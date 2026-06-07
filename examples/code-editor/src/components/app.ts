import { defineElement } from '@takanashi/rikka-elements';
import { div, h1, p, button, svg, path, css } from '@takanashi/rikka-dom';
import { resetAll } from '../editor-store.js';
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
      align-items: center;
      gap: 0.75rem;
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
      background: rgba(239, 68, 68, 0.3);
      border-color: rgba(239, 68, 68, 0.5);
    }
    
    .header-btn svg {
      width: 16px;
      height: 16px;
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
    const resetBtn = button(
      { class: 'header-btn' },
      svg(
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' },
        path({ d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' })
      ),
      '重置代码'
    );

    resetBtn.addEventListener('click', () => {
      resetAll();
    });

    return div(
      { class: 'app-container' },
      div(
        { class: 'app-header' },
        div(
          { class: 'header-left' },
          div({},
            h1({ class: 'app-title' }, '💻 代码编辑器'),
            p({ class: 'app-subtitle' }, 'HTML, CSS, JavaScript 在线编辑器')
          )
        ),
        div({ class: 'header-actions' }, resetBtn)
      ),
      div(
        { class: 'app-content' },
        div(
          { class: 'editor-panel' },
          tabBar.h({}),
          codeEditor.h({})
        ),
        div(
          { class: 'preview-panel' },
          previewFrame.h({}),
          consolePanel.h({})
        )
      )
    );
  },
});
