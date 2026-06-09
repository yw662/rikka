import { div, h1, h2, h3, h4, p, a, pre, code, ul, li, h } from "@takanashi/rikka-dom";
import { effect } from "@takanashi/rikka-signal";
import { locale, t } from "./i18n";
import type { ExampleData } from "./example-content";
import { exampleLabels } from "./example-content";

/**
 * Render a full example detail page from structured data.
 * All text is locale-aware and reactively updates on language change.
 */
export function renderExamplePage(data: ExampleData, prevNext: { prev?: { slug: string; title: string }; next?: { slug: string; title: string } }): HTMLElement {
  const page = div({ class: "example-page" });

  const render = () => {
    const l = locale.get();

    // --- Title & description ---
    const titleEl = h1({}, data.title);
    const descEl = p({}, t(data.description));

    // --- Live demo iframe ---
    const demoSection = div(
      {
        style: `
          width: 100%;
          height: 600px;
          border: 2px solid var(--color-primary);
          border-radius: var(--radius-lg);
          overflow: hidden;
          margin: 2rem 0;
          box-shadow: var(--shadow-md);
        `,
      },
      div(
        {
          style: `
            background: var(--color-surface);
            padding: 0.75rem 1rem;
            border-bottom: 1px solid var(--color-surface-hover);
            display: flex;
            align-items: center;
            justify-content: space-between;
          `,
        },
        div({}, `${data.title.split(" ")[0]} ${t(exampleLabels.liveDemo)}`),
        a(
          {
            href: `./examples/${data.slug}/index.html`,
            target: "_blank",
            style: `
              color: var(--color-primary);
              text-decoration: none;
              font-size: 0.875rem;
            `,
          },
          t(exampleLabels.view),
        ),
      ),
      div(
        {
          style: `
            width: 100%;
            height: calc(100% - 52px);
          `,
        },
        h("iframe", {
          src: `./examples/${data.slug}/index.html`,
          style: `
            width: 100%;
            height: 100%;
            border: none;
          `,
          title: `${data.title} Demo`,
        }),
      ),
    );

    // --- Vibe Coding guide ---
    const vibeSection = div(
      { class: "showcase-hero" },
      h2({}, t(data.vibe.heading)),
      p({}, t(data.vibe.intro)),
      div(
        { class: "vibe-prompts" },
        ...data.vibe.steps.map(step =>
          div({},
            h3({}, t(step.title)),
            pre({}, code({}, t(step.prompt))),
          )
        ),
      ),
      // Core features used
      h2({}, l === "zh" ? "使用的 Rikka 核心功能" : "Core Rikka Features Used"),
      div(
        { class: "feature-grid" },
        ...data.coreFeatures.map(f =>
          div(
            { class: "feature-card" },
            h3({}, t(f.title)),
            p({}, t(f.description)),
          )
        ),
      ),
      // Workflow
      h2({}, t(data.workflow.heading)),
      p({}, t(data.workflow.intro)),
      div(
        { class: "workflow-steps" },
        ...data.workflow.steps.map(s =>
          div(
            { class: "step" },
            h4({}, t(s.title)),
            p({}, t(s.description)),
          )
        ),
      ),
      // Build steps
      h2({}, t(data.buildSteps.heading)),
      p({}, t(data.buildSteps.intro)),
      ul({},
        ...t(data.buildSteps.steps).map(step => li({}, step))
      ),
    );

    // --- Project Structure (keep as-is, code doesn't need translation) ---
    const projectStructureSection = div({},
      h2({}, t(exampleLabels.projectStructure)),
      div({ class: "arch-section" },
        pre({}, code({}, getProjectStructure(data.slug)))
      ),
    );

    // --- Key Features ---
    const keyFeaturesSection = div({},
      h2({}, t(exampleLabels.keyFeatures)),
      div(
        { class: "feature-grid" },
        ...data.keyFeatures.map(f =>
          div(
            { class: "feature-card" },
            h3({}, f.title),
            p({}, t(f.description)),
          )
        ),
      ),
    );

    // --- Deep dive code explanations (keep as-is, code doesn't need translation) ---
    const deepDiveSection = getDeepDiveSection(data.slug);

    // --- Navigation ---
    const navSection = div(
      { class: "example-nav" },
      a({ href: "#/examples", class: "prev-link" }, t(exampleLabels.allExamples)),
      div({ class: "spacer" }),
      prevNext.next
        ? a({ href: `#/examples/${prevNext.next.slug}`, class: "next-link" }, `${prevNext.next.title} →`)
        : prevNext.prev
          ? a({ href: `#/examples/${prevNext.prev.slug}`, class: "next-link" }, `${prevNext.prev.title} →`)
          : null,
    );

    page.replaceChildren(
      titleEl,
      descEl,
      demoSection,
      vibeSection,
      projectStructureSection,
      keyFeaturesSection,
      deepDiveSection,
      navSection,
    );
  };

  render();
  effect(() => { locale.get(); render(); });

  return page;
}

