import { defineElement } from "@takanashi/rikka-elements";
import { css, div, h1, h2, p, a, pre, code as codeTag } from "@takanashi/rikka-dom";
import {sharedHelpers} from "../../shared/helpers";
import {docPageStyles} from "../../shared/page-styles";
import { docContent } from "../../shared/doc-content";
import { tr } from "../../shared/i18n";
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const styles = css`
  ${docPageStyles}
`;

const C = docContent.inlineStyle;

const DocDomStyle = defineElement("rikka-doc-dom-style", {
  styles,
  render() {
    return div(
      { class: "doc-page" },
      h1({}, tr(docContent.sidebar.inlineStyle)),
      sharedHelpers.advancedBadge("inlineStyle``", C.advancedNote),
      p(
        tr(C.desc1),
        sharedHelpers.inlineCode("@takanashi/rikka-dom"),
        tr(C.desc1End),
      ),
      div(
        { class: "api-signature" },
        `inlineStyle(strings: TemplateStringsArray, ...values: (string | number)[]): Record<string, string>`,
      ),
      div(
        { class: "doc-content" },
        h2({}, tr(C.basicUsage)),
        p(
          tr(C.basicUsageDesc1),
          sharedHelpers.inlineCode("inlineStyle"),
          tr(C.basicUsageDesc1End),
        ),
        RikkaLivePlayground.h({
    code: `const cardStyle = inlineStyle\`
  padding: 16px;
  border-radius: 8px;
  background: #1a1a2e;
  color: #e2e8f0;
\`;

container.appendChild(div({ style: cardStyle },
  h3({}, 'Styled with inlineStyle\`\`'),
  p({}, 'This uses the inlineStyle template tag.')
));`, height: "180", title: "inlineStyle Template Basics"
}),
        h2({}, tr(C.cssToCamelCase)),
        p({}, tr(C.cssToCamelCaseDesc)),
        pre(
          { class: "code-block" },
          codeTag(`const s = inlineStyle\`
  font-size: 14px;
  background-color: red;
  border-top-left-radius: 4px;
\`;
// => { fontSize: '14px', backgroundColor: 'red', borderTopLeftRadius: '4px' }`),
        ),
        h2({}, tr(C.vsCss)),
        p(
          sharedHelpers.inlineCode("css``"),
          tr(C.vsCssDesc1),
          sharedHelpers.inlineCode("CSSStyleSheet"),
          tr(C.vsCssDesc1End),
          sharedHelpers.inlineCode("adoptedStyleSheets"),
          tr(C.vsCssDesc1Final),
          sharedHelpers.inlineCode("config.styles"),
          tr(C.vsCssDesc1End),
        ),
        p(
          sharedHelpers.inlineCode("inlineStyle\`\`"),
          tr(C.vsCssDesc2),
          sharedHelpers.inlineCode("style"),
          tr(C.vsCssDesc2End),
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
        h2({}, tr(C.interpolation)),
        p({}, tr(C.interpolationDesc)),
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
        h2({}, tr(docContent.ui.tryIt)),
        RikkaLivePlayground.h({
    code: `const cardStyle = inlineStyle\`
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

container.appendChild(app);`, height: "200", title: "inlineStyle Template"
}),
      ),
      div(
        { class: "doc-nav" },
        a(
          { href: "#/docs/@takanashi/rikka-dom/css-template", class: "prev-link" },
          tr(C.prevCssTemplate),
        ),
        div({ class: "spacer" }),
        a(
          { href: "#/docs/@takanashi/rikka-elements/define-element", class: "next-link" },
          tr(C.nextDefineElement),
        ),
      ),
    );
  },
});

export { DocDomStyle };
