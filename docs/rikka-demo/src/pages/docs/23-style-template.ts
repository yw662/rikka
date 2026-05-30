import { defineElement } from "rikka-elements";
import { css, div, h1, h2, p, a, pre, code as codeTag } from "rikka-dom";
import { sharedStyles, docPageStyles } from "../../shared/styles";

const styles = css`
  ${docPageStyles}
`;

const DocDomStyle = defineElement("rikka-doc-dom-style", {
  styles,
  render() {
    return div(
      { class: "doc-page" },
      h1("inlineStyle``"),
      p(
        "Tag template for creating inline style objects. Exported from ",
        sharedStyles.inlineCode("rikka-dom"),
        ".",
      ),
      div(
        { class: "api-signature" },
        `inlineStyle(strings: TemplateStringsArray, ...values: (string | number)[]): Record<string, string>`,
      ),
      div(
        { class: "doc-content" },
        h2("Basic Usage"),
        p(
          "The ",
          sharedStyles.inlineCode("inlineStyle"),
          " tagged template creates a JavaScript style object from CSS-like syntax:",
        ),
        sharedStyles.createPlayground(
          `const cardStyle = inlineStyle\`
  padding: 16px;
  border-radius: 8px;
  background: #1a1a2e;
  color: #e2e8f0;
\`;

container.appendChild(div({ style: cardStyle },
  h3({}, 'Styled with inlineStyle\`\`'),
  p({}, 'This uses the inlineStyle template tag.')
));`,
          "180",
          "inlineStyle Template Basics",
        ),
        h2("CSS to camelCase"),
        p(
          "CSS property names are automatically converted to camelCase for JavaScript compatibility:",
        ),
        pre(
          { class: "code-block" },
          codeTag(`const s = inlineStyle\`
  font-size: 14px;
  background-color: red;
  border-top-left-radius: 4px;
\`;
// => { fontSize: '14px', backgroundColor: 'red', borderTopLeftRadius: '4px' }`),
        ),
        h2("vs css``"),
        p(
          sharedStyles.inlineCode("css``"),
          " returns a ",
          sharedStyles.inlineCode("CSSStyleSheet"),
          " for ",
          sharedStyles.inlineCode("adoptedStyleSheets"),
          " or ",
          sharedStyles.inlineCode("config.styles"),
          ".",
        ),
        p(
          sharedStyles.inlineCode("inlineStyle\`\`"),
          " returns a plain object for the ",
          sharedStyles.inlineCode("style"),
          " attribute of individual elements.",
        ),
        pre(
          { class: "code-block" },
          codeTag(`// css\`\` — for shadow DOM stylesheets
const sheet = css\`:host { display: block; }\`;
defineElement('my-el', { styles: sheet });

// inlineStyle\`\` — for inline element styles
const inline = inlineStyle\`padding: 8px; color: red\`;
div({ style: inline }, 'Text')`),
        ),
        h2("Interpolation"),
        p("String and number values can be interpolated:"),
        pre(
          { class: "code-block" },
          codeTag(`const size = 16;
const color = '#e2e8f0';

const s = inlineStyle\`
  font-size: \${size}px;
  color: \${color};
\`;
// => { fontSize: '16px', color: '#e2e8f0' }`),
        ),
      ),
      div(
        { class: "playground-section" },
        h2("Try It"),
        sharedStyles.createPlayground(
          `const cardStyle = inlineStyle\`
  padding: 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-family: system-ui, sans-serif;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  max-width: 320px;
\`;

const badgeStyle = inlineStyle\`
  display: inline-block;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: 12px;
\`;

const app = div(
  { style: cardStyle },
  h3({ style: { margin: '0 0 4px', fontSize: '1.25rem' } }, 'Inline Styled Card'),
  p({ style: { margin: '0', opacity: '0.9', fontSize: '0.875rem' } }, 'Styled with inlineStyle\`\` template tag'),
  span({ style: badgeStyle }, 'inlineStyle\`\` powered')
);

container.appendChild(app);`,
          "200",
          "inlineStyle Template",
        ),
      ),
      div(
        { class: "doc-nav" },
        a(
          { href: "#/docs/rikka-dom/css-template", class: "prev-link" },
          "\u2190 css``",
        ),
        div({ class: "spacer" }),
        a(
          { href: "#/docs/rikka-elements/define-element", class: "next-link" },
          "defineElement \u2192",
        ),
      ),
    );
  },
});

export { DocDomStyle };
