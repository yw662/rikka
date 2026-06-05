import { defineElement, NumberAttr } from "@rikka/elements";
import { css, div, h1, h2, p, a, pre, code } from "@rikka/dom";
import { sharedStyles, docPageStyles } from "../../shared/styles";

const styles = css`
  ${docPageStyles}
`;

const DocElements12 = defineElement("rikka-doc-elements-12", {
  styles,
  render() {
    return div(
      { class: "doc-page" },
      h1("defineElement"),
      sharedStyles.advancedBadge("defineElement", "is an advanced feature. You can build entire apps using only h(), div(), and other tag helpers. Use defineElement when you need reusable, encapsulated components with Shadow DOM isolation."),
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
          sharedStyles.inlineCode("defineElement"),
          " function is an ",
          sharedStyles.inlineCode("optional"),
          " utility for creating reusable, encapsulated components. It registers a custom element with the browser by creating a class extending ",
          sharedStyles.inlineCode("HTMLElement"),
          ", configuring shadow DOM, styles, attributes, and events via ",
          sharedStyles.inlineCode("customElements.define"),
          ".",
        ),
        p(
          { style: { color: "#94a3b8", marginTop: "8px" } },
          "Most Rikka applications work perfectly fine using only ",
          sharedStyles.inlineCode("h()"),
          ", ",
          sharedStyles.inlineCode("div()"),
          ", and signal interpolation directly. Use ",
          sharedStyles.inlineCode("defineElement"),
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
          sharedStyles.inlineCode("render"),
          " function is mounted on the element prototype and called in ",
          sharedStyles.inlineCode("connectedCallback"),
          ". Inside render, ",
          sharedStyles.inlineCode("this"),
          " is the element instance. It must return an ",
          sharedStyles.inlineCode("Element"),
          " to append to ",
          sharedStyles.inlineCode("this.shadowRoot"),
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
        sharedStyles.createPlayground(
          `const MyElement = defineElement('my-element', {
  render() {
    return div({
      style: { padding: '16px', background: '#1a1a2e', color: '#e2e8f0', borderRadius: '8px', fontFamily: 'system-ui' }
    }, 'Hello from a custom element!');
  }
});

customElements.whenDefined('my-element').then(() => {
  const el = document.createElement('my-element');
  container.appendChild(el);
});`,
          "200",
          "Basic Custom Element",
        ),
      ),
      div(
        { class: "doc-nav" },
        a(
          { href: "#/docs/@rikka/dom/inlineStyle", class: "prev-link" },
          "\u2190 inlineStyle``",
        ),
        div({ class: "spacer" }),
        a(
          { href: "#/docs/@rikka/elements/shadow", class: "next-link" },
          "Shadow DOM \u2192",
        ),
      ),
    );
  },
});

export { DocElements12 };
