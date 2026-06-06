import {
  defineElement,
  NumberAttr,
  StringAttr,
  BooleanAttr,
} from "@takanashi/rikka-elements";
import {
  css,
  div,
  h1,
  h2,
  h3,
  p,
  a,
  pre,
  code,
  span,
  table,
  thead,
  tbody,
  tr,
  th,
  td,
} from "@takanashi/rikka-dom";
import {sharedHelpers} from "../../shared/helpers";
import {docPageStyles} from "../../shared/page-styles";

const styles = css`
  ${docPageStyles}
`;

const DocApiReference = defineElement("rikka-doc-api-ref", {
  styles,
  render() {
    return div(
      { class: "doc-page" },
      h1("API Reference"),
      p("Complete API reference for all Rikka packages."),

      div(
        { class: "doc-content" },

        h2("@takanashi/rikka-signal"),
        p("Reactive primitives built on the TC39 Signals proposal."),
        p(
          "Re-exports ",
          sharedHelpers.inlineCode("Signal"),
          " from ",
          sharedHelpers.inlineCode("signal-polyfill"),
          ".",
        ),

        h3("signal<T>(initialValue)"),
        p("Creates a reactive state container."),
        pre(
          { class: "code-block" },
          code(
            `function signal<T>(initialValue: T): Signal.State<T>

const count = signal(0);
count.get();   // 0
count.set(5);  // triggers subscribers`,
          ),
        ),

        h3("computed<T>(fn)"),
        p(
          "Creates a derived signal that auto-tracks dependencies. Lazy and cached.",
        ),
        pre(
          { class: "code-block" },
          code(
            `function computed<T>(fn: () => T): Signal.Computed<T>

const a = signal(2);
const b = signal(3);
const sum = computed(() => a.get() + b.get());
sum.get();  // 5 — cached until a or b changes`,
          ),
        ),

        h3("effect(fn)"),
        p(
          "Runs a function reactively. Re-runs when tracked signals change. Returns a dispose function.",
        ),
        pre(
          { class: "code-block" },
          code(
            `function effect(fn: () => void | (() => void)): () => void

// Basic usage
const dispose = effect(() => {
  console.log(count.get());
});
dispose();  // stop watching

// Return cleanup from fn
effect(() => {
  const value = count.get();
  return () => console.log('cleanup:', value);
});`,
          ),
        ),

        h3("Signal (re-export)"),
        p("The full Signal namespace from signal-polyfill, including:"),
        pre(
          { class: "code-block" },
          code(
            `Signal.State<T>       — writable signal, .get() / .set()
Signal.Computed<T>    — read-only derived signal
Signal.isState(v)      — type guard for State
Signal.isComputed(v)   — type guard for Computed
Signal.subtle.Watcher  — low-level dependency watcher`,
          ),
        ),

        h2("@takanashi/rikka-dom"),
        p("DOM creation utilities: h(), tag helpers, control flow, templates."),

        h3("h(tag, attrs?, ...children)"),
        p("Creates a DOM element directly."),
        pre(
          { class: "code-block" },
          code(
            `function h<K extends keyof ElementTagNameMap>(
  tag: K,
  attrs?: Attributes<K>,
  ...children: Child[]
): ElementTagNameMap[K]

// Returns Element directly:
const el = div({ class: 'card' }, 'Hello');  // HTMLDivElement

// Children accept: string | number | HTMLElement | Signal | ReactiveRange | Child[] | null | false`,
          ),
        ),

        h3("h`...` (tagged template)"),
        sharedHelpers.advancedBadge(
          "h`...`",
          "is an alternative to h() / tag helpers. Reach for it when you have static HTML-like structures with signal interpolation.",
        ),
        p(
          "HTML template literal returning Element[]. Use ",
          sharedHelpers.inlineCode("[0]"),
          " for single element, or ",
          sharedHelpers.inlineCode("h\\`<template>\\`[0]"),
          " for template elements.",
        ),
        pre(
          { class: "code-block" },
          code(
            `function h(strings: TemplateStringsArray, ...values: any[]): Element[]

const name = signal('World');
const nodes = h\`<span>Hello \${name}!</span>\`;

// Fine-grained: \${signal} creates effect on text node
// Coarse-grained: \${signal.get()} resolves immediately`,
          ),
        ),

        h3("Tag Helpers"),
        p(
          "40 pre-bound helpers with the same signature as ",
          sharedHelpers.inlineCode("h()"),
          ":",
        ),
        pre(
          { class: "code-block" },
          code(
            `div, span, p, a, button, input, form, ul, ol, li
h1, h2, h3, h4, h5, h6, header, footer, main, section
nav, article, aside, img, table, thead, tbody, tr, th, td
label, select, option, textarea, pre, code, br, hr
slot, template, svg, circle
svga, svgscript, svgstyle, svgtitle

// All return Element directly:
div({ id: 'app' }, h1({}, 'Title'))  // → HTMLElement`,
          ),
        ),

        h3("For(source, render, keyFn?)"),
        p(
          "Reactive list rendering. Only adds/removes changed items when keyFn is provided.",
        ),
        pre(
          { class: "code-block" },
          code(
            `function For<T, K = T>(
  source: Signal.State<T[]> | Signal.Computed<T[]>,
  render: (item: T, index: number) => Element,
  keyFn?: (item: T, index: number) => K
): ReactiveRange

const items = signal(['A', 'B', 'C']);
const list = For(items, (item) => li({}, item));
items.set(['A', 'B', 'D']);  // only 'D' is appended`,
          ),
        ),

        h3("Show(condition, render)"),
        p("Conditionally show/hide an element."),
        pre(
          { class: "code-block" },
          code(
            `function Show(
  condition: boolean | Signal.State<boolean> | Signal.Computed<boolean>,
  render: () => Element | null
): ReactiveRange

const visible = signal(true);
Show(visible, () => div({}, 'Visible!'));
visible.set(false);  // element removed from DOM`,
          ),
        ),

        h3("When(condition, trueRender, falseRender)"),
        p("Conditional branching — renders one of two branches."),
        pre(
          { class: "code-block" },
          code(
            `function When(
  condition: boolean | Signal.State<boolean> | Signal.Computed<boolean>,
  trueRender: () => Element | null,
  falseRender: () => Element | null
): ReactiveRange`,
          ),
        ),

        h3("Switch(value, ...cases, fallback?)"),
        sharedHelpers.advancedBadge(
          "Switch()",
          "is for multi-way branching (3+ branches). For single/binary conditions, Show() / When() is simpler.",
        ),
        p("Multi-way conditional branching."),
        pre(
          { class: "code-block" },
          code(
            `function Switch<T>(
  value: T | Signal.State<T> | Signal.Computed<T>,
  cases: Case<T>[],
  fallback?: () => Element | null
): ReactiveRange

const tab = signal('home');
Switch(tab,
  Match('home', () => div({}, 'Home')),
  Match('about', () => div({}, 'About')),
)`,
          ),
        ),

        h3("Match(match, render)"),
        sharedHelpers.advancedBadge(
          "Match()",
          "is the companion to Switch() for defining each branch.",
        ),
        p("Defines a case for Switch."),
        pre(
          { class: "code-block" },
          code(
            `function Match<T>(
  match: T | ((value: T) => boolean),
  render: () => Element | null
): Case<T>`,
          ),
        ),

        h3("css`...`"),
        sharedHelpers.advancedBadge(
          "css`...`",
          "is mainly for Shadow DOM styling via adoptedStyleSheets. For non-Shadow-DOM code, plain <style> blocks are simpler.",
        ),
        p("Creates a CSSStyleSheet from tagged template literal."),
        pre(
          { class: "code-block" },
          code(
            `function css(strings: TemplateStringsArray, ...values: any[]): CSSStyleSheet

const styles = css\`
  :host { display: block; }
  .card { padding: 1rem; border-radius: 8px; }
\`;

defineElement('my-el', { styles });`,
          ),
        ),

        h3("inlineStyle`...`"),
        sharedHelpers.advancedBadge(
          "inlineStyle`...`",
          "is a niche helper that returns a camelCase style object. Most code uses style strings or external CSS.",
        ),
        p("Parses CSS into a style record object for inline styles."),
        pre(
          { class: "code-block" },
          code(
            `function inlineStyle(strings: TemplateStringsArray, ...values: any[]): Record<string, string>

const s = inlineStyle\`padding: 16px; color: red; font-size: 14px\`;
// { padding: '16px', color: 'red', fontSize: '14px' }

div({ style: s }, 'Hello')`,
          ),
        ),

        h2("@takanashi/rikka-elements"),
        sharedHelpers.advancedBadge(
          "@takanashi/rikka-elements",
          "is an advanced feature. You can build complete apps using only h() and tag helpers — reach for defineElement only when you need reusable, encapsulated components with reactive attributes, custom events, Shadow DOM, and declarative lifecycle.",
        ),
        p(
          "Declarative custom elements with reactive attributes, events, shadow DOM, styles, and render function.",
        ),

        h3("defineElement(tagName, config?)"),
        p(
          "Defines a Web Component with typed attributes, events, shadow DOM, and render function.",
        ),
        pre(
          { class: "code-block" },
          code(
            `function defineElement<const C extends ElementConfig>(
  tagName: string,
  config?: C
): ElementConstructor<C>

const MyCounter = defineElement('my-counter', {
  attributes: {
    count: { ...NumberAttr, default: 0 },  // with default value
    label: StringAttr,
    active: BooleanAttr,
  },
  events: {
    change: (e) => e.detail,  // transform DOM event → detail
    reset: undefined,         // no detail
  },
  shadow: { mode: 'open' },  // or false for no shadow
  styles: css\`:host { display: block; }\`,
  template: h\`<template>
    <div class="card">
      <h2>{{title}}</h2>
      <button onclick="{{@change}}">{{label}}</button>
    </div>
  </template>\`[0],
});`,
          ),
        ),

        h3("event<T>()"),
        p(
          "Type marker for events that carry a detail payload via a transform function.",
        ),
        pre(
          { class: "code-block" },
          code(
            `function event<T = void>(): ((domEvent: Event) => T) | undefined

events: {
  click: (e: MouseEvent) => ({ x: e.clientX, y: e.clientY }),
  reset: undefined,
}`,
          ),
        ),

        h3("ElementConfig"),
        pre(
          { class: "code-block" },
          code(
            `type BaseConfig = {
  shadow?: ShadowRootInit | false;
  styles?: CSSStyleSheet | CSSStyleSheet[];
  attributes?: Record<string, AttributeSpec<any>>;
  events?: Record<string, EventSpec>;
  methods?: Record<string, (...args: any[]) => any>;
};

type ElementConfig =
  | (BaseConfig & { template: HTMLTemplateElement; render?: never })
  | (BaseConfig & { template?: never; render?: () => Element })
  | BaseConfig;`,
          ),
        ),

        h3("AttributeSpec<T>"),
        pre(
          { class: "code-block" },
          code(
            `type AttributeSpec<T> = {
  toProp: (v?: string) => T;
  toAttribute: (v?: T) => string | undefined;
  default?: T;
};

// Built-in attribute specs:
NumberAttr    // "42" → 42, "" → NaN
StringAttr    // identity
BooleanAttr   // attr present → true, absent → false
// Custom: { toProp: (v) => JSON.parse(v ?? 'null'), toAttribute: (v) => JSON.stringify(v) }
// With default: { ...NumberAttr, default: 0 }
`,
          ),
        ),

        h3("EventSpec"),
        pre(
          { class: "code-block" },
          code(
            `type EventSpec = ((domEvent: Event) => any) | undefined;

// Transform function: receives DOM event, returns custom event detail
(domEvent: MouseEvent) => ({ x: domEvent.clientX })
undefined  // no detail (void)
`,
          ),
        ),

        h3("Generated Instance Members"),
        p(
          "For each attribute ",
          sharedHelpers.inlineCode("name"),
          " of type ",
          sharedHelpers.inlineCode("T"),
          ":",
        ),
        table(
          { class: "api-table" },
          thead(tr(th("Member"), th("Type"), th("Description"))),
          tbody(
            tr(
              td(code("el.name")),
              td(code("T")),
              td("Get/set raw value. Triggers attributeChangedCallback."),
            ),
            tr(
              td(code("el.$name")),
              td(code("Signal.State<T>")),
              td("Underlying signal. Use for reactive bindings."),
            ),
          ),
        ),
        p(
          "For each event ",
          sharedHelpers.inlineCode("name"),
          " with detail ",
          sharedHelpers.inlineCode("D"),
          ":",
        ),
        table(
          { class: "api-table" },
          thead(tr(th("Member"), th("Type"), th("Description"))),
          tbody(
            tr(
              td(code("el.dispatchName(detail?)")),
              td(code("() => boolean")),
              td("Dispatch CustomEvent with optional detail."),
            ),
            tr(
              td(code("el.onName")),
              td(code("(ev) => void | null")),
              td(
                "Get/set event handler. Auto-wrapped to prevent infinite loops.",
              ),
            ),
          ),
        ),
        p("Additional instance members:"),
        table(
          { class: "api-table" },
          thead(tr(th("Member"), th("Type"), th("Condition"))),
          tbody(
            tr(
              td(code("el.shadowRoot")),
              td(code("ShadowRoot")),
              td("When shadow !== false"),
            ),
            tr(
              td(code("el.methodName()")),
              td("From methods config"),
              td("When methods is provided"),
            ),
          ),
        ),

        h3("Template Binding Syntax"),
        p("When ", sharedHelpers.inlineCode("config.template"), " is provided:"),
        table(
          { class: "api-table" },
          thead(tr(th("Syntax"), th("Binding Type"), th("Behavior"))),
          tbody(
            tr(
              td(code("{{name}}")),
              td("Text"),
              td("textContent, prefers $name signal"),
            ),
            tr(
              td(code('attr="{{name}}"')),
              td("Attribute"),
              td("setAttribute, reactive if signal"),
            ),
            tr(
              td(code('onclick="{{@action}}"')),
              td("Event dispatch"),
              td("DOM event → transform(el.dispatchAction(detail))"),
            ),
          ),
        ),

        h2("Type Exports"),
        table(
          { class: "api-table" },
          thead(tr(th("Type"), th("Package"), th("Description"))),
          tbody(
            tr(
              td(code("Signal.State<T>")),
              td("@takanashi/rikka-signal"),
              td("Writable reactive state container"),
            ),
            tr(
              td(code("Signal.Computed<T>")),
              td("@takanashi/rikka-signal"),
              td("Read-only derived signal with caching"),
            ),
            tr(
              td(code("Child")),
              td("@takanashi/rikka-dom"),
              td(
                "string | number | Node | Signal | ReactiveRange | null | false",
              ),
            ),
            tr(
              td(code("Attributes<K>")),
              td("@takanashi/rikka-dom"),
              td("Typed attribute map for element K"),
            ),
            tr(
              td(code("ReactiveRange")),
              td("@takanashi/rikka-dom"),
              td("For/Show/When/Switch output — managed node range"),
            ),
            tr(
              td(code("Case<T>")),
              td("@takanashi/rikka-dom"),
              td("Single case definition for Switch"),
            ),
            tr(
              td(code("AttributeSpec<T>")),
              td("@takanashi/rikka-elements"),
              td("Attribute parser/serializer spec"),
            ),
            tr(
              td(code("EventSpec")),
              td("@takanashi/rikka-elements"),
              td("(DOM Event → detail) transform | undefined"),
            ),
            tr(
              td(code("ElementConfig")),
              td("@takanashi/rikka-elements"),
              td("Full configuration for defineElement"),
            ),
            tr(
              td(code("ElementInstance<C>")),
              td("@takanashi/rikka-elements"),
              td("HTMLElement & props & signals & events & shadow & methods"),
            ),
            tr(
              td(code("ElementConstructor<C>")),
              td("@takanashi/rikka-elements"),
              td("Typed constructor + observedAttributes"),
            ),
          ),
        ),
      ),

      div({ class: "doc-nav" }),
    );
  },
});

export { DocApiReference };
