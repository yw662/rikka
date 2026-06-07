import { defineElement } from '@takanashi/rikka-elements';
import { div, span, button, svg, path, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { consoleEntries, clearConsole, isConsoleOpen, type ConsoleEntry } from '../editor-store.js';

export const consolePanel = defineElement('console-panel', {
  attributes: {},
  styles: css`
    :host {
      display: block;
      transition: all 0.3s ease;
    }
    
    :host(.closed) {
      height: 0;
      overflow: hidden;
    }
    
    .console-container {
      background: #0f172a;
      border-radius: 0.75rem;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .console-header {
      background: #1e293b;
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #334155;
    }
    
    .console-title {
      color: #e2e8f0;
      font-weight: 600;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .console-actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .console-btn {
      background: transparent;
      border: none;
      padding: 0.375rem 0.75rem;
      border-radius: 0.375rem;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 500;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 0.375rem;
      transition: all 0.2s ease;
    }
    
    .console-btn:hover {
      background: #334155;
      color: #e2e8f0;
    }
    
    .console-btn svg {
      width: 16px;
      height: 16px;
    }
    
    .console-content {
      padding: 0.75rem;
      max-height: 200px;
      overflow-y: auto;
      font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
      font-size: 0.8rem;
    }
    
    .console-empty {
      color: #64748b;
      text-align: center;
      padding: 1rem;
    }
    
    .console-entry {
      padding: 0.375rem 0;
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
      border-bottom: 1px solid #1e293b;
    }
    
    .console-entry:last-child {
      border-bottom: none;
    }
    
    .entry-type {
      font-size: 0.7rem;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-weight: 600;
      text-transform: uppercase;
      flex-shrink: 0;
    }
    
    .entry-type.log {
      background: #3b82f6;
      color: white;
    }
    
    .entry-type.warn {
      background: #f59e0b;
      color: white;
    }
    
    .entry-type.error {
      background: #ef4444;
      color: white;
    }
    
    .entry-type.info {
      background: #06b6d4;
      color: white;
    }
    
    .entry-message {
      color: #e2e8f0;
      word-break: break-all;
      white-space: pre-wrap;
    }
    
    .entry-time {
      color: #64748b;
      font-size: 0.7rem;
      flex-shrink: 0;
    }
  `,
  render() {
    const host = this;

    const content = div({ class: 'console-content' });

    function renderEntries() {
      content.innerHTML = '';
      const entries = consoleEntries.get();

      if (entries.length === 0) {
        content.appendChild(div({ class: 'console-empty' }, '控制台为空，等待输出...'));
        return;
      }

      entries.forEach((entry) => {
        const entryEl = div({ class: 'console-entry' });
        
        const time = new Date(entry.timestamp);
        const timeStr = time.toLocaleTimeString();
        
        entryEl.appendChild(span({ class: 'entry-time' }, timeStr));
        entryEl.appendChild(span({ class: `entry-type ${entry.type}` }, entry.type));
        entryEl.appendChild(span({ class: 'entry-message' }, entry.message));
        
        content.appendChild(entryEl);
      });

      // Auto-scroll to bottom
      content.scrollTop = content.scrollHeight;
    }

    const clearBtn = button(
      { class: 'console-btn' },
      svg(
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' },
        path({ d: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' })
      ),
      '清空'
    );

    clearBtn.addEventListener('click', () => {
      clearConsole();
    });

    const container = div(
      { class: 'console-container' },
      div(
        { class: 'console-header' },
        div({ class: 'console-title' }, '🖥️ 控制台'),
        div({ class: 'console-actions' }, clearBtn)
      ),
      content
    );

    renderEntries();

    effect(() => {
      renderEntries();
    });

    effect(() => {
      if (isConsoleOpen.get()) {
        host.classList.remove('closed');
      } else {
        host.classList.add('closed');
      }
    });

    return container;
  },
});
