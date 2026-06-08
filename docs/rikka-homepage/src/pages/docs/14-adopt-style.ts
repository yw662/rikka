import { defineElement } from "@takanashi/rikka-elements";
import { css, div, h1, h2, p, a, pre, code } from "@takanashi/rikka-dom";
import {sharedHelpers} from "../../shared/helpers";
import {docPageStyles} from "../../shared/page-styles";
import { docContent } from "../../shared/doc-content";
import { tr } from "../../shared/i18n";
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const styles = css`
  ${docPageStyles}
`;

const DocElements14 = defineElement("rikka-doc-elements-14", {
  styles,
  render() {
    return div(
      { class: "doc-page" },
      h1({}, tr(docContent.sidebar.adoptStyle)),
      sharedHelpers.advancedBadge("adoptStyle", docContent.adoptStyle.advancedNote),
      p({}, tr(docContent.adoptStyle.desc)),
      div(
        { class: "api-signature" },
        `config.styles?: CSSStyleSheet | CSSStyleSheet[]`,
      ),
      div(
        { class: "doc-content" },
        h2({}, tr(docContent.adoptStyle.overview)),
        p(
          tr(docContent.adoptStyle.overviewDesc1),
          sharedHelpers.inlineCode("config.styles"),
          tr(docContent.adoptStyle.overviewDesc1End),
          sharedHelpers.inlineCode("CSSStyleSheet"),
          tr(docContent.adoptStyle.overviewDesc1Mid),
          sharedHelpers.inlineCode("adoptedStyleSheets"),
          tr(docContent.adoptStyle.overviewDesc1MidEnd),
        ),
        h2({}, tr(docContent.adoptStyle.cssTagTemplate)),
        p(
          tr(docContent.adoptStyle.cssTagTemplateDesc1),
          sharedHelpers.inlineCode("css"),
          tr(docContent.adoptStyle.cssTagTemplateDesc1End),
          sharedHelpers.inlineCode("CSSStyleSheet"),
          tr(docContent.adoptStyle.cssTagTemplateDesc1Final),
        ),
        RikkaLivePlayground.h({
    code: `const MyComponent = defineElement('my-component', {
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

container.appendChild(document.createElement('my-component'));`, height: "180", title: "css Template"
}),
        h2({}, tr(docContent.adoptStyle.multipleStylesheets)),
        p({}, tr(docContent.adoptStyle.multipleStylesheetsDesc)),
        pre(
          { class: "code-block" },
          code(`const baseStyles = css\`:host { display: block; }\`;
const themeStyles = css\`:host { color: #e2e8f0; }\`;

const MyElement = defineElement('my-element', {
  styles: [baseStyles, themeStyles]
});`),
        ),
        h2({}, tr(docContent.adoptStyle.adoptedStyleSheetsApi)),
        p(
          tr(docContent.adoptStyle.adoptedStyleSheetsApiDesc1),
          sharedHelpers.inlineCode("defineElement"),
          tr(docContent.adoptStyle.adoptedStyleSheetsApiDesc1End),
          sharedHelpers.inlineCode("shadow.adoptedStyleSheets"),
          tr(docContent.adoptStyle.adoptedStyleSheetsApiDesc1Final),
        ),
      ),
      div(
        { class: "playground-section" },
        h2({}, tr(docContent.ui.tryIt)),
        RikkaLivePlayground.h({
    code: `const cardStyle = css\`
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

container.appendChild(document.createElement('styled-card'));`, height: "250", title: "Styled Component"
}),
      ),
      div(
        { class: "doc-nav" },
        a(
          { href: "#/docs/@takanashi/rikka-elements/shadow", class: "prev-link" },
          tr(docContent.adoptStyle.prevShadow),
        ),
        div({ class: "spacer" }),
        a(
          { href: "#/docs/@takanashi/rikka-elements/attribute", class: "next-link" },
          tr(docContent.adoptStyle.nextAttribute),
        ),
      ),
    );
  },
});

export { DocElements14 };
