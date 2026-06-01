import { defineElement } from "@rikka/elements";
import { css, div, h1, h2, p, pre, a } from "@rikka/dom";
import { sharedStyles, docPageStyles } from "../../shared/styles";

const styles = css`
  ${docPageStyles}
`;

export const RikkaDocSignal05 = defineElement("rikka-doc-signal-05", {
  styles,
  render() {
    return div(
      { class: "doc-page" },
      div(
        { class: "doc-header" },
        h1({ class: "doc-title" }, "Batch Updates"),
        p(
          { class: "doc-subtitle" },
          "Multiple synchronous signal updates trigger effects only once.",
        ),
      ),
      div(
        { class: "doc-section" },
        h2({ class: "section-title" }, "Automatic Batching"),
        p(
          {},
          "Rikka automatically batches synchronous signal updates using microtasks. When you set multiple signals in the same synchronous block, effects run only once after all updates are complete.",
        ),
        pre(
          { class: "code-block" },
          `const x = signal(1);
const y = signal(2);

let effectRuns = 0;
effect(() => {
  x.get();
  y.get();
  effectRuns++;
});

x.set(10);
y.set(20);
// effect runs once, not twice`,
        ),
      ),
      div(
        { class: "doc-section" },
        h2({ class: "section-title" }, "TC39 Signals Behavior"),
        p(
          {},
          "This batching behavior follows the ",
          sharedStyles.inlineCode("Signal.subtle.Watcher"),
          " semantics from the TC39 Signals proposal. Effects are scheduled via microtask and coalesce multiple notifications into a single run.",
        ),
      ),
      div(
        { class: "doc-section" },
        h2({ class: "section-title" }, "Batch vs Individual Updates"),
        sharedStyles.createPlayground(
          `// Without batching awareness:
const a = signal(0);
const b = signal(0);
let runs = 0;

effect(() => {
  a.get();
  b.get();
  runs++;
});

// These are batched automatically:
a.set(1);
b.set(1);

container.appendChild(div({},
  h2({}, 'Batch Demo'),
  p({}, 'a: ', a, ' | b: ', b),
  p({ style: { color: '#94a3b8' } }, 'Effect runs: ', runs, ' (batched, not 2)'),
  div({ style: { display: 'flex', gap: '8px', marginTop: '8px' } },
    button({ onclick: () => { a.set(a.get() + 1); b.set(b.get() + 1); } }, 'Increment Both')
  )
));`,
          "240",
          "Batch Behavior",
        ),
      ),
      div(
        { class: "doc-section" },
        h2({ class: "section-title" }, "Try It"),
        sharedStyles.createPlayground(
          `import { signal, computed, effect } from '@rikka/signal';

const a = signal(1);
const b = signal(2);
const sum = computed(() => a.get() + b.get());

let effectRuns = 0;
effect(() => {
  console.log(\`Sum: \${sum.get()}\`);
  effectRuns++;
});

console.log('Before batch:', effectRuns);

a.set(10);
b.set(20);

console.log('After batch (microtask):', effectRuns);
// Sum updates once with value 30`,
          320,
          "Batch Updates Demo",
        ),
      ),
      div(
        { class: "doc-nav" },
        a(
          { class: "nav-link prev", href: "#/docs/rikka-signal/effect" },
          "← effect()",
        ),
        a({ class: "nav-link next", href: "#/docs/rikka-dom/h" }, "h() →"),
      ),
    );
  },
});
