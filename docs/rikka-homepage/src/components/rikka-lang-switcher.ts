import { defineElement, css } from "@takanashi/rikka-elements";
import { div, button, span } from "@takanashi/rikka-dom";
import { locale, setLocale, type Locale } from "../shared/i18n";
import { effect } from "@takanashi/rikka-signal";

const switcherStyles = css`
  :host {
    display: inline-flex;
  }
  .lang-switcher {
    display: inline-flex;
    align-items: center;
    gap: 0;
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    overflow: hidden;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .lang-btn {
    padding: 0.25rem 0.5rem;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 600;
    font-family: inherit;
    transition: all 0.15s ease;
    line-height: 1;
  }
  .lang-btn:hover {
    background: var(--color-nav-link-bg);
    color: var(--color-text-primary);
  }
  .lang-btn.active {
    background: var(--color-primary);
    color: white;
  }
  .lang-btn.active:hover {
    background: var(--color-secondary);
    color: white;
  }
`;

const LangSwitcher = defineElement("rikka-lang-switcher", {
  styles: switcherStyles,
  render() {
    const btnEn = button({ class: "lang-btn" }, "EN");
    const btnZh = button({ class: "lang-btn" }, "中文");

    btnEn.onclick = () => setLocale("en");
    btnZh.onclick = () => setLocale("zh");

    effect(() => {
      const l = locale.get();
      btnEn.className = `lang-btn${l === "en" ? " active" : ""}`;
      btnZh.className = `lang-btn${l === "zh" ? " active" : ""}`;
    });

    return div({ class: "lang-switcher" }, btnEn, btnZh);
  },
});

export { LangSwitcher };
