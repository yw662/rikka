import {
  defineElement,
  css,
  event,
  type RikkaElement,
  type ElementConfig,
  type AttributeSpec,
} from "@takanashi/rikka-elements";
import {
  div,
  textarea,
  button,
  pre,
  span,
  section,
} from "@takanashi/rikka-dom";
import { computed, effect } from "@takanashi/rikka-signal";
import * as esbuild from "esbuild-wasm";
import wasmUrl from "esbuild-wasm/esbuild.wasm?url";

const livePlaygroundStyles = css`
  :host {
    display: block;

    --pg-bg: #0d1117;
    --pg-surface: #161b22;
    --pg-surface-elevated: #1a1a2e;
    --pg-surface-2: #0f0f1a;
    --pg-surface-hover: #1f2937;

    --pg-border: #334155;

    --pg-text: #e6edf3;
    --pg-text-muted: #94a3b8;
    --pg-text-subtle: #64748b;
    --pg-text-strong: #e2e8f0;
    --pg-text-inverse: #ffffff;

    --pg-accent: #6366f1;
    --pg-accent-soft: rgba(99, 102, 241, 0.12);
    --pg-accent-soft-strong: rgba(99, 102, 241, 0.22);
    --pg-accent-active: #a5b4fc;
    --pg-success: #238636;
    --pg-success-hover: #2ea043;
    --pg-warn: #d29922;
    --pg-error: #f85149;
    --pg-error-bg: rgba(248, 81, 73, 0.08);
    --pg-info: #58a6ff;

    --pg-handle-grip: #475569;
    --pg-spinner-track: #334155;
    --pg-spinner-active: #6366f1;
  }
  :host([data-theme="light"]) {
    --pg-bg: #ffffff;
    --pg-surface: #f8fafc;
    --pg-surface-elevated: #f1f5f9;
    --pg-surface-2: #ffffff;
    --pg-surface-hover: #e2e8f0;

    --pg-border: #cbd5e1;

    --pg-text: #1e293b;
    --pg-text-muted: #475569;
    --pg-text-subtle: #64748b;
    --pg-text-strong: #0f172a;
    --pg-text-inverse: #ffffff;

    --pg-accent: #6366f1;
    --pg-accent-soft: rgba(99, 102, 241, 0.08);
    --pg-accent-soft-strong: rgba(99, 102, 241, 0.15);
    --pg-accent-active: #4338ca;

    --pg-error-bg: rgba(248, 81, 73, 0.06);

    --pg-handle-grip: #94a3b8;
    --pg-spinner-track: #cbd5e1;
    --pg-spinner-active: #6366f1;
  }
  :host {
    transition:
      background-color 0.2s,
      color 0.2s,
      border-color 0.2s;
  }
  :host([fullscreen]) {
    position: fixed;
    inset: 0;
    z-index: 999999;
    background: var(--pg-bg);
  }
  :host([fullscreen]) .container {
    height: 100%;
    border-radius: 0;
    border: none;
  }
  :host([fullscreen]) .preview-handle {
    display: none;
  }
  .container {
    border: 1px solid var(--pg-border);
    border-radius: 0.75rem;
    overflow: hidden;
    background: var(--pg-bg);
    display: flex;
    flex-direction: column;
  }
  .body {
    display: flex;
    flex-direction: column; /* always column: split-area + previewHandle at bottom */
    min-height: 0;
    overflow: hidden;
  }
  .split-area {
    display: flex;
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  }
  .body.layout-vertical .split-area {
    flex-direction: column;
  }
  .body.layout-horizontal .split-area {
    flex-direction: row;
  }
  .editor-pane,
  .preview-pane {
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  }
  /* Vertical split: editor has fixed height, preview fills rest */
  .body.layout-vertical .editor-pane {
    flex: 0 0 auto;
  }
  .body.layout-vertical .preview-pane {
    flex: 1 1 auto;
  }
  /* When only one pane is visible, it fills the entire split-area */
  .split-area.single-editor > .editor-pane,
  .split-area.single-preview > .preview-pane {
    flex: 1 1 auto !important;
    width: 100% !important;
    height: 100% !important;
  }
  /* Horizontal split: editor has fixed width, preview fills rest */
  .body.layout-horizontal .editor-pane {
    flex: 0 0 auto;
    height: 100%;
  }
  .body.layout-horizontal .preview-pane {
    flex: 1 1 auto;
    height: 100%;
  }
  .pane-hidden {
    display: none !important;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    background: var(--pg-surface);
    border-bottom: 1px solid var(--pg-border);
    flex-shrink: 0;
  }
  .title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--pg-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .actions {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .btn-group {
    display: inline-flex;
    border: 1px solid var(--pg-border);
    border-radius: 0.375rem;
    overflow: hidden;
    background: transparent;
  }
  .icon-btn {
    padding: 0.35rem 0.55rem;
    font-size: 0.75rem;
    background: transparent;
    color: var(--pg-text-muted);
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition:
      background 0.15s,
      color 0.15s;
    line-height: 1;
  }
  .icon-btn:hover {
    background: var(--pg-accent-soft);
    color: var(--pg-text-strong);
  }
  .icon-btn.active {
    background: var(--pg-accent-soft-strong);
    color: var(--pg-accent-active);
  }
  .icon-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .btn-divider {
    width: 1px;
    background: var(--pg-border);
  }
  .run-btn {
    padding: 0.35rem 0.75rem;
    font-size: 0.75rem;
    background: var(--pg-success);
    color: var(--pg-text-inverse);
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    transition: background 0.2s;
  }
  .run-btn:hover {
    background: var(--pg-success-hover);
  }
  .reset-btn {
    padding: 0.35rem 0.75rem;
    font-size: 0.75rem;
    background: transparent;
    color: var(--pg-text-muted);
    border: 1px solid var(--pg-border);
    border-radius: 0.375rem;
    cursor: pointer;
  }
  .reset-btn:hover {
    border-color: var(--pg-accent);
    color: var(--pg-text-strong);
  }
  .editor-area {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 0.85rem;
    line-height: 1.6;
    background: var(--pg-bg);
    color: var(--pg-text);
    padding: 1rem;
    border: none;
    resize: none;
    outline: none;
    flex: 1;
    min-height: 60px;
  }
  .body.layout-horizontal .editor-area {
    min-width: 120px;
  }
  .preview-section {
    display: flex;
    flex-direction: column;
    background: var(--pg-surface-elevated);
    min-height: 0;
    flex: 1;
    overflow: hidden;
  }
  .preview-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--pg-text-subtle);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.75rem 1rem 0 1rem;
    flex-shrink: 0;
  }
  .preview-area {
    flex: 1;
    background: var(--pg-surface-2);
    border: 1px solid var(--pg-border);
    border-radius: 0.5rem;
    margin: 0.5rem 1rem 1rem 1rem;
    padding: 1rem;
    min-height: 40px;
    overflow: auto;
  }
  /* ===== Split handle: between editor and preview ===== */
  .resize-handle.editor-handle {
    flex-shrink: 0;
    background: var(--pg-surface);
    cursor: ns-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    border-top: 1px solid var(--pg-border);
    border-bottom: 1px solid var(--pg-border);
    transition: background 0.2s;
    position: relative;
  }
  /* Horizontal layout: split handle becomes vertical bar */
  .body.layout-horizontal .resize-handle.editor-handle {
    width: 8px;
    height: auto;
    cursor: ew-resize;
    border-top: none;
    border-bottom: none;
    border-left: 1px solid var(--pg-border);
    border-right: 1px solid var(--pg-border);
  }

  /* ===== Bottom handle: adjusts total playground height ===== */
  .resize-handle.preview-handle {
    flex-shrink: 0;
    background: var(--pg-surface);
    cursor: ns-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    border-top: 1px solid var(--pg-border);
    transition: background 0.2s;
    position: relative;
  }

  .resize-handle:hover,
  .resize-handle.active {
    background: var(--pg-surface-hover);
  }
  .resize-handle::after {
    content: "";
    width: 32px;
    height: 3px;
    border-radius: 2px;
    background: var(--pg-handle-grip);
    transition: background 0.2s;
  }
  .body.layout-horizontal .resize-handle.editor-handle::after {
    width: 3px;
    height: 32px;
  }
  .resize-handle:hover::after,
  .resize-handle.active::after {
    background: var(--pg-accent);
  }
  /* Touch-friendly hit area: prevent the page from scrolling while the
     user is dragging the handle, and make the click target large enough
     to grab with a finger. */
  .resize-handle {
    touch-action: none;
  }
  .resize-handle.editor-handle,
  .resize-handle.preview-handle {
    min-height: 14px;
  }
  .body.layout-horizontal .resize-handle.editor-handle {
    min-width: 14px;
  }
  @media (hover: none) and (pointer: coarse) {
    .resize-handle.editor-handle,
    .resize-handle.preview-handle {
      min-height: 22px;
    }
    .body.layout-horizontal .resize-handle.editor-handle {
      min-width: 22px;
    }
    /* iOS Safari zooms into the page when an input is focused and its
       computed font-size is < 16px. Bump on touch devices. */
    .editor-area {
      font-size: 1rem;
    }
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
    color: var(--pg-error);
    background: var(--pg-error-bg);
    border-top: 1px solid var(--pg-border);
    white-space: pre-wrap;
    margin: 0;
    display: none;
    flex-shrink: 0;
  }
  .error-area.has-error {
    display: block;
  }
  .loading-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 60px;
    gap: 0.75rem;
    color: var(--pg-text-subtle);
  }
  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2.5px solid var(--pg-spinner-track);
    border-top-color: var(--pg-spinner-active);
    border-radius: 50%;
    animation: rikka-spin 0.8s linear infinite;
  }
  @keyframes rikka-spin {
    to {
      transform: rotate(360deg);
    }
  }
  .loading-text {
    font-size: 0.75rem;
    letter-spacing: 0.03em;
  }
  .icon-svg {
    width: 14px;
    height: 14px;
    display: block;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

const PLAYGROUND_DISPOSABLES_KEY = Symbol.for("rikka.disposables");

function registerElementDisposable(el: HTMLElement, dispose: () => void): void {
  const internal = el as unknown as Record<symbol, (() => void)[] | undefined>;
  let list = internal[PLAYGROUND_DISPOSABLES_KEY];
  if (!list) {
    list = [];
    internal[PLAYGROUND_DISPOSABLES_KEY] = list;
  }
  list.push(dispose);
}

const PLAYGROUND_CSS_VARS = [
  "--pg-bg",
  "--pg-surface",
  "--pg-surface-elevated",
  "--pg-surface-2",
  "--pg-surface-hover",
  "--pg-border",
  "--pg-text",
  "--pg-text-muted",
  "--pg-text-subtle",
  "--pg-text-strong",
  "--pg-text-inverse",
  "--pg-accent",
  "--pg-accent-soft",
  "--pg-accent-soft-strong",
  "--pg-accent-active",
  "--pg-success",
  "--pg-success-hover",
  "--pg-warn",
  "--pg-error",
  "--pg-error-bg",
  "--pg-info",
  "--pg-handle-grip",
  "--pg-spinner-track",
  "--pg-spinner-active",
] as const;

function getPlaygroundVars(host: HTMLElement): string {
  const cs = getComputedStyle(host);
  return PLAYGROUND_CSS_VARS.map(
    (v) => `${v}: ${cs.getPropertyValue(v).trim() || "initial"};`,
  ).join(" ");
}

const THEME_WATCHER_KEY = Symbol.for("rikka.livePlayground.themeWatcher");
const PAGE_THEME_WATCHER_KEY = Symbol.for(
  "rikka.livePlayground.pageThemeWatcher",
);
const THEME_MESSAGE_TYPE = "__rikka_playground_theme";
const RESOLVED_THEME_KEY = Symbol.for("rikka.livePlayground.resolvedTheme");

function watchPrefersColorScheme(callback: () => void): () => void {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return () => {};
  }
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => callback();
  if (typeof mql.addEventListener === "function") {
    mql.addEventListener("change", handler);
  } else if (
    typeof (
      mql as MediaQueryList & {
        addListener?: (cb: () => void) => void;
      }
    ).addListener === "function"
  ) {
    (
      mql as MediaQueryList & {
        addListener: (cb: () => void) => void;
      }
    ).addListener(handler);
  }
  return () => {
    if (typeof mql.removeEventListener === "function") {
      mql.removeEventListener("change", handler);
    } else if (
      typeof (
        mql as MediaQueryList & {
          removeListener?: (cb: () => void) => void;
        }
      ).removeListener === "function"
    ) {
      (
        mql as MediaQueryList & {
          removeListener: (cb: () => void) => void;
        }
      ).removeListener(handler);
    }
  };
}

function resolveSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") {
    return "dark";
  }
  // Prefer the page's explicit data-theme on <html> over the OS preference.
  // This ensures the playground follows the host page's theme system (e.g.
  // rikka-homepage sets data-theme="light"|"dark" on documentElement).
  const pageTheme = document.documentElement.getAttribute("data-theme");
  if (pageTheme === "light" || pageTheme === "dark") {
    return pageTheme;
  }
  if (typeof window.matchMedia !== "function") {
    return "dark";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function watchPageTheme(callback: () => void): () => void {
  if (
    typeof window === "undefined" ||
    typeof MutationObserver === "undefined"
  ) {
    return () => {};
  }
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (
        m.type === "attributes" &&
        (m as MutationRecord).attributeName === "data-theme"
      ) {
        callback();
        return;
      }
    }
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

let esbuildInitPromise: Promise<void> | null = null;

async function ensureEsbuild() {
  if (!esbuildInitPromise) {
    esbuildInitPromise = esbuild.initialize({ wasmURL: wasmUrl }).catch((e) => {
      esbuildInitPromise = null;
      throw e;
    });
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

function getBasePath(): string {
  if (typeof window === "undefined") return "";
  const { pathname } = window.location;
  const match = pathname.match(/^\/[^/]+/);
  return match ? match[0] : "";
}

function generateIframeHtml(basePath: string, themeVarsCss: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script type="importmap">
  {
    "imports": {
      "@takanashi/rikka-signal": "${basePath}/esm/rikka-signal.js",
      "@takanashi/rikka-dom": "${basePath}/esm/rikka-dom.js",
      "@takanashi/rikka-elements": "${basePath}/esm/rikka-elements.js",
      "rikka-signal": "${basePath}/esm/rikka-signal.js",
      "rikka-dom": "${basePath}/esm/rikka-dom.js",
      "rikka-elements": "${basePath}/esm/rikka-elements.js",
      "signal-polyfill": "${basePath}/esm/signal-polyfill.js"
    }
  }
  </script>
  <style id="__rikka_theme_vars">
    :root {
      ${themeVarsCss}
    }
    body {
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, sans-serif;
      color: var(--pg-text);
      background: transparent;
    }
    #app { padding: 0; }
    #console-output {
      margin-top: 1rem;
      padding: 0.75rem;
      background: var(--pg-surface-2);
      border: 1px solid var(--pg-border);
      border-radius: 0.375rem;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.8125rem;
      max-height: 200px;
      overflow-y: auto;
      color: var(--pg-text);
    }
    #console-output:empty { display: none; }
    .console-log { color: var(--pg-text); margin: 0.125rem 0; }
    .console-warn { color: var(--pg-warn); margin: 0.125rem 0; }
    .console-error { color: var(--pg-error); margin: 0.125rem 0; }
    .console-info { color: var(--pg-info); margin: 0.125rem 0; }
  </style>
  <script>
    (function() {
      window.addEventListener("message", function(e) {
        if (e.data && e.data.type === ${JSON.stringify(THEME_MESSAGE_TYPE)} && typeof e.data.css === "string") {
          var s = document.getElementById("__rikka_theme_vars");
          if (s) s.textContent = ":root { " + e.data.css + " }";
        }
      });
    })();
  </script>
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
}

const SETUP_SCRIPT = `
  var RS = RikkaSignal;
  if (RS) {
    window.signal = RS.signal;
    window.computed = RS.computed;
    window.effect = RS.effect;
  }
  var RD = RikkaDom;
  if (RD) {
    window.h = RD.h;
    window.For = RD.For;
    window.Show = RD.Show;
    window.When = RD.When;
    window.Switch = RD.Switch;
    window.Match = RD.Match;
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
    window.path = RD.path;
    window.rect = RD.rect;
    window.line = RD.line;
    window.polygon = RD.polygon;
    window.polyline = RD.polyline;
    window.g = RD.g;
    window.defs = RD.defs;
    window.use = RD.use;
    window.foreignObject = RD.foreignObject;
    window.clipPath = RD.clipPath;
    window.pattern = RD.pattern;
    window.marker = RD.marker;
    window.mask = RD.mask;
    window.image = RD.image;
    window.linearGradient = RD.linearGradient;
    window.radialGradient = RD.radialGradient;
    window.stop = RD.stop;
    window.symbol = RD.symbol;
    window.filter = RD.filter;
    window.ellipse = RD.ellipse;
    window.text = RD.text;
    window.tspan = RD.tspan;
    window.textPath = RD.textPath;
    window.svga = RD.svga;
    window.svgscript = RD.svgscript;
    window.svgstyle = RD.svgstyle;
    window.svgtitle = RD.svgtitle;
    window.svgtext = RD.svgtext;
    window.svgspan = RD.svgspan;
    window.svgtextPath = RD.svgtextPath;
    window.css = RD.css;
    window.inlineStyle = RD.inlineStyle;
  }
  var RE = RikkaElements;
  if (RE) {
    window.defineElement = RE.defineElement;
    window.event = RE.event;
    window.StringAttr = RE.StringAttr;
    window.NumberAttr = RE.NumberAttr;
    window.BooleanAttr = RE.BooleanAttr;
  }
