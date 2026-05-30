import { Signal } from "signal-polyfill";

export function effect(fn: () => void | (() => void)): () => void {
  let cleanup: (() => void) | void;
  let disposed = false;
  const watcher = new Signal.subtle.Watcher(() => {
    queueMicrotask(() => {
      if (disposed) return;
      try {
        computed.get();
      } catch (e) {
        // Error in effect should not break the watcher or other effects
        // Just log and continue re-watching for next update
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
    // Initial execution error - still set up watching for future updates
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
