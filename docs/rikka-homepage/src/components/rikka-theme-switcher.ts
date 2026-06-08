import { defineElement, css } from "@takanashi/rikka-elements";
import { button, span } from "@takanashi/rikka-dom";

type ThemeMode = "auto" | "light" | "dark";

function resolveSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined" || !window.matchMedia) {
    return "dark";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

const themeSwitcherStyles = css`
  :host {
    display: inline-flex;
  }

  .theme-switcher {
    position: relative;
    display: inline-flex;
    align-items: stretch;
    box-sizing: border-box;
    height: 32px;
    padding: 3px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: transparent;
    isolation: isolate;
    transition: border-color var(--transition-fast);
  }

  .theme-switcher:hover {
    border-color: var(--color-border-hover);
  }

  .theme-btn {
    position: relative;
    z-index: 1;
    flex: 0 0 auto;
    width: 28px;
    height: 100%;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    line-height: 1;
    border-radius: calc(var(--radius-md) - 3px);
    transition: color 0.2s ease;
    font-family: inherit;
    padding: 0;
  }

  .theme-btn:hover {
    color: var(--color-text-primary);
  }

  .theme-btn[aria-checked="true"] {
    color: var(--color-primary);
  }

  .theme-btn:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .theme-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 28px;
    height: calc(100% - 6px);
    background: var(--color-nav-link-active-bg);
    border-radius: calc(var(--radius-md) - 3px);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 0;
    pointer-events: none;
  }

  :host([data-theme="light"]) .theme-thumb {
    transform: translateX(0);
  }
  :host([data-theme="auto"]) .theme-thumb {
    transform: translateX(28px);
  }
  :host([data-theme="dark"]) .theme-thumb {
    transform: translateX(56px);
  }
`;

const ORDER: ThemeMode[] = ["light", "auto", "dark"];
const ICONS: Record<ThemeMode, string> = {
  auto: "💻",
  light: "☀️",
  dark: "🌙",
};
const LABELS: Record<ThemeMode, string> = {
  auto: "System theme",
  light: "Light theme",
  dark: "Dark theme",
};

export const ThemeSwitcher = defineElement("rikka-theme-switcher", {
  styles: themeSwitcherStyles,
  render() {
    // Read saved mode synchronously so the initial render can mark the
    // right button as checked.
    let savedMode: ThemeMode | null = null;
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "auto" || stored === "light" || stored === "dark") {
        savedMode = stored;
      }
    } catch {
      // localStorage unavailable
    }
    const initialMode: ThemeMode = savedMode ?? "auto";

    // Build buttons first so applyMode can update their aria-checked.
    const buttons: ReturnType<typeof button>[] = [];

    const applyMode = (mode: ThemeMode) => {
      document.documentElement.setAttribute("data-theme", mode);
      this.setAttribute("data-theme", mode);

      try {
        localStorage.setItem("theme", mode);
      } catch {
        // localStorage unavailable
      }

      for (const btn of buttons) {
        const m = btn.getAttribute("data-mode") as ThemeMode;
        btn.setAttribute("aria-checked", String(m === mode));
      }

      this.dispatchEvent(
        new CustomEvent("theme-changed", {
          detail: { mode },
          bubbles: true,
          composed: true,
        }),
      );
    };

    for (const mode of ORDER) {
      const btn = button(
        {
          class: "theme-btn",
          type: "button",
          role: "radio",
          "data-mode": mode,
          "aria-label": LABELS[mode],
          "aria-checked": String(initialMode === mode),
          title: LABELS[mode],
          onclick: () => applyMode(mode),
        },
        span({ "aria-hidden": "true" }, ICONS[mode]),
      );
      buttons.push(btn);
    }

    // Apply initial mode (also persists to localStorage and dispatches the
    // initial theme-changed event so any listeners can react).
    applyMode(initialMode);

    // Listen for system theme changes — no DOM change needed since CSS
    // @media (prefers-color-scheme) handles the auto mode automatically.
    // We only need to re-dispatch so other JS listeners can react.
    if (typeof window.matchMedia === "function") {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", () => {
          if (
            document.documentElement.getAttribute("data-theme") === "auto"
          ) {
            this.dispatchEvent(
              new CustomEvent("theme-changed", {
                detail: { mode: "auto" },
                bubbles: true,
                composed: true,
              }),
            );
          }
        });
    }

    const thumb = span({ class: "theme-thumb", "aria-hidden": "true" });

    return span(
      {
        class: "theme-switcher",
        role: "radiogroup",
        "aria-label": "Theme mode",
      },
      thumb,
      ...buttons,
    );
  },
});