`;

type Panel = "both" | "editor" | "preview";
type Layout = "vertical" | "horizontal";
type Theme = "auto" | "dark" | "light";

type Action =
  | `layout-${Layout}`
  | `panel-${Panel}`
  | "fullscreen"
  | "run"
  | "reset";

type LivePlaygroundConfig = ElementConfig & {
  attributes: {
    code: AttributeSpec<string>;
    height: AttributeSpec<string>;
    title: AttributeSpec<string>;
    layout: AttributeSpec<Layout>;
    panel: AttributeSpec<Panel>;
    theme: AttributeSpec<Theme>;
  };
  events: {
    error: ((domEvent: Event) => string) | undefined;
  };
  styles: CSSStyleSheet;
};

type LivePlaygroundElement = RikkaElement<LivePlaygroundConfig>;

function isValidLayout(v: string | undefined): v is Layout {
  return v === "vertical" || v === "horizontal";
}

function isValidPanel(v: string | undefined): v is Panel {
  return v === "both" || v === "editor" || v === "preview";
}

function isValidTheme(v: string | undefined): v is Theme {
  return v === "auto" || v === "dark" || v === "light";
}

function iconFor(name: string): SVGSVGElement {
  const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgEl.setAttribute("class", "icon-svg");
  svgEl.setAttribute("viewBox", "0 0 24 24");
  const ns = "http://www.w3.org/2000/svg";
  const make = (tag: string, attrs: Record<string, string>) => {
    const node = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    svgEl.appendChild(node);
    return node;
  };
  if (name === "layout-vertical") {
    make("rect", { x: "3", y: "3", width: "18", height: "9", rx: "1" });
    make("rect", { x: "3", y: "15", width: "18", height: "6", rx: "1" });
  } else if (name === "layout-horizontal") {
    make("rect", { x: "3", y: "3", width: "9", height: "18", rx: "1" });
    make("rect", { x: "15", y: "3", width: "6", height: "18", rx: "1" });
  } else if (name === "code") {
    make("polyline", { points: "16 18 22 12 16 6" });
    make("polyline", { points: "8 6 2 12 8 18" });
  } else if (name === "eye") {
    make("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" });
    make("circle", { cx: "12", cy: "12", r: "3" });
  } else if (name === "expand") {
    make("polyline", { points: "4 14 10 14 10 20" });
    make("polyline", { points: "20 10 14 10 14 4" });
    make("line", { x1: "14", y1: "10", x2: "21", y2: "3" });
    make("line", { x1: "3", y1: "21", x2: "10", y2: "14" });
  } else if (name === "shrink") {
    make("polyline", { points: "4 20 4 14 10 14" });
    make("polyline", { points: "20 4 14 4 14 10" });
    make("line", { x1: "14", y1: "10", x2: "21", y2: "3" });
    make("line", { x1: "3", y1: "21", x2: "10", y2: "14" });
  }
  return svgEl;
}

const RikkaLivePlayground = defineElement("rikka-live-playground", {
  attributes: {
    code: { toProp: (v?: string) => v ?? "", toAttribute: (v?: string) => v },
    height: {
      toProp: (v?: string) => v ?? "320",
      toAttribute: (v?: string) => v,
    },
    title: {
      toProp: (v?: string) => v ?? "Example",
      toAttribute: (v?: string) => v,
    },
    layout: {
      toProp: (v?: string) => (isValidLayout(v) ? v : "vertical"),
      toAttribute: (v?: string) => v,
    },
    panel: {
      toProp: (v?: string) => (isValidPanel(v) ? v : "both"),
      toAttribute: (v?: string) => v,
    },
    theme: {
      toProp: (v?: string) => (isValidTheme(v) ? v : "auto"),
      toAttribute: (v?: string) => v,
    },
  },
  events: {
    error: event<string>(),
  },
  styles: livePlaygroundStyles,
  methods: {
    run(this: LivePlaygroundElement) {
      return runPlayground(this);
    },
    reset(this: LivePlaygroundElement) {
      const textareaEl = this.shadowRoot?.querySelector(
        ".editor-area",
      ) as HTMLTextAreaElement | null;
      if (textareaEl) {
        const originalCode = this.textContent?.trim() || this.code;
        textareaEl.defaultValue = originalCode;
        textareaEl.value = originalCode;
      }
      return runPlayground(this);
    },
    toggleLayout(this: LivePlaygroundElement) {
      this.layout = this.layout === "vertical" ? "horizontal" : "vertical";
    },
    setLayout(this: LivePlaygroundElement, layout: Layout) {
      this.layout = layout;
    },
    togglePanel(this: LivePlaygroundElement, target: Panel) {
      this.panel = this.panel === target ? "both" : target;
    },
    setPanel(this: LivePlaygroundElement, panel: Panel) {
      this.panel = panel;
    },
    setTheme(this: LivePlaygroundElement, theme: Theme) {
      if (!isValidTheme(theme)) return;
      this.theme = theme;
    },
    toggleTheme(this: LivePlaygroundElement) {
      const slot = this as unknown as {
        [RESOLVED_THEME_KEY]?: "dark" | "light";
      };
      const current: "dark" | "light" = slot[RESOLVED_THEME_KEY] ?? "dark";
      this.theme = current === "dark" ? "light" : "dark";
    },
    toggleFullscreen(this: LivePlaygroundElement) {
      return toggleFullscreen(this);
    },
    exitFullscreen(this: LivePlaygroundElement) {
      return exitFullscreenFn(this);
    },
  },
  render(this: RikkaElement<LivePlaygroundConfig>) {
    const self = this as LivePlaygroundElement;
    const initialCode = this.textContent?.trim() || this.code;

    const editorPane = div(
      { class: "editor-pane" },
      textarea({
        class: "editor-area",
        spellcheck: false,
        defaultValue: initialCode,
      }),
    );

    const previewPane = div(
      { class: "preview-pane" },
      section(
        { class: "preview-section" },
        div({ class: "preview-label" }, "Preview"),
        div(
          { class: "preview-area" },
          div(
            { class: "loading-indicator" },
            div({ class: "loading-spinner" }),
            span({ class: "loading-text" }, "Loading..."),
          ),
        ),
      ),
    );

    const editorHandle = div({ class: "resize-handle editor-handle" });
    const previewHandle = div({ class: "resize-handle preview-handle" });

    const splitArea = div(
      { class: "split-area" },
      editorPane,
      editorHandle,
      previewPane,
    );
    const body = div(
      {
        class: `body layout-${this.layout}`,
        style: computed(() => `height: ${this.$height.get()}px`),
      },
      splitArea,
      previewHandle,
    );

    // Single delegated action handler — `e.stopPropagation()` keeps the
    // click from reaching the rikka-app (or any other ancestor), so the
    // playground's internal state stays self-contained. We resolve the
    // live-playground via `currentTarget.getRootNode().host` instead of
    // a closure-captured `self`, because the element may be re-created
    // (e.g. rikka-app's route effect re-running) and the closure would
    // otherwise point at a detached instance.
    const handleAction = (e: Event) => {
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      const action = target.dataset.action as Action | undefined;
      if (!action) return;
      const root = target.getRootNode() as ShadowRoot | Document;
      const host = (root as ShadowRoot).host as LivePlaygroundElement | null;
      if (host) dispatchAction(host, action);
    };

    const iconBtn = (
      action: Action,
      label: string,
      iconName: string,
    ): HTMLElement =>
      button(
        {
          class: "icon-btn",
          type: "button",
          "data-action": action,
          "aria-label": label,
          title: label,
          onclick: handleAction,
        },
        iconFor(iconName),
      );

    const header = div(
      { class: "header" },
      span({ class: "title" }, this.title),
      div(
        { class: "actions" },
        div(
          { class: "btn-group" },
          iconBtn("layout-vertical", "Vertical layout", "layout-vertical"),
          div({ class: "btn-divider" }),
          iconBtn(
            "layout-horizontal",
            "Horizontal layout",
            "layout-horizontal",
          ),
        ),
        div(
          { class: "btn-group" },
          iconBtn("panel-both", "Show both panels", "layout-vertical"),
          div({ class: "btn-divider" }),
          iconBtn("panel-editor", "Show editor only", "code"),
          div({ class: "btn-divider" }),
          iconBtn("panel-preview", "Show preview only", "eye"),
        ),
        iconBtn("fullscreen", "Enter fullscreen", "expand"),
        div({ class: "btn-divider" }),
        button(
          { class: "run-btn", "data-action": "run", onclick: handleAction },
          "\u25B6 Run",
        ),
        button(
          { class: "reset-btn", "data-action": "reset", onclick: handleAction },
          "Reset",
        ),
      ),
    );

    // Collect the action buttons while they're in scope so post-mount code
    // can update their `active` state by reference, not by query (the
    // shadow root doesn't exist yet while render is running).
    const buttons = self.shadowRoot?.querySelectorAll(
      '[data-action="layout-vertical"], [data-action="layout-horizontal"], [data-action="panel-both"], [data-action="panel-editor"], [data-action="panel-preview"]',
    );

    // === Post-mount wiring: pointer drag for the resize handles, then
    // initial run + reactive effects for layout/panel/theme. None of this
    // leaks outside the element — every listener is tied to `self`. ===
    wirePostMount(self, {
      body,
      editorPane,
      previewPane,
      editorHandle,
      previewHandle,
      splitArea,
      header,
      initialCode,
    });

    // Apply the initial button active states once the buttons are in the
    // shadow (i.e. after connectedCallback appends the rendered tree).
    queueMicrotask(() => {
      applyButtonStates(self, self.layout, self.panel);
    });

    return div(
      { class: "container" },
      header,
      body,
      pre({ class: "error-area" }),
    );
  },
});

function applyFullscreenState(self: LivePlaygroundElement, isFs: boolean) {
  const root = self.shadowRoot;
  const btn = root?.querySelector(
    '[data-action="fullscreen"]',
  ) as HTMLButtonElement | null;
  if (isFs) {
    self.setAttribute("fullscreen", "");
    if (btn) {
      btn.replaceChildren();
      btn.appendChild(iconFor("shrink"));
      btn.setAttribute("aria-label", "Exit fullscreen");
      btn.setAttribute("title", "Exit fullscreen");
    }
  } else {
    self.removeAttribute("fullscreen");
    if (btn) {
      btn.replaceChildren();
      btn.appendChild(iconFor("expand"));
      btn.setAttribute("aria-label", "Enter fullscreen");
      btn.setAttribute("title", "Enter fullscreen");
    }
  }
}

function dispatchAction(self: LivePlaygroundElement, action: Action): void {
  switch (action) {
    case "layout-vertical":
      self.layout = "vertical";
      return;
    case "layout-horizontal":
      self.layout = "horizontal";
      return;
    case "panel-both":
      self.panel = "both";
      return;
    case "panel-editor":
      self.togglePanel("editor");
      return;
    case "panel-preview":
      self.togglePanel("preview");
      return;
    case "fullscreen":
      void self.toggleFullscreen();
      return;
    case "run":
      void self.run();
      return;
    case "reset":
      self.reset();
      return;
  }
}

interface PostMountRefs {
  body: HTMLElement;
  editorPane: HTMLElement;
  previewPane: HTMLElement;
  editorHandle: HTMLElement;
  previewHandle: HTMLElement;
  splitArea: HTMLElement;
  header: HTMLElement;
  initialCode: string;
}

function applyButtonStates(
  self: LivePlaygroundElement,
  layout: Layout,
  panel: Panel,
): void {
  const header = self.shadowRoot?.querySelector(".header");
  if (!header) return;
  header.querySelectorAll<HTMLElement>("[data-action]").forEach((btn) => {
    const action = btn.dataset.action;
    if (action === "layout-vertical" || action === "layout-horizontal") {
      btn.classList.toggle("active", action === `layout-${layout}`);
    } else if (
      action === "panel-both" ||
      action === "panel-editor" ||
      action === "panel-preview"
    ) {
      btn.classList.toggle("active", action === `panel-${panel}`);
    }
  });
}

function wirePostMount(self: LivePlaygroundElement, refs: PostMountRefs): void {
  // === Resize handles: drag the editor ↔ preview divider (editor) or the
  // bottom edge (preview). State is captured per-pointerdown and torn down
  // on pointerup. Listeners are removed when the element disposes. ===
  const { body, editorPane, editorHandle, previewHandle, splitArea } = refs;

  const onEditorPointerDown = (e: PointerEvent) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const handle = e.currentTarget as HTMLElement;
    handle.classList.add("active");
    try {
      handle.setPointerCapture(e.pointerId);
    } catch {
      // pointer capture not supported; events still fire on handle
    }
    const isHorizontal = body.classList.contains("layout-horizontal");
    const startX = e.clientX;
    const startY = e.clientY;
    const startSize = isHorizontal
      ? editorPane.offsetWidth
      : editorPane.offsetHeight;

    const onMove = (ev: PointerEvent) => {
      const delta = isHorizontal ? ev.clientX - startX : ev.clientY - startY;
      const min = isHorizontal ? 120 : 60;
      const next = Math.max(min, startSize + delta);
      if (isHorizontal) {
        editorPane.style.width = `${next}px`;
        editorPane.style.height = "100%";
      } else {
        editorPane.style.height = `${next}px`;
        editorPane.style.width = "100%";
      }
    };
    const onEnd = () => {
      handle.classList.remove("active");
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onEnd);
      handle.removeEventListener("pointercancel", onEnd);
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onEnd);
    handle.addEventListener("pointercancel", onEnd);
  };
  editorHandle.addEventListener("pointerdown", onEditorPointerDown);

  const onPreviewPointerDown = (e: PointerEvent) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const handle = e.currentTarget as HTMLElement;
    const bodyEl = handle.parentElement as HTMLElement;
    if (!bodyEl) return;
    handle.classList.add("active");
    try {
      handle.setPointerCapture(e.pointerId);
    } catch {
      // pointer capture not supported; events still fire on handle
    }
    const startY = e.clientY;
    const startH = bodyEl.offsetHeight;
    const onMove = (ev: PointerEvent) => {
      bodyEl.style.height = `${Math.max(120, startH + ev.clientY - startY)}px`;
    };
    const onEnd = () => {
      handle.classList.remove("active");
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onEnd);
      handle.removeEventListener("pointercancel", onEnd);
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onEnd);
    handle.addEventListener("pointercancel", onEnd);
  };
  previewHandle.addEventListener("pointerdown", onPreviewPointerDown);

  // === Layout reactive: sync .layout-* classes and clear stale inline
  // dimensions so the new layout's CSS can take over. ===
  const applyLayoutClass = (layout: Layout) => {
    body.classList.toggle("layout-vertical", layout === "vertical");
    body.classList.toggle("layout-horizontal", layout === "horizontal");
    if (layout === "horizontal") {
      editorPane.style.removeProperty("width");
      editorPane.style.setProperty("height", "100%");
    } else {
      editorPane.style.removeProperty("height");
      editorPane.style.setProperty("width", "100%");
    }
    applyButtonStates(self, layout, self.panel);
  };

  // === Panel reactive: hide panes, toggle single-pane class, mark buttons. ===
  const applyPanelClass = (panel: Panel) => {
    refs.previewPane.classList.toggle("pane-hidden", panel === "editor");
    editorPane.classList.toggle("pane-hidden", panel === "preview");
    editorHandle.style.display = panel === "both" ? "" : "none";
    splitArea.classList.remove("single-editor", "single-preview");
    if (panel !== "both") {
      splitArea.classList.add(
        panel === "editor" ? "single-editor" : "single-preview",
      );
    }
    applyButtonStates(self, self.layout, panel);
  };

  applyLayoutClass(self.layout);
  applyPanelClass(self.panel);
  applyFullscreenState(self, document.fullscreenElement === self);

  effect(() => {
    applyLayoutClass(self.$layout.get());
  });
  effect(() => {
    applyPanelClass(self.$panel.get());
  });

  // === Theme: mirror the theme signal onto host data-theme and push the
  // resolved CSS variables into the preview iframe. Track the watcher so
  // we tear it down on disconnect. ===
  const resolvedSlot = self as unknown as {
    [RESOLVED_THEME_KEY]?: "dark" | "light";
  };
  const syncTheme = (theme: Theme) => {
    const effective: "dark" | "light" =
      theme === "auto" ? resolveSystemTheme() : theme;
    resolvedSlot[RESOLVED_THEME_KEY] = effective;
    if (self.getAttribute("data-theme") !== effective) {
      self.setAttribute("data-theme", effective);
    }
    const iframe = self.shadowRoot?.querySelector(
      ".preview-iframe",
    ) as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      try {
        iframe.contentWindow.postMessage(
          { type: THEME_MESSAGE_TYPE, css: getPlaygroundVars(self) },
          "*",
        );
      } catch {
        // ignore
      }
    }
  };
  syncTheme(self.theme);
  effect(() => {
    syncTheme(self.$theme.get());
  });

  const watcherSlot = self as unknown as {
    [THEME_WATCHER_KEY]?: () => void;
  };
  watcherSlot[THEME_WATCHER_KEY]?.();
  watcherSlot[THEME_WATCHER_KEY] = watchPrefersColorScheme(() => {
    if (self.theme === "auto") {
      syncTheme("auto");
    }
  });

  // Watch the page's data-theme attribute on <html> so the playground
  // follows the host page's theme system when theme="auto".
  const pageWatcherSlot = self as unknown as {
    [PAGE_THEME_WATCHER_KEY]?: () => void;
  };
  pageWatcherSlot[PAGE_THEME_WATCHER_KEY]?.();
  pageWatcherSlot[PAGE_THEME_WATCHER_KEY] = watchPageTheme(() => {
    if (self.theme === "auto") {
      syncTheme("auto");
    }
  });

  // === Fullscreen: keep the icon and host attribute in sync with the
  // browser fullscreen element. ===
  const fsHandler = () => {
    applyFullscreenState(self, document.fullscreenElement === self);
  };
  document.addEventListener("fullscreenchange", fsHandler);

  // === Initial run if there's starter code. ===
  if (refs.initialCode) {
    queueMicrotask(() => {
      void runPlayground(self);
    });
  }

  // === Disposables: tear down all listeners on disconnect. ===
  registerElementDisposable(self, () => {
    editorHandle.removeEventListener("pointerdown", onEditorPointerDown);
    previewHandle.removeEventListener("pointerdown", onPreviewPointerDown);
    document.removeEventListener("fullscreenchange", fsHandler);
    const themeSlot = self as unknown as { [THEME_WATCHER_KEY]?: () => void };
    themeSlot[THEME_WATCHER_KEY]?.();
    themeSlot[THEME_WATCHER_KEY] = undefined;
    const pageThemeSlot = self as unknown as {
      [PAGE_THEME_WATCHER_KEY]?: () => void;
    };
    pageThemeSlot[PAGE_THEME_WATCHER_KEY]?.();
    pageThemeSlot[PAGE_THEME_WATCHER_KEY] = undefined;
  });
}

async function runPlayground(self: LivePlaygroundElement): Promise<void> {
  const textareaEl = self.shadowRoot?.querySelector(
    ".editor-area",
  ) as HTMLTextAreaElement | null;
  const previewEl = self.shadowRoot?.querySelector(
    ".preview-area",
  ) as HTMLElement | null;
  const errorEl = self.shadowRoot?.querySelector(
    ".error-area",
  ) as HTMLPreElement | null;
  const iframeEl = self.shadowRoot?.querySelector(
    ".preview-iframe",
  ) as HTMLIFrameElement | null;

  if (!textareaEl || !previewEl || !errorEl) return;

  const currentCode = textareaEl.value || self.textContent?.trim() || self.code;

  errorEl.classList.remove("has-error");
  errorEl.textContent = "";

  if (iframeEl) {
    const resizer = (
      iframeEl as HTMLIFrameElement & { __resizer?: ResizeObserver }
    ).__resizer;
    resizer?.disconnect();
    iframeEl.remove();
  }

  previewEl.innerHTML = "";
  const loadingEl = document.createElement("div");
  loadingEl.className = "loading-indicator";
  loadingEl.innerHTML =
    '<div class="loading-spinner"></div><span class="loading-text">Loading...</span>';
  previewEl.appendChild(loadingEl);

  let compiledCode: string;
  try {
    compiledCode = await transformCode(currentCode);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    loadingEl.remove();
    errorEl.textContent = `Compile Error: ${msg}`;
    errorEl.classList.add("has-error");
    self.dispatchError(msg);
    return;
  }

  try {
    const codeHtml = generateIframeWithCode(
      compiledCode,
      getPlaygroundVars(self),
    );
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
        loadingEl.remove();
        let lastSetHeight = 0;
        let rafId = 0;
        const fitIframeToContent = () => {
          if (!newIframe.isConnected) return;
          const doc = newIframe.contentDocument;
          if (!doc) return;
          const body = doc.body;
          const html = doc.documentElement;
          const contentHeight = Math.max(
            body?.scrollHeight || 0,
            body?.offsetHeight || 0,
            html?.clientHeight || 0,
            html?.scrollHeight || 0,
          );
          const next = contentHeight > 0 ? contentHeight + 8 : 0;
          if (next !== lastSetHeight) {
            lastSetHeight = next;
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
              if (!newIframe.isConnected) return;
              newIframe.style.height = next > 0 ? `${next}px` : "";
            });
          }
        };
        fitIframeToContent();
        const doc = newIframe.contentDocument;
        if (doc?.body) {
          const observer = new ResizeObserver(fitIframeToContent);
          observer.observe(doc.body);
          (
            newIframe as HTMLIFrameElement & { __resizer?: ResizeObserver }
          ).__resizer = observer;
          registerElementDisposable(self, () => {
            observer.disconnect();
          });
        }
        resolve();
      };
      newIframe.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Iframe load error"));
      };
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    loadingEl.remove();
    errorEl.textContent = `Error: ${msg}`;
    errorEl.classList.add("has-error");
    self.dispatchError(msg);
  }
}

function resetPlayground(self: LivePlaygroundElement): void {
  const textareaEl = self.shadowRoot?.querySelector(
    ".editor-area",
  ) as HTMLTextAreaElement | null;
  if (textareaEl) {
    const originalCode = self.textContent?.trim() || self.code;
    textareaEl.defaultValue = originalCode;
    textareaEl.value = originalCode;
  }
  void runPlayground(self);
}

async function toggleFullscreen(self: LivePlaygroundElement): Promise<void> {
  if (document.fullscreenElement || self.hasAttribute("fullscreen")) {
    applyFullscreenState(self, false);
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // exitFullscreen may fail in some browsers; state already cleaned up above
      }
    }
    return;
  }
  try {
    await self.requestFullscreen();
  } catch {
    applyFullscreenState(self, false);
  }
}

async function exitFullscreenFn(self: LivePlaygroundElement): Promise<void> {
  if (document.fullscreenElement) {
    try {
      await document.exitFullscreen();
    } catch {
      // ignore
    }
  }
  applyFullscreenState(self, false);
}

function generateIframeWithCode(
  compiledCode: string,
  themeVarsCss: string,
): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const basePath = getBasePath();

  const sanitizedCode = compiledCode
    .replace(
      /^import\s+(?:(?:[\w*\s,{}]*)\s*from\s*)?['"][^'"]+['"]\s*;?\s*$/gm,
      "",
    )
    .trim();

  const EXPOSED = [
    "signal",
    "computed",
    "effect",
    "h",
    "For",
    "Show",
    "When",
    "Switch",
    "Match",
    "div",
    "span",
    "a",
    "p",
    "button",
    "input",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "section",
    "article",
    "aside",
    "nav",
    "header",
    "footer",
    "main",
    "ul",
    "ol",
    "li",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "form",
    "select",
    "option",
    "label",
    "textarea",
    "pre",
    "code",
    "br",
    "hr",
    "img",
    "slot",
    "template",
    "svg",
    "circle",
    "path",
    "rect",
    "line",
    "polygon",
    "polyline",
    "g",
    "defs",
    "use",
    "foreignObject",
    "clipPath",
    "pattern",
    "marker",
    "mask",
    "image",
    "linearGradient",
    "radialGradient",
    "stop",
    "symbol",
    "filter",
    "ellipse",
    "text",
    "tspan",
    "textPath",
    "svga",
    "svgscript",
    "svgstyle",
    "svgtitle",
    "svgtext",
    "svgspan",
    "svgtextPath",
    "css",
    "inlineStyle",
    "defineElement",
    "event",
    "StringAttr",
    "NumberAttr",
    "BooleanAttr",
  ];
  const exposedParamDecls = EXPOSED.join(",");
  const exposedArgList = EXPOSED.map(
    (n) => `window[${JSON.stringify(n)}]`,
  ).join(",");

  const userScript = [
    `import * as RikkaSignal from '${origin}${basePath}/esm/rikka-signal.js';`,
    `import * as RikkaDom from '${origin}${basePath}/esm/rikka-dom.js';`,
    `import * as RikkaElements from '${origin}${basePath}/esm/rikka-elements.js';`,
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
    "  var runUserCode = new Function('container', " +
      JSON.stringify(sanitizedCode) +
      ");",
    "  var result = runUserCode(container);",
    "  if (result != null && result !== false) {",
    "    safeAppend(container, result);",
    "  }",
    "} catch (err) {",
    "  var errorDiv = document.createElement('div');",
    "  errorDiv.style.color = 'var(--pg-error, #f85149)';",
    "  errorDiv.style.padding = '0.75rem';",
    "  errorDiv.textContent = 'Error: ' + err.message;",
    "  var output = document.getElementById('console-output') || document.body;",
    "  output.appendChild(errorDiv);",
    "}",
  ].join("\n");

  const iframeHtml = generateIframeHtml(basePath, themeVarsCss);
  return iframeHtml.replace(
    "</body>",
    `<script type="module">${userScript}</script></body>`,
  );
}

export { RikkaLivePlayground };
export type { LivePlaygroundElement };
// LivePlaygroundElement is just an alias for the inferred element type —
// prefer `InstanceType<typeof RikkaLivePlayground>` or `RikkaElement<Config>`
// in new code.
