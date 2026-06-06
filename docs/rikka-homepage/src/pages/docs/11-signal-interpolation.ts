import { defineElement } from '@takanashi/rikka-elements';
import { css, div, h1, h2, p, a, ul, li } from '@takanashi/rikka-dom';
import {sharedHelpers} from '../../shared/helpers';
import {docPageStyles} from '../../shared/page-styles';
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const styles = css`${docPageStyles}`;

const DocDom11 = defineElement('rikka-doc-dom-11', {
  styles,
  render() {
    return div({ class: 'doc-page' },
      h1('Signal Interpolation'),
      sharedHelpers.advancedBadge("Signal Interpolation", "is an advanced topic. Understanding fine-grained vs coarse-grained updates is only needed when optimizing performance."),
      p('How signals behave differently depending on how you use them in templates.'),
      div({ class: 'doc-content' },
        h2('Three Modes'),
        ul(
          li(sharedHelpers.inlineCode('${signal}'), ' — Fine-grained: signal passed as a child. Only the text node updates. Focus is preserved.'),
          li(sharedHelpers.inlineCode('signal.get() outside computed'), ' — Loses reactivity entirely. The value is read once and never updates.'),
          li(sharedHelpers.inlineCode('computed(() => { ... signal.get() ... })'), ' — Coarse-grained: signal.get() inside computed creates a dependency. When the signal changes, computed re-executes and rebuilds the entire DOM subtree.'),
        ),
        h2('Live Comparison'),
        RikkaLivePlayground.h({
    code: `// Three signals, three different behaviors
const fine = signal("Alice");
const lost = signal("Bob");
const coarse = signal("Carol");

// Coarse-grained: computed tracks coarse.get() dependency
// When coarse changes, computed re-executes → entire section rebuilt
const coarseSection = computed(() =>
  section({ style: { background: "#1a1a2e", padding: "12px", borderRadius: "8px" } },
    h4({}, "Coarse-grained (computed)"),
    p({}, "Type here — coarse.get() is tracked, so computed re-runs on each keystroke:"),
    input({ value: coarse }),
    p({}, "Hello, " + coarse.get() + "!")
  )
);

container.appendChild(div({ style: { display: "flex", flexDirection: "column", gap: "16px" } },
  // 1. Fine-grained: signal as child
  section({ style: { background: "#0d1117", padding: "12px", borderRadius: "8px", border: "1px solid #30363d" } },
    h4({}, "1. Fine-grained (\${signal})"),
    p({}, "Type in input, then click button below. Cursor stays in input."),
    input({ value: fine }),
    p({}, "Hello, ", fine, "!"),
    button({ onclick: () => fine.set(fine.get() + "x") }, "Append 'x'")
  ),

  // 2. Lost reactivity: .get() outside computed
  section({ style: { background: "#0d1117", padding: "12px", borderRadius: "8px", border: "1px solid #30363d" } },
    h4({}, "2. Lost Reactivity (signal.get() outside computed)"),
    p({}, "Type in input — the display below will NEVER update:"),
    input({ value: lost }),
    p({}, "Hello, " + lost.get() + "! (static, never changes)")
  ),

  // 3. Coarse-grained
  coarseSection
));`, height: '420', title: 'Signal Interpolation Modes'
}),
      ),
      div({ class: 'doc-nav' },
        a({ href: '#/docs/@takanashi/rikka-dom/html-template', class: 'prev-link' }, '\u2190 h\`\`'),
        div({ class: 'spacer' }),
        a({ href: '#/docs/@takanashi/rikka-dom/css-template', class: 'next-link' }, 'css\`\` \u2192'),
      ),
    );
  }
});

export { DocDom11 };