function getProjectStructure(slug: string): string {
  const structures: Record<string, string> = {
    "pomodoro-timer": `pomodoro-timer/
├── index.html              # Entry HTML
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Vite bundler config
└── src/
    ├── index.ts            # App bootstrap
    ├── store.ts            # Reactive state store
    ├── styles/
    │   └── main.css        # Global styles
    └── components/
        ├── app.ts          # Root component
        ├── mode-selector.ts # Mode switcher UI
        ├── timer-display.ts # Timer ring display
        ├── controls.ts     # Play/Pause/Reset
        └── stats.ts        # Session statistics`,
    "bookmark-manager": `bookmark-manager/
├── index.html              # Entry HTML
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Vite bundler config
└── src/
    ├── index.ts            # App bootstrap
    ├── store.ts            # Reactive state store
    ├── styles/
    │   └── main.css        # Global styles
    └── components/
        ├── app.ts          # Root component
        ├── search-bar.ts   # Search input component
        ├── tag-filter.ts   # Tag filter selector
        ├── bookmark-form.ts # Add/edit form
        ├── bookmark-list.ts # List display
        └── bookmark-item.ts # Individual card`,
    "code-editor": `code-editor/
├── index.html              # Entry HTML
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Vite bundler config
└── src/
    ├── index.ts            # App bootstrap
    ├── editor-store.ts     # Reactive state store
    ├── styles/
    │   └── editor.css      # Theme & syntax styles
    └── components/
        ├── app.ts          # Root component
        ├── file-tree.ts    # File explorer sidebar
        ├── tab-bar.ts      # Editor tabs
        ├── code-editor.ts  # Main editor area
        ├── preview-frame.ts # Live preview iframe
        └── console-panel.ts # Output console`,
    "finance-tracker": `finance-tracker/
├── index.html              # Entry HTML
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Vite bundler config
└── src/
    ├── index.ts            # App bootstrap
    ├── finance-store.ts    # Reactive state store
    ├── styles/
    │   └── finance.css     # Chart & theme styles
    └── components/
        ├── app.ts          # Root component
        ├── stats-panel.ts  # Summary statistics
        ├── transaction-form.ts # Add/edit form
        ├── transaction-list.ts # Transaction table
        ├── category-chart.ts # Category breakdown chart
        └── time-chart.ts   # Timeline visualization`,
    "todo-list": `todo-list/
├── index.html              # Entry HTML
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript config
├── rsbuild.config.ts       # Rsbuild config
└── src/
    ├── index.ts            # App bootstrap
    ├── store.ts            # Reactive state store
    ├── i18n.ts             # Internationalization
    ├── content.ts          # Text content
    └── components/
        ├── app.ts          # Root component
        ├── todo-input.ts   # Add new todo input
        ├── filter-bar.ts   # View filter selector
        └── todo-list.ts    # List display`,
    "drawing-pad": `drawing-pad/
├── index.html              # Entry HTML
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript config
├── rsbuild.config.ts       # Rsbuild config
└── src/
    ├── index.ts            # App bootstrap
    ├── store.ts            # Reactive state store
    ├── i18n.ts             # Internationalization
    ├── content.ts          # Text content
    └── components/
        ├── app.ts          # Root component
        ├── toolbar.ts      # Drawing tool selector
        ├── color-picker.ts # Color palette
        ├── canvas.ts       # Drawing canvas
        └── export-panel.ts # Save/load/export`,
  };
  return structures[slug] || "";
}

