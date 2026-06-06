import { defineElement } from "@takanashi/rikka-elements";
import { css, div, h1, h2, p, a, span } from "@takanashi/rikka-dom";
import {sharedHelpers} from "../shared/helpers";
import {examplePageStyles} from "../shared/page-styles";

const styles = css`
  ${examplePageStyles}

  .examples-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
  }
  .example-card {
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
  .example-card::before {
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
  .example-card:hover::before {
    opacity: 1;
  }
  .example-card:hover {
    border-color: var(--color-primary);
    transform: translateY(-4px);
    box-shadow: 0 12px 35px rgba(99, 102, 241, 0.18);
  }
  .example-icon {
    font-size: 2rem;
    margin-bottom: 0.75rem;
    display: block;
  }
  .example-card h2 {
    color: var(--color-text-primary);
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }
  .example-card p {
    color: var(--color-text-secondary);
    font-size: 0.9375rem;
    line-height: 1.6;
    margin: 0 0 1rem 0;
  }
  .example-tags {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .example-tag {
    background: var(--color-tag-bg);
    color: var(--color-primary-light);
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 500;
    border: 1px solid var(--color-tag-border);
  }
`;

const examples = [
  {
    icon: "🔢",
    title: "Counter",
    desc: "A simple counter demonstrating signal and computed reactivity with real-time updates.",
    href: "#/examples/counter",
    tags: ["signal", "computed"],
  },
  {
    icon: "✅",
    title: "Todo List",
    desc: "A reactive todo list with add, toggle, delete operations and remaining count.",
    href: "#/examples/todo",
    tags: ["arrays", "computed", "events"],
  },
  {
    icon: "🎨",
    title: "Color Picker",
    desc: "RGB sliders controlling a color preview in real-time with hex output.",
    href: "#/examples/color-picker",
    tags: ["multiple signals", "computed"],
  },
  {
    icon: "📑",
    title: "Tabs",
    desc: "A tab component with reactive content switching using signals.",
    href: "#/examples/tabs",
    tags: ["conditional", "events"],
  },
  {
    icon: "🔍",
    title: "Live Search",
    desc: "A search input that filters a list in real-time as you type.",
    href: "#/examples/live-search",
    tags: ["filter", "computed", "input"],
  },
  {
    icon: "📊",
    title: "Mission Control",
    desc: "Real-time dashboard with 4 metrics updating every second, peak tracking, and threshold alerts.",
    href: "#/examples/mission-control",
    tags: ["effect", "signal", "For"],
  },
  {
    icon: "📋",
    title: "Kanban Board",
    desc: "3-column project board with drag-and-drop cards, priority colors, and stats bar.",
    href: "#/examples/kanban",
    tags: ["effect", "drag-drop", "computed"],
  },
  {
    icon: "🎨",
    title: "Token Manager",
    desc: "Design system color manager with groups, theme switching, and CSS export.",
    href: "#/examples/token-manager",
    tags: ["signal", "effect", "localStorage"],
  },
  {
    icon: "📚",
    title: "Knowledge Base",
    desc: "Search interface with facets, history, popular tags, and reactive filtering.",
    href: "#/examples/knowledge-base",
    tags: ["computed", "effect", "localStorage"],
  },
  {
    icon: "💻",
    title: "Mini IDE",
    desc: "File tree, closable tabs, editor area, and terminal simulator.",
    href: "#/examples/mini-ide",
    tags: ["signal", "effect", "For"],
  },
  {
    icon: "👥",
    title: "Collaboration",
    desc: "Team simulator with avatars, status indicators, role filtering, and live updates.",
    href: "#/examples/collaboration",
    tags: ["effect", "computed", "signal"],
  },
];

const ExamplesIndex = defineElement("rikka-examples-index", {
  styles,
  render() {
    return div(
      { class: "example-page" },
      h1({}, "Examples"),
      p(
        {},
        "Interactive examples showcasing Rikka's reactivity system in action. Click any example to see it live.",
      ),

      div(
        { class: "examples-grid" },
        ...examples.map((example) =>
          a(
            { href: example.href, class: "example-card" },
            span({ class: "example-icon" }, example.icon),
            h2({}, example.title),
            p({}, example.desc),
            div(
              { class: "example-tags" },
              ...example.tags.map((tag) => span({ class: "example-tag" }, tag)),
            ),
          ),
        ),
      ),
    );
  },
});

export { ExamplesIndex };
