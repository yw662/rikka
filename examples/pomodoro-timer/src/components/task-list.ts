import { defineElement } from '@takanashi/rikka-elements';
import {
  div,
  span,
  input,
  button,
  css,
} from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import {
  tasks,
  incompleteTasks,
  completedTasks,
  activeTaskId,
  addTask,
  toggleTask,
  deleteTask,
  setActiveTask,
  updateTaskEstimate,
  clearCompletedTasks,
} from '../store.js';
import { locale, t } from '../i18n.js';
import { content } from '../content.js';

export const taskList = defineElement('timer-task-list', {
  attributes: {},
  styles: css`
    :host {
      display: block;
      width: 100%;
    }

    .task-panel {
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 1.25rem;
      padding: 1.25rem;
    }

    .task-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .task-title {
      color: white;
      font-size: 1rem;
      font-weight: 700;
    }

    .task-count {
      background: rgba(255, 255, 255, 0.25);
      color: white;
      font-size: 0.75rem;
      padding: 0.125rem 0.5rem;
      border-radius: 999px;
      font-weight: 600;
    }

    .task-form {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .task-input {
      flex: 1;
      padding: 0.625rem 0.875rem;
      border-radius: 0.625rem;
      border: 1px solid rgba(255, 255, 255, 0.25);
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .task-input::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }

    .task-input:focus {
      border-color: rgba(255, 255, 255, 0.6);
    }

    .estimate-input {
      width: 60px;
      padding: 0.625rem 0.5rem;
      border-radius: 0.625rem;
      border: 1px solid rgba(255, 255, 255, 0.25);
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 0.9rem;
      outline: none;
      text-align: center;
      font-variant-numeric: tabular-nums;
    }

    .add-btn {
      padding: 0.625rem 1rem;
      border-radius: 0.625rem;
      border: none;
      background: white;
      color: #1f2937;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .add-btn:hover {
      background: rgba(255, 255, 255, 0.9);
      transform: translateY(-1px);
    }

    .task-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 260px;
      overflow-y: auto;
    }

    .task-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 0.625rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid transparent;
      transition: all 0.15s;
    }

    .task-item:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .task-item.active {
      border-color: rgba(255, 255, 255, 0.6);
      background: rgba(255, 255, 255, 0.22);
    }

    .task-item.completed {
      opacity: 0.6;
    }

    .task-checkbox {
      width: 20px;
      height: 20px;
      border-radius: 6px;
      border: 2px solid rgba(255, 255, 255, 0.5);
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.15s;
      color: transparent;
      font-size: 0.8rem;
      font-weight: 900;
    }

    .task-item.completed .task-checkbox {
      background: white;
      border-color: white;
      color: #1f2937;
    }

    .task-text {
      flex: 1;
      color: white;
      font-size: 0.9rem;
      line-height: 1.4;
      cursor: pointer;
      min-width: 0;
    }

    .task-item.completed .task-text {
      text-decoration: line-through;
      color: rgba(255, 255, 255, 0.7);
    }

    .task-meta {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: rgba(255, 255, 255, 0.75);
      font-size: 0.75rem;
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }

    .pomodoro-icon {
      font-size: 0.75rem;
    }

    .task-delete {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.5);
      cursor: pointer;
      font-size: 1.1rem;
      padding: 0.25rem;
      border-radius: 0.25rem;
      line-height: 1;
      transition: all 0.15s;
    }

    .task-delete:hover {
      color: white;
      background: rgba(255, 255, 255, 0.15);
    }

    .empty-state {
      text-align: center;
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.875rem;
      padding: 1.5rem 1rem;
    }

    .section-divider {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 1rem 0 0.5rem;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .section-divider::before,
    .section-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: rgba(255, 255, 255, 0.15);
    }

    .clear-completed {
      display: block;
      margin: 0.75rem auto 0;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: rgba(255, 255, 255, 0.75);
      padding: 0.375rem 0.875rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.15s;
    }

    .clear-completed:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .task-list::-webkit-scrollbar {
      width: 6px;
    }
    .task-list::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.25);
      border-radius: 3px;
    }
  `,
  render() {
    const titleEl = span({ class: 'task-title' }, t(content.tasks));
    const taskInput = input({
      class: 'task-input',
      type: 'text',
      placeholder: t(content.addTask),
    });
    const estimateInput = input({
      class: 'estimate-input',
      type: 'number',
      min: '1',
      max: '99',
      value: '1',
    });
    const addBtn = button({ class: 'add-btn' }, t(content.addTaskBtn));
    const listEl = div({ class: 'task-list' });
    const emptyState = div({ class: 'empty-state' }, t(content.noTasks));

    const handleAdd = () => {
      const text = (taskInput as HTMLInputElement).value.trim();
      if (!text) return;
      const estimate = parseInt((estimateInput as HTMLInputElement).value, 10) || 1;
      addTask(text, estimate);
      (taskInput as HTMLInputElement).value = '';
      (estimateInput as HTMLInputElement).value = '1';
      (taskInput as HTMLInputElement).focus();
    };

    addBtn.addEventListener('click', handleAdd);
    taskInput.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleAdd();
    });

    const renderList = () => {
      const incomplete = incompleteTasks.get();
      const completed = completedTasks.get();
      const activeId = activeTaskId.get();

      const children: HTMLElement[] = [];

      if (incomplete.length === 0) {
        children.push(emptyState);
      } else {
        for (const task of incomplete) {
          const isActive = task.id === activeId;
          const item = div(
            { class: 'task-item' + (isActive ? ' active' : '') },
            (() => {
              const cb = div({ class: 'task-checkbox' }, '✓');
              cb.addEventListener('click', () => toggleTask(task.id));
              return cb;
            })(),
            (() => {
              const textEl = span({ class: 'task-text' }, task.text);
              textEl.addEventListener('click', () => setActiveTask(isActive ? null : task.id));
              return textEl;
            })(),
            span(
              { class: 'task-meta' },
              span({ class: 'pomodoro-icon' }, '🍅'),
              span({}, `${task.pomodorosCompleted}/${task.pomodorosEstimate}`)
            ),
            (() => {
              const del = button({ class: 'task-delete' }, '×');
              del.addEventListener('click', () => deleteTask(task.id));
              return del;
            })()
          );
          children.push(item);
        }
      }

      if (completed.length > 0) {
        const divider = div({ class: 'section-divider' }, t(content.completedTasks) + ` (${completed.length})`);
        children.push(divider);
        for (const task of completed) {
          const isActive = task.id === activeId;
          const item = div(
            { class: 'task-item completed' + (isActive ? ' active' : '') },
            (() => {
              const cb = div({ class: 'task-checkbox' }, '✓');
              cb.addEventListener('click', () => toggleTask(task.id));
              return cb;
            })(),
            (() => {
              const textEl = span({ class: 'task-text' }, task.text);
              textEl.addEventListener('click', () => setActiveTask(isActive ? null : task.id));
              return textEl;
            })(),
            span(
              { class: 'task-meta' },
              span({ class: 'pomodoro-icon' }, '🍅'),
              span({}, `${task.pomodorosCompleted}`)
            ),
            (() => {
              const del = button({ class: 'task-delete' }, '×');
              del.addEventListener('click', () => deleteTask(task.id));
              return del;
            })()
          );
          children.push(item);
        }

        const clearBtn = button({ class: 'clear-completed' }, t(content.clearCompleted));
        clearBtn.addEventListener('click', () => clearCompletedTasks());
        children.push(clearBtn);
      }

      listEl.replaceChildren(...children);
    };

    renderList();

    effect(() => {
      tasks.get();
      activeTaskId.get();
      renderList();
    });

    effect(() => {
      locale.get();
      titleEl.textContent = t(content.tasks);
      (taskInput as HTMLInputElement).placeholder = t(content.addTask);
      addBtn.textContent = t(content.addTaskBtn);
      emptyState.textContent = t(content.noTasks);
    });

    const countLabel = span({ class: 'task-count' }, String(incompleteTasks.get().length));
    effect(() => {
      countLabel.textContent = String(incompleteTasks.get().length);
    });

    return div(
      { class: 'task-panel' },
      div(
        { class: 'task-header' },
        titleEl,
        countLabel
      ),
      div(
        { class: 'task-form' },
        taskInput,
        estimateInput,
        addBtn
      ),
      listEl
    );
  },
});

