import { defineElement } from '@takanashi/rikka-elements';
import { div, iframe, button, svg, path, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { combinedPreviewHTML, addConsoleEntry, isConsoleOpen } from '../editor-store.js';

export const previewFrame = defineElement('preview-frame', {
  attributes: {},
  styles: css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .preview-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: white;
      border-radius: 0.75rem;
      overflow: hidden;
    }
    
    .preview-header {
      background: #f1f5f9;
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .preview-title {
      font-weight: 600;
      color: #334155;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .preview-actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .action-btn {
      background: transparent;
      border: none;
      padding: 0.375rem 0.75rem;
      border-radius: 0.375rem;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 500;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 0.375rem;
      transition: all 0.2s ease;
    }
    
    .action-btn:hover {
      background: #e2e8f0;
      color: #334155;
    }
    
    .action-btn svg {
      width: 16px;
      height: 16px;
    }
    
    .iframe-wrapper {
      flex: 1;
      position: relative;
    }
    
    .preview-iframe {
      width: 100%;
      height: 100%;
      border: none;
      background: white;
    }
  `,
  render() {
    let iframeEl: HTMLIFrameElement | null = null;

    const refreshBtn = button(
      { class: 'action-btn' },
      svg(
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' },
        path({ d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' })
      ),
      '刷新'
    );

    const toggleConsoleBtn = button(
      { class: 'action-btn' },
      svg(
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' },
        path({ d: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' })
      ),
      '控制台'
    );

    refreshBtn.addEventListener('click', () => {
      if (iframeEl) {
        iframeEl.srcdoc = combinedPreviewHTML.get();
      }
    });

    toggleConsoleBtn.addEventListener('click', () => {
      isConsoleOpen.set(!isConsoleOpen.get());
    });

    effect(() => {
      if (iframeEl) {
        try {
          const html = combinedPreviewHTML.get();
          
          const instrumentedHtml = html.replace('</head>', `
            <script>
              const originalConsole = { ...console };
              ['log', 'warn', 'error', 'info'].forEach(method => {
                console[method] = function(...args) {
                  originalConsole[method].apply(console, args);
                  try {
                    const msg = args.map(a => 
                      typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
                    ).join(' ');
                    window.parent.postMessage({ type: 'console', method, message: msg }, '*');
                  } catch(e) {}
                };
              });
              window.onerror = function(msg, url, line, col, error) {
                try {
                  window.parent.postMessage({ 
                    type: 'console', 
                    method: 'error', 
                    message: String(msg) + ' (line ' + line + ')' 
                  }, '*');
                } catch(e) {}
              };
            <\/script>
          </head>`);
          
          iframeEl.srcdoc = instrumentedHtml;
        } catch (e) {
          console.error('Failed to update preview', e);
        }
      }
    });

    const container = div({ class: 'preview-container' });

    container.appendChild(
      div(
        { class: 'preview-header' },
        div({ class: 'preview-title' }, '👁️ 预览'),
        div(
          { class: 'preview-actions' },
          refreshBtn,
          toggleConsoleBtn
        )
      )
    );

    const iframeWrapper = div({ class: 'iframe-wrapper' });
    iframeEl = document.createElement('iframe');
    iframeEl.className = 'preview-iframe';
    iframeEl.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    iframeWrapper.appendChild(iframeEl);
    container.appendChild(iframeWrapper);

    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'console') {
        addConsoleEntry(e.data.method as any, e.data.message);
      }
    });

    return container;
  },
});
