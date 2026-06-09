import { defineElement } from '@takanashi/rikka-elements';
import { div, button, input, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { filter, searchQuery, type Filter } from '../store.js';
import { locale, t } from '../i18n.js';
import { content } from '../content.js';

export const filterBar = defineElement('todo-filter-bar', {
  attributes: {},
  styles: css`
    :host { display: block; width: 100%; }

    .filter-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1.25rem 0.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .filter-buttons {
      display: flex;
      gap: 0.25rem;
    }

    .filter-btn {
      padding: 0.35rem 0.75rem;
      border: 1px solid #e2e8f0;
      background: white;
      color: #64748b;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }

    .filter-btn:hover {
      background: #f1f5f9;
      color: #334155;
    }

    .filter-btn.active {
      background: #6366f1;
      color: white;
      border-color: #6366f1;
    }

    .search-input {
      flex: 1;
      padding: 0.5rem 0.75rem;
      font-size: 0.85rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      background: #f8fafc;
      outline: none;
      color: #0f172a;
      transition: all 0.15s;
    }

    .search-input:focus {
      border-color: #6366f1;
      background: white;
    }
  `,
  render() {
    const filters: { key: Filter; labelKey: keyof typeof content }[] = [
      { key: 'all', labelKey: 'all' },
      { key: 'active', labelKey: 'active' },
      { key: 'completed', labelKey: 'completed' },
    ];

    const buttonsEl = div({ class: 'filter-buttons' });
    const renderButtons = () => {
      buttonsEl.replaceChildren();
      filters.forEach(f => {
        const b = button(
          { class: 'filter-btn' + (filter.get() === f.key ? ' active' : '') },
          t(content[f.labelKey])
        );
        b.addEventListener('click', () => filter.set(f.key));
        buttonsEl.appendChild(b);
      });
    };
    renderButtons();

    const searchEl = input({
      class: 'search-input',
      type: 'text',
      placeholder: t(content.search),
    });
    searchEl.addEventListener('input', () => {
      searchQuery.set((searchEl as HTMLInputElement).value);
    });

    effect(() => {
      locale.get();
      renderButtons();
      (searchEl as HTMLInputElement).placeholder = t(content.search);
    });

    effect(() => {
      // 当 filter 变化时更新按钮样式
      filter.get();
      renderButtons();
    });

    return div({ class: 'filter-bar' }, searchEl, buttonsEl);
  },
});
