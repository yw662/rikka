import { signal, computed, effect, store } from '@rikka/signal';

export type FileType = 'html' | 'css' | 'js';
export type ConsoleEntry = {
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: Date;
};

interface EditorState {
  html: string;
  css: string;
  js: string;
}

const STORAGE_KEY_CODE = 'rikka-code-editor-code';
const STORAGE_KEY_THEME = 'rikka-code-editor-theme';

const DEFAULT_HTML = `<div class="container">
  <h1>Hello World</h1>
  <p>Welcome to Mini Code Editor</p>
  <button id="btn">Click Me</button>
  <div id="output"></div>
</div>`;

const DEFAULT_CSS = `.container {
  font-family: system-ui, sans-serif;
  padding: 2rem;
  text-align: center;
}

h1 {
  color: #007acc;
  margin-bottom: 1rem;
}

button {
  padding: 0.75rem 1.5rem;
  background: #007acc;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;
}

button:hover {
  background: #005f8f;
}

#output {
  margin-top: 1rem;
  padding: 1rem;
  background: #f0f0f0;
  border-radius: 6px;
}`;

const DEFAULT_JS = `let count = 0;

document.getElementById('btn').addEventListener('click', () => {
  count++;
  const output = document.getElementById('output');
  output.textContent = \`Clicked \${count} time(s)\`;
  console.log('Button clicked:', count);
});

console.log('Mini Code Editor initialized!');
console.info('Try clicking the button above');`;

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage errors are non-fatal - editor should still work
  }
}

function loadInitialState(): EditorState {
  return loadFromStorage(STORAGE_KEY_CODE, {
    html: DEFAULT_HTML,
    css: DEFAULT_CSS,
    js: DEFAULT_JS,
  });
}

function loadInitialTheme(): 'dark' | 'light' {
  return loadFromStorage(STORAGE_KEY_THEME, 'dark');
}

export const editorState = store<EditorState>(loadInitialState());

export const activeTab = signal<FileType>('html');

export const theme = signal<'dark' | 'light'>(loadInitialTheme());

export const consoleEntries = signal<ConsoleEntry[]>([]);

export function addConsoleEntry(type: ConsoleEntry['type'], message: string): void {
  consoleEntries.set([
    ...consoleEntries.get(),
    { type, message, timestamp: new Date() }
  ]);
}

export function clearConsole(): void {
  consoleEntries.set([]);
}

export const combinedPreviewHTML = computed(() => {
  const { html, css, js } = editorState;
  return html.replace('</head>', `<style>${css}</style></head>`)
    .replace('</body>', `<script>${js}<\/script></body>`);
});

effect(() => {
  saveToStorage(STORAGE_KEY_CODE, {
    html: editorState.html,
    css: editorState.css,
    js: editorState.js,
  });
});

effect(() => {
  saveToStorage(STORAGE_KEY_THEME, theme.get());
});