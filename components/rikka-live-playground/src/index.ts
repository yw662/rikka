import {
  defineElement,
  css,
  event,
  type RikkaElement,
  type ElementConfig,
} from "rikka-elements";
import { div, textarea, button, pre, span, section } from "rikka-dom";
import * as esbuild from "esbuild-wasm";
import wasmUrl from "esbuild-wasm/esbuild.wasm?url";

const livePlaygroundStyles = css`
  :host {
    display: block;
  }
  .container {
    border: 1px solid #334155;
    border-radius: 0.75rem;
    overflow: hidden;
    background: #0d1117;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    background: #161b22;
    border-bottom: 1px solid #334155;
  }
  .title {
    font-size: 0.75rem;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .actions {
    display: flex;
    gap: 0.5rem;
  }
  .run-btn {
    padding: 0.35rem 0.75rem;
    font-size: 0.75rem;
    background: #238636;
    color: white;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    transition: background 0.2s;
  }
  .run-btn:hover {
    background: #2ea043;
  }
  .reset-btn {
    padding: 0.35rem 0.75rem;
    font-size: 0.75rem;
    background: transparent;
    color: #94a3b8;
    border: 1px solid #334155;
    border-radius: 0.375rem;
    cursor: pointer;
  }
  .reset-btn:hover {
    border-color: #6366f1;
    color: #e2e8f0;
  }
  .editor-area {
    width: 100%;
    box-sizing: border-box;
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 0.85rem;
    line-height: 1.6;
    background: #0d1117;
    color: #e6edf3;
    padding: 1rem;
    border: none;
    border-bottom: 1px solid #334155;
    resize: vertical;
    outline: none;
    min-height: 120px;
  }
  .preview-section {
    display: flex;
    flex-direction: column;
    background: #1a1a2e;
    min-height: 80px;
    height: 250px;
  }
  .preview-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.75rem 1rem 0 1rem;
  }
  .preview-area {
    flex: 1;
    background: #0f0f1a;
    border: 1px solid #334155;
    border-radius: 0.5rem;
    margin: 0.5rem 1rem;
    padding: 1rem;
    min-height: 40px;
    overflow: auto;
  }
  .resize-handle {
    height: 8px;
    background: #161b22;
    cursor: ns-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    border-top: 1px solid #334155;
    flex-shrink: 0;
    transition: background 0.2s;
  }
  .resize-handle:hover,
  .resize-handle.active {
    background: #1f2937;
  }
  .resize-handle::after {
    content: "";
    width: 32px;
    height: 3px;
    border-radius: 2px;
    background: #475569;
    transition: background 0.2s;
  }
  .resize-handle:hover::after,
  .resize-handle.active::after {
    background: #6366f1;
  }
  .preview-iframe {
    width: 100%;
    height: 100%;
    border: none;
    background: transparent;
    min-height: 40px;
  }
  .error-area {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.8rem;
    padding: 0.75rem 1rem;
    color: #f85149;
    background: rgba(248, 81, 73, 0.08);
    border-top: 1px solid #334155;
    white-space: pre-wrap;
    margin: 0;
    display: none;
  }
  .error-area.has-error {
    display: block;
  }
`;

let esbuildInitPromise: Promise<void> | null = null;

async function ensureEsbuild() {
  if (!esbuildInitPromise) {
    esbuildInitPromise = esbuild.initialize({ wasmURL: wasmUrl });
  }
  await esbuildInitPromise;
}

async function transformCode(code: string): Promise<string> {
  await ensureEsbuild();
  const result = await esbuild.transform(code, {
    target: "es2022",
    loader: "ts",
    keepNames: true,
    legalComments: "none",
  });
  return result.code;
}

