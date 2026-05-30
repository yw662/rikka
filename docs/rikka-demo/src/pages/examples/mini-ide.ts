import { defineElement, css } from "rikka-elements";
import { div, h1, h2, p, a, span, For } from "rikka-dom";
import { signal, computed, effect, store } from "rikka-signal";
import { sharedStyles, examplePageStyles } from "../../shared/styles";

const styles = css`
  ${examplePageStyles}
`;

const miniIdeCode = `// File system simulation with store
const files = store([
  { name: 'app.js', type: 'file', content: 'const x = 1;\nconsole.log(x);' },
  { name: 'utils.js', type: 'file', content: 'export function add(a, b) {\n  return a + b;\n}' },
  { name: 'index.js', type: 'file', content: 'import { add } from "./utils";\nconsole.log(add(1, 2));' },
  { name: 'src', type: 'folder', children: [
    { name: 'app.ts', type: 'file', content: 'const app = {};\nexport default app;' }
  ]}
]);

// Tab system
const openTabs = signal([]);
const activeTab = signal(0);
const terminalLines = signal(['> Ready']);

// Cursor position
const cursorLine = signal(1);
const cursorCol = signal(1);

// Language detection
const language = computed(() => {
  const tabs = openTabs.get();
  if (tabs.length === 0) return 'Plain Text';
  const fileName = tabs[activeTab.get()];
  if (fileName.endsWith('.ts')) return 'TypeScript';
  if (fileName.endsWith('.js')) return 'JavaScript';
  return 'Plain Text';
});

// Effect for tab switching feedback
effect(() => {
  const tabs = openTabs.get();
  const active = activeTab.get();
  if (tabs.length > 0) {
    console.log('Tab switched to:', tabs[active]);
  }
});

// Get file content by name
const getFileContent = (name) => {
  const findFile = (items) => {
    for (const item of items) {
      if (item.name === name && item.type === 'file') return item.content;
      if (item.children) {
        const found = findFile(item.children);
        if (found) return found;
      }
    }
    return null;
  };
  return findFile(files);
};

// Open file in tab
const openFile = (name) => {
  const tabs = openTabs.get();
  const idx = tabs.indexOf(name);
  if (idx >= 0) {
    activeTab.set(idx);
  } else {
    openTabs.set([...tabs, name]);
    activeTab.set(tabs.length);
  }
  terminalLines.set([...terminalLines.get(), '> Opening ' + name]);
  setTimeout(() => {
    terminalLines.set([...terminalLines.get(), '> Running ' + name + '...']);
    setTimeout(() => {
      const content = getFileContent(name);
      if (content) {
        const firstLine = content.split('\\n')[0];
        terminalLines.set([...terminalLines.get(), '> ' + firstLine]);
      }
    }, 300);
  }, 400);
};

// Close tab
const closeTab = (e, name) => {
  e.stopPropagation();
  const tabs = openTabs.get();
  const idx = tabs.indexOf(name);
  const newTabs = tabs.filter(t => t !== name);
  openTabs.set(newTabs);
  if (activeTab.get() >= newTabs.length) {
    activeTab.set(Math.max(0, newTabs.length - 1));
  } else if (idx <= activeTab.get()) {
    activeTab.set(Math.max(0, activeTab.get() - 1));
  }
};

// Render file tree recursively
const renderFileTree = (items, depth = 0) => {
  const elements = [];
  for (const item of items) {
    if (item.type === 'file') {
      elements.push(
        div({
          onclick: () => openFile(item.name),
          style: {
            padding: '0.35rem 0.5rem',
            paddingLeft: (depth * 16 + 8) + 'px',
            cursor: 'pointer',
            color: '#c9d1d9',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'background 0.15s'
          }
        }, '📄 ', item.name)
      );
    } else if (item.type === 'folder') {
      elements.push(
        div({
          style: {
            padding: '0.35rem 0.5rem',
            paddingLeft: (depth * 16 + 8) + 'px',
            color: '#8b949e',
            fontSize: '0.875rem',
            fontWeight: 600
          }
        }, '📁 ', item.name)
      );
      if (item.children) {
        elements.push(...renderFileTree(item.children, depth + 1));
      }
    }
  }
  return elements;
};

// File tree sidebar
const fileTree = div(
  { style: { width: '180px', background: '#0d1117', borderRight: '1px solid #30363d', padding: '0.5rem 0', overflow: 'auto' } },
  ...renderFileTree(files)
);

// Tab bar
const tabBar = div(
  { style: { display: 'flex', background: '#161b22', borderBottom: '1px solid #30363d', minHeight: '36px' } },
  For(openTabs, (tabName, i) =>
    div(
      {
        onclick: () => activeTab.set(i),
        style: {
          padding: '0.5rem 0.75rem',
          paddingRight: '2rem',
          cursor: 'pointer',
          background: computed(() => activeTab.get() === i ? '#1a1a2e' : 'transparent'),
          borderRight: '1px solid #30363d',
          color: computed(() => activeTab.get() === i ? '#e2e8f0' : '#8b949e'),
          fontSize: '0.8125rem',
          position: 'relative',
          transition: 'all 0.15s'
        }
      },
      tabName,
      span(
        {
          onclick: (e) => closeTab(e, tabName),
          style: {
            position: 'absolute',
            right: '0.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '3px',
            color: '#8b949e',
            fontSize: '0.75rem'
          }
        }, '×')
      )
    )
  )
);

// Editor area
const editorArea = div(
  { style: { flex: 1, padding: '1rem', fontFamily: "'Fira Code', monospace", fontSize: '0.875rem', background: '#0d1117', color: '#c9d1d9', overflow: 'auto', whiteSpace: 'pre-wrap' } },
  computed(() => {
    const tabs = openTabs.get();
    if (tabs.length === 0) return 'Select a file to edit...';
    const fileName = tabs[activeTab.get()];
    return getFileContent(fileName) || 'File not found';
  })
);

// Terminal
const terminal = div(
  { style: { background: '#0d1117', borderTop: '1px solid #30363d', padding: '0.75rem', fontFamily: "'Fira Code', monospace", fontSize: '0.8125rem', maxHeight: '120px', overflow: 'auto' } },
  For(terminalLines, (line) =>
    div({ style: { color: '#4ade80', marginBottom: '0.25rem' } }, line)
  )
);

// Status bar
const statusBar = div(
  { style: { display: 'flex', justifyContent: 'space-between', padding: '0.4rem 1rem', background: '#161b22', borderTop: '1px solid #30363d', fontSize: '0.75rem', color: '#8b949e' } },
  computed(() => 'Ln ' + cursorLine.get() + ', Col ' + cursorCol.get()),
  language
);

// Main IDE layout
const app = div({ style: { display: 'flex', flexDirection: 'column', height: '400px', border: '1px solid #30363d', borderRadius: '0.5rem', overflow: 'hidden', background: '#0d1117' } },
  div({ style: { padding: '0.75rem 1rem', background: '#161b22', borderBottom: '1px solid #30363d', fontWeight: 600, color: '#e2e8f0', fontSize: '0.9375rem' } }, 'Mini IDE'),
  div({ style: { display: 'flex', flex: 1, overflow: 'hidden' } }, fileTree, div({ style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }, tabBar, editorArea, terminal)),
  statusBar
);

container.appendChild(app);`;