function getDeepDiveSection(slug: string): HTMLElement {
  // These are code-heavy sections that don't need translation
  // (code is universal, headings are kept minimal)
  const sections: Record<string, () => HTMLElement> = {
    "pomodoro-timer": () => div({},
      div({ class: "explanation" },
        h2({}, "State Management Deep Dive"),
        p({}, "The reactive store centralizes all time and session tracking with clean separation of concerns:"),
        div({ class: "arch-section" },
          pre({ class: "code-block" }, code({}, pomodoroStoreCode))
        )
      ),
      div({ class: "explanation" },
        h2({}, "Component Architecture"),
        p({}, "The UI is built with composable, reactive Web Components:"),
        div({ class: "arch-section" },
          pre({ class: "code-block" }, code({}, pomodoroComponentCode))
        )
      ),
    ),
    "bookmark-manager": () => div({},
      div({ class: "explanation" },
        h2({}, "Reactive State Architecture"),
        p({}, "The store manages bookmarks, filters, and computed derived state:"),
        div({ class: "arch-section" },
          pre({ class: "code-block" }, code({}, bookmarkStoreCode))
        )
      ),
      div({ class: "explanation" },
        h2({}, "Search Component Implementation"),
        p({}, "The search bar demonstrates debounced input and reactive filtering:"),
        div({ class: "arch-section" },
          pre({ class: "code-block" }, code({}, bookmarkSearchCode))
        )
      ),
    ),
    "code-editor": () => div({},
      div({ class: "explanation" },
        h2({}, "Editor State Architecture"),
        p({}, "The central store manages files, tabs, and preview state with comprehensive reactive system:"),
        div({ class: "arch-section" },
          pre({ class: "code-block" }, code({}, editorStoreCode))
        )
      ),
      div({ class: "explanation" },
        h2({}, "Preview & Console Integration"),
        p({}, "The iframe preview system demonstrates inter-process communication between components:"),
        div({ class: "arch-section" },
          pre({ class: "code-block" }, code({}, editorPreviewCode))
        )
      ),
    ),
    "finance-tracker": () => div({},
      div({ class: "explanation" },
        h2({}, "Finance Store Architecture"),
        p({}, "The reactive store manages transactions and computes sophisticated analytics:"),
        div({ class: "arch-section" },
          pre({ class: "code-block" }, code({}, financeStoreCode))
        )
      ),
      div({ class: "explanation" },
        h2({}, "CSS Chart Implementation"),
        p({}, "The category chart demonstrates reactive CSS with computed values:"),
        div({ class: "arch-section" },
          pre({ class: "code-block" }, code({}, financeChartCode))
        )
      ),
    ),
    "todo-list": () => div({},
      div({ class: "explanation" },
        h2({}, "Reactive Todo State"),
        p({}, "The todo store demonstrates core reactive patterns with signal-based state management:"),
        div({ class: "arch-section" },
          pre({ class: "code-block" }, code({}, todoStoreCode))
        )
      ),
      div({ class: "explanation" },
        h2({}, "Filter & Search Implementation"),
        p({}, "The filter bar shows how computed values can be composed for complex filtering:"),
        div({ class: "arch-section" },
          pre({ class: "code-block" }, code({}, todoFilterCode))
        )
      ),
    ),
    "drawing-pad": () => div({},
      div({ class: "explanation" },
        h2({}, "Canvas & Tool State"),
        p({}, "The drawing pad uses reactive state to manage tools, colors and canvas content:"),
        div({ class: "arch-section" },
          pre({ class: "code-block" }, code({}, drawingStoreCode))
        )
      ),
      div({ class: "explanation" },
        h2({}, "Canvas Drawing Implementation"),
        p({}, "The canvas component demonstrates event handling with reactive tool selection:"),
        div({ class: "arch-section" },
          pre({ class: "code-block" }, code({}, drawingCanvasCode))
        )
      ),
    ),
  };
  return (sections[slug] || (() => div({})))();
}

// --- Code snippets (language-agnostic) ---

const pomodoroStoreCode = `// src/store.ts
import { signal, computed, effect } from '@takanashi/rikka-signal';

// Timer modes configuration
type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';
const MODE_DURATIONS: Record<TimerMode, number> = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

// Reactive state
export const mode = signal<TimerMode>('pomodoro');
export const timeLeft = signal(MODE_DURATIONS.pomodoro);
export const isRunning = signal(false);
export const pomodorosCompleted = signal(0);
export const totalFocusMinutes = signal(0);

// Derived computed state
export const progress = computed(() => {
  const total = MODE_DURATIONS[mode()];
  const elapsed = total - timeLeft();
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
});

export const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft() / 60);
  const seconds = timeLeft() % 60;
  return \`\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
});

// Timer control functions
export function startTimer() { isRunning.set(true); }
export function pauseTimer() { isRunning.set(false); }
export function resetTimer() {
  isRunning.set(false);
  timeLeft.set(MODE_DURATIONS[mode()]);
}
export function setMode(newMode: TimerMode) {
  mode.set(newMode);
  timeLeft.set(MODE_DURATIONS[newMode]);
  isRunning.set(false);
}

// Auto-transition effect
let timerInterval: number | null = null;
effect(() => {
  if (isRunning()) {
    timerInterval = window.setInterval(() => {
      if (timeLeft() > 0) {
        timeLeft.set(t => t - 1);
      } else {
        isRunning.set(false);
        if (mode() === 'pomodoro') {
          pomodorosCompleted.set(c => c + 1);
          totalFocusMinutes.set(m => m + 25);
          setMode(pomodorosCompleted() % 4 === 0 ? 'longBreak' : 'shortBreak');
        } else {
          setMode('pomodoro');
        }
        playCompletionSound();
      }
    }, 1000);
  } else {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
  return () => {
    if (timerInterval) clearInterval(timerInterval);
  };
});

// Persistence effect
effect(() => {
  localStorage.setItem('pomodoro:completed', pomodorosCompleted().toString());
  localStorage.setItem('pomodoro:focusMinutes', totalFocusMinutes().toString());
});

// Initialize from storage
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('pomodoro:completed');
  if (saved) pomodorosCompleted.set(parseInt(saved, 10));
  const savedMinutes = localStorage.getItem('pomodoro:focusMinutes');
  if (savedMinutes) totalFocusMinutes.set(parseInt(savedMinutes, 10));
}`;

