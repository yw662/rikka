import { defineElement } from '@takanashi/rikka-elements';
import { div, textarea, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import {
  activeTab,
  htmlCode,
  cssCode,
  jsCode,
  type FileType,
} from '../editor-store.js';

export const codeEditor = defineElement('code-editor', {
  attributes: {},
  styles: css`
    :host {
      display: block;
      height: 100%;
    }
    
    .editor-container {
      height: 100%;
      position: relative;
    }
    
    .code-textarea {
      width: 100%;
      height: 100%;
      background: #1e1e2e;
      color: #cdd6f4;
      border: none;
      padding: 1.25rem;
      font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
      font-size: 0.875rem;
      line-height: 1.6;
      resize: none;
      outline: none;
      border-radius: 0.75rem;
    }
    
    .code-textarea::placeholder {
      color: rgba(205, 214, 244, 0.3);
    }
  `,
  render() {
    const textareaEl = textarea({
      class: 'code-textarea',
      spellcheck: 'false',
    });

    function getCodeSignal(type: FileType) {
      switch (type) {
        case 'html':
          return htmlCode;
        case 'css':
          return cssCode;
        case 'js':
          return jsCode;
        default:
          return htmlCode;
      }
    }

    textareaEl.addEventListener('input', (e) => {
      const currentTab = activeTab.get();
      const signal = getCodeSignal(currentTab);
      signal.set((e.target as HTMLTextAreaElement).value);
    });

    // Handle tab key
    textareaEl.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const target = e.target as HTMLTextAreaElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const value = target.value;
        target.value = value.substring(0, start) + '  ' + value.substring(end);
        target.selectionStart = target.selectionEnd = start + 2;
        
        const currentTab = activeTab.get();
        const signal = getCodeSignal(currentTab);
        signal.set(target.value);
      }
    });

    effect(() => {
      const currentTab = activeTab.get();
      const signal = getCodeSignal(currentTab);
      textareaEl.value = signal.get();
      
      textareaEl.placeholder = 
        currentTab === 'html' ? '在这里编写 HTML...' :
        currentTab === 'css' ? '在这里编写 CSS...' :
        '在这里编写 JavaScript...';
    });

    return div(
      { class: 'editor-container' },
      textareaEl
    );
  },
});
