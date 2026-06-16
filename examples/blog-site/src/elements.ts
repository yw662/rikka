/**
 * Blog Site — Custom Elements.
 *
 * Product-grade Web Components built with rikka-elements + rikka-dom + rikka-signal.
 * Each element hydrates from server-rendered JSON-LD data (<script type="application/ld+json">).
 *
 * Design principles:
 * - Shadow DOM for style encapsulation
 * - Reactive state with signals (proper signal binding, not .get())
 * - Progressive enhancement (content readable before JS)
 * - Responsive layout with mobile-first approach
 * - Toast notifications for action feedback
 * - Modal confirmation dialogs for destructive actions
 * - Editable settings form
 */

import {
  defineElement,
  StringAttr,
  css,
} from "@takanashi/rikka-elements";
import {
  div,
  header,
  nav,
  main,
  footer,
  a,
  p,
  h1,
  h2,
  h3,
  h4,
  span,
  button,
  input,
  section,
  label,
  br,
  table,
  thead,
  tbody,
  tr,
  th,
  td,
  strong,
  For,
  Show,
  When,
} from "@takanashi/rikka-dom";
import {
  signal,
  computed,
} from "@takanashi/rikka-signal";

async function apiPatch(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function apiPost(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Types — matched to actual resource responses from resources.ts
// ---------------------------------------------------------------------------

interface ArticleData {
  id: number;
  title: string;
  body: string;
  authorId: number;
  authorName?: string;
  authorRole?: string;
  tags: string[];
  createdAt: string;
  comments?: CommentData[];
}

interface CommentData {
  id: number;
  articleId: number;
  author: string;
  text: string;
  createdAt: string;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  role: "admin" | "author" | "reader";
}

interface SiteRootData {
  name: string;
  tagline: string;
  articleCount: number;
  commentCount: number;
  userCount: number;
  recentArticles: { id: number; title: string }[];
  links: Record<string, string>;
}

interface DashboardData {
  articleCount: number;
  commentCount: number;
  userCount: number;
  recentArticles: { id: number; title: string }[];
}

interface SettingsData {
  siteName: string;
  theme: string;
  postsPerPage: number;
}

// ---------------------------------------------------------------------------
// Shared styles & constants
// ---------------------------------------------------------------------------

const COLORS = {
  primary: "#6366f1",
  primaryLight: "#818cf8",
  primaryDark: "#4f46e5",
  surface: "#ffffff",
  surfaceAlt: "#f8fafc",
  border: "#e2e8f0",
  text: "#1e293b",
  textMuted: "#64748b",
  textLight: "#94a3b8",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
};

const resetCSS = css`
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
`;

const typographyCSS = css`
  :host {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: ${COLORS.text};
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  h1, h2, h3, h4 { font-weight: 700; line-height: 1.3; }
  h1 { font-size: 2rem; }
  h2 { font-size: 1.5rem; }
  h3 { font-size: 1.25rem; }
  h4 { font-size: 1.1rem; }
`;

// ---------------------------------------------------------------------------
// Global Toast Notification System
// ---------------------------------------------------------------------------

interface ToastMessage {
  id: number;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

let toastIdCounter = 0;
const toasts = signal<ToastMessage[]>([]);

/** Show a toast notification (callable from any element) */
export function showToast(type: ToastMessage["type"], message: string): void {
  const toast: ToastMessage = { id: ++toastIdCounter, type, message };
  toasts.set([...toasts.get(), toast]);
  setTimeout(() => {
    toasts.set(toasts.get().filter((t) => t.id !== toast.id));
  }, 3500);
}

/** Remove a toast by ID */
function dismissToast(id: number): void {
  toasts.set(toasts.get().filter((t) => t.id !== id));
}

// ---------------------------------------------------------------------------
// Global Modal Confirmation System
// ---------------------------------------------------------------------------

interface ModalState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: "danger" | "primary" | "warning";
  onConfirm: () => void;
}

const modalState = signal<ModalState>({
  open: false,
  title: "",
  message: "",
  confirmLabel: "Confirm",
  cancelLabel: "Cancel",
  variant: "primary",
  onConfirm: () => {},
});

/** Show a confirmation modal and resolve with true (confirm) or false (cancel). */
let modalResolve: ((value: boolean) => void) | null = null;

export function confirmAction(opts: {
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "primary" | "warning";
}): Promise<boolean> {
  return new Promise((resolve) => {
    modalResolve = resolve;
    modalState.set({
      open: true,
      title: opts.title,
      message: opts.message,
      confirmLabel: opts.confirmLabel ?? "Confirm",
      cancelLabel: "Cancel",
      variant: opts.variant ?? "primary",
      onConfirm: () => { resolve(true); },
    });
  });
}

export function closeModal(): void {
  modalState.set({ ...modalState.get(), open: false });
  if (modalResolve) {
    modalResolve(false);
    modalResolve = null;
  }
}

// ---------------------------------------------------------------------------
// Helpers — Hydration: read resource data from DOM based on strategy
// ---------------------------------------------------------------------------

/**
 * Find and parse resource data from the DOM.
 * Delegates to the SDK's findResourceData when available (loaded via /_rikka/sdk.js),
 * falls back to a local implementation for offline / pre-SDK scenarios.
 */
function findResourceData<T = unknown>(el?: Element): T | null {
  // Prefer the SDK version — it handles @graph unwrapping and async fetch
  const sdk = (window as any).__rikka;
  if (sdk?.findResourceData) {
    return sdk.findResourceData(el) as T | null;
  }

  // Fallback: local implementation
  if (el) {
    const dataAttr = el.getAttribute("data-resource");
    if (dataAttr) {
      try { return JSON.parse(dataAttr) as T; } catch { /* fall through */ }
    }
  }

  if (el) {
    const tmpl = el.querySelector("template[shadowrootmode]") as HTMLTemplateElement | null;
    if (tmpl) {
      const dsScript = tmpl.content.querySelector('script[type="application/json"]');
      if (dsScript) {
        try { return JSON.parse(dsScript.textContent ?? "") as T; } catch { /* fall through */ }
      }
    }
  }

  const script = document.querySelector('script[type="application/ld+json"]');
  if (script) {
    try { return JSON.parse(script.textContent ?? "") as T; } catch { /* fall through */ }
  }

  return null;
}

/** Format date to readable string */
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return dateStr; }
}

/** Truncate text to max length */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "...";
}

/** Get role badge color */
function roleColor(role: string): string {
  switch (role) {
    case "admin": return COLORS.danger;
    case "author": return COLORS.primary;
    default: return COLORS.textMuted;
  }
}

// ===========================================================================
// GLOBAL OVERLAY: Toast + Modal container
// Renders at body level, outside any shadow DOM
// ===========================================================================

