import { defineElement } from '@rikka/elements';
import { css, div, h1, h2, p, a, pre, code, ul, li } from '@rikka/dom';
import { signal } from '@rikka/signal';
import { sharedStyles, docPageStyles } from '../../shared/styles';

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
          li(sharedStyles.inlineCode('h(tag, attrs?, ...children)'), ' — Create an element by tag name.'),
          li('Children can be ', sharedStyles.inlineCode('string'), ', ', sharedStyles.inlineCode('number'), ', ', sharedStyles.inlineCode('Element'), ', ', sharedStyles.inlineCode('Signal'), ', or ', sharedStyles.inlineCode('array'), '.'),
          li('Signals in children automatically subscribe and update when changed.'),
          li('Attributes accept plain objects; event handlers use ', sharedStyles.inlineCode('on{Event}'), ' naming.'),
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
        sharedStyles.createPlayground(
          `function CounterExample() {
  const count = signal(0);
  return div({ style: { textAlign: 'center' } },
    p({ style: { fontSize: '2em', fontWeight: 'bold' } }, count),
    button({ onclick: () => count.set(count.get() - 1) }, "-"),
    span({ style: { margin: '0 12px' } }, "count"),
    button({ onclick: () => count.set(count.get() + 1) }, "+")
  );
}

container.appendChild(CounterExample());`,
          '220',
          'Basic h() Usage'
        ),
      ),
      div({ class: 'doc-nav' },
        a({ href: '#/docs/rikka-signal/batch', class: 'prev-link' }, '\u2190 batch'),
        div({ class: 'spacer' }),
        a({ href: '#/docs/rikka-dom/tag-helpers', class: 'next-link' }, 'Tag Helpers \u2192'),
      ),
    );
  }
});

export { DocDom06 };
