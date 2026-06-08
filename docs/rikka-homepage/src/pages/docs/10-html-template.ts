import { defineElement } from "@takanashi/rikka-elements";
import { css, div, h1, h2, p, a, pre, code, ul, li } from "@takanashi/rikka-dom";
import {sharedHelpers} from "../../shared/helpers";
import {docPageStyles} from "../../shared/page-styles";
import { docContent } from "../../shared/doc-content";
import { tr } from "../../shared/i18n";
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const styles = css`
  ${docPageStyles}
`;

const DocDom10 = defineElement("rikka-doc-dom-10", {
  styles,
  render() {
    return div(
      { class: "doc-page" },
      h1({}, tr(docContent.sidebar.htmlTemplate)),
      sharedHelpers.advancedBadge("h``", docContent.htmlTemplate.advancedNote),
      p({}, tr(docContent.htmlTemplate.desc)),
      div(
        { class: "doc-content" },
        h2({}, tr(docContent.htmlTemplate.keyConcepts)),
        ul(
          li(sharedHelpers.inlineCode("h`<div>${signal}</div>`"), tr(docContent.htmlTemplate.bullet1)),
          li({}, tr(docContent.htmlTemplate.bullet2)),
          li(
            tr(docContent.htmlTemplate.bullet3),
            sharedHelpers.inlineCode("Element[]"),
            tr(docContent.htmlTemplate.bullet3End),
          ),
          li({}, tr(docContent.htmlTemplate.bullet4)),
          li({}, tr(docContent.htmlTemplate.bullet5)),
          li({}, tr(docContent.htmlTemplate.bullet6)),
          li({}, tr(docContent.htmlTemplate.bullet7)),
          li(
            tr(docContent.htmlTemplate.bullet8),
            sharedHelpers.inlineCode("${signal}"),
            tr(docContent.htmlTemplate.bullet8End),
          ),
          li(
            tr(docContent.htmlTemplate.bullet9),
            sharedHelpers.inlineCode("${signal.get()}"),
            tr(docContent.htmlTemplate.bullet9End),
          ),
        ),
        h2({}, tr(docContent.htmlTemplate.apiSignature)),
        pre(
          { class: "code-block" },
          code(
            `h(strings: TemplateStringsArray, ...values: any[]): Element[]

// Fine-grained: \${signal} creates effect, updates only text node
// Coarse-grained: \${signal.get()} resolves immediately`,
          ),
        ),
      ),
      div(
        { class: "playground-section" },
        h2({}, tr(docContent.ui.tryIt)),
        RikkaLivePlayground.h({
    code: `import { h } from '@takanashi/rikka-dom';

const name = signal("Rikka");
const count = signal(42);

function TemplateDemo() {
  return div({},
    h\`
      <div style="padding:16px;border:1px solid #ddd;
                   border-radius:8px">
        <h3>Hello, \${name}!</h3>
        <p>Count: \${count}</p>
        <p>This is rendered via the template tag</p>
      </div>
    \`
  );
}
container.appendChild(TemplateDemo());`, height: "260", title: "h`` Template"
}),
      ),
      div(
        { class: "doc-nav" },
        a(
          { href: "#/docs/@takanashi/rikka-dom/conditionals", class: "prev-link" },
          tr(docContent.htmlTemplate.prevConditionals),
        ),
        div({ class: "spacer" }),
        a(
          { href: "#/docs/@takanashi/rikka-dom/signal-interpolation", class: "next-link" },
          tr(docContent.htmlTemplate.nextSignalInterpolation),
        ),
      ),
    );
  },
});

export { DocDom10 };
