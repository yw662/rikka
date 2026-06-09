import { defineElement } from '@takanashi/rikka-elements';
import {
  div, h1, p, span, button, css,
} from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import {
  todos, activeCount, completedCount, clearCompleted, exportData, importData,
} from '../store.js';
import { locale, setLocale, t } from '../i18n.js';
import { content } from '../content.js';
import { todoInput } from './todo-input.js';
import { filterBar } from './filter-bar.js';
import { todoList } from './todo-list.js';

export const app = defineElement('todo-app', {
  attributes: {},
  styles: css`
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .app-container {
      max-width: 620px;
      margin: 0 auto;
      padding: 2.5rem 1rem;
    }

    .app-header {
      text-align: center;
      margin-bottom: 2rem;
      color: white;
    }

    .app-title {
      font-size: 2.5rem;
      font-weight: 800;
      margin: 0 0 0.5rem 0;
      letter-spacing: -0.02em;
    }

    .app-subtitle {
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.8);
      margin: 0;
    }

    .top-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .icon-btn {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: white;
      padding: 0.4rem 0.8rem;
      border-radius: 0.5rem;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }

    .icon-btn:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .app-card {
      background: white;
      border-radius: 1.25rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      overflow: hidden;
    }

    .stats-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 0.85rem;
    }

    .stats-count {
      font-weight: 600;
      color: #475569;
    }

    .clear-btn {
      background: transparent;
      border: none;
      color: #64748b;
      padding: 0.35rem 0.75rem;
      border-radius: 0.4rem;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.15s;
    }

    .clear-btn:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    .clear-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .footer-info {
      text-align: center;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.8rem;
      margin-top: 1.5rem;
    }
  `,
  render() {
    const titleEl = h1({ class: 'app-title' }, t(content.appTitle));
    const subtitleEl = p({ class: 'app-subtitle' }, t(content.appSubtitle));

    effect(() => {
      titleEl.textContent = t(content.appTitle);
      subtitleEl.textContent = t(content.appSubtitle);
    });

    const langBtn = button({ class: 'icon-btn' }, locale.get() === 'en' ? '中文' : 'EN');
    langBtn.addEventListener('click', () => {
      setLocale(locale.get() === 'en' ? 'zh' : 'en');
    });
    effect(() => {
      langBtn.textContent = locale.get() === 'en' ? '中文' : 'EN';
    });

    // 导出按钮
    const exportBtn = button({ class: 'icon-btn' }, t(content.exportData));
    exportBtn.addEventListener('click', () => {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `todo-list-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
    effect(() => { exportBtn.textContent = t(content.exportData); });

    // 导入按钮
    const importBtn = button({ class: 'icon-btn' }, t(content.importData));
    importBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const text = typeof reader.result === 'string' ? reader.result : '';
          if (importData(text)) {
            alert('Imported successfully');
          } else {
            alert('Invalid JSON file');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });
    effect(() => { importBtn.textContent = t(content.importData); });

    const activeCountEl = span({ class: 'stats-count' }, String(activeCount.get()));
    const itemsLeftLabel = span({}, t(content.itemsLeft));
    effect(() => { activeCountEl.textContent = String(activeCount.get()); });
    effect(() => { itemsLeftLabel.textContent = t(content.itemsLeft); });

    const clearBtn = button({ class: 'clear-btn' }, t(content.clearCompleted));
    clearBtn.addEventListener('click', () => clearCompleted());
    effect(() => {
      clearBtn.textContent = t(content.clearCompleted);
      (clearBtn as HTMLButtonElement).disabled = completedCount.get() === 0;
    });

    // 监听整体变化重新计算
    effect(() => {
      // 这里读取以建立响应式依赖
      todos.get();
    });

    return div(
      { class: 'app-container' },
      div({ class: 'top-actions' }, importBtn, exportBtn, langBtn),
      div({ class: 'app-header' }, titleEl, subtitleEl),
      div(
        { class: 'app-card' },
        todoInput.h({}),
        filterBar.h({}),
        todoList.h({}),
        div(
          { class: 'stats-bar' },
          span({}, activeCountEl, ' ', itemsLeftLabel),
          clearBtn
        )
      ),
      div({ class: 'footer-info' }, 'Built with Rikka • Native Web Components')
    );
  },
});
