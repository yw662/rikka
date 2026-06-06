import { defineElement } from '@takanashi/rikka-elements';
import { css, div, h1, h2, p, a, For } from '@takanashi/rikka-dom';
import {sharedHelpers} from '../../shared/helpers';
import {examplePageStyles} from '../../shared/page-styles';
import { RikkaLivePlayground } from "@takanashi/rikka-live-playground";

const styles = css`${examplePageStyles}`;

const todoCode = `const todos = signal([
  { id: 1, text: 'Learn Rikka', done: false },
  { id: 2, text: 'Build an app', done: false }
]);
let nextId = 3;

const addTodo = () => {
  const input = document.getElementById('todo-input');
  const text = input.value.trim();
  if (text) {
    todos.set([...todos.get(), { id: nextId++, text, done: false }]);
    input.value = '';
  }
};

const toggleTodo = (id) => {
  todos.set(todos.get().map(t => t.id === id ? { ...t, done: !t.done } : t));
};

const deleteTodo = (id) => {
  todos.set(todos.get().filter(t => t.id !== id));
};

const remaining = computed(() => todos.get().filter(t => !t.done).length);

const app = div(
  { style: { maxWidth: '400px' } },
  h1({ style: { color: '#e2e8f0', marginBottom: '1rem' } }, 'Todo List'),
  div({ style: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' } },
    input({ id: 'todo-input', type: 'text', placeholder: 'Add a new todo...', style: { flex: '1', padding: '0.75rem', background: '#0f0f1a', border: '1px solid #334155', borderRadius: '0.5rem', color: '#e2e8f0', fontSize: '1rem' }, onkeypress: (e) => { if (e.key === 'Enter') addTodo(); } }),
    button({ onclick: addTodo, style: { padding: '0.75rem 1.5rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' } }, 'Add')
  ),
  div({ style: { display: 'flex', flexDirection: 'column', gap: '0.5rem' } },
    For(todos, (todo) =>
      div({ style: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#252542', borderRadius: '0.5rem' } },
        span({ style: { cursor: 'pointer', fontSize: '1.25rem' }, onclick: () => toggleTodo(todo.id) }, todo.done ? '\u2705' : '\u2b1c'),
        span({ style: { flex: '1', color: '#e2e8f0', textDecoration: (todo.done ? 'line-through' : 'none') } }, todo.text),
        button({ onclick: () => deleteTodo(todo.id), style: { background: 'transparent', border: 'none', color: '#f85149', cursor: 'pointer', fontSize: '1.25rem' } }, '\u00d7')
      )
    )
  ),
  div({ style: { marginTop: '1rem', color: '#94a3b8', fontSize: '0.875rem' } }, remaining, ' items remaining')
);

container.appendChild(app);`;

const ExampleTodo = defineElement('rikka-example-todo', {
  styles,
  render() {
    return div({ class: 'example-page' },
      h1('Todo List'),
      p('A reactive todo list with add, toggle, and delete.'),
      div({ class: 'playground-container' },
        RikkaLivePlayground.h({
    code: todoCode, height: '380', title: 'Todo List Example'
}),
      ),
      div({ class: 'explanation' },
        h2('Key Concepts'),
        p(sharedHelpers.inlineCode('signal([...])'), ' stores an array of todo items.'),
        p('Use ', sharedHelpers.inlineCode('.set([...])'), ' with spread operator to create new arrays for immutable updates.'),
        p(sharedHelpers.inlineCode('computed(() => ...)'), ' derives values like remaining count from the todo array.'),
        p('Click checkboxes to toggle, \u00d7 to delete, or add new items.'),
      ),
      div({ class: 'example-nav' },
        a({ href: '#/examples/counter', class: 'prev-link' }, '\u2190 Counter'),
        div({ class: 'spacer' }),
        a({ href: '#/examples/color-picker', class: 'next-link' }, 'Color Picker \u2192'),
      ),
    );
  }
});

export { ExampleTodo };
