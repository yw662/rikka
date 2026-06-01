import { defineElement } from "@rikka/elements";
import { css, div, h1, h2, p, a, pre, code } from "@rikka/dom";
import { sharedStyles, docPageStyles } from "../../shared/styles";

const styles = css`
  ${docPageStyles}
`;

const DocElements16 = defineElement("rikka-doc-elements-16", {
  styles,
  render() {
    return div(
      { class: "doc-page" },
      h1("event"),
      p("Custom events with type-safe dispatching and listening."),
      div(
        { class: "api-signature" },
        `config.events?: Record<string, EventSpec>`,
      ),
      div(
        { class: "doc-content" },
        h2("Event Declaration"),
        p(
          "Declare events in the ",
          sharedStyles.inlineCode("config.events"),
          " record. The value is the detail type constructor or ",
          sharedStyles.inlineCode("undefined"),
          " for events with no detail.",
        ),
        sharedStyles.createPlayground(
          `const MyComponent = defineElement('my-component', {
  events: {
    change: Number,
    reset: undefined,
  },
  styles: css\`
    :host { display: inline-block; }
    button { padding: 8px 16px; margin: 4px; }
  \`,
  render() {
    return div({},
      button({ onclick: () => this.dispatchChange(Date.now(), { bubbles: true }) }, 'Dispatch change'),
      button({ onclick: () => this.dispatchReset(undefined, { bubbles: true }) }, 'Dispatch reset')
    );
  }
});

const el = h('my-component');
const log = div({ style: { fontFamily: 'monospace', fontSize: '0.875rem', color: '#94a3b8', marginTop: '8px' } }, 'Events will appear here...');

el.addEventListener('change', (e) => {
  log.textContent = 'change event: ' + (e as CustomEvent<number>).detail;
});
el.addEventListener('reset', () => {
  log.textContent = 'reset event fired';
});

container.appendChild(div({},
  h2({}, 'Event Demo'),
  el,
  log
));`,
          "220",
          "Event Declaration",
        ),
        h2("Generated Methods"),
        p("A dispatch method is generated for each event:"),
        pre(
          { class: "code-block" },
          code(`this.dispatchChange(detail?, options?)  // Dispatch the event`),
        ),
        h2("Handler Property"),
        p(
          "An ",
          sharedStyles.inlineCode("on${eventName}"),
          " property is also generated as a handler that can be set directly:",
        ),
        pre(
          { class: "code-block" },
          code(`element.onchange = (e: CustomEvent<number>) => {
  console.log('Changed:', e.detail);
};`),
        ),
        h2("event<T>() Type Helper"),
        p(
          "Use the ",
          sharedStyles.inlineCode("event<T>()"),
          " helper for custom detail types:",
        ),
        pre(
          { class: "code-block" },
          code(`import { event } from '@rikka/elements';

events: {
  select: event<{ id: string; label: string }>(),
}`),
        ),
      ),
      div(
        { class: "playground-section" },
        h2("Try It"),
        sharedStyles.createPlayground(
          `const EventCounter = defineElement('event-counter', {
  attributes: { count: Number },
  events: {
    change: Number,
    reset: undefined,
  },
  styles: css\`
    .counter {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px;
      background: #1a1a2e;
      border-radius: 12px;
      font-family: system-ui;
    }
    button {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: #6366f1;
      color: white;
      font-size: 20px;
      cursor: pointer;
      transition: all 0.2s;
    }
    button:hover { background: #4f46e5; transform: scale(1.05); }
    span {
      min-width: 48px;
      text-align: center;
      font-size: 1.75rem;
      font-weight: 700;
      color: #e2e8f0;
    }
    .log {
      margin-top: 16px;
      padding: 12px;
      background: #0d1117;
      border-radius: 8px;
      font-family: monospace;
      font-size: 0.875rem;
      color: #94a3b8;
      max-height: 120px;
      overflow-y: auto;
    }
    .log-entry { margin: 4px 0; }
    .log-entry.positive { color: #22c55e; }
    .log-entry.negative { color: #ef4444; }
  \`,
  render() {
    const increment = () => {
      this.count++;
      this.dispatchChange(this.count, { bubbles: true, composed: true });
    };
    const decrement = () => {
      this.count--;
      this.dispatchChange(this.count, { bubbles: true, composed: true });
    };
    return div({ class: 'counter' },
      button({ onclick: decrement }, '-'),
      span({}, this.$count),
      button({ onclick: increment }, '+')
    );
  }
});

const counter = h('event-counter', { count: 0 });
const log = div({ class: 'log' }, 'Events will appear here...');

counter.addEventListener('change', (e) => {
  const entry = document.createElement('div');
  entry.className = 'log-entry ' + ((e as CustomEvent<number>).detail >= 0 ? 'positive' : 'negative');
  entry.textContent = 'change: ' + (e as CustomEvent<number>).detail;
  log.prepend(entry);
});

container.appendChild([counter, log]);`,
          "300",
          "Custom Event",
        ),
      ),
      div(
        { class: "doc-nav" },
        a(
          { href: "#/docs/rikka-elements/attribute", class: "prev-link" },
          "\u2190 attribute",
        ),
        div({ class: "spacer" }),
        a(
          {
            href: "#/docs/rikka-elements/attach-template",
            class: "next-link",
          },
          "attachTemplate \u2192",
        ),
      ),
    );
  },
});

export { DocElements16 };
