import { defineElement } from '@takanashi/rikka-elements';
import { div, input, button, span, css, select, option } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { addTodo, type Priority } from '../store.js';
import { locale, t } from '../i18n.js';
import { content } from '../content.js';

export const todoInput = defineElement('todo-input', {
  attributes: {},
  styles: css`
    :host { display: block; width: 100%; }

    .input-wrap {
      display: flex;
      gap: 0.5rem;
      padding: 1rem 1.25rem 0.5rem;
    }

    .text-input {
      flex: 1;
      padding: 0.8rem 1rem;
      font-size: 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 0.75rem;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      background: #f8fafc;
      color: #0f172a;
    }

    .text-input:focus {
      border-color: #6366f1;
      background: white;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }

    .priority-select {
      padding: 0 0.75rem;
      font-size: 0.85rem;
      border: 2px solid #e2e8f0;
      border-radius: 0.75rem;
      background: #f8fafc;
      color: #334155;
      cursor: pointer;
      outline: none;
      font-weight: 600;
    }

    .priority-select:focus {
      border-color: #6366f1;
      background: white;
    }

    .add-btn {
      padding: 0 1.25rem;
      border-radius: 0.75rem;
      background: #6366f1;
      color: white;
      border: none;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }

    .add-btn:hover {
      background: #4f46e5;
    }

    .add-btn:active {
      transform: translateY(1px);
    }

    .tag-input-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      padding: 0 1.25rem 1rem;
    }

    .tag-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.625rem;
      background: #e0e7ff;
      color: #4338ca;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .tag-chip button {
      background: transparent;
      border: none;
      color: #4338ca;
      font-size: 0.85rem;
      line-height: 1;
      cursor: pointer;
      padding: 0 0 0 0.15rem;
    }

    .tag-input {
      flex: 1;
      min-width: 100px;
      border: none;
      outline: none;
      padding: 0.25rem 0.5rem;
      font-size: 0.8rem;
      background: transparent;
      color: #334155;
    }

    .tag-input::placeholder {
      color: #94a3b8;
    }
  `,
  render() {
    const textInput = input({
      class: 'text-input',
      type: 'text',
      placeholder: t(content.addPlaceholder),
    });

    const prioritySelect = select(
      { class: 'priority-select' },
      option({ value: 'high' }, t(content.priorityHigh)),
      option({ value: 'medium' }, t(content.priorityMedium)),
      option({ value: 'low' }, t(content.priorityLow))
    );
    (prioritySelect as HTMLSelectElement).value = 'medium';

    const addBtn = button({ class: 'add-btn' }, t(content.addTask));

    const tagWrap = div({ class: 'tag-input-wrap' });
    const pendingTags: string[] = [];
    const tagInput = input({
      class: 'tag-input',
      type: 'text',
      placeholder: t(content.tagInput),
    });

    const renderTagChips = () => {
      tagWrap.replaceChildren(
        ...pendingTags.map(tag => span(
          { class: 'tag-chip' },
          tag,
          (() => {
            const b = button({}, '×');
            b.addEventListener('click', () => {
              const idx = pendingTags.indexOf(tag);
              if (idx >= 0) pendingTags.splice(idx, 1);
              renderTagChips();
            });
            return b;
          })()
        )),
        tagInput
      );
    };
    renderTagChips();

    const handleSubmit = () => {
      const text = (textInput as HTMLInputElement).value;
      const priority = (prioritySelect as HTMLSelectElement).value as Priority;
      if (text.trim()) {
        addTodo(text, priority, [...pendingTags]);
        (textInput as HTMLInputElement).value = '';
        pendingTags.length = 0;
        renderTagChips();
      }
    };

    textInput.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleSubmit();
    });
    addBtn.addEventListener('click', handleSubmit);

    tagInput.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = (tagInput as HTMLInputElement).value.trim();
        if (val && !pendingTags.includes(val) && pendingTags.length < 5) {
          pendingTags.push(val);
          (tagInput as HTMLInputElement).value = '';
          renderTagChips();
        }
      } else if (e.key === 'Backspace' && !(tagInput as HTMLInputElement).value && pendingTags.length) {
        pendingTags.pop();
        renderTagChips();
      }
    });

    effect(() => {
      locale.get();
      (textInput as HTMLInputElement).placeholder = t(content.addPlaceholder);
      addBtn.textContent = t(content.addTask);
      (tagInput as HTMLInputElement).placeholder = t(content.tagInput);
      // 更新 select 选项文字
      const opts = prioritySelect.querySelectorAll('option');
      if (opts[0]) opts[0].textContent = t(content.priorityHigh);
      if (opts[1]) opts[1].textContent = t(content.priorityMedium);
      if (opts[2]) opts[2].textContent = t(content.priorityLow);
    });

    return div({}, div({ class: 'input-wrap' }, textInput, prioritySelect, addBtn), tagWrap);
  },
});
