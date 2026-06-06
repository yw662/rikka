export function getPathFromHash(): string {
  const hash = window.location.hash;
  if (!hash || hash === '#/' || hash === '#') return '/';
  return hash.slice(1);
}

interface SharedHelpers {
  inlineCode: (text: string) => HTMLElement;
  advancedBadge: (featureName: string, description: string) => HTMLElement;
}

export const sharedHelpers: SharedHelpers = {
  inlineCode: (text: string): HTMLElement => {
    const el = document.createElement('code');
    el.textContent = text;
    return el;
  },

  advancedBadge: (featureName: string, description: string): HTMLElement => {
    const el = document.createElement('p');
    el.className = 'advanced-badge';
    const label = document.createElement('span');
    label.className = 'advanced-badge-label';
    label.textContent = 'Advanced';
    el.appendChild(label);
    el.appendChild(document.createTextNode(' '));
    const code = document.createElement('code');
    code.textContent = featureName;
    el.appendChild(code);
    el.appendChild(document.createTextNode(` ${description}`));
    return el;
  },
};
