import { defineElement } from '@takanashi/rikka-elements';
import { css, div, h1, h2, p, a, ul, li } from '@takanashi/rikka-dom';
import {sharedHelpers} from '../../shared/helpers';
import {docPageStyles} from '../../shared/page-styles';
import { docContent } from '../../shared/doc-content';
import { tr } from '../../shared/i18n';
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const styles = css`${docPageStyles}`;

const DocDom11 = defineElement('rikka-doc-dom-11', {
  styles,
  render() {
    return div({ class: 'doc-page' },
      h1({}, tr(docContent.sidebar.signalInterpolation)),
      sharedHelpers.advancedBadge("Signal Interpolation", docContent.signalInterpolation.advancedNote),
      p({}, tr(docContent.signalInterpolation.desc)),
      div({ class: 'doc-content' },
        h2({}, tr(docContent.signalInterpolation.threeModes)),
        ul(
          li(sharedHelpers.inlineCode('${signal}'), tr(docContent.signalInterpolation.mode1)),
          li(sharedHelpers.inlineCode('signal.get() outside computed'), tr(docContent.signalInterpolation.mode2)),
          li(sharedHelpers.inlineCode('computed(() => { ... signal.get() ... })'), tr(docContent.signalInterpolation.mode3)),
        ),
        h2({}, tr(docContent.signalInterpolation.liveComparison)),
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
        a({ href: '#/docs/@takanashi/rikka-dom/html-template', class: 'prev-link' },
          tr(docContent.signalInterpolation.prevHtmlTemplate),
        ),
        div({ class: 'spacer' }),
        a({ href: '#/docs/@takanashi/rikka-dom/css-template', class: 'next-link' },
          tr(docContent.signalInterpolation.nextCssTemplate),
        ),
      ),
    );
  }
});

export { DocDom11 };
