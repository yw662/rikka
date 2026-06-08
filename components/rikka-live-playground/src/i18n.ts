import { signal, computed } from "@takanashi/rikka-signal";

export type Locale = "en" | "zh";

const STORAGE_KEY = "rikka-locale";
const LOCALE_EVENT = "rikka:locale-change";

function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "zh") return stored;
  } catch {
    // localStorage may be unavailable in sandboxed contexts
  }
  const lang = typeof navigator !== "undefined" ? (navigator.language || "") : "";
  if (lang.startsWith("zh")) return "zh";
  return "en";
}

export const locale = signal<Locale>(detectLocale());

/**
 * Persist the locale and notify in-tab listeners.
 * The `rikka:locale-change` event is what other packages (e.g. the
 * homepage) dispatch to keep the playground in sync without requiring
 * a shared module-level signal.
 */
export function setLocale(l: Locale) {
  if (locale.get() === l) return;
  locale.set(l);
  try {
    localStorage.setItem(STORAGE_KEY, l);
  } catch {
    // ignore
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LOCALE_EVENT, { detail: l }));
  }
}

/**
 * One-shot lookup against the current locale. Use this when the value
 * is consumed outside of any reactive context.
 */
export function t<T>(record: Record<Locale, T>): T {
  return record[locale.get()];
}

/**
 * Reactive lookup — returns a `computed` signal so it can be passed
 * directly to a DOM helper as a child (rikka-dom auto-subscribes).
 */
export function tr<T extends string>(record: Record<Locale, T>) {
  return computed(() => record[locale.get()]);
}

// Cross-tab / cross-context sync.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    const next = e.newValue;
    if (next === "en" || next === "zh") {
      locale.set(next);
    }
  });
  // Same-tab updates from a host (e.g. the homepage's lang switcher).
  window.addEventListener(LOCALE_EVENT, ((e: Event) => {
    const detail = (e as CustomEvent<Locale>).detail;
    if (detail === "en" || detail === "zh") {
      locale.set(detail);
    }
  }) as EventListener);
}
