import { defineElement, css } from '@rikka/elements';
import { div, button, span } from '@rikka/dom';
import { theme } from '../editor-store';
import { TabBar } from './tab-bar';
import { CodeEditor } from './code-editor';
import { PreviewFrame } from './preview-frame';
import { ConsolePanel } from './console-panel';

const appStyles = css`
:host {
  display: block;
  height: 100vh;
  background: #1e1e1e;
}
.app-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: #252526;
  border-bottom: 1px solid #3c3c3c;
}
.app-title {
  font-size: 0.875rem;
  color: #d4d4d4;
  font-weight: 500;
}
.theme-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.theme-btn {
  padding: 0.375rem 0.75rem;
  background: #3c3c3c;
  border: none;
  color: #d4d4d4;
  font-size: 0.75rem;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}
.theme-btn:hover {
  background: #4a4a4a;
}
.main-content {
  flex: 1;
  display: flex;
  min-height: 0;
}
.editor-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-right: 1px solid #3c3c3c;
}
.preview-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
`;

const AppElement = defineElement(
  'mini-code-editor',
  {
    styles: appStyles,
    render() {
      return div(
        { class: 'app-container' },
        div(
          { class: 'app-header' },
          span({ class: 'app-title' }, 'Mini Code Editor'),
          div(
            { class: 'theme-toggle' },
            button(
              {
                class: 'theme-btn',
                onclick: () => {
                  theme.set(theme.get() === 'dark' ? 'light' : 'dark');
                }
              },
              span({}, 'Toggle Theme')
            )
          )
        ),
        div({ class: 'main-content' },
          div({ class: 'editor-section' },
            TabBar.h(),
            CodeEditor.h(),
            ConsolePanel.h()
          ),
          div({ class: 'preview-section' },
            PreviewFrame.h()
          )
        )
      );
    }
  }
);

export { AppElement };