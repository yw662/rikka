import { defineElement, NumberAttr, StringAttr, BooleanAttr } from "@takanashi/rikka-elements";
import { css, div, h1, h2, p, a, pre, code } from "@takanashi/rikka-dom";
import {sharedHelpers} from "../../shared/helpers";
import {docPageStyles} from "../../shared/page-styles";
import { docContent } from "../../shared/doc-content";
import { tr } from "../../shared/i18n";
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const styles = css`
  ${docPageStyles}
`;

const DocElements15 = defineElement("rikka-doc-elements-15", {
  styles,
  render() {
    return div(
      { class: "doc-page" },
      h1({}, tr(docContent.sidebar.attribute)),
      sharedHelpers.advancedBadge("attribute", docContent.attribute.advancedNote),
      p({}, tr(docContent.attribute.desc)),
      div(
        { class: "api-signature" },
        `config.attributes?: Record<string, AttributeSpec>`,
      ),
      div(
        { class: "doc-content" },
        h2({}, tr(docContent.attribute.attributeDeclaration)),
        p(
          tr(docContent.attribute.attributeDeclarationDesc),
          sharedHelpers.inlineCode("config.attributes"),
          tr(docContent.attribute.attributeDeclarationDescEnd),
        ),
        RikkaLivePlayground.h({
    code: `const MyElement = defineElement('my-element', {
  attributes: {
    count: NumberAttr,
    name: StringAttr,
    disabled: BooleanAttr,
  },
  styles: css\`
    :host { display: inline-block; padding: 12px; }
    .info { font-family: monospace; font-size: 0.875rem; }
  \`,
  render() {
    return div({ class: 'info' },
      p({}, 'count: ', this.$count, ' (type: ', typeof this.count, ')'),
      p({}, 'name: ', this.$name),
      p({}, 'disabled: ', this.$disabled)
    );
  }
});

const el = h('my-element', { count: 42, name: 'Test' });
container.appendChild(div({},
  h2({}, 'Attribute Demo'),
  el,
  div({ style: { marginTop: '8px' } },
    button({ onclick: () => el.count++ }, 'count++'),
    button({ onclick: () => el.name = 'Changed', style: { marginLeft: '4px' } }, 'Change name')
  )
));`, height: "240", title: "Attribute Declaration"
}),
        h2({}, tr(docContent.attribute.valueAndSignal)),
        p(
          tr(docContent.attribute.valueAndSignalDesc1),
          sharedHelpers.inlineCode("this.name"),
          tr(docContent.attribute.valueAndSignalDesc1Mid),
          sharedHelpers.inlineCode("this.$name"),
          tr(docContent.attribute.valueAndSignalDesc1End),
        ),
        pre(
          { class: "code-block" },
          code(`render() {
  console.log(this.count);        // number value
  console.log(this.$count.get()); // Signal.State<number>

  effect(() => {
    console.log('Count changed:', this.$count.get());
  });
}`),
        ),
        h2({}, tr(docContent.attribute.builtInTransforms)),
        p({}, tr(docContent.attribute.builtInTransformsDesc)),
        pre(
          { class: "code-block" },
          code(`StringAttr  // Default, no transformation
NumberAttr  // Parse as number
BooleanAttr // Parse as boolean (true if attribute present)`),
        ),
        h2({}, tr(docContent.attribute.customTransform)),
        p({}, tr(docContent.attribute.customTransformDesc)),
        pre(
          { class: "code-block" },
          code(`attributes: {
  color: { toProp: (v) => v ?? '#6366f1', toAttribute: (v) => v },
  items: { toProp: (v) => v ? v.split(',') : [], toAttribute: (v) => v?.join(',') },
}`),
        ),
      ),
      div(
        { class: "playground-section" },
        h2({}, tr(docContent.ui.tryIt)),
        RikkaLivePlayground.h({
    code: `const AttrCounter = defineElement('attr-counter', {
  attributes: { count: NumberAttr },
  styles: css\`
    .counter {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      background: #1a1a2e;
      border-radius: 8px;
      font-family: system-ui;
    }
    button {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: #6366f1;
      color: white;
      font-size: 18px;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #4f46e5; }
    button:active { transform: scale(0.95); }
    span {
      min-width: 40px;
      text-align: center;
      font-size: 1.5rem;
      font-weight: 600;
      color: #e2e8f0;
    }
  \`,
  render() {
    return div({ class: 'counter' },
      button({ onclick: () => this.count-- }, '-'),
      span({}, this.$count),
      button({ onclick: () => this.count++ }, '+')
    );
  }
});

const el = h('attr-counter', { count: 0 });
container.appendChild(el);`, height: "250", title: "Reactive Attribute"
}),
      ),
      div(
        { class: "doc-nav" },
        a(
          { href: "#/docs/@takanashi/rikka-elements/adopt-style", class: "prev-link" },
          tr(docContent.attribute.prevAdoptStyle),
        ),
        div({ class: "spacer" }),
        a(
          { href: "#/docs/@takanashi/rikka-elements/event", class: "next-link" },
          tr(docContent.attribute.nextEvent),
        ),
      ),
    );
  },
});

export { DocElements15 };
