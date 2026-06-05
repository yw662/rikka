import { defineElement } from '@rikka/elements';
import { css, div, h1, h2, p, a } from '@rikka/dom';
import { signal, computed, effect } from '@rikka/signal';
import { sharedStyles, examplePageStyles } from '../../shared/styles';

const styles = css`${examplePageStyles}`;

const tokenManagerCode = `const colors = signal({
  primary: [
    { name: 'indigo-500', hex: '#6366f1' },
    { name: 'indigo-400', hex: '#818cf8' },
    { name: 'indigo-600', hex: '#4f46e5' },
  ],
  secondary: [
    { name: 'emerald-500', hex: '#10b981' },
    { name: 'emerald-400', hex: '#34d399' },
    { name: 'emerald-600', hex: '#059669' },
  ],
  neutral: [
    { name: 'slate-900', hex: '#0f172a' },
    { name: 'slate-700', hex: '#334155' },
    { name: 'slate-500', hex: '#64748b' },
    { name: 'slate-300', hex: '#cbd5e1' },
  ],
  semantic: [
    { name: 'success', hex: '#22c55e' },
    { name: 'warning', hex: '#f59e0b' },
    { name: 'error', hex: '#ef4444' },
    { name: 'info', hex: '#3b82f6' },
  ],
});

const theme = signal<'light' | 'dark' | 'highContrast'>('dark');
const expandedGroups = signal<string[]>(['primary', 'secondary']);
const selectedColor = signal<{group: string, color: {name: string, hex: string}} | null>(null);

effect(() => {
  document.body.setAttribute('data-theme', theme.get());
});

effect(() => {
  localStorage.setItem('rikka-token-theme', theme.get());
});

const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
};

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const formatRgb = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  return \`rgb(\${r}, \${g}, \${b})\`;
};

const formatHsl = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  return \`hsl(\${h}, \${s}%, \${l}%)\`;
};

const groups = computed(() => Object.keys(colors.get()));

const toggleGroup = (groupName: string) => {
  const expanded = expandedGroups.get();
  if (expanded.includes(groupName)) {
    expandedGroups.set(expanded.filter(g => g !== groupName));
  } else {
    expandedGroups.set([...expanded, groupName]);
  }
};

const selectColor = (group: string, color: {name: string, hex: string}) => {
  selectedColor.set({ group, color });
};

const savePreset = () => {
  const data = {
    theme: theme.get(),
    colors: JSON.parse(JSON.stringify(colors.get())),
  };
  localStorage.setItem('rikka-token-preset', JSON.stringify(data));
};

const loadPreset = () => {
  const saved = localStorage.getItem('rikka-token-preset');
  if (saved) {
    const data = JSON.parse(saved);
    theme.set(data.theme);
    Object.keys(data.colors).forEach(key => {
      colors.set({...colors.get(), [key]: data.colors[key]});
    });
  }
};

const exportCss = () => {
  let css = ':root {\\n';
  Object.keys(colors.get()).forEach(group => {
    colors.get()[group].forEach((color: {name: string, hex: string}) => {
      css += \`  --\${color.name}: \${color.hex};\\n\`;
    });
  });
  css += '}\\n';
  return css;
};

const themeButtons = div({ style: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' } },
  button({
    onclick: () => theme.set('light'),
    style: () => ({
      padding: '0.5rem 1rem',
      background: theme.get() === 'light' ? '#6366f1' : '#334155',
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      cursor: 'pointer',
    })
  }, 'Light'),
  button({
    onclick: () => theme.set('dark'),
    style: () => ({
      padding: '0.5rem 1rem',
      background: theme.get() === 'dark' ? '#6366f1' : '#334155',
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      cursor: 'pointer',
    })
  }, 'Dark'),
  button({
    onclick: () => theme.set('highContrast'),
    style: () => ({
      padding: '0.5rem 1rem',
      background: theme.get() === 'highContrast' ? '#6366f1' : '#334155',
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      cursor: 'pointer',
    })
  }, 'High Contrast'),
);

const colorGroup = (groupName: string) => {
  const isExpanded = computed(() => expandedGroups.get().includes(groupName));
  const groupColors = computed(() => colors.get()[groupName]);

  return div({ style: { marginBottom: '0.75rem', border: '1px solid #334155', borderRadius: '0.5rem', overflow: 'hidden' } },
    div({
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        background: '#1a1a2e',
        cursor: 'pointer',
      },
      onclick: () => toggleGroup(groupName),
    },
      span({ style: { fontWeight: '600', color: '#e2e8f0', textTransform: 'capitalize' } }, groupName),
      span({ style: { color: '#94a3b8', fontSize: '0.875rem' } }, () => isExpanded.get() ? '▲' : '▼')
    ),
    div({ style: () => ({ display: isExpanded.get() ? 'block' : 'none', padding: '0.75rem', background: '#0f0f1a' }) },
      For(groupColors, (color: {name: string, hex: string}) =>
        div({
          style: () => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem',
            cursor: 'pointer',
            borderRadius: '0.25rem',
            background: selectedColor.get()?.color.hex === color.hex ? '#1e293b' : 'transparent',
          }),
          onclick: () => selectColor(groupName, color),
        },
          div({ style: { width: '24px', height: '24px', borderRadius: '4px', background: color.hex, border: '1px solid rgba(255,255,255,0.1)' } }),
          span({ style: { flex: '1', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem', color: '#e2e8f0' } }, color.hex),
          span({ style: { fontSize: '0.75rem', color: '#94a3b8' } }, color.name)
        )
      )
    )
  );
};

const selectedPanel = computed(() => {
  const sel = selectedColor.get();
  if (!sel) return div({ style: { padding: '1rem', textAlign: 'center', color: '#94a3b8' } }, 'Select a color to see details');
  const { group, color } = sel;
  return div(
    { style: { padding: '1rem', background: '#1a1a2e', borderRadius: '0.5rem', marginTop: '1rem' } },
    div({ style: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' } },
      div({ style: { width: '48px', height: '48px', borderRadius: '8px', background: color.hex, border: '1px solid rgba(255,255,255,0.1)' } }),
      div(
        span({ style: { display: 'block', fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.25rem' } }, \`\${group} / \${color.name}\`),
        span({ style: { display: 'block', fontSize: '1.5rem', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: '#e2e8f0' } }, color.hex)
      )
    ),
    div({ style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' } },
      div({ style: { padding: '0.5rem', background: '#0f0f1a', borderRadius: '0.25rem' } },
        span({ style: { display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' } }, 'HEX'),
        span({ style: { fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem', color: '#e2e8f0' } }, color.hex)
      ),
      div({ style: { padding: '0.5rem', background: '#0f0f1a', borderRadius: '0.25rem' } },
        span({ style: { display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' } }, 'RGB'),
        span({ style: { fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem', color: '#e2e8f0' } }, formatRgb(color.hex))
      ),
      div({ style: { padding: '0.5rem', background: '#0f0f1a', borderRadius: '0.25rem' } },
        span({ style: { display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' } }, 'HSL'),
        span({ style: { fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem', color: '#e2e8f0' } }, formatHsl(color.hex))
      )
    )
  );
});

const actionButtons = div({ style: { display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' } },
  button({
    onclick: savePreset,
    style: {
      padding: '0.5rem 1rem',
      background: '#334155',
      color: '#e2e8f0',
      border: '1px solid #475569',
      borderRadius: '0.5rem',
      cursor: 'pointer',
    }
  }, 'Save Preset'),
  button({
    onclick: loadPreset,
    style: {
      padding: '0.5rem 1rem',
      background: '#334155',
      color: '#e2e8f0',
      border: '1px solid #475569',
      borderRadius: '0.5rem',
      cursor: 'pointer',
    }
  }, 'Load Preset'),
  button({
    onclick: () => alert('CSS Variables:\\n\\n' + exportCss()),
    style: {
      padding: '0.5rem 1rem',
      background: '#6366f1',
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      cursor: 'pointer',
    }
  }, 'Export CSS'),
);

const app = div(
  { style: { maxWidth: '600px', padding: '1.5rem' } },
  h1({ style: { color: '#e2e8f0', marginBottom: '0.5rem' } }, 'Design System Token Manager'),
  p({ style: { color: '#94a3b8', marginBottom: '1.5rem' } }, 'Manage and export your design system color tokens.'),
  div({ style: { marginBottom: '1rem' } }, themeButtons),
  For(groups, (group) => colorGroup(group)),
  selectedPanel,
  actionButtons
);

container.appendChild(app);`;

