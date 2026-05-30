import { defineElement } from 'rikka-elements';
import { css, div, h1, h2, p, a, pre, code, ul, li } from 'rikka-dom';
import { sharedStyles, docPageStyles } from '../../shared/styles';

const styles = css`${docPageStyles}`;

const DocDom08 = defineElement('rikka-doc-dom-08', {
  styles,
  render() {
    return div({ class: 'doc-page' },
      h1('For'),
      p('Reactive list rendering with reference-based caching.'),
      div({ class: 'doc-content' },
        h2('Key Concepts'),
        ul(
          li(sharedStyles.inlineCode('For(source, render, keyFn?)'), ' — Render a list reactively from a Signal array.'),
          li('Cache-based diffing: only adds/removes/moves what changed.'),
          li('Key function for stable identity across re-renders.'),
          li('Returns a ', sharedStyles.inlineCode('ReactiveRange'), ' that auto-updates.'),
        ),
        h2('API Signature'),
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
        h2('Try It'),
        sharedStyles.createPlayground(
          `import { For } from 'rikka-dom';

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

container.appendChild(ListDemo());`,
          '300',
          'Add / Remove Items'
        ),
      ),
      div({ class: 'doc-nav' },
        a({ href: '#/docs/rikka-dom/tag-helpers', class: 'prev-link' }, '\u2190 Tag Helpers'),
        div({ class: 'spacer' }),
        a({ href: '#/docs/rikka-dom/conditionals', class: 'next-link' }, 'Conditionals \u2192'),
      ),
    );
  }
});

export { DocDom08 };