const pomodoroComponentCode = `// src/components/timer-display.ts
import { defineElement } from '@takanashi/rikka-elements';
import { svg, circle, div, span } from '@takanashi/rikka-dom';
import { progress, formattedTime, mode } from '../store';

export const TimerDisplay = defineElement('pomodoro-timer-display', {
  render() {
    const circumference = 2 * Math.PI * 45;
    
    return div({ class: 'timer-display' },
      svg({ width: '200', height: '200', viewBox: '0 0 100 100' },
        circle({
          cx: '50', cy: '50', r: '45',
          fill: 'none',
          stroke: 'var(--color-surface)',
          'stroke-width': '8'
        }),
        circle({
          cx: '50', cy: '50', r: '45',
          fill: 'none',
          stroke: 'var(--color-primary)',
          'stroke-width': '8',
          'stroke-linecap': 'round',
          'stroke-dasharray': circumference,
          'stroke-dashoffset': computed(() => 
            circumference - (progress() / 100) * circumference
          ),
          transform: 'rotate(-90 50 50)',
          style: 'transition: stroke-dashoffset 0.5s ease;'
        })
      ),
      div({ class: 'time-text' },
        span({}, formattedTime)
      ),
      div({ class: 'mode-label' },
        span({}, computed(() => mode() === 'pomodoro' ? 'Focus' : 'Break'))
      )
    );
  }
});`;

const bookmarkStoreCode = `// src/store.ts
import { signal, computed, effect } from '@takanashi/rikka-signal';

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  description?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  favorite: boolean;
}

// Reactive state
export const bookmarks = signal<Bookmark[]>([]);
export const searchQuery = signal('');
export const selectedTags = signal<string[]>([]);
export const sortBy = signal<'date' | 'title'>('date');

// Computed: all unique tags from bookmarks
export const allTags = computed(() => {
  const tagSet = new Set<string>();
  bookmarks().forEach(b => b.tags.forEach(t => tagSet.add(t)));
  return Array.from(tagSet).sort();
});

// Computed: filtered and sorted bookmarks
export const filteredBookmarks = computed(() => {
  let result = [...bookmarks()];
  
  const query = searchQuery().toLowerCase();
  if (query) {
    result = result.filter(b =>
      b.title.toLowerCase().includes(query) ||
      b.url.toLowerCase().includes(query) ||
      b.description?.toLowerCase().includes(query) ||
      b.tags.some(t => t.toLowerCase().includes(query))
    );
  }
  
  if (selectedTags().length > 0) {
    result = result.filter(b =>
      selectedTags().some(tag => b.tags.includes(tag))
    );
  }
  
  result.sort((a, b) => {
    if (sortBy() === 'date') {
      return b.createdAt - a.createdAt;
    } else {
      return a.title.localeCompare(b.title);
    }
  });
  
  return result;
});

// Actions
export function addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) {
  const newBookmark: Bookmark = {
    ...bookmark,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  bookmarks.set(b => [...b, newBookmark]);
}

export function updateBookmark(id: string, updates: Partial<Bookmark>) {
  bookmarks.set(b => b.map(bookmark =>
    bookmark.id === id
      ? { ...bookmark, ...updates, updatedAt: Date.now() }
      : bookmark
  ));
}

export function deleteBookmark(id: string) {
  bookmarks.set(b => b.filter(bookmark => bookmark.id !== id));
}

// Persistence effect
effect(() => {
  localStorage.setItem('bookmarks:data', JSON.stringify(bookmarks()));
});

// Initialize from storage
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('bookmarks:data');
  if (saved) {
    try {
      bookmarks.set(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load bookmarks:', e);
    }
  }
}`;

const bookmarkSearchCode = `// src/components/search-bar.ts
import { defineElement } from '@takanashi/rikka-elements';
import { input, div, span } from '@takanashi/rikka-dom';
import { searchQuery, filteredBookmarks } from '../store';

export const SearchBar = defineElement('bookmark-search-bar', {
  render() {
    let debounceTimer: number | null = null;
    
    const handleInput = (e: Event) => {
      const value = (e.target as HTMLInputElement).value;
      
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        searchQuery.set(value);
      }, 150);
    };
    
    return div({ class: 'search-bar' },
      input({
        type: 'text',
        placeholder: 'Search bookmarks...',
        value: searchQuery,
        onInput: handleInput,
        class: 'search-input'
      }),
      span({ class: 'search-count' },
        computed(() => \`\${filteredBookmarks().length} results\`)
      )
    );
  }
});`;

