import { defineElement } from '@takanashi/rikka-elements';
import { css, div, h1, h2, p, a, For } from '@takanashi/rikka-dom';
import {sharedHelpers} from '../../shared/helpers';
import {examplePageStyles} from '../../shared/page-styles';
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const styles = css`${examplePageStyles}`;

const liveSearchCode = `const query = signal('');

const items = signal([
  { name: 'Apple', icon: '\ud83c\udf4e' },
  { name: 'Banana', icon: '\ud83c\udf4c' },
  { name: 'Cherry', icon: '\ud83c\udf52' },
  { name: 'Date', icon: '\ud83c\udf34' },
  { name: 'Elderberry', icon: '\ud83e\udec2' },
  { name: 'Fig', icon: '\ud83c\udf4d' },
  { name: 'Grape', icon: '\ud83c\udf47' },
  { name: 'Honeydew', icon: '\ud83c\udf4d' },
  { name: 'Kiwi', icon: '\ud83e\udd6d' },
  { name: 'Lemon', icon: '\ud83c\udf4b' },
  { name: 'Mango', icon: '\ud83e\udd6d' },
  { name: 'Orange', icon: '\ud83c\udf4a' }
]);

const filtered = computed(() => {
  const q = query.get().toLowerCase().trim();
  const list = items.get();
  if (!q) return list;
  return list.filter(item => item.name.toLowerCase().includes(q));
});

const resultText = computed(() => {
  const results = filtered.get();
  const q = query.get();
  if (q) return \`Found \${results.length} result\${results.length !== 1 ? 's' : ''} for "\${q}"\`;
  return \`\${items.get().length} items available\`;
});

const app = div(
  { style: { maxWidth: '400px' } },
  h1({ style: { color: '#e2e8f0', marginBottom: '1rem' } }, 'Live Search'),
  input({ type: 'text', placeholder: 'Search fruits...', style: { width: '100%', boxSizing: 'border-box', padding: '0.75rem', background: '#0f0f1a', border: '1px solid #334155', borderRadius: '0.5rem', color: '#e2e8f0', fontSize: '1rem', marginBottom: '0.5rem' }, oninput: (e) => query.set(e.target.value) }),
  div({ style: { color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1rem' } }, resultText),
  div({ style: { display: 'flex', flexDirection: 'column', gap: '0.5rem' } },
    For(filtered, (item) =>
      div({ style: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#252542', borderRadius: '0.5rem', color: '#e2e8f0' } },
        span({ style: { fontSize: '1.25rem' } }, item.icon),
        span(item.name)
      )
    )
  )
);

container.appendChild(app);`;

const ExampleLiveSearch = defineElement('rikka-example-live-search', {
  styles,
  render() {
    return div({ class: 'example-page' },
      h1('Live Search'),
      p('A search input that filters a list in real-time.'),
      div({ class: 'playground-container' },
        RikkaLivePlayground.h({
    code: liveSearchCode, height: '380', title: 'Live Search Example'
}),
      ),
      div({ class: 'explanation' },
        h2('Key Concepts'),
        p(sharedHelpers.inlineCode('signal([])'), ' stores the items array as reactive state.'),
        p(sharedHelpers.inlineCode('computed()'), ' derives filtered results from query + items.'),
        p(sharedHelpers.inlineCode('For(filtered, render)'), ' creates a reactive list with fine-grained DOM updates.'),
        p('Signal as child auto-shows/hides.'),
      ),
      div({ class: 'example-nav' },
        a({ href: '#/examples/tabs', class: 'prev-link' }, '\u2190 Tabs'),
        div({ class: 'spacer' }),
        a({ href: '#/examples/mission-control', class: 'next-link' }, 'Mission Control \u2192'),
      ),
    );
  }
});

export { ExampleLiveSearch };
