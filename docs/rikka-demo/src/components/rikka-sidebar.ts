import { defineElement } from 'rikka-elements';
import { css, div, span, a } from 'rikka-dom';
import { effect } from 'rikka-signal';

interface TOCItem {
  title: string;
  path: string;
}

interface TOCGroup {
  group: string;
  items: TOCItem[];
}

const tableOfContents: TOCGroup[] = [
  {
    group: 'rikka-signal',
    items: [
      { title: 'Getting Started', path: '/docs/rikka-signal/getting-started' },
      { title: 'signal()', path: '/docs/rikka-signal/signal' },
      { title: 'computed()', path: '/docs/rikka-signal/computed' },
      { title: 'effect()', path: '/docs/rikka-signal/effect' },
      { title: 'Batch Updates', path: '/docs/rikka-signal/batch' },
      { title: 'store()', path: '/docs/rikka-signal/store' },
    ],
  },
  {
    group: 'rikka-dom',
    items: [
      { title: 'h()', path: '/docs/rikka-dom/h' },
      { title: 'Tag Helpers', path: '/docs/rikka-dom/tag-helpers' },
      { title: 'For', path: '/docs/rikka-dom/for' },
      { title: 'Conditionals', path: '/docs/rikka-dom/conditionals' },
      { title: 'h``', path: '/docs/rikka-dom/html-template' },
      { title: 'Signal Interpolation', path: '/docs/rikka-dom/signal-interpolation' },
      { title: 'css``', path: '/docs/rikka-dom/css-template' },
      { title: 'inlineStyle``', path: '/docs/rikka-dom/inlineStyle' },
    ],
  },
  {
    group: 'rikka-elements',
    items: [
      { title: 'defineElement', path: '/docs/rikka-elements/define-element' },
      { title: 'Shadow DOM', path: '/docs/rikka-elements/shadow' },
      { title: 'adoptStyle', path: '/docs/rikka-elements/adopt-style' },
      { title: 'attribute', path: '/docs/rikka-elements/attribute' },
      { title: 'event', path: '/docs/rikka-elements/event' },
      { title: 'attachTemplate', path: '/docs/rikka-elements/attach-template' },
    ],
  },
  {
    group: 'Advanced',
    items: [
      { title: 'Composition', path: '/docs/advanced/composition' },
      { title: 'Fine-grained Updates', path: '/docs/advanced/fine-grained' },
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
  width: 240px;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 1rem 0;
}
:host::-webkit-scrollbar {
  width: 4px;
}
:host::-webkit-scrollbar-track {
  background: transparent;
}
:host::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 2px;
}
.group {
  margin-bottom: 1.5rem;
}
.group-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #6366f1;
  padding: 0 1rem;
  margin-bottom: 0.5rem;
}
.nav-item {
  display: block;
  padding: 0.4rem 1rem;
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.8125rem;
  border-radius: 0.375rem;
  margin: 0.125rem 0.5rem;
  transition: all 0.15s ease;
}
.nav-item:hover {
  color: #e2e8f0;
  background: rgba(99, 102, 241, 0.1);
}
.nav-item.active {
  color: #e2e8f0;
  background: rgba(99, 102, 241, 0.2);
}
@media (max-width: 768px) {
  :host {
    width: 100%;
    max-height: 200px;
    border-bottom: 1px solid #334155;
  }
}
`;

const RikkaSidebar = defineElement('rikka-sidebar', {
  attributes: {
    'current-path': (v: string | undefined) => v ?? '/',
  },
  styles: sidebarStyles,
  render() {
    const pathSignal = (this as any)['$current-path'];

    const container = div({});

    effect(() => {
      const currentPath = pathSignal.get();
      const groups = tableOfContents.map(group => {
        const items = group.items.map(item => {
          const isActive = currentPath === item.path;
          return a(
            {
              class: `nav-item${isActive ? ' active' : ''}`,
              href: `#${item.path}`,
            },
            item.title,
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
