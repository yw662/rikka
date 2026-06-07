import { defineElement, css } from "@takanashi/rikka-elements";
import { div, a, span, p, footer } from "@takanashi/rikka-dom";

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
            p(
              { class: "footer-brand-desc" },
              "A modern Web Components toolkit with fine-grained reactivity based on TC39 Signals.",
            ),
            span({ class: "footer-built-with" }, "\u26a1 Built with Rikka"),
          ),
          div(
            {},
            div({ class: "footer-column-title" }, "Learn"),
            div(
              { class: "footer-links" },
              a({ href: "#/docs" }, "Documentation"),
              a({ href: "#/docs/@takanashi/rikka-signal/getting-started" }, "Getting Started"),
              a({ href: "#/examples" }, "Examples"),
            ),
          ),
          div(
            {},
            div({ class: "footer-column-title" }, "Packages"),
            div(
              { class: "footer-links" },
              a({ href: "#/docs/@takanashi/rikka-signal/signal" }, "@takanashi/rikka-signal"),
              a({ href: "#/docs/@takanashi/rikka-dom/h" }, "@takanashi/rikka-dom"),
              a({ href: "#/docs/@takanashi/rikka-elements/define-element" }, "@takanashi/rikka-elements"),
            ),
          ),
          div(
            {},
            div({ class: "footer-column-title" }, "Community"),
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
            }, "\u2191 Back to top"),
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
