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

export const RikkaDocSignal02 = defineElement('rikka-doc-signal-02', {
  styles,
  render() {
    return div({ class: 'doc-page' },
      div({ class: 'doc-header' },
        h1({ class: 'doc-title' }, tr(docContent.sidebar.signal)),
        p({ class: 'doc-subtitle' }, tr(docContent.signal.subtitle)),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, tr(docContent.signal.creating)),
        p(
          tr(docContent.signal.creatingDesc),
          sharedHelpers.inlineCode('signal(initialValue)'),
          tr(docContent.signal.creatingDescMethods),
          sharedHelpers.inlineCode('.get()'),
          tr(docContent.signal.creatingDescMethods),
          sharedHelpers.inlineCode('.set()'),
          tr(docContent.signal.creatingDescMethodsEnd),
        ),
        RikkaLivePlayground.h({
    code: `const count = signal(0);
count.get();  // 0
count.set(1); // triggers updates

container.appendChild(div({},
  p({}, 'Count: ', count),
  button({ onclick: () => count.set(count.get() + 1) }, 'Increment')
));`, height: '200', title: 'Signal Basics'
}),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, tr(docContent.signal.passingToDom)),
        p({}, tr(docContent.signal.passingToDomDesc)),
        RikkaLivePlayground.h({
    code: `const name = signal('Rikka');
const el = h('p', name); // auto-updates
name.set('World'); // DOM updates

container.appendChild(div({},
  h2({}, 'Signal in DOM'),
  el,
  button({ onclick: () => name.set(name.get() === 'Rikka' ? 'World' : 'Rikka') }, 'Toggle Name')
));`, height: '200', title: 'Signal to DOM'
}),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, tr(docContent.ui.tryIt)),
        RikkaLivePlayground.h({
    code: `import { signal } from '@takanashi/rikka-signal';

const count = signal(0);

const increment = () => count.set(count.get() + 1);
const decrement = () => count.set(count.get() - 1);

// Pass signal directly — DOM auto-updates
const app = h('div', [
  h('p', count),
  h('button', { onclick: increment }, ['+']),
  h('button', { onclick: decrement }, ['-']),
]);

container.appendChild(app);`, height: "320", title: 'Counter Demo'
}),
      ),
      div({ class: 'doc-section' },
        h2({ class: 'section-title' }, tr(docContent.ui.api)),
        pre({ class: 'code-block' }, `function signal<T>(initialValue: T): Signal.State<T>

interface Signal.State<T> {
  get(): T;
  set(value: T): void;
}`),
      ),
      div({ class: 'doc-nav' },
        a({ class: 'nav-link prev', href: '#/docs/@takanashi/rikka-signal/getting-started' },
          tr(docContent.signal.prevGettingStarted),
        ),
        a({ class: 'nav-link next', href: '#/docs/@takanashi/rikka-signal/computed' },
          tr(docContent.signal.nextComputed),
        ),
      ),
    );
  }
});
