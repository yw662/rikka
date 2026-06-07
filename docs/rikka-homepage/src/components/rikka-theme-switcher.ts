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
    align-items: center;
  }

  .theme-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    color: var(--color-text-secondary);
    font-size: 1.125rem;
    transition: all var(--transition-fast);
    position: relative;
    overflow: hidden;
  }

  .theme-toggle:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
    background: rgba(99, 102, 241, 0.1);
    transform: rotate(15deg) scale(1.05);
  }

  .theme-toggle:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* Auto icon (system) */
  .auto-icon {
    display: none;
  }

  /* Sun icon (light mode) */
  .sun-icon {
    display: none;
  }

  /* Moon icon (dark mode) — default visible */
  .moon-icon {
    display: inline-block;
  }

  :host([data-theme="auto"]) .auto-icon {
    display: inline-block;
  }
  :host([data-theme="auto"]) .moon-icon,
  :host([data-theme="auto"]) .sun-icon {
    display: none;
  }

  :host([data-theme="light"]) .sun-icon {
    display: inline-block;
  }
  :host([data-theme="light"]) .moon-icon,
  :host([data-theme="light"]) .auto-icon {
    display: none;
  }

  :host([data-theme="dark"]) .moon-icon {
    display: inline-block;
  }
  :host([data-theme="dark"]) .sun-icon,
  :host([data-theme="dark"]) .auto-icon {
    display: none;
  }
`;

export const ThemeSwitcher = defineElement("rikka-theme-switcher", {
  styles: themeSwitcherStyles,
  render() {
    const applyMode = (mode: ThemeMode) => {
      document.documentElement.setAttribute("data-theme", mode);
      this.setAttribute("data-theme", mode);

      try {
        localStorage.setItem("theme", mode);
      } catch {
        // localStorage unavailable
      }

      this.dispatchEvent(
        new CustomEvent("theme-changed", {
          detail: { mode },
          bubbles: true,
          composed: true,
        }),
      );
    };

    const cycleTheme = () => {
      const current =
        (document.documentElement.getAttribute("data-theme") as ThemeMode) ||
        "auto";
      const next: ThemeMode =
        current === "dark" ? "light" : current === "light" ? "auto" : "dark";
      applyMode(next);
    };

    // Initialize: read from localStorage, default to auto
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

    const nextLabel = () => {
      const current =
        (document.documentElement.getAttribute("data-theme") as ThemeMode) ||
        "auto";
      const next: ThemeMode =
        current === "dark" ? "light" : current === "light" ? "auto" : "dark";
      const labels: Record<ThemeMode, string> = {
        dark: "dark",
        light: "light",
        auto: "system",
      };
      return labels[next];
    };

    return button(
      {
        class: "theme-toggle",
        onclick: () => cycleTheme(),
        title: "Toggle theme",
        "aria-label": `Switch to ${nextLabel()} mode`,
      },
      span({ class: "auto-icon" }, "💻"),
      span({ class: "sun-icon" }, "☀️"),
      span({ class: "moon-icon" }, "🌙"),
    );
  },
});