const BlogOverlay = defineElement("blog-overlay", {
  styles: css`
    :host {
      position: fixed;
      top: 0; left: 0;
      z-index: 99999;
      pointer-events: none;
      display: block;
    }

    /* ---- Toasts ---- */
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: auto;
      max-width: 400px;
      width: calc(100% - 40px);
    }
    .toast {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 14px 18px;
      border-radius: 10px;
      background: ${COLORS.surface};
      border: 1px solid ${COLORS.border};
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      animation: slideInRight 0.25s ease-out;
      font-size: 0.9rem;
      line-height: 1.4;
    }
    .toast.removing { animation: slideOutRight 0.2s ease-in forwards; }
    .toast-success { border-left: 4px solid ${COLORS.success}; }
    .toast-error { border-left: 4px solid ${COLORS.danger}; }
    .toast-warning { border-left: 4px solid ${COLORS.warning}; }
    .toast-info { border-left: 4px solid ${COLORS.info}; }
    .toast-icon { flex-shrink: 0; font-size: 1.1rem; margin-top: 1px; }
    .toast-message { flex: 1; }
    .toast-close {
      flex-shrink: 0;
      background: none;
      border: none;
      cursor: pointer;
      color: ${COLORS.textLight};
      font-size: 1.1rem;
      padding: 0 2px;
      line-height: 1;
    }
    .toast-close:hover { color: ${COLORS.text}; }

    /* ---- Modal ---- */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      animation: fadeIn 0.15s ease-out;
      z-index: 10;
    }
    .modal {
      background: ${COLORS.surface};
      border-radius: 14px;
      padding: 28px;
      max-width: 420px;
      width: calc(100% - 40px);
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      animation: scaleIn 0.2s ease-out;
    }
    .modal-title {
      font-size: 1.15rem;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .modal-message {
      color: ${COLORS.textMuted};
      font-size: 0.93rem;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    .btn {
      padding: 9px 20px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid ${COLORS.border};
      background: ${COLORS.surface};
      color: ${COLORS.text};
      font-family: inherit;
      transition: all 0.15s;
    }
    .btn:hover { border-color: ${COLORS.primaryLight}; color: ${COLORS.primary}; }
    .btn-primary {
      background: ${COLORS.primary};
      color: white;
      border-color: ${COLORS.primary};
    }
    .btn-primary:hover { background: ${COLORS.primaryDark}; }
    .btn-danger {
      background: ${COLORS.danger};
      color: white;
      border-color: ${COLORS.danger};
    }
    .btn-danger:hover { background: #dc2626; }

    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    @media (max-width: 480px) {
      .toast-container { right: 10px; left: 10px; max-width: none; width: auto; }
      .modal { padding: 20px; }
    }
  `,
  render() {
    const open = computed(() => modalState.get().open);
    const md = computed(() => modalState.get());

    return div(
      // Toasts
      div({ className: "toast-container" },
        For(toasts, (toast) =>
          div({
            className: `toast toast-${toast.type}`,
            role: "alert",
          },
            span({ className: "toast-icon" },
              toast.type === "success" ? "\u2713" :
              toast.type === "error" ? "\u2717" :
              toast.type === "warning" ? "\u26A0" : "\u2139",
            ),
            span({ className: "toast-message" }, toast.message),
            button({
              className: "toast-close",
              onclick: () => dismissToast(toast.id),
              "aria-label": "Dismiss notification",
            }, "\u00D7"),
          ),
        ),
      ),

      // Modal
      Show(open,
        div({ className: "modal-backdrop", onclick: closeModal },
          div({
            className: "modal",
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": "modal-title",
            onclick: (e: Event) => e.stopPropagation(),
          },
            div({ className: "modal-title", id: "modal-title" }, computed(() => md.get().title)),
            div({ className: "modal-message" }, computed(() => md.get().message)),
            div({ className: "modal-actions" },
              button({ className: "btn", onclick: closeModal }, computed(() => md.get().cancelLabel)),
              button({
                className: `btn ${md.get().variant === "danger" ? "btn-danger" : "btn-primary"}`,
                onclick: () => {
                  md.get().onConfirm();
                  closeModal();
                },
              }, computed(() => md.get().confirmLabel)),
            ),
          ),
        ),
      ),
    );
  },
});

// ===========================================================================
// 1. blog-layout — Global page layout (header + nav + main + footer)
// ===========================================================================

