import { Signal } from "signal-polyfill";

export function effect(fn: () => void | (() => void)): () => void;
export function effect(
  fn: () => void | (() => void),
  onError: (err: unknown) => void,
): () => void;
export function effect(
  fn: () => void | (() => void),
  onError?: (err: unknown) => void,
): () => void {
  let cleanup: (() => void) | void;
  let disposed = false;
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
    }
    cleanup = fn();
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
  }
  // When no onError is provided the error is intentionally not logged;
  // callers should pass onError to observe effect failures.
}
