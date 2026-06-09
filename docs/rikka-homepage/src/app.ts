import { defineElement } from '@takanashi/rikka-elements';
import { signal, computed, effect } from '@takanashi/rikka-signal';
import { css, div, button, span } from '@takanashi/rikka-dom';
import '@takanashi/rikka-web-agent';
import { getPathFromHash } from './shared/helpers';
import { highlightCodeBlocks } from './shared/highlight';
import './components/rikka-nav';
import './components/rikka-sidebar';
import './components/rikka-footer';
import './components/rikka-theme-switcher';
import './components/rikka-lang-switcher';
import '@takanashi/rikka-live-playground';
import { PLAYGROUND_STARTER_CODE } from './pages/playground-data';
import './pages/home';
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
  replaceContent?: boolean;
}

const routes: Record<string, RouteConfig> = {
  '/': { tag: 'rikka-home', showSidebar: false, title: 'Project Rikka' },
  '/playground': { tag: 'rikka-live-playground', showSidebar: false, title: 'Playground — Rikka', replaceContent: true },
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
.main-layout--fullbleed {
  max-width: none;
  padding: 0;
}
.content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  min-width: 0;
}
@media (max-width: 800px) {
  .content {
    padding: 1rem;
  }
}

/* Agent FAB */
.agent-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: var(--color-primary);
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  z-index: 999998;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
}
.agent-fab:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.25);
}
.agent-fab--open {
  background: var(--color-error, #f85149);
}
.agent-fab--open:hover {
  background: #e5443d;
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

    // --- Agent FAB + floating panel ---
    const agentOpen = signal(false);

    const agentEl = document.createElement('rikka-web-agent');
    agentEl.setAttribute('layout', 'floating');
    agentEl.setAttribute('display', 'full');
    agentEl.style.display = 'none';

    // Register homepage-specific tools to WebMCP context
    const mc = (document as any).modelContext;
    if (mc) {
      mc.registerTool({
        name: 'navigate',
        description: 'Navigate to a page within the Rikka site',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Hash path, e.g. /docs, /playground, /examples' }
          },
          required: ['path']
        },
        execute: async (input: { path: string }) => {
          window.location.hash = input.path;
          return `Navigated to ${input.path}`;
        },
      });

      mc.registerTool({
        name: 'getCurrentPage',
        description: 'Get the current page path and title',
        inputSchema: { type: 'object', properties: {} },
        execute: async () => {
          const route = currentRoute.get();
          return { path: currentPath.get(), title: route.title };
        },
      });

      mc.registerTool({
        name: 'listPages',
        description: 'List all available pages on the Rikka site',
        inputSchema: { type: 'object', properties: {} },
        execute: async () => {
          return Object.keys(routes).map(p => ({ path: p, title: routes[p].title }));
        },
      });

      mc.registerTool({
        name: 'readDocs',
        description: 'Read the text content of a documentation page. Returns the visible text (no HTML tags).',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Doc page path, e.g. /docs/@takanashi/rikka-signal/signal or /docs/@takanashi/rikka-dom/h',
            },
          },
          required: ['path'],
        },
        execute: async (input: { path: string }) => {
          const route = routes[input.path];
          if (!route) return { error: `Page not found: ${input.path}. Use listPages to see available pages.` };
          // Navigate first so the content renders
          window.location.hash = input.path;
          // Wait for render
          await new Promise((r) => setTimeout(r, 200));
          const contentEl = document.querySelector('.content') as HTMLElement;
          if (!contentEl) return { error: 'Content area not found' };
          const text = contentEl.innerText || contentEl.textContent || '';
          // Truncate very long docs
          const maxLen = 8000;
          const truncated = text.length > maxLen ? text.slice(0, maxLen) + '\n... (truncated)' : text;
          return { path: input.path, title: route.title, content: truncated };
        },
      });

      mc.registerTool({
        name: 'searchDocs',
        description: 'Search documentation pages by keyword. Returns matching pages with snippets.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search keyword, e.g. "signal", "defineElement", "css"' },
          },
          required: ['query'],
        },
        execute: async (input: { query: string }) => {
          const q = input.query.toLowerCase();
          const results: { path: string; title: string }[] = [];
          for (const [path, route] of Object.entries(routes)) {
            if (path === '/playground') continue;
            const title = route.title.toLowerCase();
            const pathLower = path.toLowerCase();
            if (title.includes(q) || pathLower.includes(q)) {
              results.push({ path, title: route.title });
            }
          }
          return { query: input.query, matches: results.length, results };
        },
      });

      mc.registerTool({
        name: 'runPlayground',
        description: 'Run code in the Rikka Playground. Navigates to /playground if not already there, sets the code, and executes it.',
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'TypeScript code to run. rikka-signal, rikka-dom, and rikka-elements are available as globals.' },
          },
          required: ['code'],
        },
        execute: async (input: { code: string }) => {
          // Navigate to playground if not there
          if (currentPath.get() !== '/playground') {
            window.location.hash = '/playground';
            await new Promise((r) => setTimeout(r, 300));
          }
          const pg = document.querySelector('rikka-live-playground') as any;
          if (!pg) return { error: 'Playground element not found' };
          // Set code and run
          pg.setAttribute('code', input.code);
          // Reset re-reads code attribute and runs
          pg.reset();
          await new Promise((r) => setTimeout(r, 500));
          return { status: 'executed', code: input.code };
        },
      });

      mc.registerTool({
        name: 'getPlaygroundCode',
        description: 'Get the current code in the Rikka Playground editor.',
        inputSchema: { type: 'object', properties: {} },
        execute: async () => {
          const pg = document.querySelector('rikka-live-playground') as any;
          if (!pg) return { error: 'Playground not found. Navigate to /playground first.' };
          return { code: pg.code || '' };
        },
      });

      mc.registerTool({
        name: 'getTheme',
        description: 'Get the current site theme (light, dark, or auto).',
        inputSchema: { type: 'object', properties: {} },
        execute: async () => {
          const theme = document.documentElement.getAttribute('data-theme') || 'auto';
          return { theme };
        },
      });

      mc.registerTool({
        name: 'setTheme',
        description: 'Set the site theme.',
        inputSchema: {
          type: 'object',
          properties: {
            theme: { type: 'string', description: 'Theme mode: "light", "dark", or "auto"' },
          },
          required: ['theme'],
        },
        execute: async (input: { theme: string }) => {
          const valid = ['light', 'dark', 'auto'];
          if (!valid.includes(input.theme)) return { error: `Invalid theme "${input.theme}". Use: ${valid.join(', ')}` };
          document.documentElement.setAttribute('data-theme', input.theme);
          localStorage.setItem('rikka-theme', input.theme);
          return { theme: input.theme };
        },
      });

      mc.registerTool({
        name: 'getApiReference',
        description: 'Get the API reference for a specific rikka package or function.',
        inputSchema: {
          type: 'object',
          properties: {
            package: {
              type: 'string',
              description: 'Package name: "rikka-signal", "rikka-dom", or "rikka-elements"',
            },
          },
        },
        execute: async (input: { package?: string }) => {
          const apiDocs: Record<string, { exports: string[]; description: string }> = {
            'rikka-signal': {
              description: 'Reactive primitives: signal, computed, effect',
              exports: ['signal<T>(initial): Signal.State<T>', 'computed<T>(fn): Signal.Computed<T>', 'effect(fn): () => void', 'Signal.State<T> { get(), set(), peek() }', 'Signal.Computed<T> { get() }'],
            },
            'rikka-dom': {
              description: 'DOM creation: h, tag helpers, For, Show, Switch, css',
              exports: ['h(tag, attrs?, ...children)', 'div, span, button, input, ... (50+ tag helpers)', 'For({ each, key?, fallback? }, (item, index) => Child)', 'Show({ when, fallback? }, () => Child)', 'Switch({ on }, ...Case)', 'css`...` → CSSStyleSheet', 'inlineStyle`...` → () => string'],
            },
            'rikka-elements': {
              description: 'Custom Elements: defineElement, event, attribute specs, WebMCP tools',
              exports: ['defineElement(tagName, config?)', 'StringAttr, NumberAttr, BooleanAttr', 'event<T>()', 'css`...`', 'ToolDefinition<TInstance>', 'toolContext mapping'],
            },
          };
          if (input.package && apiDocs[input.package]) {
            return apiDocs[input.package];
          }
          return apiDocs;
        },
      });
    }

    const fabEl = button(
      { class: 'agent-fab', onclick: () => agentOpen.set(!agentOpen.get()) },
      '\u2728'  // sparkles emoji
    );

    effect(() => {
      const open = agentOpen.get();
      agentEl.style.display = open ? '' : 'none';
      fabEl.className = open ? 'agent-fab agent-fab--open' : 'agent-fab';
      fabEl.textContent = open ? '\u2715' : '\u2728';  // ✕ or sparkles
    });

    // Close agent when the component dispatches "close" event
    agentEl.addEventListener('close', () => agentOpen.set(false));

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

      const page = document.createElement(route.tag);

      if (route.replaceContent) {
        if (route.tag === 'rikka-live-playground') {
          page.setAttribute('code', PLAYGROUND_STARTER_CODE);
          page.setAttribute('height', '500');
          page.setAttribute('title', 'Rikka Playground');
        }
        page.setAttribute('bordered', 'false');
        page.style.flex = '1';
        page.style.minWidth = '0';
        page.style.display = 'block';
        mainLayout.classList.add('main-layout--fullbleed');
        mainLayout.replaceChild(page, contentArea);
      } else {
        if (mainLayout.children[1] !== contentArea) {
          mainLayout.replaceChild(contentArea, mainLayout.children[1]);
        }
        mainLayout.classList.remove('main-layout--fullbleed');
        contentArea.replaceChildren();
        contentArea.appendChild(page);
        // Apply syntax highlighting to any static <pre class="code-block"> /
        // <pre class="code-snippet"> / <pre class="hero-demo-code"> the page
        // renders into its own shadow root. defineElement runs render() in
        // connectedCallback, so the shadow tree is fully populated by the
        // time appendChild returns. Idempotent: a data-* marker on each
        // already-highlighted element prevents double-processing.
        if (page.shadowRoot) highlightCodeBlocks(page.shadowRoot);
      }

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

    return div({}, appEl, agentEl, fabEl);
  }
});

export { RikkaApp };
