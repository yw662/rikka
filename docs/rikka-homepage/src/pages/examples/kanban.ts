import { defineElement } from '@takanashi/rikka-elements';
import { css, div, h1, h2, p, span, a, For } from '@takanashi/rikka-dom';
import { signal, computed, effect } from '@takanashi/rikka-signal';
import {sharedHelpers} from '../../shared/helpers';
import {examplePageStyles} from '../../shared/page-styles';
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const styles = css`${examplePageStyles}`;

const kanbanCode = `const initialCards = [
  { id: 1, title: 'Bug Fix', priority: 'high', column: 'todo', tags: ['urgent'], dueDate: '1d' },
  { id: 2, title: 'Feature Development', priority: 'medium', column: 'todo', tags: ['feature'], dueDate: '3d' },
  { id: 3, title: 'Documentation', priority: 'low', column: 'todo', tags: ['docs'], dueDate: '5d' },
  { id: 4, title: 'API Integration', priority: 'medium', column: 'inProgress', tags: ['backend'], dueDate: '3d' },
  { id: 5, title: 'UI Redesign', priority: 'high', column: 'inProgress', tags: ['frontend', 'urgent'], dueDate: '2d' },
  { id: 6, title: 'Login Feature', priority: 'high', column: 'done', tags: ['auth'], dueDate: 'done' },
  { id: 7, title: 'Setup CI/CD', priority: 'low', column: 'done', tags: ['devops'], dueDate: 'done' }
];

const cardsSignal = signal(initialCards);
let nextCardId = 8;

const dragging = signal(null);

const priorityColors = {
  high: '#ef4444',
  medium: '#facc15',
  low: '#4ade80'
};

const todoCards = computed(() => cardsSignal.get().filter(c => c.column === 'todo'));
const inProgressCards = computed(() => cardsSignal.get().filter(c => c.column === 'inProgress'));
const doneCards = computed(() => cardsSignal.get().filter(c => c.column === 'done'));

const moveCard = (cardId, targetColumn) => {
  const cards = cardsSignal.get();
  const updated = cards.map(c => c.id === cardId ? {...c, column: targetColumn} : c);
  cardsSignal.set(updated);
};

const handleMouseDown = (e, cardId, fromColumn) => {
  e.preventDefault();
  dragging.set({ cardId, fromColumn });
};

const handleMouseUp = (e, targetColumn) => {
  const drag = dragging.get();
  if (drag && drag.fromColumn !== targetColumn) {
    moveCard(drag.cardId, targetColumn);
  }
  dragging.set(null);
};

const handleColumnMouseUp = (e, column) => {
  if (dragging.get()) {
    handleMouseUp(e, column);
  }
};

const addCard = () => {
  const input = document.getElementById('card-input');
  const text = input.value.trim();
  if (text) {
    const newCard = {
      id: nextCardId++,
      title: text,
      priority: 'medium',
      column: 'todo',
      tags: [],
      dueDate: '7d'
    };
    cardsSignal.set([...cardsSignal.get(), newCard]);
    input.value = '';
  }
};

const renderCard = (card) => {
  const borderColor = priorityColors[card.priority] || '#64748b';
  const isDragging = dragging.get()?.cardId === card.id;
  
  return div({
    style: {
      background: '#1e1e2e',
      borderRadius: '0.5rem',
      padding: '0.75rem',
      borderLeft: '4px solid ' + borderColor,
      cursor: 'grab',
      opacity: isDragging ? '0.5' : '1',
      transition: 'opacity 0.15s'
    },
    onmousedown: (e) => handleMouseDown(e, card.id, card.column)
  },
    div({ style: { color: '#e2e8f0', fontWeight: '600', marginBottom: '0.5rem' } }, card.title),
    div({ style: { display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.5rem' } },
      For(card.tags, (tag) =>
        span({ style: { background: '#3730a3', color: '#e0e7ff', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem' } }, '#' + tag)
      )
    ),
    div({ style: { color: '#94a3b8', fontSize: '0.75rem' } }, 'Due: ' + card.dueDate)
  );
};

const renderColumn = (title, cards, columnKey) => {
  const count = computed(() => cards.get().length);
  return div(
    {
      style: { flex: '1', minWidth: '200px' },
      onmouseup: (e) => handleColumnMouseUp(e, columnKey)
    },
    div({ style: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #334155' } },
      h2({ style: { color: '#e2e8f0', fontSize: '1.125rem', margin: '0' } }, title),
      span({ style: { background: '#6366f1', color: 'white', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem' } }, () => count.get().toString())
    ),
    div({ style: { display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '200px' } },
      For(cards, (card) => renderCard(card))
    ),
    columnKey === 'todo' ? div({ style: { marginTop: '1rem' } },
      input({ id: 'card-input', type: 'text', placeholder: 'Add new card...', style: { width: '100%', padding: '0.5rem', background: '#0f0f1a', border: '1px solid #334155', borderRadius: '0.5rem', color: '#e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }, onkeypress: (e) => { if (e.key === 'Enter') addCard(); } }),
      button({ onclick: addCard, style: { marginTop: '0.5rem', width: '100%', padding: '0.5rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' } }, '+ Add Card')
    ) : null
  );
};

const app = div(
  { style: { width: '100%' } },
  h1({ style: { color: '#e2e8f0', marginBottom: '0.5rem' } }, 'Kanban Project Board'),
  div({ style: { display: 'flex', gap: '1.5rem', padding: '1rem 0' } },
    renderColumn('To Do', todoCards, 'todo'),
    renderColumn('In Progress', inProgressCards, 'inProgress'),
    renderColumn('Done', doneCards, 'done')
  )
);

container.appendChild(app);`;

const ExampleKanban = defineElement('rikka-example-kanban', {
  styles,
  render() {
    return div({ class: 'example-page' },
      h1('Kanban Project Board'),
      p('Drag and drop cards between columns to track project progress.'),
      div({ class: 'playground-container' },
        RikkaLivePlayground.h({
    code: kanbanCode, height: '500', title: 'Kanban Board Example'
}),
      ),
      div({ class: 'explanation' },
        h2('Key Concepts'),
        p(sharedHelpers.inlineCode('signal([...])'), ' stores the cards array and dragging state.'),
        p(sharedHelpers.inlineCode('computed(() => ...)'), ' filters cards by column (todo, inProgress, done).'),
        p(sharedHelpers.inlineCode('effect()'), ' is used internally for reactive updates when cards change.'),
        p('Drag cards by clicking and holding, then release on target column.'),
        p('Priority colors appear as left border: ', sharedHelpers.inlineCode('high=#ef4444'), ', ', sharedHelpers.inlineCode('medium=#facc15'), ', ', sharedHelpers.inlineCode('low=#4ade80')),
      ),
      div({ class: 'example-nav' },
        a({ href: '#/examples/mission-control', class: 'prev-link' }, '\u2190 Mission Control'),
        div({ class: 'spacer' }),
        a({ href: '#/examples/token-manager', class: 'next-link' }, 'Token Manager \u2192'),
      ),
    );
  }
});

export { ExampleKanban };