import { defineElement, css } from "@takanashi/rikka-elements";
import { div, a, span, p, footer } from "@takanashi/rikka-dom";
import { effect, computed } from "@takanashi/rikka-signal";
import { t, type Locale } from "../shared/i18n";

const footerContent = {
  brandDesc: {
    en: "A modern Web Components toolkit with fine-grained reactivity based on TC39 Signals.",
    zh: "基于 TC39 Signals 的现代 Web Components 工具集，提供细粒度响应式能力。",
  } as Record<Locale, string>,
  builtWith: { en: "Built with Rikka", zh: "使用 Rikka 构建" } as Record<Locale, string>,
  learn: { en: "Learn", zh: "学习" } as Record<Locale, string>,
  documentation: { en: "Documentation", zh: "文档" } as Record<Locale, string>,
  gettingStarted: { en: "Getting Started", zh: "快速开始" } as Record<Locale, string>,
  examples: { en: "Examples", zh: "示例" } as Record<Locale, string>,
  packages: { en: "Packages", zh: "包" } as Record<Locale, string>,
  community: { en: "Community", zh: "社区" } as Record<Locale, string>,
  backToTop: { en: "Back to top", zh: "回到顶部" } as Record<Locale, string>,
};

const footerStyles = css`
  :host {
    display: block;
  }
  
  .footer {
    padding: 4rem 2rem 2rem;
    background: var(--color-background);
    border-top: 1px solid var(--color-border);
  }
  
  .footer-inner {
    max-width: 1200px;
    margin: 0 auto;
  }

  .footer-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 3rem;
    margin-bottom: 3rem;
  }

  .footer-brand-section .footer-logo {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-primary);
    text-decoration: none;
    transition: color var(--transition-fast);
    display: inline-block;
    margin-bottom: 0.75rem;
  }
  
  .footer-brand-section .footer-logo:hover {
    color: var(--color-primary-light);
  }

  .footer-brand-desc {
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    line-height: 1.6;
    margin: 0;
    max-width: 280px;
  }

  .footer-built-with {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin-top: 1rem;
    padding: 0.3rem 0.7rem;
    background: rgba(99, 102, 241, 0.08);
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: 9999px;
    font-size: 0.7rem;
    color: var(--color-primary-light);
  }

  .footer-column-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-primary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 1rem;
  }

  .footer-links {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  
  .footer-links a {
    color: var(--color-text-secondary);
    text-decoration: none;
    font-size: 0.875rem;
    transition: color var(--transition-fast);
  }
  
  .footer-links a:hover {
    color: var(--color-text-primary);
  }

  .footer-bottom {
    padding-top: 2rem;
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .footer-copy {
    color: var(--color-text-muted);
    font-size: 0.8rem;
  }

  .footer-bottom-links {
    display: flex;
    gap: 1.5rem;
  }

  .footer-bottom-links a {
    color: var(--color-text-muted);
    text-decoration: none;
    font-size: 0.8rem;
    transition: color var(--transition-fast);
  }

  .footer-bottom-links a:hover {
    color: var(--color-text-secondary);
  }

  @media (max-width: 768px) {
    .footer-grid {
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .footer-brand-section {
      grid-column: 1 / -1;
    }
    
    .footer-bottom {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .footer-bottom-links {
      flex-wrap: wrap;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .footer-grid {
      grid-template-columns: 1fr;
    }
  }
`;

const RikkaFooter = defineElement("rikka-footer", {
  styles: footerStyles,
  render() {
    return footer(
      { class: "footer" },
      div(
        { class: "footer-inner" },
        div(
          { class: "footer-grid" },
          div(
            { class: "footer-brand-section" },
            a({ href: "#/", class: "footer-logo" }, "Rikka"),
            (() => {
              const el = p({ class: "footer-brand-desc" });
              effect(() => { el.textContent = t(footerContent.brandDesc); });
              return el;
            })(),
            (() => {
              const el = span({ class: "footer-built-with" }, "\u26a1 ");
              effect(() => { el.textContent = "\u26a1 " + t(footerContent.builtWith); });
              return el;
            })(),
          ),
          div(
            {},
            (() => { const el = div({ class: "footer-column-title" }); effect(() => { el.textContent = t(footerContent.learn); }); return el; })(),
            div(
              { class: "footer-links" },
              (() => { const el = a({ href: "#/docs" }); effect(() => { el.textContent = t(footerContent.documentation); }); return el; })(),
              (() => { const el = a({ href: "#/docs/@takanashi/rikka-signal/getting-started" }); effect(() => { el.textContent = t(footerContent.gettingStarted); }); return el; })(),
              (() => { const el = a({ href: "#/examples" }); effect(() => { el.textContent = t(footerContent.examples); }); return el; })(),
            ),
          ),
          div(
            {},
            (() => { const el = div({ class: "footer-column-title" }); effect(() => { el.textContent = t(footerContent.packages); }); return el; })(),
            div(
              { class: "footer-links" },
              a({ href: "#/docs/@takanashi/rikka-signal/signal" }, "@takanashi/rikka-signal"),
              a({ href: "#/docs/@takanashi/rikka-dom/h" }, "@takanashi/rikka-dom"),
              a({ href: "#/docs/@takanashi/rikka-elements/define-element" }, "@takanashi/rikka-elements"),
            ),
          ),
          div(
            {},
            (() => { const el = div({ class: "footer-column-title" }); effect(() => { el.textContent = t(footerContent.community); }); return el; })(),
            div(
              { class: "footer-links" },
              a({
                href: "https://github.com/yw662/rikka",
                target: "_blank",
                rel: "noopener noreferrer",
              }, "GitHub"),
              a({
                href: "https://github.com/yw662/rikka/issues",
                target: "_blank",
                rel: "noopener noreferrer",
              }, "Issues"),
              a({
                href: "https://github.com/yw662/rikka/discussions",
                target: "_blank",
                rel: "noopener noreferrer",
              }, "Discussions"),
            ),
          ),
        ),
        div(
          { class: "footer-bottom" },
          span(
            { class: "footer-copy" },
            `\u00a9 ${new Date().getFullYear()} Project Rikka. MIT License.`,
          ),
          div(
            { class: "footer-bottom-links" },
            a({
              href: "#top",
              onclick: (e: Event) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              },
            }, computed(() => "\u2191 " + t(footerContent.backToTop))),
            a({
              href: "https://github.com/yw662/rikka",
              target: "_blank",
              rel: "noopener noreferrer",
            }, "GitHub"),
          ),
        ),
      ),
    );
  },
});

export { RikkaFooter };
