import { defineElement, css } from 'rikka-elements';
import { div, textarea } from 'rikka-dom';
import { effect } from 'rikka-signal';
import { activeTab, editorState } from '../editor-store';

const editorStyles = css`
:host {
  display: block;
  flex: 1;
  min-height: 0;
}
.editor-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.code-textarea {
  flex: 1;
  width: 100%;
  box-sizing: border-box;
  padding: 1rem;
  background: #1e1e1e;
  color: #d4d4d4;
  border: none;
  resize: none;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.6;
  outline: none;
  tab-size: 2;
}
.code-textarea::placeholder {
  color: #6a6a6a;
}
`;

const CodeEditor = defineElement(
  'code-editor',
  {
    styles: editorStyles,
    render() {
      const ta = textarea({
        class: 'code-textarea',
        spellcheck: false,
        oninput: (e: Event) => {
          const value = (e.target as HTMLTextAreaElement).value;
          editorState[activeTab.get()] = value;
        },
        onkeydown: (e: KeyboardEvent) => {
          if (e.key === 'Tab') {
            e.preventDefault();
            const target = e.target as HTMLTextAreaElement;
            const start = target.selectionStart;
            const end = target.selectionEnd;
            target.value = target.value.substring(0, start) + '  ' + target.value.substring(end);
            target.selectionStart = target.selectionEnd = start + 2;
            target.dispatchEvent(new Event('input'));
          }
        },
      });

      effect(() => {
        ta.value = editorState[activeTab.get()];
      });

      return div(
        { class: 'editor-container' },
        ta
      );
    }
  }
);

export { CodeEditor };
