import { defineElement } from 'rikka-elements';
import { css, div, h1, h2, p, span, button, input, a, For } from 'rikka-dom';
import { sharedStyles, examplePageStyles } from '../../shared/styles';

const styles = css`${examplePageStyles}`;

const knowledgeBaseCode = `const query = signal('');
const selectedFacets = signal({ article: true, video: true, faq: true, code: true });
const history = signal([]);

// Load history from localStorage
try {
  const saved = localStorage.getItem('rikka-search-history');
  if (saved) history.set(JSON.parse(saved));
} catch {}

const allItems = store([
  { id: 1, title: 'Understanding TypeScript Generics', type: 'article', readTime: '5 min', updated: '2d ago' },
  { id: 2, title: 'React Hooks Deep Dive', type: 'video', readTime: '12 min', views: '1.2k' },
  { id: 3, title: 'CSS Grid Complete Guide', type: 'article', readTime: '8 min', updated: '1w ago' },
  { id: 4, title: 'JavaScript Async Patterns', type: 'faq', readTime: '3 min' },
  { id: 5, title: 'Building REST APIs', type: 'code', language: 'Node.js' },
  { id: 6, title: 'Vue 3 Composition API', type: 'video', readTime: '15 min', views: '3.4k' },
  { id: 7, title: 'Python Best Practices', type: 'article', readTime: '6 min', updated: '3d ago' },
  { id: 8, title: 'Docker for Beginners', type: 'code', language: 'Dockerfile' },
  { id: 9, title: 'System Design Basics', type: 'faq', readTime: '5 min' },
  { id: 10, title: 'GraphQL Fundamentals', type: 'article', readTime: '7 min', updated: '5d ago' },
  { id: 11, title: 'Rust Ownership Model', type: 'video', readTime: '20 min', views: '800' },
  { id: 12, title: 'SQL Injection Prevention', type: 'code', language: 'SQL' }
]);

const filteredItems = computed(() => {
  const q = query.get().toLowerCase();
  const facets = selectedFacets.get();
  return allItems.filter(item => {
    const matchesQuery = !q || item.title.toLowerCase().includes(q);
    const matchesFacet = facets[item.type];
    return matchesQuery && matchesFacet;
  });
});

// Debounced search effect (simulated - actual debounce in effect)
const debouncedQuery = signal('');

effect(() => {
  const q = query.get();
  // Simulate debounce with setTimeout pattern
  if (q) {
    debouncedQuery.set(q);
  } else {
    debouncedQuery.set('');
  }
});

// History persistence effect
effect(() => {
  const q = query.get().trim();
  const currentHistory = history.get();
  if (q && q.length > 1 && !currentHistory.includes(q)) {
    const updated = [q, ...currentHistory.slice(0, 4)];
    history.set(updated);
    localStorage.setItem('rikka-search-history', JSON.stringify(updated));
  }
});

const toggleFacet = (facet) => {
  const current = selectedFacets.get();
  selectedFacets.set({ ...current, [facet]: !current[facet] });
};

const removeFromHistory = (item) => {
  const current = history.get();
  history.set(current.filter(h => h !== item));
  localStorage.setItem('rikka-search-history', JSON.stringify(history.get()));
};

const popularTags = ['typescript', 'react', 'css', 'node.js', 'python'];

const badgeColors = {
  article: '#6366f1',
  video: '#a855f7',
  faq: '#22c55e',
  code: '#f97316'
};

const app = div(
  { style: { maxWidth: '500px', padding: '1rem' } },
  h1({ style: { color: '#e2e8f0', marginBottom: '0.25rem' } }, 'Knowledge Base Assistant'),
  div({ style: { color: '#94a3b8', marginBottom: '1rem' } }, '\u2501'.repeat(40)),
  input({
    type: 'text',
    placeholder: 'Search anything...',
    value: () => query.get(),
    style: {
      width: '100%',
      boxSizing: 'border-box',
      padding: '0.75rem',
      borderRadius: '0.5rem',
      border: '1px solid #334155',
      background: '#1e1e2e',
      color: '#e2e8f0',
      fontSize: '1rem',
      outline: 'none'
    },
    oninput: (e) => query.set(e.target.value)
  }),
  div({ style: { marginTop: '1rem' } },
    span({ style: { color: '#94a3b8', fontSize: '0.875rem' } }, 'Filter: '),
    ...['article', 'video', 'faq', 'code'].map(facet =>
      label({
        style: { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.75rem', cursor: 'pointer', color: '#e2e8f0', fontSize: '0.875rem' }
      },
        input({
          type: 'checkbox',
          checked: () => selectedFacets.get()[facet],
          onchange: () => toggleFacet(facet),
          style: { accentColor: '#6366f1' }
        }),
        facet.charAt(0).toUpperCase() + facet.slice(1)
      )
    )
  ),
  div({ style: { marginTop: '0.75rem' } },
    span({ style: { color: '#94a3b8', fontSize: '0.875rem' } }, 'Popular: '),
    ...popularTags.map(tag =>
      button({
        style: {
          background: '#252542',
          border: 'none',
          borderRadius: '9999px',
          padding: '0.25rem 0.75rem',
          margin: '0.125rem',
          color: '#94a3b8',
          fontSize: '0.75rem',
          cursor: 'pointer'
        },
        onclick: () => query.set(tag)
      }, \`#\${tag}\`)
    )
  ),
  div({ style: { marginTop: '1rem' } },
    For(filteredItems, (item) =>
      div(
        {
          style: {
            padding: '0.75rem',
            background: '#252542',
            borderRadius: '0.5rem',
            marginBottom: '0.5rem',
            borderLeft: \`3px solid \${badgeColors[item.type]}\`
          }
        },
        div({ style: { fontWeight: '500', color: '#e2e8f0', marginBottom: '0.25rem' } }, item.title),
        div({ style: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' } },
          span({
            style: {
              background: badgeColors[item.type],
              color: 'white',
              padding: '0.125rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.625rem',
              textTransform: 'uppercase'
            }
          }, item.type),
          item.readTime ? span(\`\u2022 \${item.readTime}\`) : null,
          item.views ? span(\`\u2022 \${item.views} views\`) : null,
          item.updated ? span(\`\u2022 Updated \${item.updated}\`) : null,
          item.language ? span(\`\u2022 \${item.language}\`) : null
        )
      )
    )
  ),
  Show(computed(() => filteredItems.get().length === 0),
    div({ style: { textAlign: 'center', padding: '2rem', color: '#64748b' } },
      span({ style: { fontSize: '2rem' } }, '\ud83d\udd0d'),
      p({ style: { marginTop: '0.5rem' } }, 'No results found')
    )
  ),
  Show(computed(() => history.get().length > 0),
    div({ style: { marginTop: '1.5rem', borderTop: '1px solid #334155', paddingTop: '1rem' } },
      div({ style: { color: '#64748b', fontSize: '0.75rem', marginBottom: '0.5rem' } }, 'Recent searches:'),
      div({ style: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' } },
        For(history, (item) =>
          div(
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: '#1e1e2e',
                borderRadius: '9999px',
                padding: '0.25rem 0.75rem',
                fontSize: '0.75rem',
                color: '#94a3b8'
              }
            },
            button({
              style: {
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '0',
                fontSize: '0.875rem',
                lineHeight: '1'
              },
              onclick: () => removeFromHistory(item)
            }, '\u2715'),
            span({ style: { cursor: 'pointer' }, onclick: () => query.set(item) }, item)
          )
        )
      )
    )
  )
);

container.appendChild(app);`;

