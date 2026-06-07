import { signal, computed, effect } from '@takanashi/rikka-signal';

export type FileType = 'html' | 'css' | 'js';

export interface ConsoleEntry {
  id: string;
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: Date;
}

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>预览</title>
</head>
<body>
  <div class="container">
    <h1>👋 Hello, World!</h1>
    <p>这是一个实时编辑器，修改下方代码即可看到效果</p>
    <button id="clickBtn">点击我</button>
    <p id="counter">点击次数: <span id="count">0</span></p>
  </div>
</body>
</html>`;

const DEFAULT_CSS = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.container {
  background: white;
  padding: 3rem;
  border-radius: 1rem;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 100%;
}

h1 {
  color: #667eea;
  margin-bottom: 1rem;
  font-size: 2rem;
}

p {
  color: #64748b;
  margin-bottom: 1.5rem;
  font-size: 1rem;
}

button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: transform 0.2s ease;
  font-weight: 600;
}

button:hover {
  transform: scale(1.05);
}

#counter {
  margin-top: 1rem;
  font-size: 1.25rem;
  color: #667eea;
  font-weight: 600;
}`;

const DEFAULT_JS = `let count = 0;
const btn = document.getElementById('clickBtn');
const countEl = document.getElementById('count');

btn.addEventListener('click', () => {
  count++;
  countEl.textContent = count;
  console.log('按钮被点击了 ' + count + ' 次！');
  
  if (count === 5) {
    console.info('🎉 太棒了！你已经点击了5次！');
  }
  
  if (count === 10) {
    console.warn('⚠️ 警告：你已经点击10次了，休息一下吧！');
  }
});

console.log('🚀 编辑器已就绪！开始编辑代码吧');`;

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
    // ignore
  }
}

function loadInitialCode() {
  return loadFromStorage('code-editor-state', {
    html: DEFAULT_HTML,
    css: DEFAULT_CSS,
    js: DEFAULT_JS,
  });
}

const initialCode = loadInitialCode();

export const htmlCode = signal(initialCode.html);
export const cssCode = signal(initialCode.css);
export const jsCode = signal(initialCode.js);
export const activeTab = signal<FileType>('html');
export const consoleEntries = signal<ConsoleEntry[]>([]);
export const isConsoleOpen = signal(true);

export const combinedPreviewHTML = computed(() => {
  const html = htmlCode.get();
  const css = cssCode.get();
  const js = jsCode.get();
  
  const styleTag = `<style>${css}</style>`;
  const scriptTag = `<script>${js}<\/script>`;
  
  let result = html;
  
  if (!result.includes('</head>')) {
    result = result.replace('<body>', styleTag + '<body>');
  } else {
    result = result.replace('</head>', styleTag + '</head>');
  }
  
  if (!result.includes('</body>')) {
    result = result + scriptTag;
  } else {
    result = result.replace('</body>', scriptTag + '</body>');
  }
  
  return result;
});

export function addConsoleEntry(type: ConsoleEntry['type'], message: string) {
  const entry: ConsoleEntry = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    type,
    message,
    timestamp: new Date(),
  };
  consoleEntries.set([...consoleEntries.get(), entry]);
}

export function clearConsole() {
  consoleEntries.set([]);
}

export function setActiveTab(tab: FileType) {
  activeTab.set(tab);
}

export function resetAll() {
  if (confirm('确定要重置所有代码吗？这将无法撤销。')) {
    htmlCode.set(DEFAULT_HTML);
    cssCode.set(DEFAULT_CSS);
    jsCode.set(DEFAULT_JS);
    clearConsole();
  }
}

const STORAGE_KEY = 'code-editor-state';

effect(() => {
  saveToStorage(STORAGE_KEY, {
    html: htmlCode.get(),
    css: cssCode.get(),
    js: jsCode.get(),
  });
});
