import { defineElement } from '@takanashi/rikka-elements';
import { div, button, span, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { activeTab, setActiveTab, type FileType } from '../editor-store.js';

export const tabBar = defineElement('tab-bar', {
  attributes: {},
  styles: css`
    :host {
      display: block;
    }
    
    .tab-container {
      display: flex;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 0.75rem;
      padding: 0.25rem;
      gap: 0.25rem;
    }
    
    .tab-btn {
      flex: 1;
      padding: 0.75rem 1rem;
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      border-radius: 0.5rem;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    
    .tab-btn:hover {
      color: white;
      background: rgba(255, 255, 255, 0.1);
    }
    
    .tab-btn.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    .tab-icon {
      font-size: 1.1rem;
    }
  `,
  render() {
    const tabs: { type: FileType; label: string; icon: string }[] = [
      { type: 'html', label: 'HTML', icon: '🌐' },
      { type: 'css', label: 'CSS', icon: '🎨' },
      { type: 'js', label: 'JavaScript', icon: '⚡' },
    ];

    const container = div({ class: 'tab-container' });

    function renderTabs() {
      container.innerHTML = '';
      const current = activeTab.get();

      tabs.forEach((tab) => {
        const btn = button(
          { class: `tab-btn${current === tab.type ? ' active' : ''}` },
          span({ class: 'tab-icon' }, tab.icon),
          span({}, tab.label)
        );
        btn.addEventListener('click', () => setActiveTab(tab.type));
        container.appendChild(btn);
      });
    }

    renderTabs();

    effect(() => {
      renderTabs();
    });

    return container;
  },
});
