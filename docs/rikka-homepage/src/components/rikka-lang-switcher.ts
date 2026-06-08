import { defineElement, css } from "@takanashi/rikka-elements";
import { div, button, span } from "@takanashi/rikka-dom";
import { signal, effect } from "@takanashi/rikka-signal";
import { locale, setLocale, type Locale } from "../shared/i18n";

type LangEntry = { value: Locale; label: string; short: string };

const LANGS: LangEntry[] = [
  { value: "en", label: "English", short: "EN" },
  { value: "zh", label: "中文", short: "中文" },
];

const switcherStyles = css`
  :host {
    display: inline-flex;
    position: relative;
  }

  .lang-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    box-sizing: border-box;
    height: 32px;
    padding: 0 0.55rem 0 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-text-primary);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    line-height: 1;
    transition: all var(--transition-fast);
  }

  .lang-trigger:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .lang-trigger:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .lang-chevron {
    font-size: 0.55rem;
    color: var(--color-text-muted);
    transition: transform 0.2s ease;
  }

  .lang-trigger:hover .lang-chevron {
    color: var(--color-primary);
  }

  :host([data-open]) .lang-chevron {
    transform: rotate(180deg);
  }

  .lang-menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    min-width: 7.5rem;
    background: var(--color-nav-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 0.3rem;
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
    gap: 2px;
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
    transform-origin: top right;
    pointer-events: none;
    transition: opacity 0.15s ease, transform 0.15s ease;
    z-index: var(--z-dropdown);
  }

  :host([data-open]) .lang-menu {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
  }

  .lang-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.4rem 0.6rem;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    text-align: left;
    border-radius: var(--radius-sm);
    transition: all 0.15s ease;
    font-family: inherit;
    white-space: nowrap;
    line-height: 1;
  }

  .lang-item:hover {
    background: var(--color-nav-link-bg);
    color: var(--color-text-primary);
  }

  .lang-item[aria-checked="true"] {
    color: var(--color-primary);
  }

  .lang-item-check {
    font-size: 0.75rem;
    color: var(--color-primary);
    opacity: 0;
  }

  .lang-item[aria-checked="true"] .lang-item-check {
    opacity: 1;
  }
`;

const LangSwitcher = defineElement("rikka-lang-switcher", {
  styles: switcherStyles,
  render() {
    const open = signal(false);

    const items = LANGS.map((lang) =>
      button(
        {
          class: "lang-item",
          type: "button",
          role: "menuitemradio",
          "aria-checked": String(locale.get() === lang.value),
          "data-value": lang.value,
          onclick: () => {
            setLocale(lang.value);
            open.set(false);
            this.removeAttribute("data-open");
          },
        },
        span({}, lang.label),
        span({ class: "lang-item-check", "aria-hidden": "true" }, "✓"),
      ),
    );

    const menu = div({ class: "lang-menu", role: "menu" }, ...items);

    const triggerLabel = () => {
      const current = LANGS.find((l) => l.value === locale.get());
      return current ? current.short : "EN";
    };

    const trigger = button(
      {
        class: "lang-trigger",
        type: "button",
        "aria-haspopup": "menu",
        "aria-expanded": "false",
        title: "Change language",
        onclick: (e: MouseEvent) => {
          e.stopPropagation();
          const next = !open.get();
          open.set(next);
          if (next) {
            this.setAttribute("data-open", "");
          } else {
            this.removeAttribute("data-open");
          }
        },
      },
      span({ class: "lang-trigger-label" }, triggerLabel()),
      span({ class: "lang-chevron", "aria-hidden": "true" }, "▾"),
    );

    // Sync trigger label, expanded state, and item checkmarks with locale/open.
    effect(() => {
      const l = locale.get();
      const isOpen = open.get();
      trigger.setAttribute("aria-expanded", String(isOpen));
      trigger.querySelector(".lang-trigger-label")!.textContent = triggerLabel();
      for (const item of items) {
        const v = item.getAttribute("data-value") as Locale;
        item.setAttribute("aria-checked", String(v === l));
      }
    });

    // Click outside / Escape closes the menu. Effect cleanup removes the
    // listeners when the menu closes or the host element disconnects.
    // Use composedPath() so the check works across the shadow DOM boundary.
    effect(() => {
      if (!open.get()) return;
      const onDocPointer = (e: MouseEvent) => {
        if (!e.composedPath().includes(this)) {
          open.set(false);
          this.removeAttribute("data-open");
        }
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          open.set(false);
          this.removeAttribute("data-open");
          (trigger as HTMLButtonElement).focus();
        }
      };
      document.addEventListener("mousedown", onDocPointer);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("mousedown", onDocPointer);
        document.removeEventListener("keydown", onKey);
      };
    });

    return div({ class: "lang-switcher" }, trigger, menu);
  },
});

export { LangSwitcher };
