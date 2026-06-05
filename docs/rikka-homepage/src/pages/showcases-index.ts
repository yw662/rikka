import { defineElement } from "@rikka/elements";
import { css, div, h1, h2, p, a, span } from "@rikka/dom";
import { sharedStyles, examplePageStyles } from "../shared/styles";

const styles = css`
  ${examplePageStyles}

  .showcases-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
  }
  .showcase-card {
    background: var(--color-card-bg);
    border: 1px solid var(--color-card-border);
    border-radius: 0.75rem;
    padding: 1.5rem;
    transition: all 0.3s ease;
    text-decoration: none;
    color: inherit;
    display: block;
    position: relative;
    overflow: hidden;
  }
  .showcase-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--color-primary), var(--color-secondary), var(--color-primary));
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .showcase-card:hover::before {
    opacity: 1;
  }
  .showcase-card:hover {
    border-color: var(--color-primary);
    transform: translateY(-4px);
    box-shadow: 0 12px 35px rgba(99, 102, 241, 0.18);
  }
  .showcase-icon {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
    display: block;
  }
  .showcase-card h2 {
    color: var(--color-text-primary);
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }
  .showcase-card p {
    color: var(--color-text-secondary);
    font-size: 0.9375rem;
    line-height: 1.6;
    margin: 0 0 1rem 0;
  }
  .showcase-learn {
    color: var(--color-primary-light);
    font-size: 0.8125rem;
    line-height: 1.5;
    margin: 0 0 1rem 0;
    padding: 0.625rem 0.875rem;
    background: var(--color-showcase-learn-bg);
    border-left: 3px solid var(--color-primary);
    border-radius: 0 0.375rem 0.375rem 0;
  }
  .showcase-learn-label {
    color: var(--color-primary-light);
    font-weight: 600;
    margin-right: 0.25rem;
  }
  .showcase-tags {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .showcase-tag {
    background: var(--color-tag-bg);
    color: var(--color-primary-light);
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 500;
    border: 1px solid var(--color-tag-border);
  }
  .showcase-badge {
    background: rgba(34, 197, 94, 0.12);
    color: #16a34a;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 500;
    border: 1px solid rgba(34, 197, 94, 0.25);
  }
`;

const showcases = [
  {
    icon: "\u{1F516}",
    title: "Bookmark Manager",
    desc: 'A "Read Later" app with search, tag filtering, and auto-persistence — the canonical pattern for building CRUD apps with Rikka.',
    learn:
      "How to structure signals for nested arrays, derive filtered views with computed(), auto-save to localStorage with effect(), and split your UI into independent custom elements.",
    href: "#/showcases/bookmark-manager",
    tags: ["signal", "computed", "effect", "defineElement", "For", "Show"],
    badge: "Web Components",
  },
  {
    icon: "\u{1F4BB}",
    title: "Code Editor",
    desc: "A VS Code-style IDE with file tree, tabs, live iframe preview, and console panel — learn how to wire many reactive pieces into one cohesive app.",
    learn:
      "How to manage multi-file state, synchronize an iframe via effect(), drive CSS custom properties from signals for theming, and compose complex layouts from fine-grained reactivity.",
    href: "#/showcases/code-editor",
    tags: ["signal", "computed", "effect", "css", "defineElement"],
    badge: "Web Components",
  },
  {
    icon: "\u{1F4B0}",
    title: "Finance Tracker",
    desc: "A finance dashboard with transaction CRUD, live statistics, and a pure-CSS bar chart — the same app built without defineElement, using only functions and signals.",
    learn:
      "How to use the functional component style, build signal-driven visualizations without a chart library, and handle the full CRUD lifecycle with signal updates.",
    href: "#/showcases/finance-tracker",
    tags: ["signal", "computed", "effect", "When"],
    badge: "Functional",
  },
];

const ShowcasesIndex = defineElement("rikka-showcases-index", {
  styles,
  render() {
    return div(
      { class: "example-page" },
      h1({}, "Showcases"),
      p(
        {},
        "Full applications that teach you how to structure real projects with Rikka. Each showcase walks through the reactive data flow, component architecture, and the specific Rikka APIs that make it work.",
      ),

      div(
        { class: "showcases-grid" },
        ...showcases.map((showcase) =>
          a(
            { href: showcase.href, class: "showcase-card" },
            span({ class: "showcase-icon" }, showcase.icon),
            h2({}, showcase.title),
            p({}, showcase.desc),
            p(
              { class: "showcase-learn" },
              span({ class: "showcase-learn-label" }, "You will learn: "),
              showcase.learn,
            ),
            div(
              { class: "showcase-tags" },
              span({ class: "showcase-badge" }, showcase.badge),
              ...showcase.tags.map((tag) =>
                span({ class: "showcase-tag" }, tag),
              ),
            ),
          ),
        ),
      ),
    );
  },
});

export { ShowcasesIndex };
