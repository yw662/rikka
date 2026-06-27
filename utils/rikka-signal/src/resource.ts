import { Signal } from "signal-polyfill";
import { effect } from "./effect.js";

/**
 * State of a {@link Resource}.
 *
 * - `"unresolved"` — initial state, no fetch has completed yet.
 * - `"pending"` — a fetch is in flight.
 * - `"ready"` — the last fetch resolved successfully.
 * - `"errored"` — the last fetch rejected.
 */
export type ResourceState = "unresolved" | "pending" | "ready" | "errored";

/**
 * A reactive handle on an async value, inspired by Solid's `createResource`.
 *
 * Each field is an independent {@link Signal.Computed}, so DOM bindings that
 * read `value` won't re-evaluate when only `loading` changes — true
 * fine-grained reactivity.
 *
 * Pass `value` (or any field) directly to DOM helpers:
 * ```ts
 * div({}, user.value)                       // updates when data arrives
 * div({ class: { loading: user.loading } }) // updates when loading toggles
 * ```
 */
export interface Resource<T> {
  /** Latest resolved value, or `undefined` if not yet available. */
  readonly value: Signal.Computed<T | undefined>;
  /** Current {@link ResourceState}. */
  readonly state: Signal.Computed<ResourceState>;
  /** The rejection reason if the last fetch failed, else `undefined`. */
  readonly error: Signal.Computed<unknown | undefined>;
  /** `true` while a fetch is in flight. */
  readonly loading: Signal.Computed<boolean>;
  /** Re-run the fetcher with the current source value. */
  refetch(): void;
  /**
   * Optimistically replace the cached value without re-fetching.
   * Does not touch `state` / `error` / `loading`.
   */
  mutate(next: T | undefined | ((prev: T | undefined) => T | undefined)): void;
  /** Abort any in-flight fetch and stop tracking the source. */
  dispose(): void;
}

/** Extra context passed to a {@link resource} fetcher. */
export interface FetchInfo {
  /**
   * `true` when this fetch was triggered by `refetch()`.
   *
   * Best-effort semantics: if a source change and a `refetch()` are batched
   * into the same effect re-run, `refetching` reflects whichever flag was
   * raised first (refetch wins, because it sets the flag before bumping the
   * trigger). Treat this as "the user asked for a refresh" rather than a
   * precise provenance marker.
   */
  refetching: boolean;
  /**
   * Aborted when the source changes, `refetch()` is called, or the resource is
   * disposed. Pass to `fetch(url, { signal })` to cancel stale requests.
   */
  signal: AbortSignal;
}

type SourceLike<S> = Signal.Computed<S> | Signal.State<S> | (() => S);

/**
 * Creates a {@link Resource} that fetches once and never re-runs unless
 * `refetch()` is called.
 *
 * @example
 * const user = resource(() => fetch("/api/user").then(r => r.json()));
 * user.value.get();    // undefined, then the user object
 * user.loading.get();  // true, then false
 */
export function resource<T>(
  fetcher: (info: FetchInfo) => Promise<T>,
): Resource<T>;
/**
 * Creates a {@link Resource} that re-fetches whenever `source` changes.
 * Stale fetches are aborted (last-write-wins).
 *
 * @example
 * const userId = signal(1);
 * const user = resource(userId, (id) =>
 *   fetch(`/api/user/${id}`).then(r => r.json()),
 * );
 * userId.set(2); // aborts the fetch for id=1, starts fetching id=2
 */
