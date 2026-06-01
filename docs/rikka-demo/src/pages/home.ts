import { defineElement, css } from "@rikka/elements";
import {
  div,
  h1,
  h2,
  h3,
  h4,
  p,
  section,
  button,
  span,
  pre,
  a,
  code,
  footer,
} from "@rikka/dom";
import "@rikka/live-playground";
import { sharedStyles } from "../shared/styles";

const homeStyles = css`
  :host {
    display: block;
  }
  .home {
    padding: 0;
    max-width: 100%;
    margin: 0 auto;
  }

  .hero {
    text-align: center;
    padding: 5rem 2rem 4rem;
    background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%);
    position: relative;
    overflow: hidden;
  }
  .hero::before {
    content: "";
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 800px;
    height: 800px;
    background: radial-gradient(
      circle,
      rgba(99, 102, 241, 0.25) 0%,
      rgba(139, 92, 246, 0.15) 40%,
      transparent 70%
    );
    pointer-events: none;
    animation: pulse-glow 6s ease-in-out infinite;
  }
  @keyframes pulse-glow {
    0%,
    100% {
      opacity: 0.8;
      transform: translateX(-50%) scale(1);
    }
    50% {
      opacity: 1;
      transform: translateX(-50%) scale(1.05);
    }
  }
  .hero h1 {
    font-size: 5rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, #e2e8f0 0%, #a78bfa 50%, #6366f1 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.03em;
    position: relative;
  }
  .hero .tagline {
    font-size: 1.5rem;
    color: #6366f1;
    margin-bottom: 1.5rem;
    font-weight: 500;
  }
  .hero p {
    color: #94a3b8;
    font-size: 1.25rem;
    margin-bottom: 2.5rem;
    max-width: 750px;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.7;
  }
  .cta {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 3rem;
  }
  .cta a {
    padding: 1.25rem 2.5rem;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.25s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
  }
  .btn-primary {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    border: none;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
  }
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
  }
  .btn-secondary {
    background: transparent;
    border: 2px solid #334155;
    color: #e2e8f0;
  }
  .btn-secondary:hover {
    border-color: #6366f1;
    background: rgba(99, 102, 241, 0.1);
    transform: translateY(-2px);
  }

  .stats-bar {
    display: flex;
    justify-content: center;
    gap: 5rem;
    padding: 3rem 2rem;
    background: linear-gradient(
      180deg,
      rgba(99, 102, 241, 0.08) 0%,
      rgba(99, 102, 241, 0.03) 100%
    );
    border-top: 1px solid rgba(99, 102, 241, 0.15);
    border-bottom: 1px solid rgba(99, 102, 241, 0.15);
    position: relative;
    overflow: hidden;
  }
  .stats-bar::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 200%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.03),
      transparent
    );
    animation: shimmer 3s infinite;
  }
  @keyframes shimmer {
    0% {
      transform: translateX(-50%);
    }
    100% {
      transform: translateX(50%);
    }
  }
  .stat-item {
    text-align: center;
    transition: transform 0.3s ease;
    position: relative;
    z-index: 1;
  }
  .stat-item:hover {
    transform: scale(1.08) translateY(-4px);
  }
  .stat-value {
    font-size: 2.75rem;
    font-weight: 800;
    background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    display: block;
    position: relative;
  }
  .stat-value.loading {
    background: linear-gradient(90deg, #334155 25%, #475569 50%, #334155 75%);
    background-size: 200% 100%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: loading-shimmer 1.5s infinite;
  }
  @keyframes loading-shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
  .stat-value .tooltip {
    position: absolute;
    bottom: -1.5rem;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.6875rem;
    color: #64748b;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.2s ease;
    font-weight: 400;
    background: none;
    -webkit-text-fill-color: #64748b;
  }
  .stat-item:hover .stat-value .tooltip {
    opacity: 1;
  }
  .stat-label {
    font-size: 0.875rem;
    color: #94a3b8;
    margin-top: 0.25rem;
  }

  .section {
    padding: 5rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  .section-title {
    text-align: center;
    font-size: 2.75rem;
    color: #e2e8f0;
    margin-bottom: 1rem;
    font-weight: 700;
  }
  .section-subtitle {
    text-align: center;
    color: #94a3b8;
    font-size: 1.125rem;
    margin-bottom: 3rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.7;
  }

  .feature-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }
  .feature-card {
    background: linear-gradient(135deg, #1a1a2e 0%, #161b22 100%);
    border: 1px solid #334155;
    border-radius: 1rem;
    padding: 2rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  .feature-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #6366f1, #a855f7);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .feature-card:hover {
    border-color: #6366f1;
    transform: translateY(-4px);
    box-shadow: 0 10px 40px rgba(99, 102, 241, 0.15);
  }
  .feature-card:hover::before {
    opacity: 1;
  }
  .feature-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    display: block;
  }
  .feature-card h3 {
    font-size: 1.25rem;
    color: #e2e8f0;
    margin-bottom: 0.75rem;
    margin-top: 0;
  }
  .feature-card p {
    color: #94a3b8;
    font-size: 0.9375rem;
    margin: 0;
    line-height: 1.7;
  }

  .demo-section {
    background: #0d1117;
    padding: 5rem 2rem;
  }
  .demo-container {
    max-width: 1000px;
    margin: 0 auto;
  }

  .advantages-section {
    background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%);
    padding: 5rem 2rem;
    overflow-x: hidden;
  }
  .advantages-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  .advantage-card {
    background: #0d1117;
    border: 1px solid #334155;
    border-radius: 1rem;
    padding: 2rem;
    transition: all 0.3s ease;
    overflow: hidden;
  }
  .advantage-card:hover {
    border-color: #6366f1;
    box-shadow: 0 10px 40px rgba(99, 102, 241, 0.15);
    transform: translateY(-2px);
  }
  .advantage-card h3 {
    color: #a78bfa;
    font-size: 1.25rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .advantage-card h3::before {
    content: "✓";
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border-radius: 50%;
    font-size: 0.875rem;
    font-weight: 700;
  }
  .advantage-card p {
    color: #94a3b8;
    line-height: 1.7;
    margin-bottom: 1.5rem;
  }
  .advantage-card .code-block {
    background: #161b22;
    border: 1px solid #334155;
    border-radius: 0.5rem;
    padding: 1rem;
    padding-top: 2.5rem;
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 0.8125rem;
    line-height: 1.6;
    color: #e6edf3;
    overflow-x: auto;
    position: relative;
    word-wrap: break-word;
    white-space: pre-wrap;
    max-width: 100%;
    box-sizing: border-box;
  }
  .advantage-card .code-block::before {
    content: "Rikka";
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    font-size: 0.6875rem;
    color: #6366f1;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .tags-section {
    padding: 4rem 2rem;
    text-align: center;
    background: rgba(99, 102, 241, 0.03);
  }
  .tags-cloud {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
    max-width: 900px;
    margin: 0 auto;
  }
  .tag {
    padding: 0.625rem 1.25rem;
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.25);
    border-radius: 2rem;
    font-size: 0.9375rem;
    color: #e2e8f0;
    transition: all 0.25s ease;
    cursor: default;
  }
  .tag:hover {
    background: rgba(99, 102, 241, 0.2);
    border-color: #6366f1;
    transform: translateY(-2px);
  }

  .quick-start {
    padding: 5rem 2rem;
    max-width: 900px;
    margin: 0 auto;
  }
  .steps {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    margin-bottom: 2.5rem;
  }
  .step {
    display: flex;
    gap: 1.5rem;
    align-items: flex-start;
    padding: 1.5rem;
    background: linear-gradient(135deg, #1a1a2e 0%, #161b22 100%);
    border: 1px solid #334155;
    border-radius: 1rem;
    transition: all 0.3s ease;
  }
  .step:hover {
    border-color: #6366f1;
    transform: translateX(5px);
  }
  .step-number {
    flex-shrink: 0;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1.125rem;
  }
  .step-content h4 {
    color: #e2e8f0;
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
  }
  .step-content p {
    color: #94a3b8;
    margin: 0;
    font-size: 1rem;
    line-height: 1.6;
  }
  .step-content code {
    background: rgba(99, 102, 241, 0.15);
    padding: 0.2rem 0.5rem;
    border-radius: 0.25rem;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.875rem;
    color: #a5b4fc;
  }
  .code-block {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.875rem;
    line-height: 1.8;
    background: #0d1117;
    border: 1px solid #334155;
    border-radius: 1rem;
    padding: 2rem;
    padding-top: 3rem;
    overflow-x: auto;
    white-space: pre;
    color: #e6edf3;
    position: relative;
  }
  .code-block::before {
    content: "Click to copy";
    position: absolute;
    top: 0.75rem;
    right: 1rem;
    font-size: 0.75rem;
    color: #64748b;
    background: rgba(99, 102, 241, 0.1);
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    border: 1px solid rgba(99, 102, 241, 0.2);
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .code-block:hover::before {
    background: rgba(99, 102, 241, 0.2);
    border-color: #6366f1;
    color: #a5b4fc;
  }

  .packages-section {
    padding: 5rem 2rem;
    background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%);
  }
  .package-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    max-width: 1100px;
    margin: 0 auto;
  }
  .package-card {
    background: linear-gradient(135deg, #1a1a2e 0%, #161b22 100%);
    border: 1px solid #334155;
    border-radius: 1rem;
    padding: 2rem;
    transition: all 0.3s ease;
    position: relative;
  }
  .package-card::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 50%;
    height: 3px;
    background: linear-gradient(90deg, transparent, #6366f1, transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .package-card:hover {
    border-color: #6366f1;
    transform: translateY(-4px);
    box-shadow: 0 10px 40px rgba(99, 102, 241, 0.15);
  }
  .package-card:hover::after {
    opacity: 1;
  }
  .package-card h3 {
    font-size: 1.375rem;
    color: #6366f1;
    margin-bottom: 1rem;
    margin-top: 0;
  }
  .package-card p {
    color: #94a3b8;
    font-size: 0.9375rem;
    margin: 0;
    line-height: 1.7;
  }
  .package-card .npm {
    margin-top: 1.5rem;
    padding: 0.75rem 1rem;
    background: #0d1117;
    border-radius: 0.5rem;
    font-family: "JetBrains Mono", monospace;
    font-size: 0.8125rem;
    color: #a5b4fc;
  }

  .footer {
    padding: 3rem 2rem;
    background: #0d1117;
    border-top: 1px solid #334155;
    text-align: center;
  }
  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer-logo {
    font-size: 1.5rem;
    font-weight: 700;
    color: #6366f1;
  }
  .footer-links {
    display: flex;
    gap: 2rem;
  }
  .footer-links a {
    color: #94a3b8;
    text-decoration: none;
    font-size: 0.9375rem;
    transition: color 0.2s;
  }
  .footer-links a:hover {
    color: #e2e8f0;
  }
  .footer-copy {
    color: #64748b;
    font-size: 0.875rem;
  }

  @media (max-width: 768px) {
    .feature-grid,
    .package-grid {
      grid-template-columns: 1fr;
    }
    .advantages-grid {
      grid-template-columns: 1fr;
    }
    .hero h1 {
      font-size: 2.5rem;
    }
    .hero .tagline {
      font-size: 1.25rem;
    }
    .hero p {
      font-size: 1rem;
      max-width: 100%;
    }
    .stats-bar {
      flex-direction: column;
      gap: 2rem;
      padding: 2rem 1rem;
    }
    .stat-value {
      font-size: 2rem;
    }
    .section-title {
      font-size: 2rem;
    }
    .section-subtitle {
      font-size: 1rem;
    }
    .cta {
      flex-direction: column;
      align-items: center;
    }
    .cta a {
      width: 100%;
      max-width: 280px;
      justify-content: center;
    }
    .step {
      flex-direction: column;
      text-align: center;
      align-items: center;
    }
    .footer-content {
      flex-direction: column;
      gap: 1.5rem;
    }
    .section-title {
      font-size: 2rem;
    }
  }
`;

