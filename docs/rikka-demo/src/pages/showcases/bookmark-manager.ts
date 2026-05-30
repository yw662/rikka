import { defineElement } from 'rikka-elements';
import { css, div, h1, h2, h3, p, a, ul, li, span } from 'rikka-dom';
import { sharedStyles, examplePageStyles } from '../../shared/styles';

const styles = css`${examplePageStyles}
.showcase-hero {
  background: linear-gradient(135deg, #1a1a2e 0%, #161b22 100%);
  border: 1px solid #334155;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 2rem;
}
.showcase-hero h2 {
  color: #e2e8f0;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}
.showcase-hero p {
  color: #94a3b8;
  font-size: 1rem;
  line-height: 1.6;
}
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}
.feature-card {
  background: #0d1117;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  padding: 1rem;
}
.feature-card h3 {
  color: #a5b4fc;
  font-size: 0.9375rem;
  margin-bottom: 0.5rem;
}
.feature-card p {
  color: #94a3b8;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
}
.arch-section {
  background: #0d1117;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1.5rem 0;
}
.arch-section h3 {
  color: #e2e8f0;
  margin-bottom: 1rem;
}
.arch-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.arch-section li {
  color: #94a3b8;
  padding: 0.375rem 0;
  font-size: 0.875rem;
  border-bottom: 1px solid #1e293b;
}
.arch-section li:last-child {
  border-bottom: none;
}
.source-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #6366f1;
  color: white;
  text-decoration: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  margin-top: 1rem;
}
.source-link:hover {
  background: #4f46e5;
}
`;

const ShowcaseBookmarkManager = defineElement('rikka-showcase-bookmark-manager', {
  styles,
  render() {
    return div(
      { class: 'example-page' },
      h1({}, 'Bookmark Manager'),
      p({}, 'A "Read Later" app that teaches the canonical CRUD pattern in Rikka: a deep reactive store, computed derived views, effect-driven persistence, and modular Web Components.'),
      div({ class: 'showcase-hero' },
        h2({}, 'The Pattern: Store → Compute → Effect'),
        p({}, 'Bookmark Manager follows the core reactive loop that you will use in almost every Rikka application. A ', sharedStyles.inlineCode('store()'), ' holds your source-of-truth data. ', sharedStyles.inlineCode('computed()'), ' signals derive filtered or transformed views from that store. And ', sharedStyles.inlineCode('effect()'), ' runs side effects — like writing to localStorage — whenever the data changes. The UI never manually triggers updates; it simply reads reactive values, and Rikka keeps everything in sync.'),
      ),
      h2({}, 'Key Features'),
      div({ class: 'feature-grid' },
        div({ class: 'feature-card' },
          h3({}, 'Deep Reactive Store'),
          p({}, 'The bookmark array lives inside a single ', sharedStyles.inlineCode('store()'), '. Because the store is a deep reactive proxy, mutations like ', sharedStyles.inlineCode('bookmarks.push(...)'), ' or ', sharedStyles.inlineCode('bookmarks[i].tags.push("design")'), ' are tracked automatically — no manual setters or immutable updates needed.'),
        ),
        div({ class: 'feature-card' },
          h3({}, 'Computed Filtering'),
          p({}, 'Search text and selected tags are each a signal. A ', sharedStyles.inlineCode('computed()'), ' reads the store and both filter signals to produce a filtered bookmark list. When any input changes, the list recalculates and the DOM updates — no event wiring required.'),
        ),
        div({ class: 'feature-card' },
          h3({}, 'Effect-Driven Persistence'),
          p({}, 'An ', sharedStyles.inlineCode('effect()'), ' watches the raw store state and writes it to ', sharedStyles.inlineCode('localStorage'), ' on every change. On startup, saved data is hydrated back into the store. This "read-on-load, write-on-change" pattern is the standard way to add persistence in Rikka.'),
        ),
        div({ class: 'feature-card' },
          h3({}, 'Modular Web Components'),
          p({}, 'Each UI section — search bar, tag filter, bookmark form, bookmark list, bookmark item — is its own ', sharedStyles.inlineCode('defineElement()'), ' custom element with Shadow DOM. Components communicate through shared signals passed at creation time, keeping coupling low.'),
        ),
      ),
      h2({}, 'Data Flow'),
      div({ class: 'arch-section' },
        h3({}, 'How Data Moves Through the App'),
        ul({},
          li({}, sharedStyles.inlineCode('store([bookmarks])'), ' ← source of truth; every mutation (add, edit, delete, mark-read) goes here'),
          li({}, sharedStyles.inlineCode('signal(searchQuery)'), ' + ', sharedStyles.inlineCode('signal(selectedTags)'), ' ← user input captured as signals'),
          li({}, sharedStyles.inlineCode('computed(filtered)'), ' ← reads the store + both filter signals → produces the visible bookmark list'),
          li({}, sharedStyles.inlineCode('computed(tagCloud)'), ' ← reads the store → produces the set of all tags with counts'),
          li({}, sharedStyles.inlineCode('effect(persist)'), ' ← reads the store → writes to localStorage on every change'),
          li({}, sharedStyles.inlineCode('For(filtered, ...)'), ' ← renders the filtered list reactively; items are added/removed as the computed value changes'),
        ),
      ),
      h2({}, 'Architecture'),
      div({ class: 'arch-section' },
        h3({}, 'Component Tree'),
        ul({},
          li({}, sharedStyles.inlineCode('bookmark-app'), ' — Root element. Owns the store and filter signals, passes them to children.'),
          li({}, sharedStyles.inlineCode('search-bar'), ' — Text input that writes to the searchQuery signal.'),
          li({}, sharedStyles.inlineCode('tag-filter'), ' — Renders the tag cloud; clicking a tag toggles it in the selectedTags signal.'),
          li({}, sharedStyles.inlineCode('bookmark-form'), ' — Calls store mutations (push) to add a new bookmark.'),
          li({}, sharedStyles.inlineCode('bookmark-list'), ' — Uses ', sharedStyles.inlineCode('For()'), ' over the computed filtered list.'),
          li({}, sharedStyles.inlineCode('bookmark-item'), ' — Reads one bookmark from the store; edit/delete call store mutations (splice).'),
        ),
      ),
      div({ class: 'explanation' },
        h2({}, 'APIs Used'),
        p(sharedStyles.inlineCode('store()'), ' — Creates a deep reactive proxy. Use it for arrays and objects that you mutate in place (push, splice, property assignment).'),
        p(sharedStyles.inlineCode('computed()'), ' — Derives a read-only value from other reactive sources. Recalculates automatically when any source changes.'),
        p(sharedStyles.inlineCode('effect()'), ' — Runs a function whenever its reactive dependencies change. Used here for localStorage persistence.'),
        p(sharedStyles.inlineCode('defineElement()'), ' — Registers a custom element with a render function. Each element gets its own Shadow DOM.'),
        p(sharedStyles.inlineCode('For()'), ' — Reactive list rendering. Efficiently adds/removes DOM nodes as the list changes.'),
        p(sharedStyles.inlineCode('Show()'), ' — Conditional rendering. Displays the empty-state message when the filtered list is empty.'),
      ),
      div({ class: 'example-nav' },
        a({ href: '#/showcases', class: 'prev-link' }, '\u2190 Showcases'),
        div({ class: 'spacer' }),
        a({ href: '#/showcases/code-editor', class: 'next-link' }, 'Code Editor \u2192'),
      ),
    );
  }
});

export { ShowcaseBookmarkManager };
