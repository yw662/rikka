import { defineElement } from '@takanashi/rikka-elements';
import { div, h1, p, button, select, option, svg, path, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { resetAll } from '../editor-store.js';
import { t, locale, setLocale, type Locale } from '../i18n.js';
import { content } from '../content.js';
import { tabBar } from './tab-bar.js';
import { codeEditor } from './code-editor.js';
import { previewFrame } from './preview-frame.js';
import { consolePanel } from './console-panel.js';

export const app = defineElement('editor-app', {
  attributes: {},
  styles: css`
    :host {
      display: block;
      height: 100vh;
    }

    .app-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .app-header {
      padding: 1rem 1.5rem;
      background: rgba(0, 0, 0, 0.3);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .app-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .app-subtitle {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.875rem;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .header-btn {
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 0.5rem;
      color: white;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .header-btn:hover {
      background: rgba(239, 68, 68, 0.25);
      border-color: rgba(239, 68, 68, 0.5);
    }

    .lang-btn {
      padding: 0.5rem 1rem;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 0.5rem;
      color: white;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      appearance: none;
      -webkit-appearance: none;
      min-width: 80px;
    }

    .lang-btn:hover {
      background: rgba(99, 102, 241, 0.25);
      border-color: rgba(99, 102, 241, 0.5);
    }

    .lang-btn option {
      background: #1e293b;
      color: white;
    }

    .app-content {
      flex: 1;
      padding: 1.5rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      min-height: 0;
    }

    .editor-panel {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-height: 0;
    }

    .preview-panel {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-height: 0;
    }

    @media (max-width: 900px) {
      .app-content {
        grid-template-columns: 1fr;
        overflow-y: auto;
      }

      .editor-panel,
      .preview-panel {
        min-height: 400px;
      }
    }
  `,
  render() {
    const titleEl = h1({ class: 'app-title' },
      svg({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', style: { width: '20px', height: '20px' } },
        path({ d: 'M8 6l-6 6 6 6M16 6l6 6-6 6' })
      ),
      t(content.appTitle)
    );
    const subtitleEl = p({ class: 'app-subtitle' }, t(content.appSubtitle));

    const resetBtn = button({ class: 'header-btn' },
      svg({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', style: { width: '14px', height: '14px' } },
        path({ d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' })
      ),
      t(content.resetCode)
    );
    resetBtn.addEventListener('click', () => resetAll());

    const langSelect = select(
      { class: 'lang-btn' },
      option({ value: 'en' }, 'English'),
      option({ value: 'zh' }, '中文')
    );
    langSelect.value = locale.get();
    langSelect.addEventListener('change', (e) => {
      setLocale((e.target as HTMLSelectElement).value as Locale);
    });

    effect(() => {
      const newTitle = t(content.appTitle);
      const newSubtitle = t(content.appSubtitle);
      const newReset = t(content.resetCode);

      if (titleEl.childNodes.length > 1) {
        const last = titleEl.childNodes[titleEl.childNodes.length - 1];
        if (last.nodeType === Node.TEXT_NODE) last.textContent = newTitle;
      }
      subtitleEl.textContent = newSubtitle;
      const resetChildren = resetBtn.childNodes;
      if (resetChildren.length > 1) {
        const last = resetChildren[resetChildren.length - 1];
        if (last.nodeType === Node.TEXT_NODE) last.textContent = newReset;
      }
      langSelect.value = locale.get();
    });

    return div({ class: 'app-container' },
      div({ class: 'app-header' },
        div({ class: 'header-left' }, titleEl, subtitleEl),
        div({ class: 'header-actions' }, langSelect, resetBtn)
      ),
      div({ class: 'app-content' },
        div({ class: 'editor-panel' }, tabBar.h({}), codeEditor.h({})),
        div({ class: 'preview-panel' }, previewFrame.h({}), consolePanel.h({}))
      )
    );
  },
});
