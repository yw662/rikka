import { signal, computed } from "@takanashi/rikka-signal";

export type Locale = "en" | "zh";

/**
 * Detect the user's preferred language from browser settings.
 * Falls back to "en" if the language is not supported.
 */
function detectLocale(): Locale {
  const stored = localStorage.getItem("rikka-locale");
  if (stored === "en" || stored === "zh") return stored;

  const lang = navigator.language || (navigator as any).userLanguage || "";
  if (lang.startsWith("zh")) return "zh";
  return "en";
}

/**
 * Global locale signal. Components read this to decide which text to render.
 */
export const locale = signal<Locale>(detectLocale());

/**
 * Persist locale changes to localStorage and notify in-tab listeners.
 * Embedded components (e.g. the live playground) listen for this event
 * to keep their own locale signal in sync without needing direct
 * access to this module.
 */
export function setLocale(l: Locale) {
  locale.set(l);
  try {
    localStorage.setItem("rikka-locale", l);
  } catch {
    // localStorage may be unavailable
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("rikka:locale-change", { detail: l }));
  }
}

/**
 * Type-safe translation lookup.
 * Given a record like `{ en: "Hello", zh: "你好" }`, returns the value
 * for the current locale.
 */
export function t<T>(translations: Record<Locale, T>): T {
  return translations[locale.get()];
}

/**
 * Reactive version of `t` — returns a computed that updates when locale changes.
 * Use this when you need the value to be reactive (e.g. as a DOM child).
 */
export function tr(translations: Record<Locale, string>) {
  return computed(() => translations[locale.get()]);
}

/**
 * Pick from a locale-keyed object reactively.
 */
export function tp<T>(translations: Record<Locale, T>): T {
  return translations[locale.get()];
}