const editorStoreCode = `// src/editor-store.ts
import { signal, computed, effect } from '@takanashi/rikka-signal';

export interface EditorFile {
  id: string;
  name: string;
  type: 'html' | 'css' | 'js';
  content: string;
  dirty: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ConsoleMessage {
  id: string;
  type: 'log' | 'warn' | 'error' | 'info';
  content: string;
  timestamp: number;
}

// Reactive state
export const files = signal<EditorFile[]>([]);
export const activeFileId = signal<string | null>(null);
export const openTabs = signal<string[]>([]);
export const consoleMessages = signal<ConsoleMessage[]>([]);
export const isRunning = signal(false);
export const autoSaveEnabled = signal(true);

// Computed: current active file
export const activeFile = computed(() => {
  const id = activeFileId();
  return id ? files().find(f => f.id === id) : null;
});

// Computed: files as tree structure
export const fileTree = computed(() => {
  return files().sort((a, b) => a.name.localeCompare(b.name));
});

// Computed: HTML, CSS, JS files for preview
export const previewFiles = computed(() => {
  const fs = files();
  return {
    html: fs.find(f => f.type === 'html')?.content || '',
    css: fs.find(f => f.type === 'css')?.content || '',
    js: fs.find(f => f.type === 'js')?.content || '',
  };
});

// Actions
export function createFile(name: string, type: EditorFile['type'], content = '') {
  const newFile: EditorFile = {
    id: crypto.randomUUID(),
    name, type, content,
    dirty: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  files.set(f => [...f, newFile]);
  openFile(newFile.id);
}

export function deleteFile(id: string) {
  files.set(f => f.filter(file => file.id !== id));
  openTabs.set(tabs => tabs.filter(tab => tab !== id));
  if (activeFileId() === id) {
    activeFileId.set(openTabs()[0] || null);
  }
}

export function updateFile(id: string, content: string) {
  files.set(f => f.map(file =>
    file.id === id
      ? { ...file, content, dirty: true, updatedAt: Date.now() }
      : file
  ));
}

export function saveFile(id: string) {
  files.set(f => f.map(file =>
    file.id === id ? { ...file, dirty: false } : file
  ));
}

export function openFile(id: string) {
  activeFileId.set(id);
  openTabs.set(tabs => tabs.includes(id) ? tabs : [...tabs, id]);
}

export function closeTab(id: string) {
  openTabs.set(tabs => tabs.filter(tab => tab !== id));
  if (activeFileId() === id) {
    const remaining = openTabs();
    activeFileId.set(remaining[remaining.length - 1] || null);
  }
}

export function addConsoleMessage(type: ConsoleMessage['type'], content: string) {
  const message: ConsoleMessage = {
    id: crypto.randomUUID(), type, content, timestamp: Date.now(),
  };
  consoleMessages.set(m => [...m, message].slice(-100));
}

export function clearConsole() { consoleMessages.set([]); }

export function runPreview() {
  isRunning.set(true);
  setTimeout(() => isRunning.set(false), 300);
}

// Auto-save effect
let autoSaveTimer: number | null = null;
effect(() => {
  if (!autoSaveEnabled()) return;
  const dirtyFiles = files().filter(f => f.dirty);
  if (dirtyFiles.length > 0) {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = window.setTimeout(() => {
      dirtyFiles.forEach(f => saveFile(f.id));
    }, 2000);
  }
});`;

