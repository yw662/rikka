import { defineElement } from 'rikka-elements';
import { css, div, h1, h2, h3, p, a, pre, code, span, table, thead, tbody, tr, th, td } from 'rikka-dom';
import { sharedStyles, docPageStyles } from '../../shared/styles';

const styles = css`${docPageStyles}`;

const DocApiReference = defineElement('rikka-doc-api-ref', {
  styles,
  render() {
    return div({ class: 'doc-page' },
      h1('API Reference'),
      p('Complete API reference for all Rikka packages.'),

      div({ class: 'doc-content' },

        h2('rikka-signal'),
        p('Reactive primitives built on the TC39 Signals proposal.'),
        p('Re-exports ', sharedStyles.inlineCode('Signal'), ' from ', sharedStyles.inlineCode('signal-polyfill'), '.'),

        h3('signal<T>(initialValue)'),
        p('Creates a reactive state container.'),
        pre({ class: 'code-block' }, code(
          `function signal<T>(initialValue: T): Signal.State<T>

const count = signal(0);
count.get();   // 0
count.set(5);  // triggers subscribers`
        )),

        h3('computed<T>(fn)'),
        p('Creates a derived signal that auto-tracks dependencies. Lazy and cached.'),
        pre({ class: 'code-block' }, code(
          `function computed<T>(fn: () => T): Signal.Computed<T>

const a = signal(2);
const b = signal(3);
const sum = computed(() => a.get() + b.get());
sum.get();  // 5 — cached until a or b changes`
        )),

        h3('effect(fn)'),
        p('Runs a function reactively. Re-runs when tracked signals change. Returns a dispose function.'),
        pre({ class: 'code-block' }, code(
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
});`
        )),

        h3('store<T>(initial)'),
        p('Creates a reactive proxy where each property is a signal. Nested objects are deeply reactive.'),
        pre({ class: 'code-block' }, code(
          `function store<T extends object>(initial: T): Store<T>

const user = store({
  name: 'Alice',
  age: 25,
  preferences: { theme: 'dark' }
});

user.name;              // "Alice" — raw value
signalOf(user, 'name'); // Signal.State<string> — for reactive binding
user.name = 'Bob';  // reactive set

// Nested objects are also stores
user.preferences.theme = 'light';  // reactive`
        )),
        p({ style: { color: '#94a3b8', fontSize: '0.875rem', marginTop: '4px' } },
          sharedStyles.inlineCode('signalOf()'), ': access the underlying ',
          sharedStyles.inlineCode('Signal.State'), ' for fine-grained reactivity in templates.'
        ),

        h3('raw(store)'),
        p('Returns the underlying plain object without reactivity proxy.'),
        pre({ class: 'code-block' }, code(
          `function raw<T extends object>(store: Store<T>): T

const user = store({ name: 'Alice' });
const plain = raw(user);
plain.name = 'Bob';  // no reactivity`
        )),

        h3('Signal (re-export)'),
        p('The full Signal namespace from signal-polyfill, including:'),
        pre({ class: 'code-block' }, code(
          `Signal.State<T>       — writable signal, .get() / .set()
Signal.Computed<T>    — read-only derived signal
Signal.isState(v)      — type guard for State
Signal.isComputed(v)   — type guard for Computed
Signal.subtle.Watcher  — low-level dependency watcher`
        )),

        h2('rikka-dom'),
        p('DOM creation utilities: h(), tag helpers, control flow, templates.'),

        h3('h(tag, attrs?, ...children)'),
        p('Creates a DOM element directly.'),
        pre({ class: 'code-block' }, code(
          `function h<K extends keyof ElementTagNameMap>(
  tag: K,
  attrs?: Attributes<K>,
  ...children: Child[]
): ElementTagNameMap[K]

// Returns Element directly:
const el = div({ class: 'card' }, 'Hello');  // HTMLDivElement

// Children accept: string | number | HTMLElement | Signal | ReactiveRange | Child[] | null | false`
        )),

        h3('h`...` (tagged template)'),
        p('HTML template literal returning Element[]. Use ', sharedStyles.inlineCode('[0]'), ' for single element, or ', sharedStyles.inlineCode('h\\`<template>\\`[0]'), ' for template elements.'),
        pre({ class: 'code-block' }, code(
          `function h(strings: TemplateStringsArray, ...values: any[]): Element[]

const name = signal('World');
const nodes = h\`<span>Hello \${name}!</span>\`;

// Fine-grained: \${signal} creates effect on text node
// Coarse-grained: \${signal.get()} resolves immediately`
        )),

        h3('Tag Helpers'),
        p('40 pre-bound helpers with the same signature as ', sharedStyles.inlineCode('h()'), ':'),
        pre({ class: 'code-block' }, code(
          `div, span, p, a, button, input, form, ul, ol, li
h1, h2, h3, h4, h5, h6, header, footer, main, section
nav, article, aside, img, table, thead, tbody, tr, th, td
label, select, option, textarea, pre, code, br, hr
slot, template, svg, circle
svga, svgscript, svgstyle, svgtitle

// All return Element directly:
div({ id: 'app' }, h1({}, 'Title'))  // → HTMLElement`
        )),

        h3('For(source, render, keyFn?)'),
        p('Reactive list rendering. Only adds/removes changed items when keyFn is provided.'),
        pre({ class: 'code-block' }, code(
          `function For<T, K = T>(
  source: Signal.State<T[]> | Signal.Computed<T[]>,
  render: (item: T, index: number) => Element,
  keyFn?: (item: T, index: number) => K
): ReactiveRange

const items = signal(['A', 'B', 'C']);
const list = For(items, (item) => li({}, item));
items.set(['A', 'B', 'D']);  // only 'D' is appended`
        )),

        h3('Show(condition, render)'),
        p('Conditionally show/hide an element.'),
        pre({ class: 'code-block' }, code(
          `function Show(
  condition: boolean | Signal.State<boolean> | Signal.Computed<boolean>,
  render: () => Element | null
): ReactiveRange

const visible = signal(true);
Show(visible, () => div({}, 'Visible!'));
visible.set(false);  // element removed from DOM`
        )),

        h3('When(condition, trueRender, falseRender)'),
        p('Conditional branching — renders one of two branches.'),
        pre({ class: 'code-block' }, code(
          `function When(
  condition: boolean | Signal.State<boolean> | Signal.Computed<boolean>,
  trueRender: () => Element | null,
  falseRender: () => Element | null
): ReactiveRange`

        )),

        h3('Switch(value, ...cases, fallback?)'),
        p('Multi-way conditional branching.'),
        pre({ class: 'code-block' }, code(
          `function Switch<T>(
  value: T | Signal.State<T> | Signal.Computed<T>,
  cases: Case<T>[],
  fallback?: () => Element | null
): ReactiveRange

const tab = signal('home');
Switch(tab,
  Match('home', () => div({}, 'Home')),
  Match('about', () => div({}, 'About')),
)`
        )),

        h3('Match(match, render)'),
        p('Defines a case for Switch.'),
        pre({ class: 'code-block' }, code(
          `function Match<T>(
  match: T | ((value: T) => boolean),
  render: () => Element | null
): Case<T>`
        )),

        h3('css`...`'),
        p('Creates a CSSStyleSheet from tagged template literal.'),
        pre({ class: 'code-block' }, code(
          `function css(strings: TemplateStringsArray, ...values: any[]): CSSStyleSheet

const styles = css\`
  :host { display: block; }
  .card { padding: 1rem; border-radius: 8px; }
\`;

defineElement('my-el', { styles });`
        )),

        h3('inlineStyle`...`'),
        p('Parses CSS into a style record object for inline styles.'),
        pre({ class: 'code-block' }, code(
          `function inlineStyle(strings: TemplateStringsArray, ...values: any[]): Record<string, string>

const s = inlineStyle\`padding: 16px; color: red; font-size: 14px\`;
// { padding: '16px', color: 'red', fontSize: '14px' }

div({ style: s }, 'Hello')`
        )),

        h2('rikka-elements'),
        p('Declarative custom elements with reactive attributes, events, shadow DOM, styles, and render function.'),

        h3('defineElement(tagName, config?)'),
        p('Defines a Web Component with typed attributes, events, shadow DOM, and render function.'),
        pre({ class: 'code-block' }, code(
          `function defineElement<const C extends ElementConfig>(
  tagName: string,
  config?: C
): ElementConstructor<C>

const MyCounter = defineElement('my-counter', {
  attributes: {
    count: { type: Number, default: 0 },  // with default value
    label: String,
    active: Boolean,
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
});`
        )),

        h3('event<T>()'),
        p('Type marker for events that carry a detail payload via a transform function.'),
        pre({ class: 'code-block' }, code(
          `function event<T = void>(): ((domEvent: Event) => T) | undefined

events: {
  click: (e: MouseEvent) => ({ x: e.clientX, y: e.clientY }),
  reset: undefined,
}`
        )),

        h3('ElementConfig'),
        pre({ class: 'code-block' }, code(
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
  | BaseConfig;`
        )),

        h3('AttributeSpec<T>'),
        pre({ class: 'code-block' }, code(
          `type AttributeSpec<T> =
  | ((attr: string | undefined) => T)   // parse function
  | {                                    // or object form
      type: (attr: string | undefined) => T;
      default?: T;
    };

// Built-in parsers:
Number   // "42" → 42, "" → NaN
String   // identity
Boolean  // attr present → true, absent → false
// Custom: (v) => JSON.parse(v ?? 'null')
// With default: { type: Number, default: 0 }
`
        )),

        h3('EventSpec'),
        pre({ class: 'code-block' }, code(
          `type EventSpec = ((domEvent: Event) => any) | undefined;

// Transform function: receives DOM event, returns custom event detail
(domEvent: MouseEvent) => ({ x: domEvent.clientX })
undefined  // no detail (void)
`
        )),

        h3('Generated Instance Members'),
        p('For each attribute ', sharedStyles.inlineCode('name'), ' of type ', sharedStyles.inlineCode('T'), ':'),
        table({ class: 'api-table' },
          thead(tr(th('Member'), th('Type'), th('Description'))),
          tbody(
            tr(td(code('el.name')), td(code('T')), td('Get/set raw value. Triggers attributeChangedCallback.')),
            tr(td(code('el.$name')), td(code('Signal.State<T>')), td('Underlying signal. Use for reactive bindings.')),
          )
        ),
        p('For each event ', sharedStyles.inlineCode('name'), ' with detail ', sharedStyles.inlineCode('D'), ':'),
        table({ class: 'api-table' },
          thead(tr(th('Member'), th('Type'), th('Description'))),
          tbody(
            tr(td(code('el.dispatchName(detail?)')), td(code('() => boolean')), td('Dispatch CustomEvent with optional detail.')),
            tr(td(code('el.onName')), td(code('(ev) => void | null')), td('Get/set event handler. Auto-wrapped to prevent infinite loops.')),
          )
        ),
        p('Additional instance members:'),
        table({ class: 'api-table' },
          thead(tr(th('Member'), th('Type'), th('Condition'))),
          tbody(
            tr(td(code('el.shadowRoot')), td(code('ShadowRoot')), td('When shadow !== false')),
            tr(td(code('el.methodName()')), td('From methods config'), td('When methods is provided')),
          )
        ),

        h3('Template Binding Syntax'),
        p('When ', sharedStyles.inlineCode('config.template'), ' is provided:'),
        table({ class: 'api-table' },
          thead(tr(th('Syntax'), th('Binding Type'), th('Behavior'))),
          tbody(
            tr(td(code('{{name}}')), td('Text'), td('textContent, prefers $name signal')),
            tr(td(code('attr="{{name}}"')), td('Attribute'), td('setAttribute, reactive if signal')),
            tr(td(code('onclick="{{@action}}"')), td('Event dispatch'), td('DOM event → transform(el.dispatchAction(detail))')),
          )
        ),

        h2('Type Exports'),
        table({ class: 'api-table' },
          thead(tr(th('Type'), th('Package'), th('Description'))),
          tbody(
            tr(td(code('Signal.State<T>')), td('rikka-signal'), td('Writable reactive state container')),
            tr(td(code('Signal.Computed<T>')), td('rikka-signal'), td('Read-only derived signal with caching')),
            tr(td(code('Store<T>')), td('rikka-signal'), td('Reactive proxy with $-prefix signal access')),
            tr(td(code('StoreSignalRefs<T>')), td('rikka-signal'), td('Maps $K → Signal.State<T[K]>')),
            tr(td(code('Child')), td('rikka-dom'), td('string | number | Node | Signal | ReactiveRange | null | false')),
            tr(td(code('Attributes<K>')), td('rikka-dom'), td('Typed attribute map for element K')),
            tr(td(code('ReactiveRange')), td('rikka-dom'), td('For/Show/When/Switch output — managed node range')),
            tr(td(code('Case<T>')), td('rikka-dom'), td('Single case definition for Switch')),
            tr(td(code('AttributeSpec<T>')), td('rikka-elements'), td('Attribute parser/serializer spec')),
            tr(td(code('EventSpec')), td('rikka-elements'), td('(DOM Event → detail) transform | undefined')),
            tr(td(code('ElementConfig')), td('rikka-elements'), td('Full configuration for defineElement')),
            tr(td(code('ElementInstance<C>')), td('rikka-elements'), td('HTMLElement & props & signals & events & shadow & methods')),
            tr(td(code('ElementConstructor<C>')), td('rikka-elements'), td('Typed constructor + observedAttributes')),
          )
        ),
      ),

      div({ class: 'doc-nav' },
        a({ href: '#/docs/rikka-elements/attach-template', class: 'prev-link' }, '\u2190 attachTemplate'),
        div({ class: 'spacer' }),
        a({ href: '#/docs/rikka-signal/store', class: 'next-link' }, 'store() \u2192'),
      ),
    );
  }
});

export { DocApiReference };
