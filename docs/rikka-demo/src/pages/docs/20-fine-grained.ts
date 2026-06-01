import { defineElement } from '@rikka/elements';
import { css, div, h1, h2, p, a, ul, li, pre, code } from '@rikka/dom';
import { sharedStyles, docPageStyles } from '../../shared/styles';

const styles = css`${docPageStyles}`;

const DocFineGrained = defineElement('rikka-doc-advanced-20', {
  styles,
  render() {
    return div({ class: 'doc-page' },
      h1('Fine-grained Updates'),
      p('Understanding how Rikka achieves surgical DOM updates.'),
      div({ class: 'doc-content' },
        h2('How It Works'),
        p('Rikka updates the DOM with surgical precision — no virtual DOM, no diffing, no reconciliation.'),
        h2('h() Runs Once'),
        p('When you call ', sharedStyles.inlineCode('h()'), ' or any tag helper, the DOM element is created immediately. The function runs exactly once. It never re-runs.'),
        sharedStyles.createPlayground(
          `const count = signal(0);
const el = div({}, 'Count: ', count);
// div() runs once, creates a real <div> with a text node
// count signal subscribes to that text node

container.appendChild(div({ style: { padding: '16px' } },
  h3({ style: { color: '#e2e8f0' } }, 'h() Runs Once'),
  p({ style: { color: '#94a3b8', fontSize: '0.875rem', marginBottom: '12px' } }, 'div() created once. Signal subscribes to text node.'),
  el,
  button({ onclick: () => count.set(count.get() + 1), style: { marginTop: '8px' } }, 'Increment')
));`,
          '200',
          'h() Runs Once'
        ),
        h2('Signals Drive Updates via effect()'),
        p('When a signal is passed as a child, Rikka internally creates an ', sharedStyles.inlineCode('effect()'), ' that subscribes to the signal. When the signal changes, only the subscribed text node is updated.'),
        pre({ class: 'code-block' }, code(
          `// Internally, this:
div({}, 'Count: ', count)

// Is roughly equivalent to:
const el = document.createElement('div');
const textNode = document.createTextNode(String(count.get()));
el.appendChild(textNode);
effect(() => { textNode.textContent = String(count.get()); });`
        )),
        h2('Only Changed Text Nodes Update'),
        p('If you have multiple signals in one element, each gets its own effect. Changing one signal only updates its text node — siblings are untouched.'),
        pre({ class: 'code-block' }, code(
          `const x = signal(1);
const y = signal(2);

// Two separate effects, two separate text nodes
const el = div({}, 'x=', x, ' y=', y);

x.set(10);  // Only "1" \u2192 "10" updates, "2" stays`
        )),
        h2('No Virtual DOM Diffing'),
        p('Unlike React and similar frameworks, Rikka never creates a virtual DOM tree, never diffs, and never reconciles. Each signal owns its text node directly. This eliminates an entire class of performance overhead and makes updates O(1) for any signal change.'),
      ),
      div({ class: 'playground-section' },
        h2('Try It'),
        sharedStyles.createPlayground(
          `const a = signal(0);
const b = signal(0);
const renderCount = signal(0);

const el = div(
  { style: { padding: '16px', maxWidth: '400px' } },
  h3({ style: { color: '#e2e8f0', marginBottom: '12px' } }, 'Fine-grained Update Demo'),
  p({ style: { color: '#94a3b8', fontSize: '0.875rem', marginBottom: '16px' } }, 'Each counter updates only its own text node. The other is untouched.'),
  div({ style: { display: 'flex', gap: '24px', marginBottom: '16px' } },
    div({ style: { padding: '12px', background: '#0d1117', borderRadius: '6px', textAlign: 'center', flex: '1' } },
      p({ style: { color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', margin: '0 0 8px' } }, 'Signal A'),
      p({ style: { color: '#6366f1', fontSize: '2rem', fontWeight: 'bold', margin: '0 0 8px' } }, a),
      div({ style: { display: 'flex', gap: '4px', justifyContent: 'center' } },
        button({ style: { padding: '4px 12px', background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }, onclick: () => { a.set(a.get() + 1); renderCount.set(renderCount.get() + 1); } }, '+1'),
        button({ style: { padding: '4px 12px', background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }, onclick: () => { a.set(a.get() - 1); renderCount.set(renderCount.get() + 1); } }, '-1')
      )
    ),
    div({ style: { padding: '12px', background: '#0d1117', borderRadius: '6px', textAlign: 'center', flex: '1' } },
      p({ style: { color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', margin: '0 0 8px' } }, 'Signal B'),
      p({ style: { color: '#f59e0b', fontSize: '2rem', fontWeight: 'bold', margin: '0 0 8px' } }, b),
      div({ style: { display: 'flex', gap: '4px', justifyContent: 'center' } },
        button({ style: { padding: '4px 12px', background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }, onclick: () => { b.set(b.get() + 1); renderCount.set(renderCount.get() + 1); } }, '+1'),
        button({ style: { padding: '4px 12px', background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }, onclick: () => { b.set(b.get() - 1); renderCount.set(renderCount.get() + 1); } }, '-1')
      )
    )
  ),
  p({ style: { color: '#64748b', fontSize: '0.8125rem' } }, 'Total DOM updates: ', renderCount)
);

container.appendChild(el);`,
          '300',
          'Fine-grained Behavior'
        ),
      ),
      div({ class: 'doc-nav' },
        a({ href: '#/docs/advanced/composition', class: 'prev-link' }, '\u2190 Composition'),
        div({ class: 'spacer' }),
        a({ href: '#/docs/advanced/api-reference', class: 'next-link' }, 'API Reference \u2192'),
      ),
    );
  },
});

export { DocFineGrained };
