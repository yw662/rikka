import { defineElement } from '@takanashi/rikka-elements';
import { css, div, h1, h2, p, pre, a } from '@takanashi/rikka-dom';
import {sharedHelpers} from '../../shared/helpers';
import {docPageStyles} from '../../shared/page-styles';
import { docContent } from '../../shared/doc-content';
import { tr } from '../../shared/i18n';
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const styles = css`
  ${docPageStyles}
`;

export const RikkaDocSignal03 = defineElement('rikka-doc-signal-03', {
  styles,
  render() {
    return div({ class: 'doc-page' },
      div({ class: 'doc-header' },
        h1({ class: 'doc-title' }, tr(docContent.sidebar.computed)),
        p({ class: 'doc-subtitle' }, tr(docContent.computed.subtitle)),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, tr(docContent.computed.creating)),
        p(
          tr(docContent.computed.creatingDesc1),
          sharedHelpers.inlineCode('computed(fn)'),
          tr(docContent.computed.creatingDesc2),
        ),
        RikkaLivePlayground.h({
    code: `const firstName = signal('Rikka');
const lastName = signal('Reactive');
const fullName = computed(() => \`\${firstName.get()} \${lastName.get()}\`);

fullName.get(); // 'Rikka Reactive'

container.appendChild(div({},
  h2({}, 'Computed Signal'),
  p({}, 'Full Name: ', fullName),
  div({ style: { display: 'flex', gap: '8px', marginTop: '8px' } },
    input({ value: firstName, placeholder: 'First name' }),
    input({ value: lastName, placeholder: 'Last name' })
  )
));`, height: '220', title: 'Computed Basics'
}),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, tr(docContent.computed.autoTracking)),
        p(
          tr(docContent.computed.autoTrackingDesc1),
          sharedHelpers.inlineCode('.get()'),
          tr(docContent.computed.autoTrackingDesc2),
        ),
        p({}, tr(docContent.computed.autoTrackingNoArrays)),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, tr(docContent.computed.lazyEvaluation)),
        p(
          tr(docContent.computed.lazyEvaluationDesc),
          sharedHelpers.inlineCode('.get()'),
          tr(docContent.computed.lazyEvaluationDescMid),
        ),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, tr(docContent.computed.slicingTitle)),
        p(
          tr(docContent.computed.slicingDesc1),
          sharedHelpers.inlineCode('computed'),
          tr(docContent.computed.slicingDesc1Mid),
          sharedHelpers.inlineCode('computed'),
          tr(docContent.computed.slicingDesc1End),
        ),
        p(
          sharedHelpers.inlineCode('Computed'),
          tr(docContent.computed.slicingDesc2),
          sharedHelpers.inlineCode('signal'),
          tr(docContent.computed.slicingDesc2End),
        ),
        RikkaLivePlayground.h({
    code: `const user = signal({
  info: { name: 'Alice', email: 'a@b.c', age: 30 },
  settings: { theme: 'dark', lang: 'en' },
});

// Each computed depends on exactly one slice
const userName = computed(() => user.get().info.name);
const userTheme = computed(() => user.get().settings.theme);

// Effects fire only when their slice actually changes
effect(() => console.log('name ->', userName.get()));
effect(() => console.log('theme ->', userTheme.get()));

container.appendChild(div({},
  h2({}, 'Slices'),
  p({}, 'name: ', userName),
  p({}, 'theme: ', userTheme),
  h2({}, 'Mutate one slice at a time'),
  div({ style: { display: 'flex', gap: '8px' } },
    button({
      onclick: () => {
        const u = user.get();
        user.set({ ...u, info: { ...u.info, name: u.info.name + '!' } });
      },
    }, 'Bump name'),
    button({
      onclick: () => {
        const u = user.get();
        user.set({ ...u, settings: { ...u.settings, theme: u.settings.theme === 'dark' ? 'light' : 'dark' } });
      },
    }, 'Toggle theme'),
  ),
));`, height: "420", title: 'Slicing a Signal'
}),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, tr(docContent.ui.tryIt)),
        RikkaLivePlayground.h({
    code: `import { signal, computed } from '@takanashi/rikka-signal';

const firstName = signal('Rikka');
const lastName = signal('Reactive');
const fullName = computed(() => \`\${firstName.get()} \${lastName.get()}\`);

effect(() => {
  console.log(fullName.get());
});

firstName.set('Hello');
// Logs: 'Hello Reactive'`, height: "300", title: 'Full Name Demo'
}),
      ),
      div({ class: 'doc-nav' },
        a({ class: 'nav-link prev', href: '#/docs/@takanashi/rikka-signal/signal' },
          tr(docContent.computed.prevSignal),
        ),
        a({ class: 'nav-link next', href: '#/docs/@takanashi/rikka-signal/effect' },
          tr(docContent.computed.nextEffect),
        ),
      ),
    );
  }
});
