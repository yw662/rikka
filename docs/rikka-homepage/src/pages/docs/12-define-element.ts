import { defineElement, NumberAttr } from "@takanashi/rikka-elements";
import { css, div, h1, h2, p, a, pre, code } from "@takanashi/rikka-dom";
import {sharedHelpers} from "../../shared/helpers";
import {docPageStyles} from "../../shared/page-styles";
import { docContent } from "../../shared/doc-content";
import { tr } from "../../shared/i18n";
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const styles = css`
  ${docPageStyles}
`;

const DocElements12 = defineElement("rikka-doc-elements-12", {
  styles,
  render() {
    return div(
      { class: "doc-page" },
      h1({}, tr(docContent.sidebar.defineElement)),
      sharedHelpers.advancedBadge("defineElement", docContent.defineElement.advancedNote),
      p({}, tr(docContent.defineElement.desc)),
      div(
        { class: "api-signature" },
        `defineElement(tagName: string, config?: ElementConfig): ElementConstructor`,
      ),
      div(
        { class: "doc-content" },
        h2({}, tr(docContent.defineElement.overview)),
        p(
          tr(docContent.defineElement.overviewDesc1),
          sharedHelpers.inlineCode("defineElement"),
          tr(docContent.defineElement.overviewDesc1Mid),
          sharedHelpers.inlineCode("optional"),
          tr(docContent.defineElement.overviewDesc1End),
          sharedHelpers.inlineCode("HTMLElement"),
          tr(docContent.defineElement.overviewDesc1Final),
          sharedHelpers.inlineCode("customElements.define"),
          tr(docContent.defineElement.overviewDesc1FinalEnd),
        ),
        p(
          tr(docContent.defineElement.overviewDesc2),
          sharedHelpers.inlineCode("h()"),
          tr(docContent.defineElement.overviewDesc2Mid),
          sharedHelpers.inlineCode("div()"),
          tr(docContent.defineElement.overviewDesc2End),
          sharedHelpers.inlineCode("defineElement"),
          tr(docContent.defineElement.overviewDesc2Final),
        ),
        h2({}, tr(docContent.defineElement.elementConfig)),
        p({}, tr(docContent.defineElement.elementConfigDesc)),
        pre(
          { class: "code-block" },
          code(`type BaseConfig = {
  shadow?: ShadowRootInit | false;
  styles?: CSSStyleSheet | CSSStyleSheet[];
  attributes?: Record<string, AttributeSpec<any>>;
  events?: Record<string, EventSpec>;
  methods?: Record<string, (...args: any[]) => any>;
};

type ElementConfig =
  | (BaseConfig & { template: HTMLTemplateElement; render?: never })
  | (BaseConfig & { template?: never; render?: () => Element })
  | BaseConfig;`),
        ),
        h2({}, tr(docContent.defineElement.renderFunction)),
        p(
          tr(docContent.defineElement.renderDesc1),
          sharedHelpers.inlineCode("render"),
          tr(docContent.defineElement.renderDesc1Mid),
          sharedHelpers.inlineCode("connectedCallback"),
          tr(docContent.defineElement.renderDesc1End),
          sharedHelpers.inlineCode("this"),
          tr(docContent.defineElement.renderDesc1Final),
          sharedHelpers.inlineCode("Element"),
          tr(docContent.defineElement.renderDesc1FinalMid),
          sharedHelpers.inlineCode("this.shadowRoot"),
          tr(docContent.defineElement.renderDesc1FinalEnd),
        ),
        pre(
          { class: "code-block" },
          code(`const MyElement = defineElement('my-element', {
  attributes: { count: NumberAttr },
  events: { change: Number },
  styles: css\`:host { display: block; }\`,
  render() {
    return div({}, 'Hello from custom element!');
  }
});`),
        ),
      ),
      div(
        { class: "playground-section" },
        h2({}, tr(docContent.ui.tryIt)),
        RikkaLivePlayground.h({
    code: `const MyElement = defineElement('my-element', {
  render() {
    return div({
      style: { padding: '16px', background: '#1a1a2e', color: '#e2e8f0', borderRadius: '8px', fontFamily: 'system-ui' }
    }, 'Hello from a custom element!');
  }
});

customElements.whenDefined('my-element').then(() => {
  const el = document.createElement('my-element');
  container.appendChild(el);
});`, height: "200", title: "Basic Custom Element"
}),
      ),
      div(
        { class: "doc-nav" },
        a(
          { href: "#/docs/@takanashi/rikka-dom/inlineStyle", class: "prev-link" },
          tr(docContent.defineElement.prevInlineStyle),
        ),
        div({ class: "spacer" }),
        a(
          { href: "#/docs/@takanashi/rikka-elements/shadow", class: "next-link" },
          tr(docContent.defineElement.nextShadow),
        ),
      ),
    );
  },
});

export { DocElements12 };
