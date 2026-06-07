import { defineElement } from '@takanashi/rikka-elements';
import { div, a, span, button, svg, path, css } from '@takanashi/rikka-dom';
import { toggleFavorite, deleteBookmark, openEditForm, getDomain, type Bookmark } from '../store.js';

export const bookmarkItem = defineElement('bookmark-item', {
  attributes: {
    bookmark: {
      type: Object,
      default: null,
    },
  },
  styles: css`
    :host {
      display: block;
    }
    
    .bookmark-card {
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 1rem;
      padding: 1.25rem;
      transition: all 0.3s ease;
    }
    
    .bookmark-card:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }
    
    .bookmark-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }
    
    .favicon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 1.25rem;
    }
    
    .bookmark-info {
      flex: 1;
      min-width: 0;
    }
    
    .bookmark-title {
      color: white;
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .bookmark-title a {
      color: inherit;
      text-decoration: none;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .bookmark-title a:hover {
      color: #667eea;
    }
    
    .favorite-star {
      color: #fbbf24;
      font-size: 1rem;
    }
    
    .bookmark-url {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.875rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .bookmark-desc {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
      margin-bottom: 0.75rem;
      line-height: 1.5;
    }
    
    .bookmark-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
    }
    
    .tag {
      padding: 0.25rem 0.625rem;
      background: rgba(102, 126, 234, 0.25);
      border-radius: 9999px;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.9);
    }
    
    .actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .action-btn {
      width: 32px;
      height: 32px;
      border-radius: 0.5rem;
      background: rgba(255, 255, 255, 0.08);
      border: none;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    
    .action-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      color: white;
    }
    
    .action-btn.delete:hover {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }
    
    .action-btn.favorite:hover,
    .action-btn.favorite.active {
      color: #fbbf24;
    }
    
    .action-btn svg {
      width: 18px;
      height: 18px;
    }
  `,
  render() {
    const host = this;
    let bookmark = (host as any).bookmark as Bookmark;

    if (!bookmark) {
      return div({}, '');
    }

    const domain = getDomain(bookmark.url);
    const faviconEmoji = getFaviconEmoji(domain);

    function getFaviconEmoji(domain: string) {
      if (domain.includes('github')) return '🐙';
      if (domain.includes('google')) return '🔍';
      if (domain.includes('twitter') || domain.includes('x.com')) return '🐦';
      if (domain.includes('youtube')) return '📺';
      if (domain.includes('stackoverflow')) return '💻';
      if (domain.includes('mdn')) return '📚';
      return '🔗';
    }

    const favBtn = button(
      { class: `action-btn favorite${bookmark.favorite ? ' active' : ''}` },
      svg(
        { viewBox: '0 0 24 24', fill: bookmark.favorite ? 'currentColor' : 'none', stroke: 'currentColor', 'stroke-width': '2' },
        path({
          d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
        })
      )
    );

    favBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(bookmark.id);
    });

    const editBtn = button(
      { class: 'action-btn' },
      svg(
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' },
        path({
          d: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7',
        }),
        path({ d: 'M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z' })
      )
    );

    editBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openEditForm(bookmark);
    });

    const deleteBtn = button(
      { class: 'action-btn delete' },
      svg(
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' },
        path({ d: 'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2' }),
        path({ d: 'M10 11v6M14 11v6' })
      )
    );

    deleteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (confirm('确定要删除这个书签吗？')) {
        deleteBookmark(bookmark.id);
      }
    });

    const tagList = div({ class: 'tag-list' });
    bookmark.tags.forEach((tag) => {
      tagList.appendChild(span({ class: 'tag' }, tag));
    });

    return div(
      { class: 'bookmark-card' },
      div(
        { class: 'bookmark-header' },
        div({ class: 'favicon' }, faviconEmoji),
        div(
          { class: 'bookmark-info' },
          div(
            { class: 'bookmark-title' },
            a({ href: bookmark.url, target: '_blank' }, bookmark.title),
            bookmark.favorite ? span({ class: 'favorite-star' }, '⭐') : null
          ),
          div({ class: 'bookmark-url' }, domain)
        )
      ),
      bookmark.description ? div({ class: 'bookmark-desc' }, bookmark.description) : null,
      div(
        { class: 'bookmark-footer' },
        tagList,
        div(
          { class: 'actions' },
          favBtn,
          editBtn,
          deleteBtn
        )
      )
    );
  },
});