const editorPreviewCode = `// src/components/preview-frame.ts
import { defineElement } from '@takanashi/rikka-elements';
import { iframe, div, button } from '@takanashi/rikka-dom';
import { previewFiles, addConsoleMessage, runPreview } from '../editor-store';

export const PreviewFrame = defineElement('editor-preview-frame', {
  render() {
    let iframeRef: HTMLIFrameElement | null = null;
    
    const updatePreview = () => {
      if (!iframeRef || !iframeRef.contentDocument) return;
      const { html, css, js } = previewFiles();
      const fullHtml = \`
        <!DOCTYPE html><html><head><style>\${css}</style></head>
        <body>\${html}
          <script>
            const originalConsole = { ...console };
            ['log','warn','error','info'].forEach(method => {
              console[method] = (...args) => {
                originalConsole[method](...args);
                window.parent.postMessage({
                  type: 'console', method,
                  args: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a))
                }, '*');
              };
            });
            window.onerror = (msg, url, line) => {
              window.parent.postMessage({ type: 'console', method: 'error', args: [\`\${msg} (line \${line})\`] }, '*');
            };
          </script>
          <script>\${js}</script>
        </body></html>\`;
      iframeRef.srcdoc = fullHtml;
    };
    
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'console') {
        addConsoleMessage(e.data.method, e.data.args.join(' '));
      }
    };
    
    effect(() => { previewFiles(); runPreview(); updatePreview(); });
    
    this.addEventListener('connected', () => window.addEventListener('message', handleMessage));
    this.addEventListener('disconnected', () => window.removeEventListener('message', handleMessage));
    
    return div({ class: 'preview-container' },
      div({ class: 'preview-header' },
        button({ onClick: updatePreview }, '🔄 Refresh Preview')
      ),
      iframe({
        class: 'preview-iframe',
        ref: (el) => { iframeRef = el as HTMLIFrameElement; },
        sandbox: 'allow-scripts allow-same-origin'
      })
    );
  }
});`;

const financeStoreCode = `// src/finance-store.ts
import { signal, computed, effect } from '@takanashi/rikka-signal';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: number;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food & Dining', type: 'expense', color: '#ef4444', icon: '🍔' },
  { id: 'transport', name: 'Transportation', type: 'expense', color: '#f59e0b', icon: '🚗' },
  { id: 'housing', name: 'Housing', type: 'expense', color: '#8b5cf6', icon: '🏠' },
  { id: 'salary', name: 'Salary', type: 'income', color: '#10b981', icon: '💰' },
  { id: 'investment', name: 'Investments', type: 'income', color: '#3b82f6', icon: '📈' },
];

export const transactions = signal<Transaction[]>([]);
export const categories = signal<Category[]>(DEFAULT_CATEGORIES);
export const dateFilter = signal<'all' | 'month' | 'lastMonth' | 'custom'>('month');
export const customDateRange = signal<{ start: number; end: number } | null>(null);

export const filteredTransactions = computed(() => {
  let result = [...transactions()];
  const now = Date.now();
  switch (dateFilter()) {
    case 'month':
      const monthStart = new Date();
      monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      result = result.filter(t => t.date >= monthStart.getTime());
      break;
    case 'lastMonth':
      const lastMonthStart = new Date();
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
      lastMonthStart.setDate(1); lastMonthStart.setHours(0, 0, 0, 0);
      const lastMonthEnd = new Date();
      lastMonthEnd.setDate(0); lastMonthEnd.setHours(23, 59, 59, 999);
      result = result.filter(t => t.date >= lastMonthStart.getTime() && t.date <= lastMonthEnd.getTime());
      break;
    case 'custom':
      const range = customDateRange();
      if (range) result = result.filter(t => t.date >= range.start && t.date <= range.end);
      break;
  }
  return result.sort((a, b) => b.date - a.date);
});

export const stats = computed(() => {
  const tx = filteredTransactions();
  const income = tx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = tx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  return { income, expense, net: income - expense, transactionCount: tx.length };
});

export const categoryBreakdown = computed(() => {
  const tx = filteredTransactions();
  const breakdown = new Map<string, { total: number; count: number; type: TransactionType }>();
  tx.forEach(t => {
    const existing = breakdown.get(t.category) || { total: 0, count: 0, type: t.type };
    breakdown.set(t.category, { ...existing, total: existing.total + t.amount, count: existing.count + 1 });
  });
  const maxTotal = Math.max(...Array.from(breakdown.values()).map(v => v.total), 1);
  return Array.from(breakdown.entries()).map(([categoryId, data]) => {
    const category = categories().find(c => c.id === categoryId);
    return {
      categoryId, categoryName: category?.name || categoryId,
      color: category?.color || '#6b7280', icon: category?.icon || '📦',
      ...data, relativeHeight: (data.total / maxTotal) * 100,
    };
  }).sort((a, b) => b.total - a.total);
});

// Actions
export function addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>) {
  transactions.set(t => [...t, { ...tx, id: crypto.randomUUID(), createdAt: Date.now() }]);
}
export function updateTransaction(id: string, updates: Partial<Transaction>) {
  transactions.set(t => t.map(tx => tx.id === id ? { ...tx, ...updates } : tx));
}
export function deleteTransaction(id: string) {
  transactions.set(t => t.filter(tx => tx.id !== id));
}

// Persistence
effect(() => {
  localStorage.setItem('finance:transactions', JSON.stringify(transactions()));
  localStorage.setItem('finance:categories', JSON.stringify(categories()));
});

if (typeof window !== 'undefined') {
  const savedTx = localStorage.getItem('finance:transactions');
  const savedCats = localStorage.getItem('finance:categories');
  if (savedTx) transactions.set(JSON.parse(savedTx));
  if (savedCats) categories.set(JSON.parse(savedCats));
}`;