const BlogLayout = defineElement("blog-layout", {
  attributes: {
    siteName: { ...StringAttr, default: "Rikka Blog" },
    currentPath: { ...StringAttr, default: "/" },
  },
  styles: css`
    ${resetCSS}
    ${typographyCSS}
    :host {
      display: block;
      min-height: 100vh;
      background: ${COLORS.surfaceAlt};
    }

    .layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    /* Header */
    .header {
      background: linear-gradient(135deg, ${COLORS.primaryDark}, ${COLORS.primary});
      color: white;
      padding: 0 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .header-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
    }
    .logo {
      font-size: 1.35rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: white;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .logo:hover { opacity: 0.9; }
    .logo-icon {
      width: 28px; height: 28px;
      background: rgba(255,255,255,0.2);
      border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
    }

    /* Nav */
    .nav { display: flex; gap: 4px; }
    .nav-link {
      color: rgba(255,255,255,0.8);
      text-decoration: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.15s;
    }
    .nav-link:hover { color: white; background: rgba(255,255,255,0.12); }
    .nav-link.active {
      color: white;
      background: rgba(255,255,255,0.18);
    }

    /* Main content area */
    .main {
      flex: 1;
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 24px;
      width: 100%;
      box-sizing: border-box;
    }

    /* Footer */
    .footer {
      background: ${COLORS.surface};
      border-top: 1px solid ${COLORS.border};
      padding: 24px;
      text-align: center;
      color: ${COLORS.textMuted};
      font-size: 0.85rem;
    }
    .footer a { color: ${COLORS.primary}; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }

    /* Mobile nav toggle */
    .mobile-toggle {
      display: none;
      background: none;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 4px 8px;
    }

    @media (max-width: 768px) {
      .header-inner { flex-wrap: wrap; height: auto; padding: 12px 0; }
      .mobile-toggle { display: block; }
      .nav {
        display: none;
        width: 100%;
        flex-direction: column;
        order: 3;
        padding-top: 8px;
        border-top: 1px solid rgba(255,255,255,0.15);
      }
      .nav.open { display: flex; }
      .nav-link { padding: 10px 14px; text-align: center; }
      .main { padding: 20px 16px; }
    }
  `,
  render(this) {
    // SSR sets data-path on <blog-layout> (e.g., data-path="/articles").
    // Read it directly; fall back to the currentPath attribute default of "/".
    const actualPath = this.getAttribute("data-path") ?? "";
    const currentPath = signal(actualPath || this.currentPath);
    const mobileNavOpen = signal(false);

    const navItems = [
      { href: "/", label: "Home" },
      { href: "/articles", label: "Articles" },
      { href: "/users", label: "Users" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/settings", label: "Settings" },
    ];

    const isActive = (href: string) => computed(() => {
      const path = currentPath.get();
      return path === href || (href !== "/" && path.startsWith(href));
    });

    return div({ className: "layout" },
      header({ className: "header" },
        div({ className: "header-inner" },
          a({ className: "logo", href: "/" },
            span({ className: "logo-icon" }, "R"),
            span(this.siteName),
          ),
          button({
            className: "mobile-toggle",
            onclick: () => mobileNavOpen.set(!mobileNavOpen.get()),
            "aria-label": "Toggle navigation",
            "aria-expanded": mobileNavOpen,
          }, "\u2630"),
          nav({
            className: computed(() => mobileNavOpen.get() ? "nav open" : "nav"),
          },
            ...navItems.map((item) =>
              a({
                className: computed(() =>
                  `nav-link${isActive(item.href).get() ? " active" : ""}`
                ),
                href: item.href,
              }, item.label),
            ),
          ),
        ),
      ),
      main({ className: "main" },
        document.createElement("slot") as unknown as HTMLElement,
      ),
      footer({ className: "footer" },
        p("\u00A9 2026 Rikka Blog \u2014 Built with ",
          a({ href: "https://rikka.dev", target: "_blank", rel: "noopener noreferrer" }, "Rikka Framework"),
        ),
      ),
    );
  },
});

// ===========================================================================
// 2. blog-home — Landing page / site root
// Uses proper reactive signal bindings (not .get())
// ===========================================================================

const BlogHome = defineElement("blog-home", {
  styles: css`
    ${typographyCSS}
    :host { display: block; }

    /* Hero section */
    .hero {
      text-align: center;
      padding: 48px 32px 40px;
      margin-bottom: 40px;
      background: linear-gradient(135deg, ${COLORS.primaryDark}, ${COLORS.primary}, #8b5cf6);
      border-radius: 16px;
      color: white;
      position: relative;
      overflow: hidden;
    }
    .hero::before {
      content: "";
      position: absolute;
      top: -50%; right: -30%;
      width: 300px; height: 300px;
      background: rgba(255,255,255,0.06);
      border-radius: 50%;
    }
    .hero::after {
      content: "";
      position: absolute;
      bottom: -40%; left: -20%;
      width: 200px; height: 200px;
      background: rgba(255,255,255,0.04);
      border-radius: 50%;
    }
    .hero > * { position: relative; z-index: 1; }
    .hero h1 { font-size: 2.5rem; margin-bottom: 8px; }
    .hero p { opacity: 0.92; font-size: 1.12rem; max-width: 520px; margin: 0 auto; }

    /* Stats row */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      margin-bottom: 40px;
    }
    .stat-card {
      background: ${COLORS.surface};
      border: 1px solid ${COLORS.border};
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .stat-card:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
    .stat-value { font-size: 2rem; font-weight: 800; color: ${COLORS.primary}; }
    .stat-label { font-size: 0.85rem; color: ${COLORS.textMuted}; margin-top: 4px; }

    /* Section headers */
    .section-title {
      font-size: 1.35rem;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-title::after {
      content: ""; flex: 1; height: 1px; background: ${COLORS.border};
    }

    /* Quick links grid */
    .quick-links {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      margin-bottom: 40px;
    }
    .quick-link {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px 22px;
      background: ${COLORS.surface};
      border: 1px solid ${COLORS.border};
      border-radius: 10px;
      text-decoration: none;
      color: ${COLORS.text};
      transition: all 0.2s;
    }
    .quick-link:hover { border-color: ${COLORS.primary}; box-shadow: 0 4px 14px rgba(99,102,241,0.1); transform: translateY(-1px); }
    .quick-link-icon {
      width: 44px; height: 44px; border-radius: 11px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; background: ${COLORS.surfaceAlt}; flex-shrink: 0;
    }
    .quick-link-text { font-weight: 600; font-size: 0.95rem; }
    .quick-link-desc { font-size: 0.82rem; color: ${COLORS.textMuted}; margin-top: 2px; }

    /* Recent articles list */
    .recent-list { display: flex; flex-direction: column; gap: 10px; }
    .recent-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      background: ${COLORS.surface};
      border: 1px solid ${COLORS.border};
      border-radius: 10px;
      text-decoration: none;
      color: ${COLORS.text};
      transition: all 0.2s;
    }
    .recent-item:hover { border-color: ${COLORS.primaryLight}; box-shadow: 0 3px 12px rgba(99,102,241,0.08); transform: translateX(4px); }
    .recent-num {
      width: 34px; height: 34px; border-radius: 50%;
      background: ${COLORS.surfaceAlt}; display: flex;
      align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.88rem; color: ${COLORS.primary}; flex-shrink: 0;
    }
    .recent-info { flex: 1; min-width: 0; }
    .recent-title { font-weight: 600; }
    .recent-arrow { color: ${COLORS.textLight}; flex-shrink: 0; font-size: 1.1rem; }

    @media (max-width: 768px) {
      .hero { padding: 36px 20px 32px; }
      .hero h1 { font-size: 1.85rem; }
      .hero p { font-size: 1rem; }
      .stats-row { grid-template-columns: repeat(3, 1fr); gap: 10px; }
      .stat-card { padding: 14px 10px; }
      .stat-value { font-size: 1.5rem; }
      .quick-links { grid-template-columns: 1fr; }
    }
    @media (max-width: 480px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
    }
  `,
  render(this) {
    // Hydrate from server data
    const rawData = findResourceData<SiteRootData>(this);
    const data = signal<SiteRootData | null>(rawData ?? null);

    // Derived signals using computed() for value-position reactivity
    const siteName = computed(() => data.get()?.name ?? "Rikka Blog");
    const tagline = computed(() => data.get()?.tagline ?? "");
    const articleCount = computed(() => data.get()?.articleCount ?? 0);
    const commentCount = computed(() => data.get()?.commentCount ?? 0);
    const userCount = computed(() => data.get()?.userCount ?? 0);
    const recentArticles = computed(() => data.get()?.recentArticles ?? []);
    const links = computed(() => data.get()?.links ?? {} as Record<string, string>);
    const hasRecent = computed(() => recentArticles.get().length > 0);

    return div(
      // Hero Section
      section({ className: "hero" },
        h1(siteName),       // Pass signal directly (reactive)
        p(tagline),         // Pass signal directly
      ),

      // Stats Cards
      div({ className: "stats-row" },
        div({ className: "stat-card" },
          div({ className: "stat-value" }, computed(() => String(articleCount.get()))),
          div({ className: "stat-label" }, "Articles"),
        ),
        div({ className: "stat-card" },
          div({ className: "stat-value" }, computed(() => String(commentCount.get()))),
          div({ className: "stat-label" }, "Comments"),
        ),
        div({ className: "stat-card" },
          div({ className: "stat-value" }, computed(() => String(userCount.get()))),
          div({ className: "stat-label" }, "Users"),
        ),
      ),

      // Quick Links Section
      div({},
        h3({ className: "section-title" }, "Explore"),
        div({ className: "quick-links" },
          When(computed(() => !!links.get().articles),
            a({ className: "quick-link", href: computed(() => links.get().articles ?? "") },
              div({ className: "quick-link-icon" }, "\uD83D\uDCDA"),
              div({},
                div({ className: "quick-link-text" }, "Articles"),
                div({ className: "quick-link-desc" }, "Browse and manage articles"),
              ),
            ),
            null,
          ),
          When(computed(() => !!links.get().users),
            a({ className: "quick-link", href: computed(() => links.get().users ?? "") },
              div({ className: "quick-link-icon" }, "\uD83D\uDC65"),
              div({},
                div({ className: "quick-link-text" }, "Users"),
                div({ className: "quick-link-desc" }, "Manage team members"),
              ),
            ),
            null,
          ),
          When(computed(() => !!links.get().dashboard),
            a({ className: "quick-link", href: computed(() => links.get().dashboard ?? "") },
              div({ className: "quick-link-icon" }, "\uD83D\uDCCA"),
              div({},
                div({ className: "quick-link-text" }, "Dashboard"),
                div({ className: "quick-link-desc" }, "View statistics & analytics"),
              ),
            ),
            null,
          ),
          When(computed(() => !!links.get().settings),
            a({ className: "quick-link", href: computed(() => links.get().settings ?? "") },
              div({ className: "quick-link-icon" }, "\u2699\uFE0F"),
              div({},
                div({ className: "quick-link-text" }, "Settings"),
                div({ className: "quick-link-desc" }, "Configure your site"),
              ),
            ),
            null,
          ),
        ),
      ),

      // Recent Articles
      When(hasRecent,
        div({},
          h3({ className: "section-title" }, "Recent Articles"),
          div({ className: "recent-list" },
            For(recentArticles, (article, i) =>
              a({ className: "recent-item", href: computed(() => `/articles/${article.id}`) },
                div({ className: "recent-num" }, computed(() => String(i + 1))),
                div({ className: "recent-info" },
                  div({ className: "recent-title" }, article.title),
                ),
                div({ className: "recent-arrow" }, "\u2192"),
              ),
            ),
          ),
        ),
        null,
      ),
    );
  },
});

// ===========================================================================
// 3. blog-article-list — Article collection with search/filter cards
// ===========================================================================

const BlogArticleList = defineElement("blog-article-list", {
  styles: css`
    ${typographyCSS}
    :host { display: block; }

    /* Toolbar */
    .toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .search-box {
      flex: 1;
      min-width: 220px;
      position: relative;
    }
    .search-input {
      width: 100%;
      padding: 10px 16px 10px 40px;
      border: 1px solid ${COLORS.border};
      border-radius: 10px;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      background: ${COLORS.surface};
      color: ${COLORS.text};
      font-family: inherit;
    }
    .search-input:focus { border-color: ${COLORS.primary}; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
    .search-input::placeholder { color: ${COLORS.textLight}; }
    .search-icon {
      position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
      color: ${COLORS.textLight}; pointer-events: none; font-size: 0.95rem;
    }

    /* Tag filter chips */
    .filter-chip {
      padding: 6px 15px;
      border-radius: 20px;
      font-size: 0.85rem;
      cursor: pointer;
      border: 1px solid ${COLORS.border};
      background: ${COLORS.surface};
      color: ${COLORS.textMuted};
      transition: all 0.15s;
      font-family: inherit;
    }
    .filter-chip:hover { border-color: ${COLORS.primaryLight}; color: ${COLORS.primary}; }
    .filter-chip.active {
      background: ${COLORS.primary};
      color: white;
      border-color: ${COLORS.primary};
    }

    /* Card grid */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
    }

    /* Individual card */
    .card {
      background: ${COLORS.surface};
      border: 1px solid ${COLORS.border};
      border-radius: 14px;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      flex-direction: column;
      text-decoration: none;
      color: inherit;
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.09);
      border-color: ${COLORS.primaryLight};
    }
    .card-body { padding: 22px; flex: 1; display: flex; flex-direction: column; }
    .card-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      font-size: 0.82rem;
      color: ${COLORS.textMuted};
    }
    .card-date { display: flex; align-items: center; gap: 4px; }
    .card-title {
      font-size: 1.15rem;
      font-weight: 700;
      margin-bottom: 8px;
      line-height: 1.4;
    }
    .card-title a {
      color: ${COLORS.text};
      text-decoration: none;
      transition: color 0.15s;
    }
    .card-title a:hover { color: ${COLORS.primary}; }
    .card-excerpt {
      color: ${COLORS.textMuted};
      font-size: 0.9rem;
      flex: 1;
      margin-bottom: 16px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.55;
    }
    .card-tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag {
      padding: 3px 11px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
      background: #ede9fe;
      color: ${COLORS.primaryDark};
    }

    /* Empty state */
    .empty {
      text-align: center;
      padding: 64px 20px;
      color: ${COLORS.textMuted};
    }
    .empty-icon { font-size: 3.5rem; margin-bottom: 14px; opacity: 0.6; }
    .empty-title { font-size: 1.15rem; font-weight: 600; margin-bottom: 6px; color: ${COLORS.text}; }
    .empty-desc { font-size: 0.92rem; }

    /* Count badge */
    .count-badge {
      font-size: 0.9rem;
      color: ${COLORS.textMuted};
      background: ${COLORS.surfaceAlt};
      padding: 4px 12px;
      border-radius: 12px;
    }

    @media (max-width: 768px) {
      .grid { grid-template-columns: 1fr; }
      .toolbar { flex-direction: column; align-items: stretch; }
      .search-box { min-width: unset; }
    }
  `,
  render(this) {
    // Hydrate: data-resource may contain raw array OR { "@graph": [...] }
    const rawData = findResourceData<ArticleData[] | { "@graph": ArticleData[] }>(this);
    const allArticles = signal<ArticleData[]>(
      Array.isArray(rawData)
        ? rawData
        : (rawData && rawData["@graph"]) ?? [],
    );
    const searchQuery = signal("");
    const activeTag = signal<string | null>(null);

    // Extract unique tags reactively
    const allTags = computed(() => {
      const tags = new Set<string>();
      for (const a of allArticles.get()) {
        for (const t of a.tags) tags.add(t);
      }
      return Array.from(tags).sort();
    });

    // Filtered articles (reactive)
    const filtered = computed(() => {
      let items = allArticles.get();
      const q = searchQuery.get().toLowerCase();
      const tag = activeTag.get();
      if (q) {
        items = items.filter((a) =>
          a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q),
        );
      }
      if (tag) {
        items = items.filter((a) => a.tags.includes(tag));
      }
      return items;
    });

    const filteredCount = computed(() => {
      const len = filtered.get().length;
      return `${len} article${len !== 1 ? "s" : ""}`;
    });

    const hasResults = computed(() => filtered.get().length > 0);
    const noResults = computed(() => filtered.get().length === 0);

    return div(
      // Page header with count
      div({ style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" } },
        h1("Articles"),
        span({ className: "count-badge" }, filteredCount),
      ),

      // Search toolbar
      div({ className: "toolbar" },
        div({ className: "search-box" },
          span({ className: "search-icon" }, "\uD83D\uDD0D"),
          input({
            className: "search-input",
            type: "text",
            placeholder: "Search articles by title or content...",
            value: searchQuery,
            oninput: (e: Event) => {
              searchQuery.set((e.target as HTMLInputElement).value);
            },
          }),
        ),
      ),

      // Tag filter chips
      Show(computed(() => allTags.get().length > 0),
        div({ style: { display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" } },
          button({
            className: computed(() =>
              `filter-chip${activeTag.get() === null ? " active" : ""}`
            ),
            onclick: () => activeTag.set(null),
          }, "All"),
          For(allTags, (tag) =>
            button({
              className: computed(() =>
                `filter-chip${activeTag.get() === tag ? " active" : ""}`
              ),
              onclick: () => activeTag.set(activeTag.get() === tag ? null : tag),
            }, tag),
          ),
        ),
      ),

      // Card grid
      Show(hasResults,
        div({ className: "grid" },
          For(filtered, (article) => articleCard(article)),
        ),
      ),

      // Empty state
      Show(noResults,
        div({ className: "empty" },
          div({ className: "empty-icon" }, "\uD83D\uDDC1"),
          div({ className: "empty-title" }, "No articles found"),
          p({ className: "empty-desc" }, "Try adjusting your search or filter criteria."),
        ),
      ),
    );
  },
});

/** Reusable article card component */
function articleCard(article: ArticleData): HTMLElement {
  return a({ href: `/articles/${article.id}`, className: "card" },
    div({ className: "card-body" },
      div({ className: "card-meta" },
        span({ className: "card-date" }, "\uD83D\uDCC5 ", formatDate(article.createdAt)),
        span(`by ${article.authorName ?? `Author #${article.authorId}`}`),
      ),
      div({ className: "card-title" },
        a({ href: `/articles/${article.id}` }, article.title),
      ),
      div({ className: "card-excerpt" }, truncate(article.body, 150)),
      div({ className: "card-tags" },
        ...(article.tags ?? []).map((tag) => span({ className: "tag" }, tag)),
      ),
    ),
  );
}

// ===========================================================================
// 4. blog-article-detail — Single article with comments
// ===========================================================================

const BlogArticleDetail = defineElement("blog-article-detail", {
  styles: css`
    ${typographyCSS}
    :host { display: block; }

    /* Back navigation link */
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: ${COLORS.primary};
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      margin-bottom: 24px;
      transition: gap 0.15s;
    }
    .back-link:hover { gap: 10px; }

    /* Article header */
    .article-header { margin-bottom: 28px; }
    .article-title { font-size: 2rem; margin-bottom: 12px; line-height: 1.25; }
    .article-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
      color: ${COLORS.textMuted};
      font-size: 0.9rem;
    }
    .meta-item { display: flex; align-items: center; gap: 5px; }

    /* Article body content */
    .article-body {
      font-size: 1.05rem;
      line-height: 1.8;
      color: ${COLORS.text};
      margin-bottom: 32px;
      padding: 28px;
      background: ${COLORS.surface};
      border: 1px solid ${COLORS.border};
      border-radius: 12px;
      white-space: pre-wrap;
    }

    /* Tags row */
    .tags-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 36px;
    }
    .tag {
      padding: 5px 14px;
      border-radius: 16px;
      font-size: 0.82rem;
      font-weight: 500;
      background: #ede9fe;
      color: ${COLORS.primaryDark};
    }

    /* Comments section */
    .comments-section { margin-top: 40px; }
    .comments-title {
      font-size: 1.25rem;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .comment-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: ${COLORS.surfaceAlt};
      color: ${COLORS.textMuted};
      font-size: 0.8rem;
      font-weight: 600;
      padding: 2px 9px;
      border-radius: 10px;
    }
    .comment-list { display: flex; flex-direction: column; gap: 12px; }
    .comment {
      background: ${COLORS.surface};
      border: 1px solid ${COLORS.border};
      border-radius: 10px;
      padding: 16px 20px;
      transition: border-color 0.15s;
    }
    .comment:hover { border-color: ${COLORS.primaryLight}; }
    .comment-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .comment-author { font-weight: 600; color: ${COLORS.text}; }
    .comment-date { font-size: 0.82rem; color: ${COLORS.textLight}; }
    .comment-body { color: ${COLORS.textMuted}; font-size: 0.93rem; line-height: 1.5; }

    /* Action buttons */
    .actions {
      display: flex;
      gap: 10px;
      margin-top: 28px;
      flex-wrap: wrap;
    }
    .btn {
      padding: 9px 20px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid ${COLORS.border};
      background: ${COLORS.surface};
      color: ${COLORS.text};
      transition: all 0.15s;
      font-family: inherit;
    }
    .btn:hover { border-color: ${COLORS.primaryLight}; color: ${COLORS.primary}; }
    .btn-primary {
      background: ${COLORS.primary};
      color: white;
      border-color: ${COLORS.primary};
    }
    .btn-primary:hover { background: ${COLORS.primaryDark}; }
    .btn-danger:hover { border-color: ${COLORS.danger}; color: ${COLORS.danger}; }

    /* Not found state */
    .not-found {
      text-align: center;
      padding: 64px 20px;
      color: ${COLORS.textMuted};
    }
    .not-found-icon { font-size: 4rem; margin-bottom: 16px; opacity: 0.5; }
    .not-found-title { font-size: 1.25rem; font-weight: 600; color: ${COLORS.text}; margin-bottom: 8px; }

    @media (max-width: 768px) {
      .article-title { font-size: 1.5rem; }
      .article-body { padding: 18px; font-size: 1rem; }
      .actions { flex-direction: column; }
      .btn { width: 100%; text-align: center; }
    }
  `,
  render(this) {
    const rawData = findResourceData<ArticleData>(this);
    const article = signal<ArticleData | null>(rawData ?? null);

    // Reactive derived signals
    const hasArticle = computed(() => article.get() !== null);
    const title = computed(() => article.get()?.title ?? "");
    const body = computed(() => article.get()?.body ?? "");
    const createdAt = computed(() => article.get()?.createdAt ?? "");
    const authorName = computed(() => article.get()?.authorName);
    const authorId = computed(() => article.get()?.authorId ?? 0);
    const authorRole = computed(() => article.get()?.authorRole);
    const tags = computed(() => article.get()?.tags ?? []);
    const hasTags = computed(() => tags.get().length > 0);
    const comments = computed(() => article.get()?.comments ?? []);
    const commentCount = computed(() => comments.get().length);
    const hasComments = computed(() => commentCount.get() > 0);

    const editing = signal(false);
    const editTitle = signal(article.get()?.title ?? "");
    const editBody = signal(article.get()?.body ?? "");
    const editTags = signal((article.get()?.tags ?? []).join(", "));
    const saving = signal(false);

    const startEdit = () => {
      editTitle.set(article.get()?.title ?? "");
      editBody.set(article.get()?.body ?? "");
      editTags.set((article.get()?.tags ?? []).join(", "));
      editing.set(true);
    };

    const cancelEdit = () => editing.set(false);

    const saveArticle = async () => {
      saving.set(true);
      try {
        const id = article.get()?.id;
        if (!id) throw new Error("Missing article id");
        const updated = await apiPatch(`/articles/${id}`, {
          title: editTitle.get(),
          body: editBody.get(),
          tags: editTags.get().split(",").map((t) => t.trim()).filter(Boolean),
        });
        article.set(updated as ArticleData);
        editing.set(false);
        showToast("success", "Article updated successfully");
      } catch (err) {
        showToast("error", `Failed to update article: ${(err as Error).message}`);
      } finally {
        saving.set(false);
      }
    };

    return div(
      // Back link
      a({ className: "back-link", href: "/articles" },
        "\u2190 Back to Articles",
      ),

      // Article content (when loaded)
      Show(hasArticle,
        div({},
          When(editing,
            div({ className: "article-edit" },
              div({ className: "form-field" },
                label({ className: "form-label" }, "Title"),
                input({
                  className: "form-input",
                  type: "text",
                  value: editTitle,
                  oninput: (e: Event) => editTitle.set((e.target as HTMLInputElement).value),
                }),
              ),
              div({ className: "form-field" },
                label({ className: "form-label" }, "Body"),
                input({
                  className: "form-input",
                  style: { minHeight: "200px" },
                  value: editBody,
                  oninput: (e: Event) => editBody.set((e.target as HTMLInputElement).value),
                }),
              ),
              div({ className: "form-field" },
                label({ className: "form-label" }, "Tags (comma separated)"),
                input({
                  className: "form-input",
                  type: "text",
                  value: editTags,
                  oninput: (e: Event) => editTags.set((e.target as HTMLInputElement).value),
                }),
              ),
              div({ className: "actions" },
                button({ className: "btn btn-primary", onclick: saveArticle, disabled: saving }, "Save"),
                button({ className: "btn btn-secondary", onclick: cancelEdit, disabled: saving }, "Cancel"),
              ),
            ),
            div({},
              // Header
              div({ className: "article-header" },
                h1({ className: "article-title" }, title),
                div({ className: "article-meta" },
                  span({ className: "meta-item" }, "\uD83D\uDCC5 ", computed(() => formatDate(createdAt.get()))),
                  span({ className: "meta-item" }, "\u270E\uFE0F by ",
                    When(computed(() => !!authorName.get()),
                      strong(computed(() => authorName.get() ?? "")),
                      span(computed(() => `Author #${authorId.get()}`)),
                    ),
                  ),
                  When(computed(() => !!authorRole.get()),
                    span({
                      style: {
                        padding: "2px 10px",
                        borderRadius: "10px",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        background: computed(() => `${roleColor(authorRole.get()!)}18`),
                        color: computed(() => roleColor(authorRole.get()!)),
                      },
                    }, computed(() => authorRole.get()!)),
                    null,
                  ),
                ),
              ),

              // Body content
              div({ className: "article-body" }, body),

              // Tags
              When(hasTags,
                div({ className: "tags-row" },
                  For(tags, (tag) => span({ className: "tag" }, tag)),
                ),
                null,
              ),

              // Comments section
              When(hasComments,
                section({ className: "comments-section" },
                  h3({ className: "comments-title" },
                    "\uD83D\uDDAC ",
                    "Comments",
                    span({ className: "comment-count" }, commentCount),
                  ),
                  div({ className: "comment-list" },
                    For(comments, (comment) =>
                      div({ className: "comment" },
                        div({ className: "comment-header" },
                          span({ className: "comment-author" }, comment.author),
                          span({ className: "comment-date" }, formatDate(comment.createdAt)),
                        ),
                        div({ className: "comment-body" }, comment.text),
                      ),
                    ),
                  ),
                ),
                null,
              ),

              // Action buttons
              div({ className: "actions" },
                button({
                  className: "btn btn-primary",
                  onclick: startEdit,
                }, "\u270F Edit Article"),
                button({
                  className: "btn btn-danger",
                  onclick: async () => {
                    const confirmed = await confirmAction({
                      title: "Delete Article",
                      message: `Are you sure you want to delete "${title.get()}\"? This action cannot be undone.`,
                      confirmLabel: "Delete",
                      variant: "danger",
                    });
                    if (confirmed) {
                      showToast("success", "Article deleted successfully");
                    }
                  },
                }, "\uD83D\uDDD1 Delete"),
              ),
            ),
          ),
        ),
      ),

      // Not found state
      Show(computed(() => !hasArticle.get()),
        div({ className: "not-found" },
          div({ className: "not-found-icon" }, "\uD83D\uDCDD"),
          div({ className: "not-found-title" }, "Article Not Found"),
          p("The article you're looking for doesn't exist or has been removed."),
          br(),
          a({ className: "back-link", href: "/articles" }, "\u2190 Back to Articles"),
        ),
      ),
    );
  },
});

// ===========================================================================
// 5. blog-user-list — User management cards
// ===========================================================================

const BlogUserList = defineElement("blog-user-list", {
  styles: css`
    ${typographyCSS}
    :host { display: block; }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .user-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .user-card {
      background: ${COLORS.surface};
      border: 1px solid ${COLORS.border};
      border-radius: 12px;
      padding: 24px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      transition: box-shadow 0.15s, border-color 0.15s;
    }
    .user-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); border-color: ${COLORS.primaryLight}; }

    .avatar {
      width: 50px; height: 50px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; font-weight: 700; color: white; flex-shrink: 0;
    }
    .avatar-a { background: linear-gradient(135deg, ${COLORS.primary}, #8b5cf6); }
    .avatar-e { background: linear-gradient(135deg, #f59e0b, #ef4444); }
    .avatar-default { background: linear-gradient(135deg, ${COLORS.textMuted}, ${COLORS.border}); }

    .user-info { flex: 1; min-width: 0; }
    .user-name { font-weight: 700; font-size: 1.05rem; }
    .user-email { color: ${COLORS.textMuted}; font-size: 0.88rem; margin-top: 3px; }
    .user-role {
      display: inline-block;
      margin-top: 10px;
      padding: 2px 10px;
      border-radius: 10px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .btn {
      padding: 9px 20px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid ${COLORS.border};
      background: ${COLORS.surface};
      color: ${COLORS.text};
      transition: all 0.15s;
      font-family: inherit;
    }
    .btn:hover { border-color: ${COLORS.primaryLight}; color: ${COLORS.primary}; }
    .btn-primary {
      background: ${COLORS.primary}; color: white; border-color: ${COLORS.primary};
    }
    .btn-primary:hover { background: ${COLORS.primaryDark}; }

    .empty { text-align: center; padding: 64px 20px; color: ${COLORS.textMuted}; }
    .empty-icon { font-size: 3.5rem; margin-bottom: 12px; opacity: 0.5; }

    .count-badge {
      font-size: 0.9rem;
      color: ${COLORS.textMuted};
      background: ${COLORS.surfaceAlt};
      padding: 4px 12px;
      border-radius: 12px;
    }

    @media (max-width: 768px) {
      .user-grid { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; gap: 12px; align-items: flex-start; }
    }
  `,
  render(this) {
    const rawData = findResourceData<UserData[] | { "@graph": UserData[] }>(this);
    const users = signal<UserData[]>(
      Array.isArray(rawData)
        ? rawData
        : (rawData && rawData["@graph"]) ?? [],
    );

    const userCount = computed(() => {
      const len = users.get().length;
      return `${len} user${len !== 1 ? "s" : ""}`;
    });
    const hasUsers = computed(() => users.get().length > 0);
    const noUsers = computed(() => users.get().length === 0);

    const adding = signal(false);
    const newName = signal("");
    const newEmail = signal("");
    const newRole = signal<UserData["role"]>("reader");
    const saving = signal(false);

    const startAdd = () => {
      newName.set("");
      newEmail.set("");
      newRole.set("reader");
      adding.set(true);
    };
    const cancelAdd = () => adding.set(false);

    const saveUser = async () => {
      saving.set(true);
      try {
        const created = await apiPost("/users", {
          name: newName.get(),
          email: newEmail.get(),
          role: newRole.get(),
        });
        users.set([...users.get(), created as UserData]);
        adding.set(false);
        showToast("success", "User created successfully");
      } catch (err) {
        showToast("error", `Failed to create user: ${(err as Error).message}`);
      } finally {
        saving.set(false);
      }
    };

    return div(
      // Page header
      div({ className: "page-header" },
        div({ style: { display: "flex", alignItems: "center", gap: "12px" } },
          h1("Users"),
          span({ className: "count-badge" }, userCount),
        ),
      ),

      // User cards grid
      Show(hasUsers,
        div({ className: "user-grid" },
          For(users, (user) => {
            const initial = computed(() => user.name.charAt(0).toUpperCase());
            const avatarClass = computed(() => {
              const init = initial.get();
              return init === "A" ? "avatar-a" : init === "E" ? "avatar-e" : "avatar-default";
            });
            const roleBg = computed(() => `${roleColor(user.role)}18`);
            const roleClr = computed(() => roleColor(user.role));

            return div({ className: "user-card" },
              div({ className: computed(() => `avatar ${avatarClass.get()}`) }, initial),
              div({ className: "user-info" },
                div({ className: "user-name" }, user.name),
                div({ className: "user-email" }, user.email),
                span({
                  className: "user-role",
                  style: { background: roleBg, color: roleClr },
                }, user.role),
              ),
            );
          }),
        ),
      ),

      // Empty state
      Show(noUsers,
        div({ className: "empty" },
          div({ className: "empty-icon" }, "\uD83D\uDC65"),
          p("No users found."),
        ),
      ),

      // Add user form / button
      When(adding,
        div({ className: "user-form" },
          div({ className: "form-field" },
            label({ className: "form-label" }, "Name"),
            input({
              className: "form-input",
              type: "text",
              value: newName,
              oninput: (e: Event) => newName.set((e.target as HTMLInputElement).value),
            }),
          ),
          div({ className: "form-field" },
            label({ className: "form-label" }, "Email"),
            input({
              className: "form-input",
              type: "email",
              value: newEmail,
              oninput: (e: Event) => newEmail.set((e.target as HTMLInputElement).value),
            }),
          ),
          div({ className: "form-field" },
            label({ className: "form-label" }, "Role"),
            input({
              className: "form-input",
              type: "text",
              value: newRole,
              oninput: (e: Event) => newRole.set((e.target as HTMLInputElement).value as UserData["role"]),
            }),
          ),
          div({ style: { marginTop: "16px" } },
            button({ className: "btn btn-primary", onclick: saveUser, disabled: saving }, "Create User"),
            button({ className: "btn btn-secondary", onclick: cancelAdd, disabled: saving }, "Cancel"),
          ),
        ),
        div({ style: { marginTop: "24px" } },
          button({ className: "btn btn-primary", onclick: startAdd }, "+ Add User"),
        ),
      ),
    );
  },
});

// ===========================================================================
// 6. blog-dashboard — Statistics dashboard
// ===========================================================================

const BlogDashboard = defineElement("blog-dashboard", {
  styles: css`
    ${typographyCSS}
    :host { display: block; }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .page-subtitle { color: ${COLORS.textMuted}; font-size: 0.92rem; }

    /* Stats grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 16px;
      margin-bottom: 36px;
    }
    .stat-card {
      background: ${COLORS.surface};
      border: 1px solid ${COLORS.border};
      border-radius: 14px;
      padding: 24px;
      position: relative;
      overflow: hidden;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.06); }
    .stat-card::before {
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0; height: 4px;
    }
    .stat-card-articles::before { background: ${COLORS.primary}; }
    .stat-card-comments::before { background: #f59e0b; }
    .stat-card-users::before { background: #22c55e; }
    .stat-icon {
      width: 46px; height: 46px; border-radius: 11px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.35rem; margin-bottom: 16px;
    }
    .stat-icon-articles { background: #ede9fe; }
    .stat-icon-comments { background: #fef3c7; }
    .stat-icon-users { background: #dcfce7; }
    .stat-value { font-size: 2.2rem; font-weight: 800; color: ${COLORS.text}; }
    .stat-label { font-size: 0.88rem; color: ${COLORS.textMuted}; margin-top: 2px; }
    .stat-change {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 10px;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 2px 9px;
      border-radius: 6px;
    }
    .change-up { color: ${COLORS.success}; background: #dcfce7; }
    .change-down { color: ${COLORS.danger}; background: #fee2e2; }

    /* Recent articles table */
    .section-title {
      font-size: 1.2rem;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title::after {
      content: ""; flex: 1; height: 1px; background: ${COLORS.border};
    }
    .table-wrapper {
      background: ${COLORS.surface};
      border: 1px solid ${COLORS.border};
      border-radius: 12px;
      overflow: hidden;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
    }
    .table th {
      text-align: left;
      padding: 13px 18px;
      background: ${COLORS.surfaceAlt};
      font-size: 0.82rem;
      font-weight: 600;
      color: ${COLORS.textMuted};
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid ${COLORS.border};
    }
    .table td {
      padding: 13px 18px;
      border-bottom: 1px solid ${COLORS.border};
      font-size: 0.92rem;
    }
    .table tr:last-child td { border-bottom: none; }
    .table tr:hover td { background: ${COLORS.surfaceAlt}; }
    .table a {
      color: ${COLORS.primary};
      text-decoration: none;
      font-weight: 500;
    }
    .table a:hover { text-decoration: underline; }

    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: 1fr 1fr; }
      .table-wrapper { overflow-x: auto; }
      .page-header { flex-direction: column; align-items: flex-start; }
    }
    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: 1fr; }
    }
  `,
  render(this) {
    const rawData = findResourceData<DashboardData>(this);
    const data = signal<DashboardData | null>(rawData ?? null);

    // Reactive derived values
    const articleCount = computed(() => data.get()?.articleCount ?? 0);
    const commentCount = computed(() => data.get()?.commentCount ?? 0);
    const userCount = computed(() => data.get()?.userCount ?? 0);
    const recentArticles = computed(() => data.get()?.recentArticles ?? []);
    const hasRecent = computed(() => recentArticles.get().length > 0);

    return div(
      // Page header
      div({ className: "page-header" },
        div({}, h1("Dashboard"), span({ className: "page-subtitle" }, "Overview & statistics")),
      ),

      // Stat cards
      div({ className: "stats-grid" },
        div({ className: "stat-card stat-card-articles" },
          div({ className: "stat-icon stat-icon-articles" }, "\uD83D\uDCDC"),
          div({ className: "stat-value" }, computed(() => String(articleCount.get()))),
          div({ className: "stat-label" }, "Total Articles"),
          span({ className: "stat-change change-up" }, "\u2191 12%"),
        ),
        div({ className: "stat-card stat-card-comments" },
          div({ className: "stat-icon stat-icon-comments" }, "\uD83D\uDDAC"),
          div({ className: "stat-value" }, computed(() => String(commentCount.get()))),
          div({ className: "stat-label" }, "Total Comments"),
          span({ className: "stat-change change-up" }, "\u2191 8%"),
        ),
        div({ className: "stat-card stat-card-users" },
          div({ className: "stat-icon stat-icon-users" }, "\uD83D\uDC65"),
          div({ className: "stat-value" }, computed(() => String(userCount.get()))),
          div({ className: "stat-label" }, "Total Users"),
          span({ className: "stat-change change-up" }, "\u2191 5%"),
        ),
      ),

      // Recent articles table
      When(hasRecent,
        div({},
          h3({ className: "section-title" }, "Recent Articles"),
          div({ className: "table-wrapper" },
            table({ className: "table" },
              thead({},
                tr({},
                  th("ID"),
                  th("Title"),
                  th("Action"),
                ),
              ),
              tbody({},
                For(recentArticles, (item) =>
                  tr({},
                    td(String(item.id)),
                    td(item.title),
                    td(a({ href: `/articles/${item.id}` }, "View \u2192")),
                  ),
                ),
              ),
            ),
          ),
        ),
        null,
      ),
    );
  },
});

// ===========================================================================
// 7. blog-settings — Editable site settings with save/cancel
// ===========================================================================

const BlogSettings = defineElement("blog-settings", {
  styles: css`
    ${typographyCSS}
    :host { display: block; }

    .page-header { margin-bottom: 28px; }
    .page-subtitle { color: ${COLORS.textMuted}; margin-top: 4px; font-size: 0.93rem; }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }

    .setting-card {
      background: ${COLORS.surface};
      border: 1px solid ${COLORS.border};
      border-radius: 12px;
      padding: 24px;
      transition: border-color 0.15s;
    }
    .setting-card:hover { border-color: ${COLORS.primaryLight}; }
    .setting-card.editing { border-color: ${COLORS.primary}; box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }

    .setting-label {
      font-size: 0.82rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: ${COLORS.textMuted};
      margin-bottom: 8px;
    }
    .setting-value {
      font-size: 1.3rem;
      font-weight: 700;
      color: ${COLORS.text};
    }
    .setting-description {
      font-size: 0.87rem;
      color: ${COLORS.textMuted};
      margin-top: 6px;
    }

    /* Form inputs in edit mode */
    .form-field { margin-bottom: 16px; }
    .form-label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: ${COLORS.text};
      margin-bottom: 6px;
    }
    .form-input {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid ${COLORS.border};
      border-radius: 8px;
      font-size: 0.95rem;
      outline: none;
      background: ${COLORS.surface};
      color: ${COLORS.text};
      font-family: inherit;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .form-input:focus { border-color: ${COLORS.primary}; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }

    .setting-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.82rem;
      font-weight: 600;
      margin-top: 8px;
    }
    .badge-dark { background: #1e293b; color: white; }
    .badge-light { background: #f1f5f9; color: ${COLORS.text}; }

    /* Actions */
    .actions { margin-top: 28px; display: flex; gap: 10px; flex-wrap: wrap; }
    .btn {
      padding: 9px 20px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid ${COLORS.border};
      background: ${COLORS.surface};
      color: ${COLORS.text};
      transition: all 0.15s;
      font-family: inherit;
    }
    .btn:hover { border-color: ${COLORS.primaryLight}; color: ${COLORS.primary}; }
    .btn-primary {
      background: ${COLORS.primary}; color: white; border-color: ${COLORS.primary};
    }
    .btn-primary:hover { background: ${COLORS.primaryDark}; }
    .btn-secondary {
      background: transparent;
    }

    /* Save status indicator */
    .save-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-left: 12px;
      font-size: 0.85rem;
      font-weight: 500;
    }
    .status-saving { color: ${COLORS.warning}; }
    .status-saved { color: ${COLORS.success}; }
    .status-error { color: ${COLORS.danger}; }

    @media (max-width: 768px) {
      .settings-grid { grid-template-columns: 1fr; }
    }
  `,
  render(this) {
    const rawData = findResourceData<SettingsData>(this);
    const originalData = signal<SettingsData | null>(rawData ?? null);

    const editing = signal(false);
    const editSiteName = signal(rawData?.siteName ?? "");
    const editTheme = signal(rawData?.theme ?? "dark");
    const editPostsPerPage = signal(rawData?.postsPerPage ?? 10);
    const saving = signal(false);
    const saveStatus = signal<"idle" | "saving" | "saved" | "error">("idle");

    // Reactive computed values
    const siteName = computed(() => originalData.get()?.siteName ?? "\u2014");
    const theme = computed(() => originalData.get()?.theme ?? "\u2014");
    const postsPerPage = computed(() => originalData.get()?.postsPerPage ?? "\u2014");
    const isDarkTheme = computed(() => theme.get() === "dark");

    // Enter edit mode
    const startEdit = () => {
      editSiteName.set(originalData.get()?.siteName ?? "");
      editTheme.set(originalData.get()?.theme ?? "dark");
      editPostsPerPage.set(originalData.get()?.postsPerPage ?? 10);
      editing.set(true);
      saveStatus.set("idle");
    };

    // Cancel edit mode
    const cancelEdit = () => {
      editing.set(false);
      saveStatus.set("idle");
    };

    // Save changes via API
    const saveChanges = async () => {
      saving.set(true);
      saveStatus.set("saving");
      try {
        const updated = await apiPatch("/settings", {
          siteName: editSiteName.get(),
          theme: editTheme.get(),
          postsPerPage: editPostsPerPage.get(),
        });
        originalData.set(updated as SettingsData);
        editing.set(false);
        saveStatus.set("saved");
        showToast("success", "Settings saved successfully!");
        setTimeout(() => saveStatus.set("idle"), 2500);
      } catch (err) {
        saveStatus.set("error");
        showToast("error", `Failed to save settings: ${(err as Error).message}`);
      } finally {
        saving.set(false);
      }
    };

    return div(
      // Page header
      div({ className: "page-header" },
        div({}, h1("Settings"), p({ className: "page-subtitle" }, "Site configuration")),
      ),

      // Settings cards (view or edit mode)
      Show(editing,
        // --- EDIT MODE ---
        div({ className: "settings-grid" },
          // Site Name field
          div({ className: "setting-card editing" },
            div({ className: "form-field" },
              label({ className: "form-label" }, "Site Name"),
              input({
                className: "form-input",
                type: "text",
                value: editSiteName,
                oninput: (e: Event) => editSiteName.set((e.target as HTMLInputElement).value),
              }),
            ),
            div({ className: "setting-description" }, "Display name shown in header and page titles"),
          ),

          // Theme field
          div({ className: "setting-card editing" },
            div({ className: "form-field" },
              label({ className: "form-label" }, "Theme"),
              input({
                className: "form-input",
                type: "text",
                value: editTheme,
                oninput: (e: Event) => editTheme.set((e.target as HTMLInputElement).value),
              }),
            ),
            div({ className: "setting-description" }, "Current visual theme"),
          ),

          // Posts per page field
          div({ className: "setting-card editing" },
            div({ className: "form-field" },
              label({ className: "form-label" }, "Posts Per Page"),
              input({
                className: "form-input",
                type: "number",
                value: editPostsPerPage,
                oninput: (e: Event) => editPostsPerPage.set(Number((e.target as HTMLInputElement).value)),
              }),
            ),
            div({ className: "setting-description" }, "Number of articles shown per page in lists"),
          ),
        ),
      ),

      Show(computed(() => !editing.get()),
        // --- VIEW MODE ---
        div({ className: "settings-grid" },
          // Site Name card
          div({ className: "setting-card" },
            div({ className: "setting-label" }, "Site Name"),
            div({ className: "setting-value" }, siteName),
            div({ className: "setting-description" }, "Display name shown in header and page titles"),
          ),

          // Theme card
          div({ className: "setting-card" },
            div({ className: "setting-label" }, "Theme"),
            div({ className: "setting-value" }, theme),
            span({
              className: `setting-badge ${isDarkTheme.get() ? "badge-dark" : "badge-light"}`,
            }, theme),
            div({ className: "setting-description" }, "Current visual theme"),
          ),

          // Posts per page card
          div({ className: "setting-card" },
            div({ className: "setting-label" }, "Posts Per Page"),
            div({ className: "setting-value" }, computed(() => String(postsPerPage.get()))),
            div({ className: "setting-description" }, "Number of articles shown per page in lists"),
          ),
        ),
      ),

      // Action buttons
      div({ className: "actions" },
        Show(computed(() => !editing.get()),
          button({ className: "btn btn-primary", onclick: startEdit }, "\u270F Edit Settings"),
        ),
        Show(editing,
          button({
            className: "btn btn-primary",
            onclick: saveChanges,
            disabled: saving,
          }, computed(() => saving.get() ? "Saving..." : "Save Changes")),
        ),
        Show(editing,
          button({ className: "btn btn-secondary", onclick: cancelEdit, disabled: saving }, "Cancel"),
        ),
        Show(computed(() => !editing.get()),
          button({
            className: "btn",
            onclick: async () => {
              const confirmed = await confirmAction({
                title: "Reset Settings",
                message: "Are you sure you want to reset all settings to their default values?",
                confirmLabel: "Reset",
                variant: "warning",
              });
              if (confirmed) {
                originalData.set({ siteName: "Rikka Blog", theme: "dark", postsPerPage: 10 });
                showToast("success", "Settings reset to defaults");
              }
            },
          }, "\u21BA Reset to Defaults"),
        ),
        // Save status indicator
        When(computed(() => saveStatus.get() === "saved"),
          span({ className: "save-status status-saved" }, "\u2713 Saved!"),
          null,
        ),
        When(computed(() => saveStatus.get() === "saving"),
          span({ className: "save-status status-saving" }, "Saving..."),
          null,
        ),
      ),
    );
  },
});

// ===========================================================================
// rikka-resource — Router element that delegates to the correct component
// The server renders <rikka-resource path="..." kind="..." data-resource="...">
// This client-side element inspects attributes and renders the appropriate
// blog-* child component.
//
// Uses the SDK's matchRoute + sitemap when available, with a path-based
// fallback for pre-SDK scenarios.
// ===========================================================================

const RikkaResource = defineElement("rikka-resource", {
  styles: css`:host { display: contents; }`,
  render(this) {
    const path = this.getAttribute("path") ?? "";
    const kind = this.getAttribute("kind") ?? "";

    // Normalize: strip trailing slash for consistent matching
    const normPath = path.replace(/\/+$/, "");

    // Try SDK router first — uses the sitemap embedded in the page
    const sdk = (window as any).__rikka;
    if (sdk?.matchRoute && sdk?.readSitemapFromDom) {
      const sitemap = sdk.readSitemapFromDom();
      if (sitemap) {
        const match = sdk.matchRoute(sitemap, normPath || "/");
        if (match?.route?.element) {
          try {
            return document.createElement(match.route.element);
          } catch {
            // Element not registered — fall through
          }
        }
      }
    }

    // Fallback: path-based routing
    const match = (): HTMLElement => {
      // Home / site root
      if (normPath === "/" || (kind === "ReadOnly" && normPath === "")) {
        return document.createElement("blog-home");
      }

      // Article item (e.g., /articles/1) — check BEFORE collection
      if (normPath.match(/^\/articles\/\d+$/)) {
        return document.createElement("blog-article-detail");
      }

      // Articles collection
      if (normPath === "/articles" || normPath.startsWith("/articles")) {
        return document.createElement("blog-article-list");
      }

      // Users collection
      if (normPath === "/users" || normPath.startsWith("/users")) {
        return document.createElement("blog-user-list");
      }

      // Dashboard
      if (normPath === "/dashboard") {
        return document.createElement("blog-dashboard");
      }

      // Settings
      if (normPath === "/settings") {
        return document.createElement("blog-settings");
      }

      // Fallback — empty div
      return div({ style: { padding: "40px", textAlign: "center", color: COLORS.textMuted } },
        p(`Unknown resource: ${path} (${kind})`),
      );
    };

    // Return the matched element directly.
    return match();
  },
});

// ---------------------------------------------------------------------------
// Export all elements for registration
// ---------------------------------------------------------------------------

export const elements = {
  BlogOverlay,
  BlogLayout,
  BlogHome,
  BlogArticleList,
  BlogArticleDetail,
  BlogUserList,
  BlogDashboard,
  BlogSettings,
};

/** Register all blog custom elements. Call once in your entry point.
 *  Safe to call multiple times — skips already-registered elements. */
export function registerBlogElements(): void {
  const defs: [string, CustomElementConstructor][] = [
    ["blog-overlay", BlogOverlay],
    ["blog-layout", BlogLayout],
    ["blog-home", BlogHome],
    ["blog-article-list", BlogArticleList],
    ["blog-article-detail", BlogArticleDetail],
    ["blog-user-list", BlogUserList],
    ["blog-dashboard", BlogDashboard],
    ["blog-settings", BlogSettings],
    ["rikka-resource", RikkaResource],
  ];
  for (const [name, ctor] of defs) {
    if (!customElements.get(name)) {
      customElements.define(name, ctor);
    }
  }
}

// Note: defineElement() already registers each element with customElements.define().
// registerBlogElements() is kept for programmatic use (e.g., testing) and is safe
// to call multiple times — it skips already-registered elements.
