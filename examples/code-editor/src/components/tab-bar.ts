import { defineElement, css } from 'rikka-elements';
import { div, button } from 'rikka-dom';
import { computed } from 'rikka-signal';
import { activeTab } from '../editor-store';
import type { FileType } from '../editor-store';

const tabBarStyles = css`
:host {
  display: block;
}
.tab-bar {
  display: flex;
  background: #252526;
  border-bottom: 1px solid #3c3c3c;
}
.tab {
  padding: 0.75rem 1.5rem;
  background: #2d2d2d;
  color: #d4d4d4;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-family: inherit;
  transition: background 0.15s, color 0.15s;
  border-right: 1px solid #3c3c3c;
}
.tab:hover {
  background: #353535;
}
.tab.active {
  background: #1e1e1e;
  color: #ffffff;
}
`;

const TAB_CONFIG: { type: FileType; label: string }[] = [
  { type: 'html', label: 'HTML' },
  { type: 'css', label: 'CSS' },
  { type: 'js', label: 'JavaScript' },
];

const TabBar = defineElement(
  'tab-bar',
  {
    styles: tabBarStyles,
    render() {
      return div(
        { class: 'tab-bar' },
        ...TAB_CONFIG.map((tab) =>
          button(
            {
              class: computed(() => `tab ${activeTab.get() === tab.type ? 'active' : ''}`),
              onclick: () => activeTab.set(tab.type),
            },
            tab.label
          )
        )
      );
    }
  }
);

export { TabBar };