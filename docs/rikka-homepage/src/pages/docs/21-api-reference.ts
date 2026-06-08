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
import { docContent } from "../../shared/doc-content";
import { tr as t_ } from "../../shared/i18n";

const styles = css`
  ${docPageStyles}
`;

const DocApiReference = defineElement("rikka-doc-api-ref", {
  styles,
  render() {
    const C = docContent.apiReference;
    return div(
      { class: "doc-page" },
      h1({}, t_(C.title)),
      p({}, t_(C.desc)),

      div(
        { class: "doc-content" },

        h2({}, t_(C.signalPackage)),
        p({}, t_(C.signalPackageDesc)),
        p(
          t_(C.signalPackageReExport1),
          sharedHelpers.inlineCode("Signal"),
          t_(C.signalPackageReExport2),
          sharedHelpers.inlineCode("signal-polyfill"),
          t_(C.signalPackageReExport3),
        ),

        h3({}, t_(C.signalFn)),
        p({}, t_(C.signalFnDesc)),
        pre(
          { class: "code-block" },
          code(
            `function signal<T>(initialValue: T): Signal.State<T>

const count = signal(0);
count.get();   // 0
count.set(5);  // triggers subscribers`,
          ),
        ),

        h3({}, t_(C.computedFn)),
        p({}, t_(C.computedFnDesc)),
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

        h3({}, t_(C.effectFn)),
        p({}, t_(C.effectFnDesc)),
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

        h3({}, t_(C.signalNamespace)),
        p({}, t_(C.signalNamespaceDesc)),
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

        h2({}, t_(C.domPackage)),
        p({}, t_(C.domPackageDesc)),

        h3({}, t_(C.hFn)),
        p({}, t_(C.hFnDesc)),
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

        h3({}, t_(C.hTemplateFn)),
        sharedHelpers.advancedBadge(
          "h`...`",
          C.hTemplateFnAdvanced,
        ),
        p(
          t_(C.hTemplateFnDesc1),
          sharedHelpers.inlineCode("[0]"),
          t_(C.hTemplateFnDesc1End),
          sharedHelpers.inlineCode("h\\`<template>\\`[0]"),
          t_(C.hTemplateFnDesc1Final),
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

        h3({}, t_(C.tagHelpersHeading)),
        p(
          t_(C.tagHelpersDesc1),
          sharedHelpers.inlineCode("h()"),
          t_(C.tagHelpersDesc1End),
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

        h3({}, t_(C.forFn)),
        p({}, t_(C.forFnDesc)),
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

        h3({}, t_(C.showFn)),
        p({}, t_(C.showFnDesc)),
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

        h3({}, t_(C.whenFn)),
        p({}, t_(C.whenFnDesc)),
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

        h3({}, t_(C.switchFn)),
        sharedHelpers.advancedBadge(
          "Switch()",
          C.switchFnAdvanced,
        ),
        p({}, t_(C.switchFnDesc)),
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

        h3({}, t_(C.matchFn)),
        sharedHelpers.advancedBadge(
          "Match()",
          C.matchFnAdvanced,
        ),
        p({}, t_(C.matchFnDesc)),
        pre(
          { class: "code-block" },
          code(
            `function Match<T>(
  match: T | ((value: T) => boolean),
  render: () => Element | null
): Case<T>`,
          ),
        ),

        h3({}, t_(C.cssFn)),
        sharedHelpers.advancedBadge(
          "css`...`",
          C.cssFnAdvanced,
        ),
        p({}, t_(C.cssFnDesc)),
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

        h3({}, t_(C.inlineStyleFn)),
        sharedHelpers.advancedBadge(
          "inlineStyle`...`",
          C.inlineStyleFnAdvanced,
        ),
        p({}, t_(C.inlineStyleFnDesc)),
        pre(
          { class: "code-block" },
          code(
            `function inlineStyle(strings: TemplateStringsArray, ...values: any[]): Record<string, string>

const s = inlineStyle\`padding: 16px; color: red; font-size: 14px\`;
// { padding: '16px', color: 'red', fontSize: '14px' }

div({ style: s }, 'Hello')`,
          ),
        ),

        h2({}, t_(C.elementsPackage)),
        sharedHelpers.advancedBadge(
          "@takanashi/rikka-elements",
          C.elementsPackageAdvanced,
        ),
        p({}, t_(C.elementsPackageDesc)),

        h3({}, t_(C.defineElementFn)),
        p({}, t_(C.defineElementFnDesc)),
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

        h3({}, t_(C.eventTypeHelper)),
        p({}, t_(C.eventTypeHelperDesc)),
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

        h3({}, t_(C.elementConfig)),
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

        h3({}, t_(C.attributeSpec)),
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

        h3({}, t_(C.eventSpec)),
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

        h3({}, t_(C.generatedMembers)),
        p(
          t_(C.generatedMembersDesc1),
          sharedHelpers.inlineCode("name"),
          t_(C.generatedMembersDesc1Mid),
          sharedHelpers.inlineCode("T"),
          t_(C.generatedMembersDesc1End),
        ),
        table(
          { class: "api-table" },
          thead(tr(th({}, t_(C.thMember)), th({}, t_(C.thType)), th({}, t_(C.thDescription)))),
          tbody(
            tr(
              td(code("el.name")),
              td(code("T")),
              td({}, t_(C.tdGetSetValue)),
            ),
            tr(
              td(code("el.$name")),
              td(code("Signal.State<T>")),
              td({}, t_(C.tdUnderlyingSignal)),
            ),
          ),
        ),
        p(
          t_(C.generatedMembersEventDesc1),
          sharedHelpers.inlineCode("name"),
          t_(C.generatedMembersEventDesc1Mid),
          sharedHelpers.inlineCode("D"),
          t_(C.generatedMembersEventDesc1End),
        ),
        table(
          { class: "api-table" },
          thead(tr(th({}, t_(C.thMember)), th({}, t_(C.thType)), th({}, t_(C.thDescription)))),
          tbody(
            tr(
              td(code("el.dispatchName(detail?)")),
              td(code("() => boolean")),
              td({}, t_(C.tdDispatchCustomEvent)),
            ),
            tr(
              td(code("el.onName")),
              td(code("(ev) => void | null")),
              td({}, t_(C.tdGetSetHandler)),
            ),
          ),
        ),
        p({}, t_(C.additionalMembers)),
        table(
          { class: "api-table" },
          thead(tr(th({}, t_(C.thMember)), th({}, t_(C.thType)), th({}, t_(C.thCondition)))),
          tbody(
            tr(
              td(code("el.shadowRoot")),
              td(code("ShadowRoot")),
              td({}, t_(C.tdShadowRootCondition)),
            ),
            tr(
              td(code("el.methodName()")),
              td({}, t_(C.tdFromMethodsConfig)),
              td({}, t_(C.tdWhenMethodsProvided)),
            ),
          ),
        ),

        h3({}, t_(C.templateBindingSyntax)),
        p(
          t_(C.templateBindingSyntaxDesc1),
          sharedHelpers.inlineCode("config.template"),
          t_(C.templateBindingSyntaxDesc1End),
        ),
        table(
          { class: "api-table" },
          thead(tr(th({}, t_(C.thSyntax)), th({}, t_(C.thBindingType)), th({}, t_(C.thBehavior)))),
          tbody(
            tr(
              td(code("{{name}}")),
              td({}, t_(C.tdText)),
              td({}, t_(C.tdTextContent)),
            ),
            tr(
              td(code('attr="{{name}}"')),
              td({}, t_(C.tdAttribute)),
              td({}, t_(C.tdSetAttribute)),
            ),
            tr(
              td(code('onclick="{{@action}}"')),
              td({}, t_(C.tdEventDispatch)),
              td({}, t_(C.tdEventDispatchBehavior)),
            ),
          ),
        ),

        h2({}, t_(C.typeExports)),
        table(
          { class: "api-table" },
          thead(tr(th({}, t_(C.thType)), th({}, t_(C.thPackage)), th({}, t_(C.thDescription)))),
          tbody(
            tr(
              td(code("Signal.State<T>")),
              td("@takanashi/rikka-signal"),
              td({}, t_(C.typeSignalState)),
            ),
            tr(
              td(code("Signal.Computed<T>")),
              td("@takanashi/rikka-signal"),
              td({}, t_(C.typeSignalComputed)),
            ),
            tr(
              td(code("Child")),
              td("@takanashi/rikka-dom"),
              td({}, t_(C.typeChild)),
            ),
            tr(
              td(code("Attributes<K>")),
              td("@takanashi/rikka-dom"),
              td({}, t_(C.typeAttributes)),
            ),
            tr(
              td(code("ReactiveRange")),
              td("@takanashi/rikka-dom"),
              td({}, t_(C.typeReactiveRange)),
            ),
            tr(
              td(code("Case<T>")),
              td("@takanashi/rikka-dom"),
              td({}, t_(C.typeCase)),
            ),
            tr(
              td(code("AttributeSpec<T>")),
              td("@takanashi/rikka-elements"),
              td({}, t_(C.typeAttributeSpec)),
            ),
            tr(
              td(code("EventSpec")),
              td("@takanashi/rikka-elements"),
              td({}, t_(C.typeEventSpec)),
            ),
            tr(
              td(code("ElementConfig")),
              td("@takanashi/rikka-elements"),
              td({}, t_(C.typeElementConfig)),
            ),
            tr(
              td(code("ElementInstance<C>")),
              td("@takanashi/rikka-elements"),
              td({}, t_(C.typeElementInstance)),
            ),
            tr(
              td(code("ElementConstructor<C>")),
              td("@takanashi/rikka-elements"),
              td({}, t_(C.typeElementConstructor)),
            ),
          ),
        ),
      ),

      div({ class: "doc-nav" }),
    );
  },
});

export { DocApiReference };
