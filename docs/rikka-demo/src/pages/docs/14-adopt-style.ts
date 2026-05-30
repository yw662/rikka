import { defineElement } from "rikka-elements";
import { css, div, h1, h2, p, a, pre, code } from "rikka-dom";
import { sharedStyles, docPageStyles } from "../../shared/styles";

const styles = css`
  ${docPageStyles}
`;

const DocElements14 = defineElement("rikka-doc-elements-14", {
  styles,
  render() {
    return div(
      { class: "doc-page" },
      h1("adoptStyle"),
      p("Inject CSS stylesheets into the ShadowRoot."),
      div(
        { class: "api-signature" },
        `config.styles?: CSSStyleSheet | CSSStyleSheet[]`,
      ),
      div(
        { class: "doc-content" },
        h2("Overview"),
        p(
          "The ",
          sharedStyles.inlineCode("config.styles"),
          " option accepts a ",
          sharedStyles.inlineCode("CSSStyleSheet"),
          " or an array of them. These are injected into the shadow root via the ",
          sharedStyles.inlineCode("adoptedStyleSheets"),
          " API when the element connects.",
        ),
        h2("css Tag Template"),
        p(
          "Use the ",
          sharedStyles.inlineCode("css"),
          " tagged template literal to create ",
          sharedStyles.inlineCode("CSSStyleSheet"),
          " objects:",
        ),
        sharedStyles.createPlayground(
          `const MyComponent = defineElement('my-component', {
  styles: css\`
    :host {
      display: block;
      padding: 16px;
    }
    .title {
      font-size: 1.5rem;
      font-weight: bold;
    }
  \`,
  render() {
    return div({ class: 'title' }, 'Styled Component');
  }
});

container.appendChild(document.createElement('my-component'));`,
          "180",
          "css Template",
        ),
        h2("Multiple Stylesheets"),
        p("Pass an array to compose styles from multiple sources:"),
        pre(
          { class: "code-block" },
          code(`const baseStyles = css\`:host { display: block; }\`;
const themeStyles = css\`:host { color: #e2e8f0; }\`;

const MyElement = defineElement('my-element', {
  styles: [baseStyles, themeStyles]
});`),
        ),
        h2("adoptedStyleSheets API"),
        p(
          "Under the hood, ",
          sharedStyles.inlineCode("defineElement"),
          " merges styles into ",
          sharedStyles.inlineCode("shadow.adoptedStyleSheets"),
          " for performant, deduplicated style application.",
        ),
      ),
      div(
        { class: "playground-section" },
        h2("Try It"),
        sharedStyles.createPlayground(
          `const cardStyle = css\`
  :host {
    display: block;
    font-family: system-ui, sans-serif;
  }
  .card {
    padding: 24px;
    border-radius: 12px;
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
  }
  .card:hover {
    transform: translateY(-2px);
  }
  .card h3 {
    margin: 0 0 12px;
    color: #1f2937;
    font-size: 1.25rem;
  }
  .card p {
    margin: 0;
    color: #6b7280;
    line-height: 1.5;
  }
\`;

const StyledCard = defineElement('styled-card', {
  styles: cardStyle,
  render() {
    return div({ class: 'card' },
      h3({}, 'Card Title'),
      p({}, 'This card uses styles injected via adoptedStyleSheets.')
    );
  }
});

container.appendChild(document.createElement('styled-card'));`,
          "250",
          "Styled Component",
        ),
      ),
      div(
        { class: "doc-nav" },
        a(
          { href: "#/docs/rikka-elements/shadow", class: "prev-link" },
          "\u2190 Shadow DOM",
        ),
        div({ class: "spacer" }),
        a(
          { href: "#/docs/rikka-elements/attribute", class: "next-link" },
          "attribute \u2192",
        ),
      ),
    );
  },
});

export { DocElements14 };
