import { defineElement, NumberAttr } from "@takanashi/rikka-elements";
import { css, div, h1, h2, p, a, pre, code } from "@takanashi/rikka-dom";
import {sharedHelpers} from "../../shared/helpers";
import {docPageStyles} from "../../shared/page-styles";
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const styles = css`
  ${docPageStyles}
`;

const DocElements12 = defineElement("rikka-doc-elements-12", {
  styles,
  render() {
    return div(
      { class: "doc-page" },
      h1("defineElement"),
      sharedHelpers.advancedBadge("defineElement", "is an advanced feature. You can build entire apps using only h(), div(), and other tag helpers. Use defineElement when you need reusable, encapsulated components with Shadow DOM isolation."),
      p(
        "Define custom elements for reusable components with reactive attributes, events, and styles.",
      ),
      div(
        { class: "api-signature" },
        `defineElement(tagName: string, config?: ElementConfig): ElementConstructor`,
      ),
      div(
        { class: "doc-content" },
        h2("Overview"),
        p(
          "The ",
          sharedHelpers.inlineCode("defineElement"),
          " function is an ",
          sharedHelpers.inlineCode("optional"),
          " utility for creating reusable, encapsulated components. It registers a custom element with the browser by creating a class extending ",
          sharedHelpers.inlineCode("HTMLElement"),
          ", configuring shadow DOM, styles, attributes, and events via ",
          sharedHelpers.inlineCode("customElements.define"),
          ".",
        ),
        p(
          { style: { color: "#94a3b8", marginTop: "8px" } },
          "Most Rikka applications work perfectly fine using only ",
          sharedHelpers.inlineCode("h()"),
          ", ",
          sharedHelpers.inlineCode("div()"),
          ", and signal interpolation directly. Use ",
          sharedHelpers.inlineCode("defineElement"),
          " when you need component reuse across different parts of your app, or when you want style encapsulation via shadow DOM.",
        ),
        h2("ElementConfig Interface"),
        p("The configuration object declares all features of the element:"),
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
        h2("Render Function"),
        p(
          "The ",
          sharedHelpers.inlineCode("render"),
          " function is mounted on the element prototype and called in ",
          sharedHelpers.inlineCode("connectedCallback"),
          ". Inside render, ",
          sharedHelpers.inlineCode("this"),
          " is the element instance. It must return an ",
          sharedHelpers.inlineCode("Element"),
          " to append to ",
          sharedHelpers.inlineCode("this.shadowRoot"),
          ".",
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
        h2("Try It"),
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
          "\u2190 inlineStyle``",
        ),
        div({ class: "spacer" }),
        a(
          { href: "#/docs/@takanashi/rikka-elements/shadow", class: "next-link" },
          "Shadow DOM \u2192",
        ),
      ),
    );
  },
});

export { DocElements12 };
