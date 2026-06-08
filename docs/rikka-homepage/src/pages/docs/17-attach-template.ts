import { defineElement, NumberAttr, StringAttr } from "@takanashi/rikka-elements";
import { css, div, h1, h2, p, a, pre, code } from "@takanashi/rikka-dom";
import {sharedHelpers} from "../../shared/helpers";
import {docPageStyles} from "../../shared/page-styles";
import { docContent } from "../../shared/doc-content";
import { tr } from "../../shared/i18n";
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const styles = css`
  ${docPageStyles}
`;

const DocElements17 = defineElement("rikka-doc-elements-17", {
  styles,
  render() {
    return div(
      { class: "doc-page" },
      h1({}, tr(docContent.sidebar.attachTemplate)),
      sharedHelpers.advancedBadge(
        "attachTemplate",
        docContent.attachTemplate.advancedNote,
      ),
      p({}, tr(docContent.attachTemplate.desc)),
      div({ class: "api-signature" }, `config.template?: HTMLTemplateElement`),
      div(
        { class: "doc-content" },
        h2({}, tr(docContent.attachTemplate.templateOption)),
        p(
          tr(docContent.attachTemplate.templateOptionDesc1),
          sharedHelpers.inlineCode("config.template"),
          tr(docContent.attachTemplate.templateOptionDesc1End),
          sharedHelpers.inlineCode("{{name}}"),
          tr(docContent.attachTemplate.templateOptionDesc1Final),
        ),
        RikkaLivePlayground.h({
    code: `import { h } from '@takanashi/rikka-dom';

// h\`<template>\` returns Element[], [0] is the real HTMLTemplateElement
const tmpl = h\`<template>
  <div class="card" style="padding:16px;border-radius:8px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white">
    <h2 style="margin:0 0 8px">{{title}}</h2>
    <p style="margin:0">{{description}}</p>
  </div>
</template>\`[0];

const MyCard = defineElement('my-card', {
  attributes: { title: StringAttr, description: StringAttr },
  template: tmpl,
});

const el = h('my-card', { title: 'Template Demo', description: 'Using {{slot}} bindings' });
container.appendChild(div({},
  h2({}, 'Template Binding'),
  el
));`, height: "200", title: "Template Option"
}),
        h2({}, tr(docContent.attachTemplate.bindingTypes)),
        p({}, tr(docContent.attachTemplate.bindingTypesDesc)),
        pre(
          { class: "code-block" },
          code(`Text binding:      {{name}}              → textContent
Attribute binding: class="{{name}}"        → setAttribute
Event binding:     onclick="{{@action}}"    → dispatchAction(detail)`),
        ),
        h2({}, tr(docContent.attachTemplate.signalSupport)),
        p({}, tr(docContent.attachTemplate.signalSupportDesc)),
        pre(
          { class: "code-block" },
          code(`const el = document.createElement('my-component');
el.count = signal(0);
el.title = computed(() => 'Count: ' + el.count.get());
container.appendChild(el);`),
        ),
      ),
      div(
        { class: "playground-section" },
        h2({}, tr(docContent.ui.tryIt)),
        RikkaLivePlayground.h({
    code: `import { h } from '@takanashi/rikka-dom';

// h\`<template>\` returns Element[], [0] is the real HTMLTemplateElement
const cardTmpl = h\`<template>
  <style>
    .card {
      padding: 24px;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-family: system-ui;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    h2 { margin: 0 0 12px; font-size: 1.5rem; }
    p { margin: 0 0 16px; opacity: 0.9; }
    button {
      padding: 8px 16px;
      border-radius: 6px;
      border: none;
      background: rgba(255,255,255,0.2);
      color: white;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: rgba(255,255,255,0.3); }
  </style>
  <div class="card">
    <h2>{{title}}</h2>
    <p>{{description}}</p>
    <p style="margin: 0; opacity:0.7; font-size: 0.875rem">Clicks: {{clickCount}}</p>
    <button onclick="{{@action}}">{{buttonText}}</button>
  </div>
</template>\`[0];

const TemplateCard = defineElement('template-card', {
  attributes: {
    title: StringAttr,
    description: StringAttr,
    buttonText: StringAttr,
    clickCount: NumberAttr,
  },
  events: {
    // Transform DOM MouseEvent → custom event detail
    action: (clickEvent) => ({
      x: clickEvent.clientX,
      y: clickEvent.clientY,
    }),
  },
  template: cardTmpl,
});

const el = h('template-card', { title: 'Welcome', description: 'This template uses {{binding}} syntax for reactive updates.', buttonText: 'Click Me', clickCount: 0 });
el.addEventListener('action', (ev) => {
  const detail = ev.detail;
  el.clickCount++;
  el.buttonText = 'Clicked ' + el.clickCount + 'x';
  el.description = 'Click at (' + detail.x + ', ' + detail.y + ')';
});
container.appendChild(el);`, height: "300", title: "Template Binding"
}),
      ),
      div(
        { class: "doc-nav" },
        a(
          { href: "#/docs/@takanashi/rikka-elements/event", class: "prev-link" },
          tr(docContent.attachTemplate.prevEvent),
        ),
        div({ class: "spacer" }),
        a(
          { href: "#/docs/api-reference", class: "next-link" },
          tr(docContent.attachTemplate.nextApiReference),
        ),
      ),
    );
  },
});

export { DocElements17 };
