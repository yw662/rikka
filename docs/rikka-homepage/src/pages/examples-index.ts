import { defineElement } from "@takanashi/rikka-elements";
import { div, h1, h2, h3, p, a, span, css } from "@takanashi/rikka-dom";
import { examplePageStyles } from "../shared/page-styles";

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
    font-size: 40px;
    line-height: 1;
  }

  .example-meta {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .example-tag {
    background: var(--color-tag-bg);
    color: var(--color-primary-light);
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid var(--color-tag-border);
  }

  .example-content h3 {
    color: var(--color-text-primary);
    font-size: 1.25rem;
    margin-bottom: 8px;
    font-weight: 700;
  }

  .example-content p {
    color: var(--color-text-secondary);
    font-size: 0.95rem;
    line-height: 1.6;
    margin-bottom: 16px;
  }

  .example-features {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-bottom: 16px;
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    color: var(--color-text-secondary);
  }

  .feature-dot {
    width: 8px;
    height: 8px;
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

const examples = [
  {
    slug: "pomodoro-timer",
    title: "🍅 Pomodoro Timer",
    description: "A beautiful productivity-focused Pomodoro timer with session tracking, animated progress ring, and Web Audio API notifications.",
    tags: ["Web Components", "Signals", "Effects"],
    features: ["Timer Modes", "Progress Ring", "Session Stats"]
  },
  {
    slug: "bookmark-manager",
    title: "📌 Bookmark Manager",
    description: "Comprehensive read-it-later application with instant search, smart tag system, and automatic localStorage persistence.",
    tags: ["LocalStorage", "Filtering", "CRUD"],
    features: ["Search & Filter", "Tag System", "Auto Save"]
  },
  {
    slug: "code-editor",
    title: "💻 Code Editor",
    description: "Full-featured browser IDE with virtual file system, multi-tab editing, live preview, and integrated console capture.",
    tags: ["Iframe", "Tabs", "Live Preview"],
    features: ["File System", "Tabs UI", "Console Capture"]
  },
  {
    slug: "finance-tracker",
    title: "💰 Finance Tracker",
    description: "Sophisticated personal finance app with transaction management, real-time analytics, and reactive CSS-based visualizations.",
    tags: ["Charting", "Analytics", "Vite"],
    features: ["Income/Expense", "Category Stats", "Persistence"]
  }
];

const ExamplesIndex = defineElement("rikka-examples-index", {
  styles,
  render() {
    return div(
      { class: "example-page" },
      h1({}, "Examples"),
      p({}, "Complete, real-world applications built with Rikka through vibe coding. Each example is a standalone project you can explore, run, and learn from."),
      div({ class: "examples-grid" },
        ...examples.map(example => div(
          { class: "example-card" },
          div({ class: "example-header" },
            span({ class: "example-icon" }, example.title.split(" ")[0]),
            div({ class: "example-meta" },
              ...example.tags.map(tag => span({ class: "example-tag" }, tag))
            )
          ),
          div({ class: "example-content" },
            h3({}, example.title.substring(2).trim()),
            p({}, example.description),
            div({ class: "example-features" },
              ...example.features.map(feature => div(
                { class: "feature-item" },
                span({ class: "feature-dot" }),
                span({}, feature)
              ))
            )
          ),
          div({ class: "example-actions" },
            a({ href: "#/examples/" + example.slug, class: "view-demo" }, "Learn More"),
            a({ href: "./examples/" + example.slug + "/index.html", target: "_blank", class: "view-source" }, "View")
          )
        ))
      )
    );
  }
});

export { ExamplesIndex };
