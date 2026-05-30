import { defineElement, css } from 'rikka-elements';
import { div, button, span, For } from 'rikka-dom';
import { consoleEntries, clearConsole } from '../editor-store';

const consoleStyles = css`
:host {
  display: block;
  height: 150px;
  border-top: 1px solid #3c3c3c;
  background: #1e1e1e;
}
.console-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.console-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: #252526;
  border-bottom: 1px solid #3c3c3c;
}
.console-title {
  font-size: 0.75rem;
  color: #d4d4d4;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.clear-btn {
  padding: 0.25rem 0.5rem;
  background: transparent;
  border: 1px solid #4a4a4a;
  color: #8a8a8a;
  font-size: 0.6875rem;
  cursor: pointer;
  border-radius: 3px;
}
.clear-btn:hover {
  background: #3a3a3a;
  color: #d4d4d4;
}
.console-output {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 0.8125rem;
}
.console-entry {
  padding: 0.25rem 0.5rem;
  margin: 2px 0;
  border-radius: 2px;
  display: flex;
  align-items: flex-start;
}
.console-entry.log {
  color: #d4d4d4;
}
.console-entry.warn {
  color: #d29922;
  background: rgba(210, 153, 34, 0.1);
}
.console-entry.error {
  color: #f85149;
  background: rgba(248, 81, 73, 0.1);
}
.console-entry.info {
  color: #58a6ff;
}
.console-timestamp {
  color: #6a6a6a;
  margin-right: 0.75rem;
  font-size: 0.6875rem;
}
.console-message {
  flex: 1;
  word-break: break-word;
}
.empty-state {
  color: #6a6a6a;
  padding: 1rem;
  text-align: center;
  font-size: 0.8125rem;
}
`;

const formatTimestamp = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const renderEntry = (entry: { type: string; message: string; timestamp: Date }) => {
  return div(
    { class: `console-entry ${entry.type}` },
    span({ class: 'console-timestamp' }, formatTimestamp(entry.timestamp)),
    span({ class: 'console-message' }, entry.message)
  );
};

const ConsolePanel = defineElement(
  'console-panel',
  {
    styles: consoleStyles,
    render() {
      return div(
        { class: 'console-container' },
        div(
          { class: 'console-header' },
          span({ class: 'console-title' }, 'Console'),
          button({ class: 'clear-btn', onclick: clearConsole }, 'Clear')
        ),
        div({ class: 'console-output' }, For(consoleEntries, renderEntry, (_, i) => i))
      );
    }
  }
);

export { ConsolePanel };