import { defineElement } from "@takanashi/rikka-elements";
import { div, h1, h2, h3, h4, p, a, pre, code, ul, li, h } from "@takanashi/rikka-dom";
import { showcasePageStyles } from "../../shared/page-styles";

const CodeEditor = defineElement("rikka-example-code-editor", {
  styles: showcasePageStyles,
  render() {
    return div(
      { class: "example-page" },
      h1({}, "💻 Code Editor"),
      p({}, "A full-featured browser-based IDE built with Rikka through vibe coding. Edit HTML/CSS/JS, run it instantly, and see live preview with integrated console."),
      
      div({
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
        div({
          style: `
            background: var(--color-surface);
            padding: 0.75rem 1rem;
            border-bottom: 1px solid var(--color-surface-hover);
            display: flex;
            align-items: center;
            justify-content: space-between;
          `,
        },
          div({}, "💻 Live Demo"),
          a({
            href: "./examples/code-editor/index.html",
            target: "_blank",
            style: `
              color: var(--color-primary);
              text-decoration: none;
              font-size: 0.875rem;
            `,
          }, "View →"),
        ),
        div({
          style: `
            width: 100%;
            height: calc(100% - 52px);
          `,
        },
          h('iframe', {
            src: "./examples/code-editor/index.html",
            style: `
              width: 100%;
              height: 100%;
              border: none;
            `,
            title: "Code Editor Demo",
          }),
        ),
      ),
      
      div({ class: "showcase-hero" },
        h2({}, "Vibe Coding 构建指南"),
        p({}, "Code Editor 展示了如何通过 vibe coding 构建复杂的编辑器应用。以下是我们使用的核心提示词："),
        div({ class: "vibe-prompts" },
          h3({}, "🚀 第一步：设计编辑器架构"),
          pre({}, code({}, `
# 你可以这样开始：

"创建一个在线代码编辑器，使用 Rikka Web Components。
应用需要：
- 左侧文件树，中间代码编辑区，右侧实时预览
- 支持 HTML/CSS/JS 三个文件
- 实时预览：编辑代码后 iframe 自动更新
- 底部控制台：捕获并显示 console 输出
- 标签页管理：支持多文件切换"

# AI 接下来会帮你：
1. 设计文件管理的数据结构
2. 创建编辑器界面的布局
3. 实现文件系统的增删改查
4. 构建预览和 console 拦截系统
`.trim())),
          h3({}, "🔧 第二步：构建文件管理"),
          pre({}, code({}, `
# 告诉 AI 如何实现文件管理：

"在 editor-store.ts 中：
- 定义 EditorFile 接口（id, name, type, content, dirty）
- 定义 files 信号存储文件列表
- 定义 openTabs 和 activeFileId 信号
- 使用 computed 获取当前活动的文件
- 实现 createFile, deleteFile, updateFile 等操作"

# 关键 Rikka 功能：
- signal<EditorFile[]> 管理文件列表
- computed 自动追踪当前文件
- effect 监听文件变化并保存
`.trim())),
          h3({}, "🎨 第三步：创建编辑器界面"),
          pre({}, code({}, `
# 让 AI 构建编辑器 UI：

"创建以下组件：
- FileTree：文件树侧边栏，点击打开文件
- TabBar：标签栏，显示打开的文件标签
- CodeEditor：文本编辑区，使用 textarea
- PreviewFrame：iframe 预览，监听文件变化
- ConsolePanel：控制台，显示日志和错误"

# Rikka 组件化：
- 每个组件用 defineElement 封装
- 组件之间通过 signals 共享状态
- 自动响应式更新，无需手动刷新
`.trim())),
          h3({}, "⚡ 第四步：实现实时预览"),
          pre({}, code({}, `
# 让 AI 添加实时预览功能：

"实现 PreviewFrame 组件：
- 使用 iframe 的 srcdoc 属性
- effect 监听文件内容变化
- 合并 HTML/CSS/JS 生成完整页面
- 拦截 iframe 的 console 输出"

# Rikka 响应式系统：
- 自动追踪依赖
- 文件变化时自动更新预览
- 无需手动调用刷新
`.trim()))
        ),
        h2({}, "使用的 Rikka 核心功能"),
        div({ class: "feature-grid" },
          div({ class: "feature-card" },
            h3({}, "📁 虚拟文件系统"),
            p({}, "使用 signals 模拟文件系统，支持文件的创建、读取、更新、删除。所有文件操作都是响应式的。")
          ),
          div({ class: "feature-card" },
            h3({}, "📑 多标签状态管理"),
            p({}, "使用 signals 管理打开的标签页和当前活动标签。标签切换时自动更新编辑器内容。")
          ),
          div({ class: "feature-card" },
            h3({}, "🔄 自动预览刷新"),
            p({}, "使用 computed 合并所有文件内容，effect 监听变化并更新 iframe 预览。编辑即所见即所得。")
          ),
          div({ class: "feature-card" },
            h3({}, "🖥️ 跨窗口通信"),
            p({}, "通过 postMessage API 拦截 iframe 中的 console 输出，显示在控制台面板中。")
          ),
          div({ class: "feature-card" },
            h3({}, "⚡ 防抖自动保存"),
            p({}, "使用 effect 和 setTimeout 实现防抖自动保存，避免频繁的文件更新。")
          ),
          div({ class: "feature-card" },
            h3({}, "🎯 脏标记追踪"),
            p({}, "文件修改后标记 dirty 状态，在标签页显示未保存指示器。保存后清除脏标记。")
          )
        ),
        h2({}, "Vibe Coding 工作流程"),
        p({}, "编辑器是一个较复杂的应用，通过分步构建可以更好地控制："),
        div({ class: "workflow-steps" },
          div({ class: "step" },
            h4({}, "1. 先实现单文件编辑"),
            p({}, "从简单的单个 textarea 开始，如 \"创建一个 textarea，绑定到 content 信号\"")
          ),
          div({ class: "step" },
            h4({}, "2. 添加多文件支持"),
            p({}, "扩展为多文件，如 \"添加文件标签页，点击切换编辑不同文件\"")
          ),
          div({ class: "step" },
            h4({}, "3. 实现实时预览"),
            p({}, "添加 iframe 预览，如 \"添加一个 iframe，实时显示 HTML 预览\"")
          ),
          div({ class: "step" },
            h4({}, "4. 完善功能细节"),
            p({}, "添加控制台和快捷键，如 \"拦截 console.log，显示在底部面板\"")
          )
        ),
        h2({}, "构建步骤"),
        p({}, "这个应用展示了复杂编辑器应用的 vibe coding 工作流程："),
        ul({},
          li({}, "Step 1: 设计文件模型 - 定义 EditorFile 接口和文件操作 API"),
          li({}, "Step 2: 构建状态管理 - 使用 signals 管理文件列表和标签页状态"),
          li({}, "Step 3: 创建界面布局 - 使用 defineElement 构建文件树、编辑区、预览区"),
          li({}, "Step 4: 实现编辑器功能 - textarea 绑定、标签切换、文件切换"),
          li({}, "Step 5: 添加实时预览 - effect 监听变化并更新 iframe srcdoc"),
          li({}, "Step 6: 实现控制台 - postMessage 拦截 console 并显示在面板中")
        )
      ),
      
      h2({}, "Project Structure"),
      div({ class: "arch-section" },
        pre({}, code({}, `
code-editor/
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
        └── console-panel.ts # Output console
`.trim()))
      ),
      
      h2({}, "Key Features"),
      div({ class: "feature-grid" },
        div({ class: "feature-card" },
          h3({}, "📁 Virtual File System"),
          p({}, "Manage files and folders with reactive, in-memory file system that supports create, delete, rename")
        ),
        div({ class: "feature-card" },
          h3({}, "📑 Multi-tab Editing"),
          p({}, "Open multiple files simultaneously with tab switching, close buttons, and dirty state indicators")
        ),
        div({ class: "feature-card" },
          h3({}, "▶️ Live Preview"),
          p({}, "Iframe-based preview that automatically updates on edit with debounced rendering")
        ),
        div({ class: "feature-card" },
          h3({}, "🖨️ Integrated Console"),
          p({}, "Captures console.log, errors, and warnings from preview and displays them with formatting")
        ),
        div({ class: "feature-card" },
          h3({}, "⌨️ Keyboard Shortcuts"),
          p({}, "Common IDE shortcuts like Cmd/Ctrl+S for save, Cmd/Ctrl+P for quick file search")
        ),
        div({ class: "feature-card" },
          h3({}, "🎨 Syntax Highlighting"),
          p({}, "Basic syntax highlighting for HTML, CSS, and JavaScript with theme support")
        )
      ),
      
      div({ class: "explanation" },
        h2({}, "Editor State Architecture"),
        p({}, "The central store manages files, tabs, and preview state with comprehensive reactive system:"),
        div({ class: "arch-section" },
          pre({}, code({}, `
// src/editor-store.ts
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
    name,
    type,
    content,
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
    file.id === id
      ? { ...file, dirty: false }
      : file
  ));
}

export function openFile(id: string) {
  activeFileId.set(id);
  openTabs.set(tabs =>
    tabs.includes(id) ? tabs : [...tabs, id]
  );
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
    id: crypto.randomUUID(),
    type,
    content,
    timestamp: Date.now(),
  };
  consoleMessages.set(m => [...m, message].slice(-100));
}

export function clearConsole() {
  consoleMessages.set([]);
}

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
});
`.trim()))
        )
      ),
      
      div({ class: "explanation" },
        h2({}, "Preview & Console Integration"),
        p({}, "The iframe preview system demonstrates inter-process communication between components:"),
        div({ class: "arch-section" },
          pre({}, code({}, `
// src/components/preview-frame.ts
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
        <!DOCTYPE html>
        <html>
        <head>
          <style>\${css}</style>
        </head>
        <body>
          \${html}
          <script>
            // Override console to capture messages
            const originalConsole = { ...console };
            ['log', 'warn', 'error', 'info'].forEach(method => {
              console[method] = (...args) => {
                originalConsole[method](...args);
                window.parent.postMessage({
                  type: 'console',
                  method,
                  args: args.map(a => 
                    typeof a === 'object' ? JSON.stringify(a) : String(a)
                  )
                }, '*');
              };
            });
            // Catch errors
            window.onerror = (msg, url, line, col, err) => {
              window.parent.postMessage({
                type: 'console',
                method: 'error',
                args: [\`\${msg} (line \${line})\`]
              }, '*');
            };
          </script>
          <script>\${js}</script>
        </body>
        </html>
      \`;
      
      iframeRef.srcdoc = fullHtml;
    };
    
    // Listen for console messages from iframe
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'console') {
        addConsoleMessage(
          e.data.method as any,
          e.data.args.join(' ')
        );
      }
    };
    
    effect(() => {
      previewFiles(); // Trigger on change
      runPreview(); // Track run state
      updatePreview();
    });
    
    this.addEventListener('connected', () => {
      window.addEventListener('message', handleMessage);
    });
    
    this.addEventListener('disconnected', () => {
      window.removeEventListener('message', handleMessage);
    });
    
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
});
`.trim()))
        )
      ),
      
      div({ class: "example-nav" },
        a({ href: "#/examples", class: "prev-link" }, "← All Examples"),
        div({ class: "spacer" }),
        a({ href: "#/examples/finance-tracker", class: "next-link" }, "Finance Tracker →")
      )
    );
  }
});

export { CodeEditor as ExampleCodeEditor };
