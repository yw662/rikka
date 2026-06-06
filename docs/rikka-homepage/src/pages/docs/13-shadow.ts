import { defineElement } from "@takanashi/rikka-elements";
import { css, div, h1, h2, p, a, pre, code } from "@takanashi/rikka-dom";
import {sharedHelpers} from "../../shared/helpers";
import {docPageStyles} from "../../shared/page-styles";
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const styles = css`
  ${docPageStyles}
`;

const DocElements13 = defineElement("rikka-doc-elements-13", {
  styles,
  render() {
    return div(
      { class: "doc-page" },
      h1("Shadow DOM"),
      sharedHelpers.advancedBadge("Shadow DOM", "is part of @takanashi/rikka-elements, an advanced feature. Simple apps don't need custom elements or Shadow DOM."),
      p("Style encapsulation with Shadow DOM for custom elements."),
      div(
        { class: "api-signature" },
        `config.shadow?: ShadowRootInit | false  // default: { mode: 'open' }`,
      ),
      div(
        { class: "doc-content" },
        h2("Default Behavior"),
        p(
          sharedHelpers.inlineCode("defineElement"),
          " creates an open shadow root by default. Access it via ",
          sharedHelpers.inlineCode("this.shadowRoot"),
          " in the setup function.",
        ),
        RikkaLivePlayground.h({
    code: `const MyElement = defineElement('my-element', {
  render() {
    return div({}, 'Content inside shadow DOM');
  }
});

const el = document.createElement('my-element');
container.appendChild(div({},
  h2({}, 'Shadow DOM Demo'),
  el,
  p({ style: { marginTop: '8px', color: '#94a3b8' } }, 'This element has encapsulated styles.')
));`, height: "180", title: "Shadow DOM Basics"
}),
        h2("Shadow Options"),
        p(
          "Configure or disable shadow DOM with the ",
          sharedHelpers.inlineCode("shadow"),
          " option:",
        ),
        pre(
          { class: "code-block" },
          code(`defineElement('my-element', { shadow: { mode: 'open' } });   // default
defineElement('my-element', { shadow: { mode: 'closed' } });
defineElement('my-element', { shadow: false });               // no shadow DOM`),
        ),
        h2("Encapsulation"),
        p(
          "Styles defined inside Shadow DOM do not leak out, and external styles do not penetrate in. This provides true component isolation.",
        ),
      ),
      div(
        { class: "playground-section" },
        h2("Try It"),
        RikkaLivePlayground.h({
    code: `const ShadowDemo = defineElement('shadow-demo', {
  styles: css\`
    .box {
      padding: 20px;
      border-radius: 8px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-family: system-ui;
    }
  \`,
  render() {
    return div({ class: 'box' }, 'Shadow DOM content - styles encapsulated!');
  }
});

const el = document.createElement('shadow-demo');
container.appendChild(el);
container.appendChild(div({ style: { marginTop: '16px', color: '#94a3b8' } },
  'This text is outside shadow DOM. The gradient styles stay inside.'));`, height: "200", title: "Shadow DOM Encapsulation"
}),
      ),
      div(
        { class: "doc-nav" },
        a(
          { href: "#/docs/@takanashi/rikka-elements/define-element", class: "prev-link" },
          "\u2190 defineElement",
        ),
        div({ class: "spacer" }),
        a(
          { href: "#/docs/@takanashi/rikka-elements/adopt-style", class: "next-link" },
          "adoptStyle \u2192",
        ),
      ),
    );
  },
});

export { DocElements13 };