const IFRAME_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script type="importmap">
  {
    "imports": {
      "rikka-signal": "/esm/rikka-signal.js",
      "rikka-dom": "/esm/rikka-dom.js",
      "rikka-elements": "/esm/rikka-elements.js",
      "signal-polyfill": "/esm/signal-polyfill.js"
    }
  }
  </script>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, sans-serif;
      color: #e2e8f0;
      background: transparent;
    }
    #app { padding: 0; }
    #console-output {
      margin-top: 1rem;
      padding: 0.75rem;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 0.375rem;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.8125rem;
      max-height: 200px;
      overflow-y: auto;
    }
    #console-output:empty { display: none; }
    .console-log { color: #e2e8f0; margin: 0.125rem 0; }
    .console-warn { color: #d29922; margin: 0.125rem 0; }
    .console-error { color: #f85149; margin: 0.125rem 0; }
    .console-info { color: #58a6ff; margin: 0.125rem 0; }
  </style>
</head>
<body>
  <div id="app"></div>
  <div id="console-output"></div>
  <script>
    (function() {
      var consoleOutput = document.getElementById('console-output');
      var originalLog = console.log;
      var originalWarn = console.warn;
      var originalError = console.error;
      var originalInfo = console.info;

      function appendToConsole(type, args) {
        var line = document.createElement('div');
        line.className = 'console-' + type;
        line.textContent = '[' + type.toUpperCase() + '] ' + Array.from(args).map(function(arg) {
          return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg);
        }).join(' ');
        consoleOutput.appendChild(line);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
      }

      console.log = function() { originalLog.apply(console, arguments); appendToConsole('log', arguments); };
      console.warn = function() { originalWarn.apply(console, arguments); appendToConsole('warn', arguments); };
      console.error = function() { originalError.apply(console, arguments); appendToConsole('error', arguments); };
      console.info = function() { originalInfo.apply(console, arguments); appendToConsole('info', arguments); };
    })();
  </script>
</body>
</html>`;

const SETUP_SCRIPT = `
  var RS = RikkaSignal;
  if (RS) {
    window.signal = RS.signal;
    window.computed = RS.computed;
    window.effect = RS.effect;
    window.store = RS.store;
    window.raw = RS.raw;
  }
  var RD = RikkaDom;
  if (RD) {
    window.h = RD.h;
    window.For = RD.For;
    window.div = RD.div;
    window.span = RD.span;
    window.a = RD.a;
    window.p = RD.p;
    window.button = RD.button;
    window.input = RD.input;
    window.h1 = RD.h1;
    window.h2 = RD.h2;
    window.h3 = RD.h3;
    window.h4 = RD.h4;
    window.h5 = RD.h5;
    window.h6 = RD.h6;
    window.section = RD.section;
    window.article = RD.article;
    window.aside = RD.aside;
    window.nav = RD.nav;
    window.header = RD.header;
    window.footer = RD.footer;
    window.main = RD.main;
    window.ul = RD.ul;
    window.ol = RD.ol;
    window.li = RD.li;
    window.table = RD.table;
    window.thead = RD.thead;
    window.tbody = RD.tbody;
    window.tr = RD.tr;
    window.th = RD.th;
    window.td = RD.td;
    window.form = RD.form;
    window.select = RD.select;
    window.option = RD.option;
    window.label = RD.label;
    window.textarea = RD.textarea;
    window.pre = RD.pre;
    window.code = RD.code;
    window.br = RD.br;
    window.hr = RD.hr;
    window.img = RD.img;
    window.slot = RD.slot;
    window.template = RD.template;
    window.svg = RD.svg;
    window.circle = RD.circle;
    window.css = RD.css;
    window.inlineStyle = RD.inlineStyle;
    window.render = RD.render;
  }
  var RE = RikkaElements;
  if (RE) {
    window.defineElement = RE.defineElement;
    window.event = RE.event;
  }
`;

type LivePlaygroundConfig = ElementConfig & {
  attributes: {
    code: (v: string | undefined) => string;
    height: (v: string | undefined) => string;
    title: (v: string | undefined) => string;
  };
  events: {
    error: ((domEvent: Event) => string) | undefined;
  };
  styles: CSSStyleSheet;
};

type LivePlaygroundElement = RikkaElement<LivePlaygroundConfig> & {
  run: () => Promise<void>;
  reset: () => void;
  dispatchError: (
    msg: string,
    options?: Omit<CustomEventInit<string>, "detail">,
  ) => boolean;
};

const RikkaLivePlayground = defineElement("rikka-live-playground", {
  attributes: {
    code: (v: string | undefined) => v ?? "",
    height: (v: string | undefined) => v ?? "200",
    title: (v: string | undefined) => v ?? "Example",
  },
  events: {
    error: event<string>(),
  },
  styles: livePlaygroundStyles,
  render(this: RikkaElement<LivePlaygroundConfig>) {
    const self = this as LivePlaygroundElement;
    const initialCode = this.textContent?.trim() || this.code;

    if (initialCode) {
      queueMicrotask(() => self.run());
    }

    return div(
      { class: "container" },
      div(
        { class: "header" },
        span({ class: "title" }, this.title),
        div(
          { class: "actions" },
          button({ class: "run-btn", onclick: () => self.run() }, "▶ Run"),
          button({ class: "reset-btn", onclick: () => self.reset() }, "Reset"),
        ),
      ),
      textarea({
        class: "editor-area",
        style: { height: `${this.height}px` },
        spellcheck: false,
        defaultValue: this.textContent?.trim() || this.code,
      }),
      div({
        class: "resize-handle",
        onmousedown: (e: MouseEvent) => {
          e.preventDefault();
          const handle = e.currentTarget as HTMLElement;
          const editor = handle.previousElementSibling as HTMLElement;
          if (!editor) return;

          handle.classList.add("active");
          const startY = e.clientY;
          const startH = editor.offsetHeight;

          const onMouseMove = (ev: MouseEvent) => {
            editor.style.height = `${Math.max(60, startH + ev.clientY - startY)}px`;
          };

          const onMouseUp = () => {
            handle.classList.remove("active");
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
          };

          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        },
      }),
      section(
        { class: "preview-section" },
        div({ class: "preview-label" }, "Preview"),
        div({ class: "preview-area" }),
        div({
          class: "resize-handle",
          onmousedown: (e: MouseEvent) => {
            e.preventDefault();
            const handle = e.currentTarget as HTMLElement;
            const section = handle.parentElement as HTMLElement;
            if (!section) return;

            handle.classList.add("active");
            const startY = e.clientY;
            const startH = section.offsetHeight;

            const onMouseMove = (ev: MouseEvent) => {
              section.style.height = `${Math.max(40, startH + ev.clientY - startY)}px`;
            };

            const onMouseUp = () => {
              handle.classList.remove("active");
              document.removeEventListener("mousemove", onMouseMove);
              document.removeEventListener("mouseup", onMouseUp);
            };

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
          },
        }),
      ),
      pre({ class: "error-area" }),
    );
  },
});

(RikkaLivePlayground as any).prototype.run = async function (
  this: LivePlaygroundElement,
) {
  const textareaEl = this.shadowRoot?.querySelector(
    ".editor-area",
  ) as HTMLTextAreaElement | null;
  const previewEl = this.shadowRoot?.querySelector(
    ".preview-area",
  ) as HTMLElement | null;
  const errorEl = this.shadowRoot?.querySelector(
    ".error-area",
  ) as HTMLPreElement | null;
  const iframeEl = this.shadowRoot?.querySelector(
    ".preview-iframe",
  ) as HTMLIFrameElement | null;

  if (!textareaEl || !previewEl || !errorEl) return;

  const currentCode = textareaEl.value || this.textContent?.trim() || this.code;

  errorEl.classList.remove("has-error");
  errorEl.textContent = "";

  if (iframeEl) {
    iframeEl.remove();
  }

  previewEl.innerHTML = "";

  let compiledCode: string;
  try {
    compiledCode = await transformCode(currentCode);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    errorEl.textContent = `Compile Error: ${msg}`;
    errorEl.classList.add("has-error");
    this.dispatchError(msg);
    return;
  }

  try {
    const codeHtml = generateIframeWithCode(compiledCode);
    const newIframe = document.createElement("iframe");
    newIframe.className = "preview-iframe";
    newIframe.sandbox.add("allow-scripts", "allow-same-origin");
    newIframe.srcdoc = codeHtml;
    previewEl.appendChild(newIframe);

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Iframe load timeout")),
        10000,
      );
      newIframe.onload = () => {
        clearTimeout(timeout);
        resolve();
      };
      newIframe.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Iframe load error"));
      };
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    errorEl.textContent = `Error: ${msg}`;
    errorEl.classList.add("has-error");
    this.dispatchError(msg);
  }
};

(RikkaLivePlayground as any).prototype.reset = function (
  this: LivePlaygroundElement,
) {
  const textareaEl = this.shadowRoot?.querySelector(
    ".editor-area",
  ) as HTMLTextAreaElement | null;
  if (textareaEl) {
    const originalCode = this.textContent?.trim() || this.code;
    textareaEl.defaultValue = originalCode;
    textareaEl.value = originalCode;
  }
  this.run();
};

function generateIframeWithCode(compiledCode: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const sanitizedCode = compiledCode
    .replace(/^import\s+.*?;?\s*$/gm, "")
    .trim();

  const userScript = [
    `import * as RikkaSignal from '${origin}/esm/rikka-signal.js';`,
    `import * as RikkaDom from '${origin}/esm/rikka-dom.js';`,
    `import * as RikkaElements from '${origin}/esm/rikka-elements.js';`,
    "",
    SETUP_SCRIPT,
    "",
    "function safeAppend(container, value) {",
    "  if (value == null || value === false) return;",
    "  if (Array.isArray(value)) {",
    "    value.forEach(function(item) { safeAppend(container, item); });",
    "    return;",
    "  }",
    "  if (value instanceof Node || (value && typeof value.nodeType === 'number')) {",
    "    container.appendChild(value);",
    "    return;",
    "  }",
    "  if (typeof value === 'string' || typeof value === 'number') {",
    "    container.appendChild(document.createTextNode(String(value)));",
    "    return;",
    "  }",
    "}",
    "",
    "try {",
    "  var container = document.getElementById('app');",
    "  var result = (function() {",
    sanitizedCode,
    "  })();",
    "  if (result != null && result !== false) {",
    "    safeAppend(container, result);",
    "  }",
    "} catch (err) {",
    "  var errorDiv = document.createElement('div');",
    "  errorDiv.style.color = '#f85149';",
    "  errorDiv.style.padding = '0.75rem';",
    "  errorDiv.textContent = 'Error: ' + err.message;",
    "  var output = document.getElementById('console-output') || document.body;",
    "  output.appendChild(errorDiv);",
    "}",
  ].join("\n");

  return IFRAME_HTML.replace(
    "</body>",
    `<script type="module">${userScript}</script></body>`,
  );
}

export { RikkaLivePlayground };
export type { LivePlaygroundElement };