const financeChartCode = `// src/components/category-chart.ts
import { defineElement, css } from '@takanashi/rikka-elements';
import { div, span } from '@takanashi/rikka-dom';
import { categoryBreakdown, stats } from '../finance-store';

const chartStyles = css\`
  .category-chart { display: flex; gap: 1rem; padding: 1.5rem; background: var(--color-surface); border-radius: var(--radius-lg); }
  .chart-bar { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
  .bar-container { height: 200px; width: 100%; display: flex; align-items: flex-end; background: var(--color-surface-hover); border-radius: var(--radius-sm); overflow: hidden; }
  .bar { width: 100%; transition: height 0.3s ease; border-radius: var(--radius-sm) var(--radius-sm) 0 0; }
  .bar-label { font-size: 0.75rem; color: var(--color-text-secondary); text-align: center; }
  .bar-value { font-weight: 600; color: var(--color-text-primary); }
\`;

export const CategoryChart = defineElement('finance-category-chart', {
  styles: chartStyles,
  render() {
    const breakdown = categoryBreakdown();
    return div({ class: 'category-chart' },
      ...breakdown.map(item =>
        div({ class: 'chart-bar', key: item.categoryId },
          div({ class: 'bar-container' },
            div({ class: 'bar', style: \`height: \${item.relativeHeight}%; background-color: \${item.color};\` })
          ),
          span({ class: 'bar-value' }, \`\${item.type === 'expense' ? '-' : '+'}$\${item.total.toFixed(2)}\`),
          span({ class: 'bar-label' }, \`\${item.icon} \${item.categoryName}\`)
        )
      )
    );
  }
});`;

const todoStoreCode = `// src/store.ts
import { signal, computed, effect } from '@takanashi/rikka-signal';

export type Priority = 'low' | 'medium' | 'high';
export type Filter = 'all' | 'active' | 'completed';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  tags: string[];
  createdAt: number;
}

// Reactive state
export const todos = signal<Todo[]>([]);
export const filter = signal<Filter>('all');
export const searchText = signal('');
export const activePriority = signal<Priority | 'all'>('all');
export const activeTag = signal<string | 'all'>('all');

// Computed: filtered todos
export const filteredTodos = computed(() => {
  let result = todos();
  if (filter() === 'active') result = result.filter(t => !t.completed);
  if (filter() === 'completed') result = result.filter(t => t.completed);
  if (activePriority() !== 'all') result = result.filter(t => t.priority === activePriority());
  if (activeTag() !== 'all') result = result.filter(t => t.tags.includes(activeTag() as string));
  const query = searchText().toLowerCase();
  if (query) result = result.filter(t => t.text.toLowerCase().includes(query));
  return result;
});

// Computed: stats
export const activeCount = computed(() => todos().filter(t => !t.completed).length);
export const completedCount = computed(() => todos().filter(t => t.completed).length);
export const allTags = computed(() => {
  const set = new Set<string>();
  todos().forEach(t => t.tags.forEach(tag => set.add(tag)));
  return Array.from(set).sort();
});

// Actions
export function addTodo(text: string, priority: Priority = 'medium', tags: string[] = []) {
  todos.set(ts => [...ts, {
    id: crypto.randomUUID(),
    text, completed: false, priority, tags,
    createdAt: Date.now(),
  }]);
}

export function toggleTodo(id: string) {
  todos.set(ts => ts.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
}

export function deleteTodo(id: string) {
  todos.set(ts => ts.filter(t => t.id !== id));
}

export function editTodo(id: string, text: string) {
  todos.set(ts => ts.map(t => t.id === id ? { ...t, text } : t));
}

export function clearCompleted() {
  todos.set(ts => ts.filter(t => !t.completed));
}

// Persistence
effect(() => {
  localStorage.setItem('todo:data', JSON.stringify(todos()));
});

if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('todo:data');
  if (saved) todos.set(JSON.parse(saved));
}`;

