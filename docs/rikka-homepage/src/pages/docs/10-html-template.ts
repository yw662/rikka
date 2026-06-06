import { defineElement } from "@takanashi/rikka-elements";
import { css, div, h1, h2, p, a, pre, code, ul, li } from "@takanashi/rikka-dom";
import {sharedHelpers} from "../../shared/helpers";
import {docPageStyles} from "../../shared/page-styles";
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const styles = css`
  ${docPageStyles}
`;

const DocDom10 = defineElement("rikka-doc-dom-10", {
  styles,
  render() {
    return div(
      { class: "doc-page" },
      h1("h``"),
      sharedHelpers.advancedBadge("h``", "is an advanced alternative to h(). For most use cases, h() with tag helpers is simpler and more type-safe."),
      p(
        "Tagged template literal on the h function from rikka-dom. Creates DOM elements from HTML template strings with signal interpolation support.",
      ),
      div(
        { class: "doc-content" },
        h2("Key Concepts"),
        ul(
          li(
            sharedHelpers.inlineCode("h`<div>${signal}</div>`"),
            " — Embed signals directly in template strings for fine-grained updates.",
          ),
          li("Comment-based slot system for efficient DOM patching."),
          li("Returns ", sharedHelpers.inlineCode("Element[]"), "."),
          li("Supports nested templates and mixed content."),
          li(
            "Signals in text content update in-place without rebuilding the entire template.",
          ),
          li("Signals in attribute values also get reactive bindings."),
          li("Element values can be interpolated as children."),
          li(
            "Fine-grained: ",
            sharedHelpers.inlineCode("${signal}"),
            " creates effect, updates only text node.",
          ),
          li(
            "Coarse-grained: ",
            sharedHelpers.inlineCode("${signal.get()}"),
            " resolves immediately.",
          ),
        ),
        h2("API Signature"),
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
        h2("Try It"),
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
          "\u2190 Conditionals",
        ),
        div({ class: "spacer" }),
        a(
          {
            href: "#/docs/@takanashi/rikka-dom/signal-interpolation",
            class: "next-link",
          },
          "Signal Interpolation \u2192",
        ),
      ),
    );
  },
});

export { DocDom10 };
