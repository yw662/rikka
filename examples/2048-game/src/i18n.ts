import { signal } from '@takanashi/rikka-signal';

export type Locale = 'en' | 'zh';

function detectLocale(): Locale {
  const stored = localStorage.getItem('2048-locale');
  if (stored === 'en' || stored === 'zh') return stored;
  const lang = navigator.language || '';
  if (lang.startsWith('zh')) return 'zh';
  return 'en';
}

export const locale = signal<Locale>(detectLocale());

export function setLocale(l: Locale) {
  locale.set(l);
  localStorage.setItem('2048-locale', l);
}

export function t<T>(translations: Record<Locale, T>): T {
  return translations[locale.get()];
}