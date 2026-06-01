import { defineElement, css } from @rikka/elements;
import { div, h1, h2, p, a } from @rikka/dom;
import { sharedStyles, examplePageStyles } from "../../shared/styles";

const styles = css`
  ${examplePageStyles}
`;

const counterCode = `const count = signal(0);
const doubled = computed(() => count.get() * 2);

const app = div(
  { style: { textAlign: 'center', padding: '2rem' } },
  h1({ style: { color: '#e2e8f0', marginBottom: '1rem' } }, 'Counter'),
  div({ style: { fontSize: '3rem', color: '#6366f1', marginBottom: '0.5rem' } }, count),
  div({ style: { fontSize: '1.25rem', color: '#94a3b8', marginBottom: '1.5rem' } }, 'Doubled: ', doubled),
  div({ style: { display: 'flex', gap: '0.5rem', justifyContent: 'center' } },
    button({ onclick: () => count.set(count.get() - 1), style: { padding: '0.75rem 1.5rem', fontSize: '1.25rem', background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' } }, '-'),
    button({ onclick: () => count.set(0), style: { padding: '0.75rem 1.5rem', fontSize: '1rem', background: '#1a1a2e', color: '#94a3b8', border: '1px solid #334155', borderRadius: '0.5rem', cursor: 'pointer' } }, 'Reset'),
    button({ onclick: () => count.set(count.get() + 1), style: { padding: '0.75rem 1.5rem', fontSize: '1.25rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' } }, '+')
  )
);

container.appendChild(app);`;

const ExampleCounter = defineElement("rikka-example-counter", {
  styles,
  render() {
    return div(
      { class: "example-page" },
      h1("Counter"),
      p("A simple counter demonstrating signal and computed."),
      div(
        { class: "playground-container" },
        sharedStyles.createPlayground(counterCode, "280", "Counter Example"),
      ),
      div(
        { class: "explanation" },
        h2("Key Concepts"),
        p(
          sharedStyles.inlineCode("signal(0)"),
          " creates a reactive state container with initial value 0.",
        ),
        p(
          sharedStyles.inlineCode("computed(() => ...)"),
          " creates a derived value that automatically updates when dependencies change.",
        ),
        p(
          "Pass signals directly to DOM helpers for automatic reactivity — no manual subscription needed.",
        ),
        p("Click the buttons to see fine-grained updates in action."),
      ),
      div(
        { class: "example-nav" },
        a({ href: "#/examples", class: "prev-link" }, "\u2190 Examples"),
        div({ class: "spacer" }),
        a({ href: "#/examples/todo", class: "next-link" }, "Todo List \u2192"),
      ),
    );
  },
});

export { ExampleCounter };
