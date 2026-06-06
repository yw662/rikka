import { defineElement } from "@takanashi/rikka-elements";
import { css, div, h1, h2, p, a, pre, code } from "@takanashi/rikka-dom";
import {sharedHelpers} from "../../shared/helpers";
import {docPageStyles} from "../../shared/page-styles";
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const styles = css`
  ${docPageStyles}
`;

const DocDom18 = defineElement("rikka-doc-dom-18", {
  styles,
  render() {
    return div(
      { class: "doc-page" },
      h1("css``"),
      sharedHelpers.advancedBadge(
        "css`...`",
        "is mainly for Shadow DOM styling via adoptedStyleSheets. For non-Shadow-DOM code, plain <style> blocks or external CSS are simpler.",
      ),
      p(
        "Tag template for creating CSSStyleSheet objects. Exported from ",
        sharedHelpers.inlineCode("@takanashi/rikka-dom"),
        ".",
      ),
      div(
        { class: "api-signature" },
        `css(strings: TemplateStringsArray, ...values: (string | number | CSSStyleSheet)[]): CSSStyleSheet`,
      ),
      div(
        { class: "doc-content" },
        h2("Basic Usage"),
        p(
          "The ",
          sharedHelpers.inlineCode("css"),
          " tagged template creates a ",
          sharedHelpers.inlineCode("CSSStyleSheet"),
          " object from a template literal:",
        ),
        RikkaLivePlayground.h({
    code: `const buttonStyles = css\`
  button {
    padding: 8px 16px;
    border-radius: 4px;
    background: #6366f1;
    color: white;
    border: none;
    cursor: pointer;
  }
  button:hover { background: #4f46e5; }
\`;

const StyledButton = defineElement('styled-button', {
  styles: buttonStyles,
  render() {
    return div({ style: { textAlign: 'center' } },
      h3({}, 'Styled Button'),
      button({}, 'Click Me')
    );
  }
});

container.appendChild(document.createElement('styled-button'));`, height: "200", title: "css Template Basics"
}),
        h2("Composition"),
        p(
          "Interpolate existing stylesheets with ",
          sharedHelpers.inlineCode("${sheet}"),
          " to compose styles:",
        ),
        pre(
          { class: "code-block" },
          code(`const baseStyles = css\`
  :host { display: block; font-family: system-ui; }
\`;

const componentStyles = css\`
  \${baseStyles}
  .card { padding: 16px; border-radius: 8px; }
\`;`),
        ),
        h2("Returns CSSStyleSheet"),
        p(
          "The return value is a native ",
          sharedHelpers.inlineCode("CSSStyleSheet"),
          " that can be used with ",
          sharedHelpers.inlineCode("adoptedStyleSheets"),
          " or the ",
          sharedHelpers.inlineCode("config.styles"),
          " option directly.",
        ),
        pre(
          { class: "code-block" },
          code(`const sheet = css\`:host { display: block; }\`;
// sheet instanceof CSSStyleSheet === true`),
        ),
      ),
      div(
        { class: "playground-section" },
        h2("Try It"),
        RikkaLivePlayground.h({
    code: `const profileCardStyle = css\`
  :host {
    display: block;
    font-family: system-ui, sans-serif;
  }
  .card {
    display: flex;
    gap: 16px;
    padding: 20px;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8ec 100%);
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.15);
  }
  .avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
    font-weight: bold;
  }
  .info { flex: 1; }
  .info h3 {
    margin: 0 0 4px;
    font-size: 1.125rem;
    color: #1e293b;
  }
  .info p {
    margin: 0;
    font-size: 0.875rem;
    color: #64748b;
  }
  .badge {
    display: inline-block;
    padding: 4px 8px;
    background: #dbeafe;
    color: #1e40af;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }
\`;

const ProfileCard = defineElement('profile-card', {
  styles: profileCardStyle,
  render() {
    return div({ class: 'card' },
      div({ class: 'avatar' }, 'JD'),
      div({ class: 'info' },
        h3({}, 'John Doe'),
        p({}, 'Software Engineer'),
        span({ class: 'badge' }, 'Pro')
      )
    );
  }
});

container.appendChild(document.createElement('profile-card'));`, height: "250", title: "css Template"
}),
      ),
      div(
        { class: "doc-nav" },
        a(
          {
            href: "#/docs/@takanashi/rikka-dom/signal-interpolation",
            class: "prev-link",
          },
          "\u2190 Signal Interpolation",
        ),
        div({ class: "spacer" }),
        a(
          { href: "#/docs/@takanashi/rikka-dom/inlineStyle", class: "next-link" },
          "inlineStyle`` \u2192",
        ),
      ),
    );
  },
});

export { DocDom18 };
