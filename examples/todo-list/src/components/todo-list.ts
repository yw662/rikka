import { defineElement } from '@takanashi/rikka-elements';
import { div, span, button, input, css, select, option } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import {
  filteredTodos, todos, toggleTodo, deleteTodo, updateTodoText,
  setPriority, toggleTag, editingId, type Priority, type Todo,
} from '../store.js';
import { locale, t } from '../i18n.js';
import { content } from '../content.js';

const priorityColors: Record<Priority, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
};

export const todoList = defineElement('todo-list', {
  attributes: {},
  styles: css`
    :host { display: block; width: 100%; }

    .list {
      max-height: 60vh;
      overflow-y: auto;
    }

    .empty {
      padding: 3rem 1.5rem;
      text-align: center;
      color: #94a3b8;
      font-size: 0.9rem;
    }

    .item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      transition: background 0.15s;
    }

    .item:hover {
      background: #f8fafc;
    }

    .item.completed .item-text {
      text-decoration: line-through;
      color: #94a3b8;
    }

    .checkbox {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 2px solid #cbd5e1;
      cursor: pointer;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      transition: all 0.15s;
    }

    .checkbox:hover {
      border-color: #6366f1;
    }

    .item.completed .checkbox {
      background: #6366f1;
      border-color: #6366f1;
      color: white;
    }

    .priority-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .item-text {
      flex: 1;
      color: #1e293b;
      font-size: 0.95rem;
      cursor: pointer;
      min-width: 0;
      word-break: break-word;
    }

    .edit-input {
      flex: 1;
      padding: 0.35rem 0.5rem;
      font-size: 0.95rem;
      border: 2px solid #6366f1;
      border-radius: 0.375rem;
      outline: none;
      color: #0f172a;
      background: white;
    }

    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin-top: 0.375rem;
    }

    .tag {
      font-size: 0.7rem;
      padding: 0.125rem 0.5rem;
      background: #f1f5f9;
      color: #475569;
      border-radius: 999px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      border: none;
    }

    .tag:hover {
      background: #e2e8f0;
      color: #1e293b;
    }

    .item-main {
      flex: 1;
      min-width: 0;
    }

    .item-actions {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .priority-select {
      padding: 0.2rem 0.5rem;
      font-size: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      background: white;
      color: #334155;
      cursor: pointer;
      outline: none;
      font-weight: 600;
    }

    .priority-select:focus {
      border-color: #6366f1;
    }

    .edit-btn, .delete-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.3rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.8rem;
      font-weight: 600;
      transition: all 0.15s;
    }

    .edit-btn:hover {
      background: #e0e7ff;
      color: #4338ca;
    }

    .delete-btn:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    .list::-webkit-scrollbar {
      width: 6px;
    }
    .list::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }
    .list::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `,
  render() {
    const listEl = div({ class: 'list' });

    const renderList = () => {
      const items = filteredTodos.get();
      listEl.replaceChildren();
      if (items.length === 0) {
        const empty = div({ class: 'empty' }, t(content.noTasks));
        listEl.appendChild(empty);
        return;
      }
      for (const todo of items) {
        listEl.appendChild(renderItem(todo));
      }
    };

    const renderItem = (todo: Todo) => {
      const isEditing = editingId.get() === todo.id;

      const item = div({ class: 'item' + (todo.completed ? ' completed' : '') });

      // checkbox
      const cb = button({ class: 'checkbox' }, '✓');
      cb.addEventListener('click', () => toggleTodo(todo.id));

      // priority dot
      const dot = div({
        class: 'priority-dot',
        style: `background: ${priorityColors[todo.priority]}`,
      });

      // main
      const main = div({ class: 'item-main' });
      if (isEditing) {
        const editInput = input({
          class: 'edit-input',
          type: 'text',
          value: todo.text,
        });
        editInput.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.key === 'Enter') {
            const val = (editInput as HTMLInputElement).value;
            if (val.trim()) {
              updateTodoText(todo.id, val);
            }
            editingId.set(null);
          } else if (e.key === 'Escape') {
            editingId.set(null);
          }
        });
        editInput.addEventListener('blur', () => {
          if (editingId.get() === todo.id) {
            const val = (editInput as HTMLInputElement).value;
            if (val.trim()) updateTodoText(todo.id, val);
            editingId.set(null);
          }
        });
        main.appendChild(editInput);
        setTimeout(() => {
          (editInput as HTMLInputElement).focus();
          (editInput as HTMLInputElement).select();
        }, 0);
      } else {
        const textEl = span({ class: 'item-text' }, todo.text);
        textEl.addEventListener('click', () => toggleTodo(todo.id));
        main.appendChild(textEl);

        if (todo.tags.length > 0) {
          const tagList = div({ class: 'tag-list' });
          todo.tags.forEach(tag => {
            const tagBtn = button({ class: 'tag' }, '#' + tag);
            tagBtn.addEventListener('click', (e) => {
              (e as Event).stopPropagation();
              toggleTag(todo.id, tag);
            });
            tagList.appendChild(tagBtn);
          });
          main.appendChild(tagList);
        }
      }

      // priority select (非编辑模式时显示)
      const actions = div({ class: 'item-actions' });
      if (!isEditing) {
        const prio = select(
          { class: 'priority-select' },
          option({ value: 'high' }, t(content.priorityHigh)),
          option({ value: 'medium' }, t(content.priorityMedium)),
          option({ value: 'low' }, t(content.priorityLow))
        );
        (prio as HTMLSelectElement).value = todo.priority;
        prio.addEventListener('change', () => {
          setPriority(todo.id, (prio as HTMLSelectElement).value as Priority);
        });
        actions.appendChild(prio);

        const editBtn = button({ class: 'edit-btn' }, t(content.edit));
        editBtn.addEventListener('click', () => editingId.set(todo.id));
        actions.appendChild(editBtn);

        const delBtn = button({ class: 'delete-btn' }, t(content.delete));
        delBtn.addEventListener('click', () => deleteTodo(todo.id));
        actions.appendChild(delBtn);
      }

      item.appendChild(cb);
      item.appendChild(dot);
      item.appendChild(main);
      item.appendChild(actions);
      return item;
    };

    renderList();

    effect(() => {
      // 响应式更新列表
      filteredTodos.get();
      editingId.get();
      locale.get();
      renderList();
    });

    return listEl;
  },
});
