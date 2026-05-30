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

const ShowcaseCodeEditor = defineElement('rikka-showcase-code-editor', {
  styles,
  render() {
    return div(
      { class: 'example-page' },
      h1({}, 'Code Editor'),
      p({}, 'A browser-based IDE that teaches you how to compose many reactive pieces — file system, tabs, preview, console, theming — into one cohesive application.'),
      div({ class: 'showcase-hero' },
        h2({}, 'The Pattern: One Store, Many Derived Views'),
        p({}, 'Code Editor revolves around a single ', sharedStyles.inlineCode('store()'), ' that holds the virtual file system. From that one store, multiple ', sharedStyles.inlineCode('computed()'), ' signals derive the active file content, the combined preview HTML, and filtered console messages. ', sharedStyles.inlineCode('effect()'), ' handles the side effects — writing into the iframe and intercepting console calls. This "single source of truth, many projections" pattern scales well as your app grows.'),
      ),
      h2({}, 'Key Features'),
      div({ class: 'feature-grid' },
        div({ class: 'feature-card' },
          h3({}, 'Reactive File System'),
          p({}, 'A ', sharedStyles.inlineCode('store()'), ' holds an array of file objects with name, type, and content. Opening a file, switching tabs, and editing content are all mutations on this single store — every UI section reacts to the same data.'),
        ),
        div({ class: 'feature-card' },
          h3({}, 'Tab System with Signals'),
          p({}, 'Open tabs are tracked in a ', sharedStyles.inlineCode('signal([])'), ', and the active tab index in another ', sharedStyles.inlineCode('signal(0)'), '. Closing a tab updates both signals. The tab bar, editor, and status bar all read from these signals, so they stay in sync automatically.'),
        ),
        div({ class: 'feature-card' },
          h3({}, 'Live iframe Preview'),
          p({}, 'A ', sharedStyles.inlineCode('computed()'), ' combines the HTML, CSS, and JS from the store into a single srcdoc string. An ', sharedStyles.inlineCode('effect()'), ' writes that string into the iframe. Every keystroke propagates through the reactive chain and refreshes the preview — no manual refresh button needed.'),
        ),
        div({ class: 'feature-card' },
          h3({}, 'Theme Switching via CSS Custom Properties'),
          p({}, 'A theme signal drives ', sharedStyles.inlineCode('CSS custom properties'), ' on the root element. All components read colors from these variables, so switching the signal value updates the entire UI reactively. This is the idiomatic way to implement theming in Rikka.'),
        ),
        div({ class: 'feature-card' },
          h3({}, 'Console Output Panel'),
          p({}, 'An ', sharedStyles.inlineCode('effect()'), ' intercepts ', sharedStyles.inlineCode('console.log'), ', ', sharedStyles.inlineCode('console.error'), ', and ', sharedStyles.inlineCode('console.warn'), ' inside the preview iframe. Messages are pushed into a reactive array and rendered with ', sharedStyles.inlineCode('For()'), ' with color-coded levels — a practical example of cross-frame communication driven by reactivity.'),
        ),
      ),
      h2({}, 'Data Flow'),
      div({ class: 'arch-section' },
        h3({}, 'How Data Moves Through the App'),
        ul({},
          li({}, sharedStyles.inlineCode('store([files])'), ' ← source of truth for the file system; each file has name, type, content'),
          li({}, sharedStyles.inlineCode('signal(openTabs)'), ' + ', sharedStyles.inlineCode('signal(activeTab)'), ' ← which files are open and which is focused'),
          li({}, sharedStyles.inlineCode('computed(activeFileContent)'), ' ← reads the store + activeTab → returns the content of the current file'),
          li({}, sharedStyles.inlineCode('computed(previewSrcdoc)'), ' ← reads the store → combines all files into a single HTML document for the iframe'),
          li({}, sharedStyles.inlineCode('effect(syncPreview)'), ' ← reads previewSrcdoc → writes it into the iframe\'s srcdoc attribute'),
          li({}, sharedStyles.inlineCode('signal(consoleMessages)'), ' ← populated by the iframe intercept effect; rendered with ', sharedStyles.inlineCode('For()')),
          li({}, sharedStyles.inlineCode('signal(theme)'), ' ← drives CSS custom properties across all components'),
        ),
      ),
      h2({}, 'Architecture'),
      div({ class: 'arch-section' },
        h3({}, 'Component Tree'),
        ul({},
          li({}, sharedStyles.inlineCode('editor-app'), ' — Root layout. Owns the file store, tab signals, and theme signal.'),
          li({}, sharedStyles.inlineCode('file-tree'), ' — Reads the store to render files and folders; clicking a file calls openFile().'),
          li({}, sharedStyles.inlineCode('editor-tabs'), ' — Reads openTabs and activeTab signals; renders tab bar with close buttons.'),
          li({}, sharedStyles.inlineCode('code-editor'), ' — Reads activeFileContent; writes edits back to the store.'),
          li({}, sharedStyles.inlineCode('preview-panel'), ' — Contains the iframe; the syncPreview effect writes to it.'),
          li({}, sharedStyles.inlineCode('console-panel'), ' — Reads consoleMessages signal; renders with ', sharedStyles.inlineCode('For()'), '.'),
          li({}, sharedStyles.inlineCode('theme-toggle'), ' — Writes to the theme signal; all components react through CSS custom properties.'),
        ),
      ),
      div({ class: 'explanation' },
        h2({}, 'APIs Used'),
        p(sharedStyles.inlineCode('store()'), ' — Deep reactive proxy for the file system. Supports nested structures (folders with children).'),
        p(sharedStyles.inlineCode('signal()'), ' — Lightweight reactive container for tab state, theme, and console messages. Use signal() for primitive or replace-by-value state.'),
        p(sharedStyles.inlineCode('computed()'), ' — Derives the active file content, combined preview HTML, and language label from the store and signals.'),
        p(sharedStyles.inlineCode('effect()'), ' — Syncs the iframe preview on content change and intercepts iframe console calls. Effects are the bridge from reactive state to imperative APIs.'),
        p(sharedStyles.inlineCode('defineElement()'), ' — Each panel and widget is an isolated custom element with its own Shadow DOM.'),
        p(sharedStyles.inlineCode('For()'), ' — Reactive list rendering for tabs and console messages.'),
      ),
      div({ class: 'example-nav' },
        a({ href: '#/showcases/bookmark-manager', class: 'prev-link' }, '\u2190 Bookmark Manager'),
        div({ class: 'spacer' }),
        a({ href: '#/showcases/finance-tracker', class: 'next-link' }, 'Finance Tracker \u2192'),
      ),
    );
  }
});

export { ShowcaseCodeEditor };