const ExampleTokenManager = defineElement('rikka-example-token-manager', {
  styles,
  render() {
    return div({ class: 'example-page' },
      h1('Design System Token Manager'),
      p('A comprehensive example demonstrating signals, effects, and color palette management.'),
      div({ class: 'playground-container' },
        sharedStyles.createPlayground(tokenManagerCode, '600', 'Token Manager Example'),
      ),
      div({ class: 'explanation' },
        h2('Key Concepts'),
        p(sharedStyles.inlineCode('signal({ ... })'), ' creates a reactive signal for color groups with immutable updates.'),
        p(sharedStyles.inlineCode('effect()'), ' automatically syncs theme to document.body and localStorage.'),
        p(sharedStyles.inlineCode('For(groups, (group) => ...)'), ' renders the color group list with proper reactivity.'),
        p('Click group headers to expand/collapse. Click colors to see hex/rgb/hsl details.'),
        p('Save presets to localStorage and export as CSS variables.'),
      ),
      div({ class: 'example-nav' },
        a({ href: '#/examples/kanban', class: 'prev-link' }, '\u2190 Kanban'),
        div({ class: 'spacer' }),
        a({ href: '#/examples/knowledge-base', class: 'next-link' }, 'Knowledge Base \u2192'),
      ),
    );
  }
});

export { ExampleTokenManager };