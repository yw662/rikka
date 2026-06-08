import { defineElement } from '@takanashi/rikka-elements';
import { css, div, h1, h2, p, a, pre, code, ul, li } from '@takanashi/rikka-dom';
import {sharedHelpers} from '../../shared/helpers';
import {docPageStyles} from '../../shared/page-styles';
import { docContent } from '../../shared/doc-content';
import { tr } from '../../shared/i18n';
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const styles = css`${docPageStyles}`;

const DocDom06 = defineElement('rikka-doc-dom-06', {
  styles,
  render() {
    return div({ class: 'doc-page' },
      h1({}, tr(docContent.sidebar.h)),
      p({}, tr(docContent.h.desc)),
      div({ class: 'doc-content' },
        h2({}, tr(docContent.h.keyConcepts)),
        ul(
          li(sharedHelpers.inlineCode('h(tag, attrs?, ...children)'), tr(docContent.h.bullet1)),
          li(
            tr(docContent.h.bullet2),
            sharedHelpers.inlineCode('string'),
            tr(docContent.h.bullet2Mid),
            sharedHelpers.inlineCode('number'),
            tr(docContent.h.bullet2Mid),
            sharedHelpers.inlineCode('Element'),
            tr(docContent.h.bullet2Mid),
            sharedHelpers.inlineCode('Signal'),
            tr(docContent.h.bullet2End),
            sharedHelpers.inlineCode('array'),
            tr(docContent.h.bullet2Mid),
          ),
          li({}, tr(docContent.h.bullet3)),
          li(
            tr(docContent.h.bullet4),
            sharedHelpers.inlineCode('on{Event}'),
            tr(docContent.h.bullet4End),
          ),
        ),
        h2({}, tr(docContent.h.apiSignature)),
        pre({ class: 'code-block' }, code(
          `h<K extends keyof ElementTagNameMap>(
  tag: K,
  attrs?: Attributes<K>,
  ...children: Child[]
): Element`
        )),
      ),
      div({ class: 'playground-section' },
        h2({}, tr(docContent.ui.tryIt)),
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
        a({ href: '#/docs/@takanashi/rikka-signal/effect', class: 'prev-link' },
          tr(docContent.h.prevEffect),
        ),
        div({ class: 'spacer' }),
        a({ href: '#/docs/@takanashi/rikka-dom/tag-helpers', class: 'next-link' },
          tr(docContent.h.nextTagHelpers),
        ),
      ),
    );
  }
});

export { DocDom06 };