export function resource<S, T>(
  source: SourceLike<S>,
  fetcher: (source: S, info: FetchInfo) => Promise<T>,
): Resource<T>;
export function resource<S, T>(
  sourceOrFetcher: ((info: FetchInfo) => Promise<T>) | SourceLike<S>,
  fetcher?: (source: S, info: FetchInfo) => Promise<T>,
): Resource<T> {
  // Resolve the overload once at creation time so the effect body doesn't
  // re-dispatch on which form was used. The body calls a single unified
  // runFetcher(info) with no branching or type assertions in the hot path.
  const runFetcher: (info: FetchInfo) => Promise<T> =
    fetcher === undefined
      ? (info) =>
          (sourceOrFetcher as (info: FetchInfo) => Promise<T>)(info)
      : (info) =>
          fetcher(readSource(sourceOrFetcher as SourceLike<S>), info);

  const valueState = new Signal.State<T | undefined>(undefined);
  const stateState = new Signal.State<ResourceState>("unresolved");
  const errorState = new Signal.State<unknown | undefined>(undefined);
  // `loading` is a pure projection of `state` (loading ≡ state === "pending"),
  // so it is derived rather than stored as independent state. This removes
  // the four manual sync points that previously kept the two in step.

  // Bumping this signal triggers a re-fetch. Used by refetch().
  const trigger = new Signal.State(0);
  // refetchingFlag lives in the signal system (not a mutable closure
  // variable) so reads and writes participate in signal consistency. The
  // effect reads it untracked — it only needs the current value, not a
  // subscription — and resets it after consuming.
  const refetchingFlag = new Signal.State<boolean>(false);

  // The state machine has three transitions, each carrying exactly the
  // fields it touches. Centralizing them here makes the invariants
  // visible: `pending` preserves value/error so the UI can keep showing
  // stale data and the previous error while loading; `ready` clears the
  // error; `errored` preserves the last value. Previously these writes
  // were scattered across four sites in the effect body, so proving
  // "every ready transition clears error" required scanning all of them.
  type Transition =
    | { kind: "pending" }
    | { kind: "ready"; value: T }
    | { kind: "errored"; error: unknown };
  const transition = (t: Transition): void => {
    switch (t.kind) {
      case "pending":
        stateState.set("pending");
        break;
      case "ready":
        valueState.set(t.value);
        errorState.set(undefined);
        stateState.set("ready");
        break;
      case "errored":
        errorState.set(t.error);
        stateState.set("errored");
        break;
    }
  };

  const disposeEffect = effect((abortSignal) => {
    // Subscribe to trigger so refetch() re-runs this effect.
    trigger.get();
    // runFetcher reads the source (if any) internally, establishing the
    // reactive dependency — no branching or type assertions here.
    transition({ kind: "pending" });

    // Read (untracked) and reset the refetching flag. Untracked because the
    // effect must not subscribe to a signal it writes to (otherwise resetting
    // the flag would schedule a spurious second re-run).
    const isRefetch = Signal.subtle.untrack(() => refetchingFlag.get());
    refetchingFlag.set(false);

    const info: FetchInfo = {
      refetching: isRefetch,
      signal: abortSignal,
    };

    let promise: Promise<T>;
    try {
      promise = runFetcher(info);
    } catch (err) {
      if (abortSignal.aborted) return;
      transition({ kind: "errored", error: err });
      return;
    }

    promise.then(
      (data) => {
        if (abortSignal.aborted) return;
        transition({ kind: "ready", value: data });
      },
      (err) => {
        if (abortSignal.aborted) return;
        transition({ kind: "errored", error: err });
      },
    );
  });

  return {
    value: new Signal.Computed(() => valueState.get()),
    state: new Signal.Computed(() => stateState.get()),
    error: new Signal.Computed(() => errorState.get()),
    loading: new Signal.Computed(() => stateState.get() === "pending"),
    refetch() {
      refetchingFlag.set(true);
      trigger.set(trigger.get() + 1);
    },
    mutate(next) {
      const prev = valueState.get();
      const resolved =
        typeof next === "function"
          ? (next as (p: T | undefined) => T | undefined)(prev)
          : next;
      valueState.set(resolved);
    },
    dispose() {
      disposeEffect();
    },
  };
}

function readSource<S>(source: SourceLike<S>): S {
  if (typeof source === "function") {
    return (source as () => S)();
  }
  return source.get();
}
