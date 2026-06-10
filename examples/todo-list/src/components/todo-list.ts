import { defineElement } from '@takanashi/rikka-elements';
import { div, span, button, input, css, select, option } from '@takanashi/rikka-dom';
import { effect, signal } from '@takanashi/rikka-signal';
import {
  filteredTodos, todos, toggleTodo, deleteTodo, updateTodoText,
  setPriority, toggleTag, editingId, reorderTodos, deleteSelected, toggleSelected,
  type Priority, type Todo,
} from '../store.js';
import { locale, t } from '../i18n.js';
import { content } from '../content.js';

const selectedIds = signal<string[]>([]);
let draggedIndex: number | null = null;

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
      gap: 0.5rem;
      padding: 0.875rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      transition: background 0.15s;
      cursor: grab;
      user-select: none;
    }

    .item:hover {
      background: #f8fafc;
    }

    .item:active {
      cursor: grabbing;
    }

    .item.dragging {
      opacity: 0.5;
      background: #e0e7ff;
    }

    .item.drag-over {
      border-top: 2px solid #6366f1;
    }

    .item.selected {
      background: #eef2ff;
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

    .select-box {
      width: 18px;
      height: 18px;
      border: 2px solid #cbd5e1;
      border-radius: 4px;
      cursor: pointer;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }

    .select-box:hover {
      border-color: #6366f1;
    }

    .select-box.selected {
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
      opacity: 0;
      transition: opacity 0.15s;
    }

    .item:hover .item-actions,
    .item.selected .item-actions {
      opacity: 1;
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

    .drag-handle {
      cursor: grab;
      color: #94a3b8;
      padding: 0.25rem;
      opacity: 0;
      transition: opacity 0.15s;
    }

    .item:hover .drag-handle {
      opacity: 1;
    }

    .drag-handle:active {
      cursor: grabbing;
    }

    .batch-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1.25rem;
      background: #f1f5f9;
      border-bottom: 1px solid #e2e8f0;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .batch-info {
      font-size: 0.85rem;
      color: #475569;
      font-weight: 600;
    }

    .batch-actions {
      display: flex;
      gap: 0.5rem;
    }

    .batch-btn {
      padding: 0.35rem 0.75rem;
      border: none;
      border-radius: 0.375rem;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }

    .batch-btn.toggle {
      background: #10b981;
      color: white;
    }

    .batch-btn.toggle:hover {
      background: #059669;
    }

    .batch-btn.delete {
      background: #ef4444;
      color: white;
    }

    .batch-btn.delete:hover {
      background: #dc2626;
    }

    .batch-btn.deselect {
      background: #94a3b8;
      color: white;
    }

    .batch-btn.deselect:hover {
      background: #64748b;
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
    const batchBar = div({ class: 'batch-bar' });
    let shiftPressed = false;
    let lastClickedId: string | null = null;

    const updateBatchBar = () => {
      const selected = selectedIds.get();
      if (selected.length === 0) {
        batchBar.style.display = 'none';
        return;
      }
      batchBar.style.display = '';
      batchBar.replaceChildren(
        span({ class: 'batch-info' }, `${selected.length} ${t(content.selected)}`),
        div({ class: 'batch-actions' },
          button({ class: 'batch-btn toggle' }, t(content.toggleSelected)),
          button({ class: 'batch-btn delete' }, t(content.deleteSelected)),
          button({ class: 'batch-btn deselect' }, t(content.deselectAll))
        )
      );
      const toggleBtn = batchBar.querySelector('.batch-btn.toggle') as HTMLButtonElement;
      const deleteBtn = batchBar.querySelector('.batch-btn.delete') as HTMLButtonElement;
      const deselectBtn = batchBar.querySelector('.batch-btn.deselect') as HTMLButtonElement;

      toggleBtn?.addEventListener('click', () => {
        toggleSelected(selectedIds.get());
        selectedIds.set([]);
      });
      deleteBtn?.addEventListener('click', () => {
        deleteSelected(selectedIds.get());
        selectedIds.set([]);
      });
      deselectBtn?.addEventListener('click', () => {
        selectedIds.set([]);
      });
    };

    const toggleSelect = (id: string, e: Event) => {
      e.stopPropagation();
      const selected = [...selectedIds.get()];
      const idx = selected.indexOf(id);
      if (idx >= 0) {
        selected.splice(idx, 1);
      } else {
        if (shiftPressed && lastClickedId) {
          const items = filteredTodos.get();
          const clickedIdx = items.findIndex(t => t.id === id);
          const lastIdx = items.findIndex(t => t.id === lastClickedId);
          const start = Math.min(clickedIdx, lastIdx);
          const end = Math.max(clickedIdx, lastIdx);
          for (let i = start; i <= end; i++) {
            if (!selected.includes(items[i].id)) {
              selected.push(items[i].id);
            }
          }
        } else {
          selected.push(id);
        }
        lastClickedId = id;
      }
      selectedIds.set(selected);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftPressed = true;
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const items = filteredTodos.get();
        selectedIds.set(items.map(t => t.id));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        selectedIds.set([]);
      }
      if (e.key === 'Delete' && selectedIds.get().length > 0) {
        e.preventDefault();
        deleteSelected(selectedIds.get());
        selectedIds.set([]);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftPressed = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const renderList = () => {
      const items = filteredTodos.get();
      const selected = selectedIds.get();
      listEl.replaceChildren();
      if (items.length === 0) {
        const empty = div({ class: 'empty' }, t(content.noTasks));
        listEl.appendChild(empty);
        return;
      }
      items.forEach((todo, index) => {
        listEl.appendChild(renderItem(todo, index));
      });
    };

    const renderItem = (todo: Todo, index: number) => {
      const isEditing = editingId.get() === todo.id;
      const isSelected = selectedIds.get().includes(todo.id);

      const item = div({
        class: 'item' + (todo.completed ? ' completed' : '') + (isSelected ? ' selected' : ''),
        draggable: !isEditing,
      });

      item.addEventListener('dragstart', (e) => {
        draggedIndex = index;
        item.classList.add('dragging');
        (e.dataTransfer as DataTransfer).effectAllowed = 'move';
      });

      item.addEventListener('dragend', () => {
        draggedIndex = null;
        item.classList.remove('dragging');
        document.querySelectorAll('.item.drag-over').forEach(el => el.classList.remove('drag-over'));
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        item.classList.add('drag-over');
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over');
      });

      item.addEventListener('drop', () => {
        item.classList.remove('drag-over');
        if (draggedIndex !== null && draggedIndex !== index) {
          reorderTodos(draggedIndex, index);
        }
        draggedIndex = null;
      });

      const selectBox = button({
        class: 'select-box' + (isSelected ? ' selected' : ''),
      }, isSelected ? '✓' : '');
      selectBox.addEventListener('click', (e) => toggleSelect(todo.id, e));

      const cb = button({ class: 'checkbox' }, '✓');
      cb.addEventListener('click', () => toggleTodo(todo.id));

      const dot = div({
        class: 'priority-dot',
        style: `background: ${priorityColors[todo.priority]}`,
      });

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

      const actions = div({ class: 'item-actions' });
      if (!isEditing) {
        const dragHandle = span({ class: 'drag-handle' }, '⋮⋮');

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

        const editBtn = button({ class: 'edit-btn' }, t(content.edit));
        editBtn.addEventListener('click', () => editingId.set(todo.id));

        const delBtn = button({ class: 'delete-btn' }, t(content.delete));
        delBtn.addEventListener('click', () => deleteTodo(todo.id));

        actions.appendChild(dragHandle);
        actions.appendChild(prio);
        actions.appendChild(editBtn);
        actions.appendChild(delBtn);
      }

      item.appendChild(selectBox);
      item.appendChild(cb);
      item.appendChild(dot);
      item.appendChild(main);
      item.appendChild(actions);

      effect(() => {
        const sel = selectedIds.get();
        item.classList.toggle('selected', sel.includes(todo.id));
      });

      return item;
    };

    renderList();
    updateBatchBar();

    effect(() => {
      filteredTodos.get();
      editingId.get();
      locale.get();
      renderList();
    });

    effect(() => {
      selectedIds.get();
      updateBatchBar();
    });

    return div({}, batchBar, listEl);
  },
});