const ExampleKnowledgeBase = defineElement('rikka-example-knowledge-base', {
  styles,
  render() {
    return div({ class: 'example-page' },
      h1('Knowledge Base Assistant'),
      p('A search interface with facets, filtering, and history persistence.'),
      div({ class: 'playground-container' },
        sharedStyles.createPlayground(knowledgeBaseCode, '550', 'Knowledge Base Example'),
      ),
      div({ class: 'explanation' },
        h2('Key Concepts'),
        p(sharedStyles.inlineCode('signal("")'), ' stores the search query as reactive state.'),
        p(sharedStyles.inlineCode('signal({ article: true, video: true, faq: true, code: true })'), ' stores facet filters for different content types.'),
        p(sharedStyles.inlineCode('signal([])'), ' stores search history.'),
        p(sharedStyles.inlineCode('store([...])'), ' stores the full list of searchable items.'),
        p(sharedStyles.inlineCode('computed()'), ' derives filtered results based on query and facets.'),
        p(sharedStyles.inlineCode('effect()'), ' persists search history to localStorage.'),
        p('Facet checkboxes toggle filtering by content type.'),
        p('Popular tags serve as quick filters to set the query.'),
        p('Search history can be removed and persists across sessions.'),
      ),
      div({ class: 'example-nav' },
        a({ href: '#/examples/token-manager', class: 'prev-link' }, '\u2190 Token Manager'),
        div({ class: 'spacer' }),
        a({ href: '#/examples/mini-ide', class: 'next-link' }, 'Mini IDE \u2192'),
      ),
    );
  }
});

export { ExampleKnowledgeBase };