import { defineElement } from '@takanashi/rikka-elements';
import { css, div, span, a, button } from '@takanashi/rikka-dom';
import { signal, effect, type Signal } from '@takanashi/rikka-signal';
import { tr, type Locale } from '../shared/i18n';
import { docContent } from '../shared/doc-content';

interface TOCItem {
  title: Record<Locale, string>;
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
      { title: docContent.sidebar.gettingStarted, path: '/docs/@takanashi/rikka-signal/getting-started' },
      { title: docContent.sidebar.signal, path: '/docs/@takanashi/rikka-signal/signal' },
      { title: docContent.sidebar.computed, path: '/docs/@takanashi/rikka-signal/computed' },
      { title: docContent.sidebar.effect, path: '/docs/@takanashi/rikka-signal/effect' },
    ],
  },
  {
    group: '@takanashi/rikka-dom',
    items: [
      { title: docContent.sidebar.h, path: '/docs/@takanashi/rikka-dom/h' },
      { title: docContent.sidebar.tagHelpers, path: '/docs/@takanashi/rikka-dom/tag-helpers' },
      { title: docContent.sidebar.for, path: '/docs/@takanashi/rikka-dom/for' },
      { title: docContent.sidebar.conditionals, path: '/docs/@takanashi/rikka-dom/conditionals' },
      { title: docContent.sidebar.htmlTemplate, path: '/docs/@takanashi/rikka-dom/html-template', advanced: true },
      { title: docContent.sidebar.signalInterpolation, path: '/docs/@takanashi/rikka-dom/signal-interpolation', advanced: true },
      { title: docContent.sidebar.cssTemplate, path: '/docs/@takanashi/rikka-dom/css-template', advanced: true },
      { title: docContent.sidebar.inlineStyle, path: '/docs/@takanashi/rikka-dom/inlineStyle', advanced: true },
    ],
  },
  {
    group: '@takanashi/rikka-elements',
    items: [
      { title: docContent.sidebar.defineElement, path: '/docs/@takanashi/rikka-elements/define-element', advanced: true },
      { title: docContent.sidebar.shadowDom, path: '/docs/@takanashi/rikka-elements/shadow', advanced: true },
      { title: docContent.sidebar.adoptStyle, path: '/docs/@takanashi/rikka-elements/adopt-style', advanced: true },
      { title: docContent.sidebar.attribute, path: '/docs/@takanashi/rikka-elements/attribute', advanced: true },
      { title: docContent.sidebar.event, path: '/docs/@takanashi/rikka-elements/event', advanced: true },
      { title: docContent.sidebar.attachTemplate, path: '/docs/@takanashi/rikka-elements/attach-template', advanced: true },
    ],
  },
  {
    group: 'API Reference',
    items: [
      { title: docContent.sidebar.apiReference, path: '/docs/api-reference' },
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

.sidebar-fab {
  display: none;
  position: fixed;
  bottom: 156px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: var(--gradient-primary);
  color: #fff;
  font-size: 1.125rem;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
  z-index: 450;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
}
.sidebar-fab:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 24px rgba(99, 102, 241, 0.5);
}
.sidebar-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 400;
  opacity: 0;
  transition: opacity var(--transition-normal);
  pointer-events: none;
}
.sidebar-backdrop.active {
  opacity: 1;
  pointer-events: auto;
}
.sidebar-drawer-header {
  display: none;
}

/* Mobile Enhancement */
@media (max-width: 800px) {
  :host {
    width: 0;
    height: 0;
    overflow: hidden;
    padding: 0;
  }

  .sidebar-fab {
    display: flex;
  }

  .sidebar-backdrop {
    display: block;
  }

  .sidebar-container {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 280px;
    background: var(--color-nav-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    padding: var(--spacing-xl);
    transform: translateX(100%);
    transition: transform var(--transition-normal);
    z-index: 500;
    box-shadow: var(--shadow-lg);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .sidebar-container.active {
    transform: translateX(0);
  }

  .sidebar-drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-lg);
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
  }

  .sidebar-drawer-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .sidebar-drawer-close {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    font-size: 1.25rem;
    cursor: pointer;
    border-radius: var(--radius-sm);
    padding: 0;
  }

  .sidebar-drawer-close:hover {
    background: var(--color-nav-link-bg);
    color: var(--color-text-primary);
  }

  .group {
    margin-bottom: var(--spacing-md);
  }

  .group-title {
    font-size: 0.75rem;
    padding: 0;
    margin-bottom: var(--spacing-xs);
  }

  .nav-item {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: 0.875rem;
    margin: 0.125rem 0;
    min-height: 44px;
    display: flex;
    align-items: center;
  }

  body.sidebar-open {
    overflow: hidden;
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
    const drawerOpen = signal(false);

    const toggleDrawer = () => drawerOpen.set(!drawerOpen.get());
    const closeDrawer = () => {
      if (drawerOpen.get()) drawerOpen.set(false);
    };

    const container = div({ class: 'sidebar-container' });

    const sidebarFab = button(
      {
        class: 'sidebar-fab',
        onclick: () => toggleDrawer(),
        'aria-label': tr(docContent.sidebar.drawerTitle),
        'aria-expanded': String(drawerOpen.get()),
      },
      '\u229e',  // ⊞ table of contents
    );

    const sidebarBackdrop = div({
      class: 'sidebar-backdrop',
      onclick: () => closeDrawer(),
    });

    effect(() => {
      const currentPath = pathSignal.get();

      const drawerHeader = div(
        { class: 'sidebar-drawer-header' },
        span({ class: 'sidebar-drawer-title' }, tr(docContent.sidebar.drawerTitle)),
        button(
          { class: 'sidebar-drawer-close', onclick: () => closeDrawer() },
          '\u2715',
        ),
      );

      const groups = tableOfContents.map(group => {
        const items = group.items.map(item => {
          const isActive = currentPath === item.path;
          const advancedBadge = item.advanced ? span({ class: 'nav-item-advanced' }, 'adv') : null;
          return a(
            {
              class: `nav-item${isActive ? ' active' : ''}`,
              href: `#${item.path}`,
              onclick: () => closeDrawer(),
            },
            tr(item.title),
            advancedBadge,
          );
        });

        return div(
          { class: 'group' },
          span({ class: 'group-title' }, group.group),
          ...items,
        );
      });

      container.replaceChildren(drawerHeader, ...groups);

      sidebarFab.setAttribute('aria-expanded', String(drawerOpen.get()));
      sidebarFab.textContent = drawerOpen.get() ? '\u2715' : '\u229e';

      if (drawerOpen.get()) {
        container.classList.add('active');
        sidebarBackdrop.classList.add('active');
        document.body.classList.add('sidebar-open');
      } else {
        container.classList.remove('active');
        sidebarBackdrop.classList.remove('active');
        document.body.classList.remove('sidebar-open');
      }
    });

    // Close drawer on navigation
    window.addEventListener('hashchange', () => closeDrawer());

    return div({}, container, sidebarFab, sidebarBackdrop);
  }
});

export { RikkaSidebar };
