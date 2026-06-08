import { defineElement } from '@takanashi/rikka-elements';
import { div, span, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { filteredBookmarks } from '../store.js';
import { bookmarkItem } from './bookmark-item.js';
import { t } from '../i18n.js';
import { content } from '../content.js';

export const bookmarkList = defineElement('bookmark-list', {
  attributes: {},
  styles: css`
    :host {
      display: block;
      width: 100%;
    }
    
    .list-container {
      display: grid;
      gap: 1rem;
    }
    
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
    }
    
    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }
    
    .empty-text {
      color: rgba(255, 255, 255, 0.6);
      font-size: 1rem;
    }
  `,
  render() {
    const container = div({ class: 'list-container' });

    function renderList() {
      container.innerHTML = '';
      const bookmarks = filteredBookmarks.get();

      if (bookmarks.length === 0) {
        const empty = div(
          { class: 'empty-state' },
          div({ class: 'empty-icon' }, '📑'),
          div({ class: 'empty-text' }, t(content.noBookmarks))
        );
        container.appendChild(empty);
        return;
      }

      bookmarks.forEach((bookmark) => {
        const item = bookmarkItem.h({});
        (item as any).bookmark = bookmark;
        container.appendChild(item);
      });
    }

    renderList();

    effect(() => {
      filteredBookmarks.get();
      renderList();
    });

    return container;
  },
});
