import { defineElement } from '@rikka/elements';
import { css, div, h1, h2, h3, p, a, ul, li, span } from '@rikka/dom';
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

const ShowcaseFinanceTracker = defineElement('rikka-showcase-finance-tracker', {
  styles,
  render() {
    return div(
      { class: 'example-page' },
      h1({}, 'Finance Tracker'),
      p({}, 'A finance dashboard that teaches Rikka\'s functional component style — building an entire app from plain functions and signals, without defineElement or Shadow DOM.'),
      div({ class: 'showcase-hero' },
        h2({}, 'The Pattern: Functions + Signals, No Classes'),
        p({}, 'Finance Tracker takes a different approach from the other showcases. Instead of ', sharedStyles.inlineCode('defineElement()'), ', every UI section is a plain function that returns a DOM tree. Signals and computed values are created at the top level and passed into functions as arguments. This style is lighter weight, easier to test, and often more natural for application code that doesn\'t need the Web Component lifecycle or style encapsulation.'),
      ),
      h2({}, 'Key Features'),
      div({ class: 'feature-grid' },
        div({ class: 'feature-card' },
          h3({}, 'CRUD with Store Mutations'),
          p({}, 'Transactions live in a ', sharedStyles.inlineCode('store()'), '. Adding, editing, and deleting are done with ', sharedStyles.inlineCode('push()'), ' and ', sharedStyles.inlineCode('splice()'), ' on the store array. Every mutation triggers reactive updates in the stats, chart, and list — no manual refresh.'),
        ),
        div({ class: 'feature-card' },
          h3({}, 'Computed Statistics'),
          p({}, 'Total income, total expenses, net balance, and per-category breakdowns are all ', sharedStyles.inlineCode('computed()'), ' signals. They read the store and recalculate automatically on every change. The stats bar and chart simply read these computed values — zero wiring code.'),
        ),
        div({ class: 'feature-card' },
          h3({}, 'Signal-Driven Bar Chart'),
          p({}, 'The category chart is pure CSS: each bar is a ', sharedStyles.inlineCode('div'), ' whose width is bound to a computed category total. No chart library, no canvas — just reactive DOM elements. This pattern works for any simple visualization.'),
        ),
        div({ class: 'feature-card' },
          h3({}, 'Effect-Driven Persistence'),
          p({}, 'An ', sharedStyles.inlineCode('effect()'), ' serializes the transaction store to JSON and writes to ', sharedStyles.inlineCode('localStorage'), '. On startup, saved data is loaded back into the store. The same "read-on-load, write-on-change" pattern as Bookmark Manager, applied here in the functional style.'),
        ),
        div({ class: 'feature-card' },
          h3({}, 'Functional Component Style'),
          p({}, 'Each UI section is a function like ', sharedStyles.inlineCode('createTransactionForm(transactions, editingId)'), '. Signals are passed as arguments, not accessed through ', sharedStyles.inlineCode('this'), ' or context. This makes components easy to reason about and test — just call the function and inspect the returned DOM.'),
        ),
      ),
      h2({}, 'Data Flow'),
      div({ class: 'arch-section' },
        h3({}, 'How Data Moves Through the App'),
        ul({},
          li({}, sharedStyles.inlineCode('store([transactions])'), ' ← source of truth; every CRUD operation mutates this array'),
          li({}, sharedStyles.inlineCode('signal(editingId)'), ' + ', sharedStyles.inlineCode('signal(filterCategory)'), ' ← UI state for which transaction is being edited and which category filter is active'),
          li({}, sharedStyles.inlineCode('computed(totalIncome)'), ', ', sharedStyles.inlineCode('computed(totalExpenses)'), ', ', sharedStyles.inlineCode('computed(netBalance)'), ' ← aggregate stats derived from the store'),
          li({}, sharedStyles.inlineCode('computed(categoryTotals)'), ' ← per-category breakdown; drives both the stats display and the bar chart widths'),
          li({}, sharedStyles.inlineCode('computed(filteredTransactions)'), ' ← reads the store + filterCategory signal → the visible list'),
          li({}, sharedStyles.inlineCode('effect(persist)'), ' ← reads the store → writes to localStorage on every change'),
          li({}, sharedStyles.inlineCode('For(filteredTransactions, ...)'), ' ← renders the list; items are added/removed as the computed value changes'),
        ),
      ),
      h2({}, 'Architecture'),
      div({ class: 'arch-section' },
        h3({}, 'Function Composition Tree'),
        ul({},
          li({}, sharedStyles.inlineCode('createApp()'), ' — Root function. Creates the store and all signals, then composes child functions into a layout.'),
          li({}, sharedStyles.inlineCode('createTransactionForm()'), ' — Add/edit form. Receives the store and editingId signal; writes mutations on submit.'),
          li({}, sharedStyles.inlineCode('createStatsBar()'), ' — Summary cards. Reads computed income, expenses, and net balance signals.'),
          li({}, sharedStyles.inlineCode('createCategoryChart()'), ' — Horizontal bar chart. Reads computed categoryTotals; bar widths are bound to signal values.'),
          li({}, sharedStyles.inlineCode('createTransactionList()'), ' — Uses ', sharedStyles.inlineCode('For()'), ' over the computed filtered list; passes each item to createTransactionItem().'),
          li({}, sharedStyles.inlineCode('createTransactionItem()'), ' — Single row. Reads one transaction from the store; edit/delete call store mutations.'),
        ),
      ),
      div({ class: 'explanation' },
        h2({}, 'APIs Used'),
        p(sharedStyles.inlineCode('store()'), ' — Deep reactive proxy for the transaction array. Mutations (push, splice) are tracked automatically.'),
        p(sharedStyles.inlineCode('signal()'), ' — Holds UI-only state: the currently editing transaction ID, the active category filter, and form inputs.'),
        p(sharedStyles.inlineCode('computed()'), ' — Derives totals, category breakdowns, and filtered views. All statistics are computed signals that recalculate when the store changes.'),
        p(sharedStyles.inlineCode('effect()'), ' — Auto-persists transactions to localStorage. The same pattern used in Bookmark Manager, but in a functional context.'),
        p(sharedStyles.inlineCode('For()'), ' — Reactive list rendering for transactions. Items are added/removed as the filtered list changes.'),
        p(sharedStyles.inlineCode('Show()'), ' — Conditional rendering for the empty state and the edit mode form.'),
      ),
      div({ class: 'example-nav' },
        a({ href: '#/showcases/code-editor', class: 'prev-link' }, '\u2190 Code Editor'),
        div({ class: 'spacer' }),
        a({ href: '#/showcases', class: 'next-link' }, 'Showcases \u2192'),
      ),
    );
  }
});

export { ShowcaseFinanceTracker };
