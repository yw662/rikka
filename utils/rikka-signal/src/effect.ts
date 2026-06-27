import { Signal } from "signal-polyfill";

/**
 * Runs `fn` immediately, re-runs when its signal dependencies change.
 *
 * `fn` receives an {@link AbortSignal} that is aborted when the effect is about
 * to re-run (because a dependency changed) or when the returned dispose
 * function is called. Use it to cancel in-flight async work started inside the
 * effect — e.g. pass it to `fetch(url, { signal })` — without managing your own
 * `AbortController`.
 *
 * The callback may return a cleanup function for **synchronous** resource
 * teardown (closing websockets, removing listeners, etc.). Cleanup runs before
 * the next execution and on dispose, independent of the abort signal.
 *
 * Multiple synchronous dependency changes trigger only one re-run (microtask
 * batched).
 *
 * @param fn - Effect body. Receives an AbortSignal. May return a cleanup fn.
 * @param onError - Optional error handler. If omitted, errors are logged to
 *                  `console.error` as a fallback so failures are observable.
 * @returns A dispose function. Calling it aborts the current signal, runs
 *          cleanup, and stops future re-runs.
 *
 * @example
 * // Async fetch with automatic cancellation on dependency change
 * effect((signal) => {
 *   const id = userId.get();
 *   fetch(`/api/user/${id}`, { signal })
 *     .then(r => r.json())
 *     .then(data.set);
 * });
 *
 * @example
 * // Sync cleanup + abort signal coexist
 * effect((signal) => {
 *   const ws = new WebSocket(url.get());
 *   ws.onmessage = e => data.set(JSON.parse(e.data));
 *   return () => ws.close(); // sync cleanup, independent of signal
 * });
 */
export function effect(
  fn: (signal: AbortSignal) => void | (() => void),
): () => void;
export function effect(
  fn: (signal: AbortSignal) => void | (() => void),
  onError: (err: unknown) => void,
): () => void;
export function effect(
  fn: (signal: AbortSignal) => void | (() => void),
  onError?: (err: unknown) => void,
): () => void {
  let cleanup: (() => void) | void;
  let disposed = false;
  let controller: AbortController | undefined;
  const watcher = new Signal.subtle.Watcher(() => {
    queueMicrotask(() => {
      if (disposed) return;
      try {
        computed.get();
      } catch (e) {
        handleError(e, onError);
      }
      watcher.watch(computed);
    });
  });

  const computed = new Signal.Computed(() => {
    if (cleanup) {
      cleanup();
      cleanup = undefined;
    }
    controller?.abort();
    controller = new AbortController();
    cleanup = fn(controller.signal);
  });

  try {
    computed.get();
  } catch (e) {
    handleError(e, onError);
  }
  watcher.watch(computed);

  return () => {
    disposed = true;
    watcher.unwatch(computed);
    controller?.abort();
    controller = undefined;
    if (cleanup) {
      cleanup();
      cleanup = undefined;
    }
  };
}

function handleError(
  err: unknown,
  onError: ((err: unknown) => void) | undefined,
): void {
  if (onError) {
    try {
      onError(err);
    } catch {
      // Swallow to prevent re-entry into the signal watcher notify loop.
    }
    return;
  }
  // No onError provided: default to console.error so uncaught effect failures
  // are visible. Silently swallowing makes debugging nearly impossible; callers
  // who want structured handling should pass onError.
  if (typeof console !== "undefined" && typeof console.error === "function") {
    try {
      console.error("Uncaught error in effect:", err);
    } catch {
      // Swallow to prevent re-entry into the signal watcher notify loop.
    }
  }
}