const HomePage = defineElement("rikka-home", {
  styles: homeStyles,
  render() {
    return div(
      { class: "home" },
      section(
        { class: "hero" },
        h1("Project Rikka"),
        div({ class: "tagline" }, "The Modern Web Toolkit"),
        p(
          "Native Web Components with fine-grained reactivity. No virtual DOM, no framework overhead — just standards-based, LLM-friendly code.",
        ),
        div(
          { class: "cta" },
          a({ href: "#/docs", class: "btn-primary" }, "Get Started"),
          a({ href: "#/examples", class: "btn-secondary" }, "View Examples"),
        ),
      ),
      div(
        { class: "stats-bar" },
        div(
          { class: "stat-item" },
          span({ class: "stat-value" }, "~8KB"),
          span({ class: "stat-label" }, "Minified + Gzipped"),
        ),
        div(
          { class: "stat-item" },
          span({ class: "stat-value" }, "0"),
          span({ class: "stat-label" }, "Virtual DOM Overhead"),
        ),
        div(
          { class: "stat-item" },
          span({ class: "stat-value" }, "TC39"),
          span({ class: "stat-label" }, "Standards Based"),
        ),
        div(
          { class: "stat-item" },
          span({ class: "stat-value" }, "100%"),
          span({ class: "stat-label" }, "TypeScript"),
        ),
      ),
      section(
        { class: "section" },
        h2({ class: "section-title" }, "Why Rikka?"),
        p(
          { class: "section-subtitle" },
          "Built for the modern web — simple, fast, and predictable",
        ),
        div(
          { class: "feature-grid" },
          div(
            { class: "feature-card" },
            span({ class: "feature-icon" }, "🎯"),
            h3("Fine-Grained Reactivity"),
            p(
              "h() runs once. Signals drive surgical DOM updates. No virtual DOM diffing, no unnecessary re-renders.",
            ),
          ),
          div(
            { class: "feature-card" },
            span({ class: "feature-icon" }, "🧠"),
            h3("LLM Friendly"),
            p(
              "Native HTML/CSS/JS patterns are more predictable for AI code generation than complex framework abstractions.",
            ),
          ),
          div(
            { class: "feature-card" },
            span({ class: "feature-icon" }, "📦"),
            h3("Zero Runtime"),
            p(
              "No framework runtime in your bundle. Direct browser APIs with tree-shakeable packages.",
            ),
          ),
          div(
            { class: "feature-card" },
            span({ class: "feature-icon" }, "🎨"),
            h3("Template System"),
            p(
              "css and html tag templates with slots. Declarative, reactive, and type-safe styling.",
            ),
          ),
          div(
            { class: "feature-card" },
            span({ class: "feature-icon" }, "🔒"),
            h3("Type Safe"),
            p(
              "Full TypeScript inference for signals and DOM helpers. Catch errors at compile time.",
            ),
          ),
          div(
            { class: "feature-card" },
            span({ class: "feature-icon" }, "🚀"),
            h3("Web Standards"),
            p(
              "Built on Custom Elements, Shadow DOM, and TC39 Signals Proposal. Future-proof your code.",
            ),
          ),
        ),
      ),
      section(
        { class: "demo-section" },
        div(
          { class: "demo-container" },
          h2({ class: "section-title" }, "Try It Live"),
          p(
            { class: "section-subtitle" },
            "Edit the code below and see the result instantly",
          ),
          sharedStyles.createPlayground(
            `// Try editing this code!
const count = signal(0);
const doubled = computed(() => count.get() * 2);

// Create UI - signals automatically update when passed as children
const app = div(
  { style: { display: 'flex', alignItems: 'center', gap: '1rem', fontFamily: 'system-ui', padding: '1rem' } },
  button({
    onclick: () => count.set(count.get() + 1),
    style: { padding: '0.5rem 1rem', fontSize: '1rem', cursor: 'pointer', background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.25rem' }
  }, '+'),
  span({ style: { fontSize: '1.1rem', color: '#e2e8f0' } }, 'Count: ', count, ' (doubled: ', doubled, ')')
);

container.appendChild(app);`,
            "180",
            "Interactive Counter",
          ),
        ),
      ),
      section(
        { class: "advantages-section" },
        h2({ class: "section-title" }, "Why Choose Rikka Over React?"),
        div(
          { class: "advantages-grid" },
          div(
            { class: "advantage-card" },
            h3("No Hook Rules"),
            p(
              "Signals can be used anywhere — inside loops, conditionals, callbacks, or even outside components. No more hook ordering restrictions.",
            ),
            pre(
              { class: "code-block" },
              `// ✅ Rikka: Use signals freely
if (condition) {
  const count = signal(0);
}

function helper() {
  const data = signal(null);  // OK!
}

// ❌ React: Hook rules violation
if (condition) {
  const [count, setCount] = useState(0); // Error!
}`,
            ),
          ),
          div(
            { class: "advantage-card" },
            h3("No Build Step Required"),
            p(
              "h() function calls work directly in the browser. No JSX compiler, no webpack config, no transpilation needed.",
            ),
            pre(
              { class: "code-block" },
              `// ✅ Rikka: Runs in browser
const btn = button(
  { onclick: () => alert('Hi!') },
  'Click me'
);
document.body.appendChild(btn);

// ❌ React: Requires build step
// Must compile JSX → React.createElement()
// Needs bundler (webpack/vite)`,
            ),
          ),
          div(
            { class: "advantage-card" },
            h3("Smaller Bundle Size"),
            p(
              "Tree-shakeable packages with zero runtime overhead. Only ship what you use — no virtual DOM diffing algorithm included.",
            ),
            pre(
              { class: "code-block" },
              `// ✅ Rikka: Measured live from npm
// Total: ~8-12KB (all 3 packages, min+gzip)
import { signal } from '@rikka/signal';     // ~2-4KB
import { div, button } from '@rikka/dom';    // ~3-5KB
import { defineElement } from '@rikka/elements'; // ~3-4KB

// ❌ React: ~42KB (min+gzip)
// + ReactDOM: ~130KB
// Total: ~172KB minimum (42x larger!)`,
            ),
          ),
          div(
            { class: "advantage-card" },
            h3("Fine-Grained Updates"),
            p(
              "Signals update only the exact DOM nodes that changed. No component re-renders, no virtual DOM diffing — surgical precision.",
            ),
            pre(
              { class: "code-block" },
              `// ✅ Rikka: Updates single text node
const name = signal('Alice');
span({}, 'Hello ', name);
// Only this text node updates on change

// ❌ React: Re-renders entire component
// Virtual DOM diff → patch → commit
// Even for simple text changes`,
            ),
          ),
        ),
      ),
      section(
        { class: "tags-section" },
        h2({ class: "section-title" }, "Everything You Need"),
        div(
          { class: "tags-cloud" },
          ...[
            "Signals",
            "Computed",
            "Effects",
            "Custom Elements",
            "Shadow DOM",
            "Templates",
            "Fine-Grained Updates",
            "TypeScript",
            "Decorators",
            "Reactive Lists",
            "No VDOM",
            "Tree Shakable",
          ].map((t) => span({ class: "tag" }, t)),
        ),
      ),
      section(
        { class: "quick-start" },
        h2({ class: "section-title" }, "Quick Start"),
        div(
          { class: "steps" },
          div(
            { class: "step" },
            div({ class: "step-number" }, "1"),
            div(
              { class: "step-content" },
              h4("Install"),
              p("npm install @rikka/elements @rikka/dom @rikka/signal"),
            ),
          ),
          div(
            { class: "step" },
            div({ class: "step-number" }, "2"),
            div(
              { class: "step-content" },
              h4("Define"),
              p(
                "Use ",
                code("h()"),
                ", ",
                code("div()"),
                ", and signals to build your UI. ",
                code("defineElement"),
                " for reusable components (optional).",
              ),
            ),
          ),
          div(
            { class: "step" },
            div({ class: "step-number" }, "3"),
            div(
              { class: "step-content" },
              h4("Render"),
              p("h() runs once — Signals handle all DOM updates automatically"),
            ),
          ),
        ),
        sharedStyles.createPlayground(
          `import { signal, computed } from '@rikka/signal';
import { div, span, button } from '@rikka/dom';

const count = signal(0);
const text = computed(() => \`Count: \${count.get()}\`);

const app = div(
  { style: { display: 'inline-flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'system-ui' } },
  span({ style: { fontSize: '1.1rem', color: '#e2e8f0' } }, text),
  button({
    onclick: () => count.set(count.get() + 1),
    style: { padding: '0.4rem 0.8rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }
  }, '+')
);

container.appendChild(app);`,
          "220",
          "Quick Example",
        ),
      ),
      section(
        { class: "packages-section" },
        h2(
          { class: "section-title" },
          "Three Packages, Infinite Possibilities",
        ),
        div(
          { class: "package-grid" },
          div(
            { class: "package-card" },
            h3("@rikka/elements"),
            p(
              "Define Custom Elements with Shadow DOM, attributes, events, and styles. Includes css/html tag templates.",
            ),
            div({ class: "npm" }, "npm install @rikka/elements"),
          ),
          div(
            { class: "package-card" },
            h3("@rikka/dom"),
            p(
              "Type-safe h() and tag factories. For() for reactive lists. Signals as children for fine-grained updates.",
            ),
            div({ class: "npm" }, "npm install @rikka/dom"),
          ),
          div(
            { class: "package-card" },
            h3("@rikka/signal"),
            p(
              "TC39 Signals polyfill. signal(), computed(), and effect() for reactivity. Standards-based primitives.",
            ),
            div({ class: "npm" }, "npm install @rikka/signal"),
          ),
        ),
      ),
      footer(
        { class: "footer" },
        div(
          { class: "footer-content" },
          div({ class: "footer-logo" }, "Rikka"),
          div(
            { class: "footer-links" },
            a({ href: "#/docs" }, "Docs"),
            a({ href: "#/examples" }, "Examples"),
            a(
              {
                href: "https://github.com/rikka-org/rikka",
                target: "_blank",
                rel: "noopener noreferrer",
              },
              "GitHub",
            ),
          ),
          div(
            { class: "footer-copy" },
            `© ${new Date().getFullYear()} Project Rikka. MIT License.`,
          ),
        ),
      ),
    );
  },
});

export { HomePage };
