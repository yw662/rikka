import { defineElement } from '@takanashi/rikka-elements';
import { signal, computed, effect } from '@takanashi/rikka-signal';
import { css, div } from '@takanashi/rikka-dom';
import { getPathFromHash } from './shared/helpers';
import './components/rikka-nav';
import './components/rikka-sidebar';
import './components/rikka-footer';
import './components/rikka-theme-switcher';
import '@takanashi/rikka-live-playground';
import './pages/home';
import './pages/playground';
import './pages/docs-index';
import './pages/examples-index';
import './pages/docs/01-getting-started';
import './pages/docs/02-signal';
import './pages/docs/03-computed';
import './pages/docs/04-effect';
import './pages/docs/06-h';
import './pages/docs/07-tag-helpers';
import './pages/docs/08-for';
import './pages/docs/09-conditionals';
import './pages/docs/10-html-template';
import './pages/docs/11-signal-interpolation';
import './pages/docs/12-define-element';
import './pages/docs/13-shadow';
import './pages/docs/14-adopt-style';
import './pages/docs/15-attribute';
import './pages/docs/16-event';
import './pages/docs/17-attach-template';
import './pages/docs/18-css-template';
import './pages/docs/23-style-template';
import './pages/docs/21-api-reference';
import './pages/examples/pomodoro-timer';
import './pages/examples/bookmark-manager';
import './pages/examples/code-editor';
import './pages/examples/finance-tracker';

interface RouteConfig {
  tag: string;
  showSidebar: boolean;
  title: string;
}

const routes: Record<string, RouteConfig> = {
  '/': { tag: 'rikka-home', showSidebar: false, title: 'Project Rikka' },
  '/playground': { tag: 'rikka-playground', showSidebar: false, title: 'Playground — Rikka' },
  '/docs': { tag: 'rikka-docs-index', showSidebar: true, title: 'Documentation — Rikka' },
  '/docs/@takanashi/rikka-signal/getting-started': { tag: 'rikka-doc-signal-01', showSidebar: true, title: 'Getting Started — Rikka' },
  '/docs/@takanashi/rikka-signal/signal': { tag: 'rikka-doc-signal-02', showSidebar: true, title: 'signal() — Rikka' },
  '/docs/@takanashi/rikka-signal/computed': { tag: 'rikka-doc-signal-03', showSidebar: true, title: 'computed() — Rikka' },
  '/docs/@takanashi/rikka-signal/effect': { tag: 'rikka-doc-signal-04', showSidebar: true, title: 'effect() — Rikka' },
  '/docs/@takanashi/rikka-dom/h': { tag: 'rikka-doc-dom-06', showSidebar: true, title: 'h() — Rikka' },
  '/docs/@takanashi/rikka-dom/tag-helpers': { tag: 'rikka-doc-dom-07', showSidebar: true, title: 'Tag Helpers — Rikka' },
  '/docs/@takanashi/rikka-dom/for': { tag: 'rikka-doc-dom-08', showSidebar: true, title: 'For — Rikka' },
  '/docs/@takanashi/rikka-dom/conditionals': { tag: 'rikka-doc-dom-09', showSidebar: true, title: 'Conditionals — Rikka' },
  '/docs/@takanashi/rikka-dom/html-template': { tag: 'rikka-doc-dom-10', showSidebar: true, title: 'h`` — Rikka' },
  '/docs/@takanashi/rikka-dom/signal-interpolation': { tag: 'rikka-doc-dom-11', showSidebar: true, title: 'Signal Interpolation — Rikka' },
  '/docs/@takanashi/rikka-dom/css-template': { tag: 'rikka-doc-dom-18', showSidebar: true, title: 'css`` — Rikka' },
  '/docs/@takanashi/rikka-dom/inlineStyle': { tag: 'rikka-doc-dom-style', showSidebar: true, title: 'inlineStyle`` — Rikka' },
  '/docs/@takanashi/rikka-elements/define-element': { tag: 'rikka-doc-elements-12', showSidebar: true, title: 'defineElement — Rikka' },
  '/docs/@takanashi/rikka-elements/shadow': { tag: 'rikka-doc-elements-13', showSidebar: true, title: 'Shadow DOM — Rikka' },
  '/docs/@takanashi/rikka-elements/adopt-style': { tag: 'rikka-doc-elements-14', showSidebar: true, title: 'adoptStyle — Rikka' },
  '/docs/@takanashi/rikka-elements/attribute': { tag: 'rikka-doc-elements-15', showSidebar: true, title: 'attribute — Rikka' },
  '/docs/@takanashi/rikka-elements/event': { tag: 'rikka-doc-elements-16', showSidebar: true, title: 'event — Rikka' },
  '/docs/@takanashi/rikka-elements/attach-template': { tag: 'rikka-doc-elements-17', showSidebar: true, title: 'attachTemplate — Rikka' },
  '/docs/api-reference': { tag: 'rikka-doc-api-ref', showSidebar: true, title: 'API Reference — Rikka' },
  '/examples': { tag: 'rikka-examples-index', showSidebar: false, title: 'Examples — Rikka' },
  '/examples/pomodoro-timer': { tag: 'rikka-example-pomodoro-timer', showSidebar: false, title: 'Pomodoro Timer — Rikka' },
  '/examples/bookmark-manager': { tag: 'rikka-example-bookmark-manager', showSidebar: false, title: 'Bookmark Manager — Rikka' },
  '/examples/code-editor': { tag: 'rikka-example-code-editor', showSidebar: false, title: 'Code Editor — Rikka' },
  '/examples/finance-tracker': { tag: 'rikka-example-finance-tracker', showSidebar: false, title: 'Finance Tracker — Rikka' },
};

const currentPath = signal('/');
const currentRoute = computed(() => routes[currentPath.get()] ?? routes['/']);

currentPath.set(getPathFromHash());

window.addEventListener('hashchange', () => {
  currentPath.set(getPathFromHash());
});

const appStyles = css`
:host {
  display: block;
}
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.main-layout {
  display: flex;
  flex: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
  width: 100%;
}
.content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  min-width: 0;
}
@media (max-width: 768px) {
  .main-layout {
    flex-direction: column;
  }
  .content {
    padding: 1rem;
  }
}
`;

const RikkaApp = defineElement('rikka-app', {
  styles: appStyles,
  render() {
    const contentArea = document.createElement('div');
    contentArea.className = 'content';

    const sidebarEl = document.createElement('rikka-sidebar');
    const mainLayout = div(
      { class: 'main-layout' },
      sidebarEl,
      contentArea
    );

    const navEl = document.createElement('rikka-nav');
    const footerEl = document.createElement('rikka-footer');
    const appEl = div({ class: 'app' }, navEl, mainLayout, footerEl);

    // Guard: only re-render when the path actually changes. The effect
    // re-fires on initial subscribe even though the path is unchanged,
    // and we want a stable DOM for the live-playground once mounted.
    let lastPath: string | null = null;
    const renderRoute = () => {
      const route = currentRoute.get();
      const path = currentPath.get();
      if (path === lastPath) return;
      lastPath = path;

      document.title = route.title;

      contentArea.replaceChildren();
      const page = document.createElement(route.tag);
      contentArea.appendChild(page);

      if (route.showSidebar) {
        sidebarEl.style.display = '';
        sidebarEl.setAttribute('current-path', path);
      } else {
        sidebarEl.style.display = 'none';
      }
    };

    effect(() => {
      currentPath.get();
      renderRoute();
    });

    return appEl;
  }
});

export { RikkaApp };
