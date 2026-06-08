import { defineElement } from '@takanashi/rikka-elements';
import { css, div, h1, h2, p, a, pre, code, ul, li } from '@takanashi/rikka-dom';
import {sharedHelpers} from '../../shared/helpers';
import {docPageStyles} from '../../shared/page-styles';
import { docContent } from '../../shared/doc-content';
import { tr } from '../../shared/i18n';
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const styles = css`${docPageStyles}`;

const DocDom08 = defineElement('rikka-doc-dom-08', {
  styles,
  render() {
    return div({ class: 'doc-page' },
      h1({}, tr(docContent.sidebar.for)),
      p({}, tr(docContent.for.desc)),
      div({ class: 'doc-content' },
        h2({}, tr(docContent.for.keyConcepts)),
        ul(
          li(sharedHelpers.inlineCode('For(source, render, keyFn?)'), tr(docContent.for.bullet1)),
          li({}, tr(docContent.for.bullet2)),
          li({}, tr(docContent.for.bullet3)),
          li(
            tr(docContent.for.bullet4),
            sharedHelpers.inlineCode('ReactiveRange'),
            tr(docContent.for.bullet4End),
          ),
        ),
        h2({}, tr(docContent.for.apiSignature)),
        pre({ class: 'code-block' }, code(
          `For<T, K = T>(
  source: Signal.State<T[]> | Signal.Computed<T[]>,
  render: (item: T, index: number) =>
    Element,
  keyFn?: (item: T, index: number) => K
): ReactiveRange`
        )),
      ),
      div({ class: 'playground-section' },
        h2({}, tr(docContent.ui.tryIt)),
        RikkaLivePlayground.h({
    code: `import { For } from '@takanashi/rikka-dom';

interface Item {
  id: number;
  text: string;
}

const items = signal<Item[]>([
  { id: 1, text: "Learn rikka-dom" },
  { id: 2, text: "Build something cool" },
  { id: 3, text: "Ship it!" }
]);

function ListDemo() {
  return div({},
    div({ style: { display: 'flex', gap: '8px', marginBottom: '12px' } },
      button({ onclick: () => {
        items.set([...items.get(), { id: Date.now(), text: "New item" }]);
      }}, "Add"),
      button({ onclick: () => {
        const cur = items.get();
        if (cur.length > 0) items.set(cur.slice(1));
      }}, "Remove First")
    ),
    For(items,
      (item) => div({ style: { padding: '8px', borderBottom: '1px solid #eee' } }, \`\${item.id}: \${item.text}\`),
      (item) => item.id
    )
  );
}

container.appendChild(ListDemo());`, height: '300', title: 'Add / Remove Items'
}),
      ),
      div({ class: 'doc-nav' },
        a({ href: '#/docs/@takanashi/rikka-dom/tag-helpers', class: 'prev-link' },
          tr(docContent.for.prevTagHelpers),
        ),
        div({ class: 'spacer' }),
        a({ href: '#/docs/@takanashi/rikka-dom/conditionals', class: 'next-link' },
          tr(docContent.for.nextConditionals),
        ),
      ),
    );
  }
});

export { DocDom08 };
