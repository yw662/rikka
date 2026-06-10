import { defineElement } from "@takanashi/rikka-elements";
import { div, h1, h2, h3, p, a, span, css } from "@takanashi/rikka-dom";
import { effect } from "@takanashi/rikka-signal";
import { examplePageStyles } from "../shared/page-styles";
import { locale, t } from "../shared/i18n";
import { examples, exampleLabels } from "../shared/example-content";

const styles = css`
  ${examplePageStyles}

  .examples-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 24px;
    margin-top: 32px;
  }

  .example-card {
    background: var(--color-card-bg);
    border: 1px solid var(--color-card-border);
    border-radius: 16px;
    padding: 28px;
    transition: all 0.3s ease;
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .example-card:hover {
    border-color: var(--color-primary);
    transform: translateY(-4px);
    box-shadow: 0 20px 50px rgba(99, 102, 241, 0.15);
  }

  .example-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .example-icon {
    font-size: 48px;
    line-height: 1;
  }

  .example-content h3 {
    color: var(--color-text-primary);
    font-size: 1.25rem;
    margin-bottom: 8px;
    font-weight: 700;
  }

  .example-content p {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    line-height: 1.6;
    margin-bottom: 16px;
  }

  .example-features {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    margin-bottom: 4px;
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    color: var(--color-text-secondary);
  }

  .feature-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-primary);
    flex-shrink: 0;
  }

  .example-actions {
    display: flex;
    gap: 12px;
    margin-top: auto;
    padding-top: 16px;
    border-top: 1px solid var(--color-card-border);
  }

  .example-actions a {
    flex: 1;
    text-align: center;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s;
  }

  .view-demo {
    background: var(--color-primary);
    color: white;
  }

  .view-demo:hover {
    background: var(--color-secondary);
  }

  .view-source {
    background: var(--color-tag-bg);
    color: var(--color-text-primary);
    border: 1px solid var(--color-card-border);
  }

  .view-source:hover {
    background: var(--color-card-border);
  }
`;

const ExamplesIndex = defineElement("rikka-examples-index", {
  styles,
  render() {
    const titleEl = h1({}, "Examples");
    const subtitleEl = p({}, "");
    const gridEl = div({ class: "examples-grid" });

    const render = () => {
      titleEl.textContent = t(exampleLabels.examplesTitle);
      subtitleEl.textContent = t(exampleLabels.examplesSubtitle);

      gridEl.replaceChildren(
        ...examples.map(example => div(
          { class: "example-card" },
          div({ class: "example-header" },
            span({ class: "example-icon" }, example.title.split(" ")[0])
          ),
          div({ class: "example-content" },
            h3({}, example.title.substring(2).trim()),
            p({}, t(example.description)),
            div({ class: "example-features" },
              ...t(example.features).map(feature => div(
                { class: "feature-item" },
                span({ class: "feature-dot" }),
                span({}, feature)
              ))
            )
          ),
          div({ class: "example-actions" },
            a({ href: "#/examples/" + example.slug, class: "view-demo" }, t(exampleLabels.learnMore)),
            a({ href: "./examples/" + example.slug + "/index.html", target: "_blank", class: "view-source" }, t(exampleLabels.viewDemo))
          )
        ))
      );
    };

    render();
    effect(() => { locale.get(); render(); });

    return div(
      { class: "example-page" },
      titleEl,
      subtitleEl,
      gridEl
    );
  }
});

export { ExamplesIndex };
