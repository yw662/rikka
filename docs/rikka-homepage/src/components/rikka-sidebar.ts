import { defineElement } from '@takanashi/rikka-elements';
import { css, div, span, a } from '@takanashi/rikka-dom';
import { effect, type Signal } from '@takanashi/rikka-signal';

interface TOCItem {
  title: string;
  path: string;
  advanced?: boolean;
}

interface TOCGroup {
  group: string;
  items: TOCItem[];
}

const tableOfContents: TOCGroup[] = [
  {
    group: '@takanashi/rikka-signal',
    items: [
      { title: 'Getting Started', path: '/docs/@takanashi/rikka-signal/getting-started' },
      { title: 'signal()', path: '/docs/@takanashi/rikka-signal/signal' },
      { title: 'computed()', path: '/docs/@takanashi/rikka-signal/computed' },
      { title: 'effect()', path: '/docs/@takanashi/rikka-signal/effect' },
    ],
  },
  {
    group: '@takanashi/rikka-dom',
    items: [
      { title: 'h()', path: '/docs/@takanashi/rikka-dom/h' },
      { title: 'Tag Helpers', path: '/docs/@takanashi/rikka-dom/tag-helpers' },
      { title: 'For', path: '/docs/@takanashi/rikka-dom/for' },
      { title: 'Conditionals', path: '/docs/@takanashi/rikka-dom/conditionals' },
      { title: 'h``', path: '/docs/@takanashi/rikka-dom/html-template', advanced: true },
      { title: 'Signal Interpolation', path: '/docs/@takanashi/rikka-dom/signal-interpolation', advanced: true },
      { title: 'css``', path: '/docs/@takanashi/rikka-dom/css-template', advanced: true },
      { title: 'inlineStyle``', path: '/docs/@takanashi/rikka-dom/inlineStyle', advanced: true },
    ],
  },
  {
    group: '@takanashi/rikka-elements',
    items: [
      { title: 'defineElement', path: '/docs/@takanashi/rikka-elements/define-element', advanced: true },
      { title: 'Shadow DOM', path: '/docs/@takanashi/rikka-elements/shadow', advanced: true },
      { title: 'adoptStyle', path: '/docs/@takanashi/rikka-elements/adopt-style', advanced: true },
      { title: 'attribute', path: '/docs/@takanashi/rikka-elements/attribute', advanced: true },
      { title: 'event', path: '/docs/@takanashi/rikka-elements/event', advanced: true },
      { title: 'attachTemplate', path: '/docs/@takanashi/rikka-elements/attach-template', advanced: true },
    ],
  },
  {
    group: 'API Reference',
    items: [
      { title: 'API Reference', path: '/docs/api-reference' },
    ],
  },
];

const sidebarStyles = css`
:host {
  display: block;
  width: 260px;
  flex-shrink: 0;
  overflow-y: auto;
  padding: var(--spacing-md) 0;
}
:host::-webkit-scrollbar {
  width: 4px;
}
:host::-webkit-scrollbar-track {
  background: transparent;
}
:host::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: var(--radius-xs);
}
  .group {
  margin-bottom: var(--spacing-lg);
}
.group-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-primary);
  padding: 0 var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}
.nav-item {
  display: block;
  padding: var(--spacing-xs) var(--spacing-md);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.8125rem;
  border-radius: var(--radius-sm);
  margin: 0.125rem var(--spacing-sm);
  transition: all var(--transition-fast);
}
.nav-item:hover {
  color: var(--color-text-primary);
  background: var(--color-nav-link-bg);
}
.nav-item.active {
  color: var(--color-text-primary);
  background: var(--color-nav-link-active-bg);
}
.nav-item-advanced {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--color-advanced-tag-bg);
  color: var(--color-warning);
  padding: 0.1em 0.4em;
  border-radius: 0.25rem;
  margin-left: 0.35rem;
  vertical-align: middle;
}

/* Tablet Optimization */
@media (max-width: 1024px) {
  :host {
    width: 220px;
  }
}

/* Mobile Enhancement */
@media (max-width: 768px) {
  :host {
    width: 100%;
    max-height: 60vh; /* 从 200px 提升到 60vh */
    border-bottom: 1px solid var(--color-border);
    padding: var(--spacing-sm) 0;
    overflow-y: auto; /* 确保可滚动 */
    -webkit-overflow-scrolling: touch; /* 平滑滚动 */
  }
  
  .group {
    margin-bottom: var(--spacing-md);
  }
  
  .group-title {
    font-size: 0.75rem; /* 稍微放大以便触控 */
    padding: 0 var(--spacing-md);
    margin-bottom: var(--spacing-xs);
  }
  
  .nav-item {
    padding: var(--spacing-sm) var(--spacing-md); /* 增大触控区域 */
    font-size: 0.875rem; /* 稍微放大 */
    margin: 0.125rem var(--spacing-md);
    min-height: 44px; /* WCAG 触控目标最小尺寸 */
    display: flex;
    align-items: center;
  }
}
`;

const RikkaSidebar = defineElement('rikka-sidebar', {
  attributes: {
    'current-path': { toProp: (v?: string) => v ?? '/', toAttribute: (v?: string) => v },
  },
  styles: sidebarStyles,
  render() {
    const pathSignal = (this as unknown as { '$current-path': Signal.State<string> })['$current-path'];

    const container = div({});

    effect(() => {
      const currentPath = pathSignal.get();
      const groups = tableOfContents.map(group => {
        const items = group.items.map(item => {
          const isActive = currentPath === item.path;
          const advancedBadge = item.advanced ? span({ class: 'nav-item-advanced' }, 'adv') : null;
          return a(
            {
              class: `nav-item${isActive ? ' active' : ''}`,
              href: `#${item.path}`,
            },
            item.title,
            advancedBadge,
          );
        });

        return div(
          { class: 'group' },
          span({ class: 'group-title' }, group.group),
          ...items,
        );
      });

      container.replaceChildren(...groups);
    });

    return container;
  }
});

export { RikkaSidebar };
