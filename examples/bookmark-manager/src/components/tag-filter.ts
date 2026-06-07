import { defineElement } from '@takanashi/rikka-elements';
import { div, span, button, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { allTags, selectedTags, toggleTag } from '../store.js';

export const tagFilter = defineElement('tag-filter', {
  attributes: {},
  styles: css`
    :host {
      display: block;
      width: 100%;
      margin-bottom: 1.5rem;
    }
    
    .tag-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .tag-btn {
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 9999px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .tag-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    }
    
    .tag-btn.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-color: transparent;
      color: white;
    }
  `,
  render() {
    const container = div({ class: 'tag-container' });

    function renderTags() {
      container.innerHTML = '';
      const tags = allTags.get();
      const selected = selectedTags.get();

      if (tags.length === 0) {
        const emptyMsg = span({}, '暂无标签，添加书签后会自动生成');
        emptyMsg.style.color = 'rgba(255, 255, 255, 0.5)';
        emptyMsg.style.fontSize = '0.875rem';
        container.appendChild(emptyMsg);
        return;
      }

      tags.forEach((tag) => {
        const btn = button(
          { class: `tag-btn${selected.includes(tag) ? ' active' : ''}` },
          tag
        );
        btn.addEventListener('click', () => toggleTag(tag));
        container.appendChild(btn);
      });
    }

    renderTags();

    effect(() => {
      allTags.get();
      selectedTags.get();
      renderTags();
    });

    return container;
  },
});