const todoFilterCode = `// src/components/filter-bar.ts
import { defineElement } from '@takanashi/rikka-dom';
import { div, button, span, select, option } from '@takanashi/rikka-dom';
import { filter, activePriority, activeTag, allTags, activeCount, completedCount } from '../store';
import { locale } from '../i18n';

export const FilterBar = defineElement('todo-filter-bar', {
  render() {
    return div({ class: 'filter-bar' },
      // Status filter
      div({ class: 'filter-group' },
        button({
          class: computed(() => 'filter-btn ' + (filter() === 'all' ? 'active' : ''),
          onClick: () => filter.set('all'),
        }, t('All (\${todos().length})'),
        button({
          class: computed(() => 'filter-btn ' + (filter() === 'active' ? 'active' : ''),
          onClick: () => filter.set('active'),
        }, 'Active (' + activeCount + ')'),
        button({
          class: computed(() => 'filter-btn ' + (filter() === 'completed' ? 'active' : ''),
          onClick: () => filter.set('completed'),
        }, 'Completed (' + completedCount + ')'),
      ),
      // Priority filter
      div({ class: 'filter-group' },
        select({
          class: 'priority-select',
          onChange: (e: Event) => activePriority.set((e.target as HTMLSelectElement).value as any),
        },
          option({ value: 'all' }, 'All priorities'),
          option({ value: 'high' }, '🔴 High'),
          option({ value: 'medium' }, '🟡 Medium'),
          option({ value: 'low' }, '🟢 Low'),
        ),
      ),
      // Tag filter
      div({ class: 'filter-group' },
        select({
          class: 'tag-select',
          onChange: (e: Event) => activeTag.set((e.target as HTMLSelectElement).value),
        },
          option({ value: 'all' }, 'All tags'),
          ...allTags().map(tag => option({ value: tag }, '#\${tag}')),
      ),
    );
  }
});`;

const drawingStoreCode = `// src/store.ts
import { signal, computed, effect } from '@takanashi/rikka-signal';

export type Tool = 'pen' | 'eraser' | 'line' | 'rect' | 'circle';

export interface Point { x: number; y: number; }
export interface Shape {
  type: Tool;
  points: Point[];
  color: string;
  size: number;
}

// Canvas state
export const activeTool = signal<Tool>('pen');
export const activeColor = signal('#000000');
export const brushSize = signal(4);
export const canvasBg = signal('#ffffff');

// Undo/redo history
export const history = signal<Shape[]>([]);
export const historyIndex = signal(0);

// Computed: current shapes on canvas
export const currentShapes = computed(() => history().slice(0, historyIndex()));
export const canUndo = computed(() => historyIndex() > 0);
export const canRedo = computed(() => historyIndex() < history().length);

// Color palette
export const PALETTE = [
  '#000000', '#ef4444', '#f59e0b', '#10b981',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
];

// Brush sizes
export const SIZES = [2, 4, 8, 16, 32];

// Actions
export function addShape(shape: Shape) {
  const newHistory = [...history().slice(0, historyIndex());
  newHistory.push(shape);
  history.set(newHistory);
  historyIndex.set(newHistory.length);
}

export function undo() {
  if (historyIndex.set(Math.max(0, historyIndex() - 1));
}

export function redo() {
  historyIndex.set(Math.min(history().length, historyIndex() + 1));
}

export function clearCanvas() {
  history.set([]);
  historyIndex.set(0);
}

// Persistence (optional)
effect(() => {
  localStorage.setItem('drawing:shapes', JSON.stringify(history()));
});

if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('drawing:shapes');
  if (saved) {
    const parsed = JSON.parse(saved);
    history.set(parsed);
    historyIndex.set(parsed.length);
  }
}`;

const drawingCanvasCode = `// src/components/canvas.ts
import { defineElement } from '@takanashi/rikka-dom';
import { canvas, div, button } from '@takanashi/rikka-dom';
import {
  activeTool, activeColor, brushSize, currentShapes,
  addShape,
} from '../store';

export const DrawingCanvas = defineElement('drawing-canvas', {
  render() {
    let ctx = null;
    let isDrawing = false;
    let currentShape = null;
    const canvasEl = canvas({
      class: 'drawing-canvas' });
    canvasEl.width = 800;
    canvasEl.height = 600;

    function getPos(e) {
      const rect = canvasEl.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function redraw() {
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
      for (const shape of currentShapes()) {
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = shape.size;
        ctx.beginPath();
        if (shape.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.stroke();
      }
    }

    canvasEl.addEventListener('pointerdown', (e) => {
      isDrawing = true;
      currentShape = {
        type: activeTool(), points: [getPos(e)],
        color: activeColor(), size: brushSize(),
      };
    });

    canvasEl.addEventListener('pointermove', (e) => {
      if (!isDrawing || !currentShape) return;
      currentShape.points.push(getPos(e));
      redraw();
      // Draw preview
      ctx.strokeStyle = currentShape.color;
      ctx.lineWidth = currentShape.size;
      ctx.beginPath();
      const pts = currentShape.points;
      for (let i = 0; i < pts.length; i++) {
        if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
        else ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
    });

    canvasEl.addEventListener('pointerup', () => {
      if (currentShape && currentShape.points.length > 1) {
        addShape(currentShape);
      }
      isDrawing = false;
      currentShape = null;
    });

    effect(redraw());

    return div({ class: 'canvas-wrapper' }, canvasEl);
  }
});`;