const ExampleMiniIde = defineElement(
  "rikka-example-mini-ide",
  {
    styles,
    render() {
      return div(
        { class: "example-page" },
        h1("Mini IDE"),
        p("A file browser, tab system, editor, terminal, and status bar all working together with reactive signals."),
        div(
          { class: "playground-container" },
          sharedStyles.createPlayground(miniIdeCode, "480", "Mini IDE Example"),
        ),
        div(
          { class: "explanation" },
          h2("Key Concepts"),
          p(
            sharedStyles.inlineCode("store([...])"),
            " creates a deep reactive store for the file system structure.",
          ),
          p(
            sharedStyles.inlineCode("signal<string[]>([])"),
            " tracks open tabs and terminal history.",
          ),
          p(
            sharedStyles.inlineCode("For(files, renderFn)"),
            " renders the file tree with recursive folder support.",
          ),
          p(
            sharedStyles.inlineCode("effect()"),
            " handles side effects like updating terminal output.",
          ),
          p(
            "Click files to open tabs, click X to close tabs, and watch the simulated terminal output.",
          ),
        ),
        div(
          { class: "example-nav" },
          a({ href: "#/examples/knowledge-base", class: "prev-link" }, "\u2190 Knowledge Base"),
          div({ class: "spacer" }),
          a(
            { href: "#/examples/collaboration",
              class: "next-link" },
            "Collaboration \u2192",
          ),
        ),
      );
    },
  },
);

export { ExampleMiniIde };