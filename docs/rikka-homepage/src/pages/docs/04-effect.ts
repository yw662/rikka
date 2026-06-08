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

export const RikkaDocSignal04 = defineElement('rikka-doc-signal-04', {
  styles,
  render() {
    return div({ class: 'doc-page' },
      div({ class: 'doc-header' },
        h1({ class: 'doc-title' }, tr(docContent.sidebar.effect)),
        p({ class: 'doc-subtitle' }, tr(docContent.effect.subtitle)),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, tr(docContent.effect.creating)),
        p(
          tr(docContent.effect.creatingDesc1),
          sharedHelpers.inlineCode('effect(fn)'),
          tr(docContent.effect.creatingDesc2),
        ),
        RikkaLivePlayground.h({
    code: `const count = signal(0);
const logs = signal<string[]>([]);
const logText = computed(() => logs.get().join('\\n'));

effect(() => {
  const msg = \`Count is now \${count.get()}\`;
  logs.set([...logs.get(), msg]);
});

container.appendChild(div({},
  h2({}, 'Effect Demo'),
  p({}, 'Count: ', count),
  button({ onclick: () => count.set(count.get() + 1) }, 'Increment'),
  pre({ style: { marginTop: '8px', padding: '8px', background: '#0d1117', borderRadius: '4px', color: '#94a3b8', fontSize: '0.75rem', maxHeight: '120px', overflow: 'auto' } }, logText)
));`, height: '260', title: 'Effect Basics'
}),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, tr(docContent.effect.cleanup)),
        p(
          tr(docContent.effect.cleanupDesc1),
          sharedHelpers.inlineCode('cleanup function'),
          tr(docContent.effect.cleanupDesc2),
        ),
        p({ style: { paddingLeft: '16px', margin: '8px 0' } },
          tr(docContent.effect.cleanupCase1),
        ),
        p({ style: { paddingLeft: '16px', margin: '8px 0' } },
          tr(docContent.effect.cleanupCase2),
        ),
        p({}, tr(docContent.effect.cleanupDesc3)),
        RikkaLivePlayground.h({
    code: `const count = signal(0);
const logs = signal<string[]>([]);
const logText = computed(() => logs.get().join('\\n'));

effect(() => {
  logs.set([...logs.get(), 'effect: count=' + count.get()]);
  return () => {
    logs.set([...logs.get(), 'cleanup']);
  };
});

container.appendChild(div({},
  h2({}, 'Cleanup Execution Order'),
  p({}, 'Count: ', count),
  button({ onclick: () => count.set(count.get() + 1) }, 'Increment'),
  p({ style: { marginTop: '8px', color: '#71717a', fontSize: '0.8rem' } }, 'Each click triggers: cleanup → effect'),
  pre({ style: { marginTop: '8px', padding: '8px', background: '#0d1117', borderRadius: '4px', color: '#94a3b8', fontSize: '0.75rem', maxHeight: '120px', overflow: 'auto' } }, logText)
));`, height: '280', title: 'Effect Cleanup'
}),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, tr(docContent.effect.disposing)),
        p(
          sharedHelpers.inlineCode('effect()'),
          tr(docContent.effect.disposingDesc1),
        ),
        RikkaLivePlayground.h({
    code: `const count = signal(0);
const logs = signal<string[]>([]);
const logText = computed(() => logs.get().join('\\n'));

const dispose = effect(() => {
  logs.set([...logs.get(), 'count: ' + count.get()]);
});

count.set(1);

container.appendChild(div({},
  h2({}, 'Dispose Effect'),
  p({}, 'Count: ', count),
  button({ onclick: () => count.set(count.get() + 1) }, 'Increment'),
  button({ onclick: () => { dispose(); logs.set([...logs.get(), '— disposed —']); }, style: { marginLeft: '8px' } }, 'Dispose'),
  pre({ style: { marginTop: '8px', padding: '8px', background: '#0d1117', borderRadius: '4px', color: '#94a3b8', fontSize: '0.75rem', maxHeight: '120px', overflow: 'auto' } }, logText)
));`, height: '280', title: 'Effect Dispose'
}),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, tr(docContent.ui.tryIt)),
        RikkaLivePlayground.h({
    code: `import { signal, effect } from '@takanashi/rikka-signal';

const count = signal(0);
const log: string[] = [];

const dispose = effect(() => {
  const msg = \`Count: \${count.get()}\`;
  log.push(msg);
  console.log(msg);
  return () => {
    console.log('cleanup before next run');
  };
});

count.set(1);
count.set(2);

console.log('Log:', log);
// ['Count: 0', 'Count: 1', 'Count: 2']

dispose();`, height: "340", title: 'Effect Logging Demo'
}),
      ),
      div({ class: 'doc-nav' },
        a({ class: 'nav-link prev', href: '#/docs/@takanashi/rikka-signal/computed' },
          tr(docContent.effect.prevComputed),
        ),
        a({ class: 'nav-link next', href: '#/docs/@takanashi/rikka-dom/h' },
          tr(docContent.effect.nextH),
        ),
      ),
    );
  }
});
