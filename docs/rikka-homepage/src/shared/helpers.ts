import { effect } from "@takanashi/rikka-signal";
import { locale, t, type Locale } from "./i18n";

export function getPathFromHash(): string {
  const hash = window.location.hash;
  if (!hash || hash === '#/' || hash === '#') return '/';
  return hash.slice(1);
}

const ADVANCED_LABEL = {
  en: "Advanced",
  zh: "进阶",
} as Record<Locale, string>;

interface SharedHelpers {
  inlineCode: (text: string) => HTMLElement;
  advancedBadge: (featureName: string, description: Record<Locale, string>) => HTMLElement;
}

export const sharedHelpers: SharedHelpers = {
  inlineCode: (text: string): HTMLElement => {
    const el = document.createElement('code');
    el.textContent = text;
    return el;
  },

  advancedBadge: (featureName: string, description: Record<Locale, string>): HTMLElement => {
    const el = document.createElement('p');
    el.className = 'advanced-badge';
    const label = document.createElement('span');
    label.className = 'advanced-badge-label';
    el.appendChild(label);
    el.appendChild(document.createTextNode(' '));
    const code = document.createElement('code');
    code.textContent = featureName;
    el.appendChild(code);
    el.appendChild(document.createTextNode(' '));
    const desc = document.createTextNode('');
    el.appendChild(desc);

    effect(() => {
      label.textContent = t(ADVANCED_LABEL);
      desc.textContent = t(description);
    });

    return el;
  },
};
