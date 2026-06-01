import { defineElement } from @rikka/elements;
import { css, div, h1, h2, p, a, pre, code } from @rikka/dom;
import { sharedStyles, docPageStyles } from "../../shared/styles";

const styles = css`
  ${docPageStyles}
`;

const DocElements15 = defineElement("rikka-doc-elements-15", {
  styles,
  render() {
    return div(
      { class: "doc-page" },
      h1("attribute"),
      p("Reactive properties synced with HTML attributes."),
      div(
        { class: "api-signature" },
        `config.attributes?: Record<string, AttributeSpec>`,
      ),
      div(
        { class: "doc-content" },
        h2("Attribute Declaration"),
        p(
          "Declare attributes in the ",
          sharedStyles.inlineCode("config.attributes"),
          " record. Each key becomes a property on the element instance.",
        ),
        sharedStyles.createPlayground(
          `const MyElement = defineElement('my-element', {
  attributes: {
    count: Number,
    name: String,
    disabled: Boolean,
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
));`,
          "240",
          "Attribute Declaration",
        ),
        h2("Value and Signal Access"),
        p(
          "Access the raw value via ",
          sharedStyles.inlineCode("this.name"),
          " and the backing Signal via ",
          sharedStyles.inlineCode("this.$name"),
          ":",
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
        h2("Built-in Transforms"),
        p("Common transforms for type conversion:"),
        pre(
          { class: "code-block" },
          code(`String  // Default, no transformation
Number  // Parse as number
Boolean // Parse as boolean (true if attribute present)`),
        ),
        h2("Custom Transform Functions"),
        p("Pass a function to implement custom parsing logic:"),
        pre(
          { class: "code-block" },
          code(`attributes: {
  color: (value) => value ?? '#6366f1',
  items: (value) => value ? value.split(',') : [],
}`),
        ),
      ),
      div(
        { class: "playground-section" },
        h2("Try It"),
        sharedStyles.createPlayground(
          `const AttrCounter = defineElement('attr-counter', {
  attributes: { count: Number },
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
container.appendChild(el);`,
          "250",
          "Reactive Attribute",
        ),
      ),
      div(
        { class: "doc-nav" },
        a(
          { href: "#/docs/rikka-elements/adopt-style", class: "prev-link" },
          "\u2190 adoptStyle",
        ),
        div({ class: "spacer" }),
        a(
          { href: "#/docs/rikka-elements/event", class: "next-link" },
          "event \u2192",
        ),
      ),
    );
  },
});

export { DocElements15 };
