import { defineElement } from '@takanashi/rikka-elements';
import { css, div, h1, h2, p, a, pre, code, ul, li } from '@takanashi/rikka-dom';
import { signal } from '@takanashi/rikka-signal';
import {sharedHelpers} from '../../shared/helpers';
import {docPageStyles} from '../../shared/page-styles';
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const styles = css`${docPageStyles}`;

const DocDom06 = defineElement('rikka-doc-dom-06', {
  styles,
  render() {
    const count = signal(0);

    return div({ class: 'doc-page' },
      h1('h()'),
      p('The core function for creating DOM elements with reactive support.'),
      div({ class: 'doc-content' },
        h2('Key Concepts'),
        ul(
          li(sharedHelpers.inlineCode('h(tag, attrs?, ...children)'), ' — Create an element by tag name.'),
          li('Children can be ', sharedHelpers.inlineCode('string'), ', ', sharedHelpers.inlineCode('number'), ', ', sharedHelpers.inlineCode('Element'), ', ', sharedHelpers.inlineCode('Signal'), ', or ', sharedHelpers.inlineCode('array'), '.'),
          li('Signals in children automatically subscribe and update when changed.'),
          li('Attributes accept plain objects; event handlers use ', sharedHelpers.inlineCode('on{Event}'), ' naming.'),
        ),
        h2('API Signature'),
        pre({ class: 'code-block' }, code(
          `h<K extends keyof ElementTagNameMap>(
  tag: K,
  attrs?: Attributes<K>,
  ...children: Child[]
): Element`
        )),
      ),
      div({ class: 'playground-section' },
        h2('Try It'),
        RikkaLivePlayground.h({
    code: `function CounterExample() {
  const count = signal(0);
  return div({ style: { textAlign: 'center' } },
    p({ style: { fontSize: '2em', fontWeight: 'bold' } }, count),
    button({ onclick: () => count.set(count.get() - 1) }, "-"),
    span({ style: { margin: '0 12px' } }, "count"),
    button({ onclick: () => count.set(count.get() + 1) }, "+")
  );
}

container.appendChild(CounterExample());`, height: '220', title: 'Basic h() Usage'
}),
      ),
      div({ class: 'doc-nav' },
        a({ href: '#/docs/@takanashi/rikka-signal/effect', class: 'prev-link' }, '\u2190 effect()'),
        div({ class: 'spacer' }),
        a({ href: '#/docs/@takanashi/rikka-dom/tag-helpers', class: 'next-link' }, 'Tag Helpers \u2192'),
      ),
    );
  }
});

export { DocDom06 };
