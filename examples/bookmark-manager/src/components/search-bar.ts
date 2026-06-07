import { defineElement } from '@takanashi/rikka-elements';
import { div, input, button, span, svg, path, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { searchQuery, clearFilters, showForm, selectedTags } from '../store.js';

export const searchBar = defineElement('search-bar', {
  attributes: {},
  styles: css`
    :host {
      display: block;
      width: 100%;
    }
    
    .search-section {
      margin-bottom: 1.5rem;
    }
    
    .search-row {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    
    .search-input-wrapper {
      flex: 1;
      position: relative;
    }
    
    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      width: 20px;
      height: 20px;
      color: rgba(255, 255, 255, 0.5);
      pointer-events: none;
    }
    
    .search-input {
      width: 100%;
      padding: 0.875rem 1rem 0.875rem 3rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 0.875rem;
      color: white;
      font-size: 1rem;
      outline: none;
      transition: all 0.3s ease;
    }
    
    .search-input::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }
    
    .search-input:focus {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.4);
    }
    
    .add-btn {
      padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 0.875rem;
      color: white;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .add-btn:hover {
      transform: scale(1.02);
      box-shadow: 0 10px 30px -10px rgba(102, 126, 234, 0.5);
    }
    
    .add-btn svg {
      width: 20px;
      height: 20px;
    }
    
    .active-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }
    
    .filter-label {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.875rem;
    }
    
    .tag-filter-item {
      padding: 0.375rem 0.75rem;
      background: rgba(102, 126, 234, 0.3);
      border: 1px solid rgba(102, 126, 234, 0.5);
      border-radius: 0.5rem;
      color: white;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }
    
    .tag-filter-item button {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
    }
    
    .tag-filter-item button:hover {
      color: white;
    }
    
    .clear-btn {
      padding: 0.375rem 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 0.5rem;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .clear-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  `,
  render() {
    const inputEl = input({
      class: 'search-input',
      placeholder: '搜索书签...',
      value: searchQuery.get(),
    });

    inputEl.addEventListener('input', (e) => {
      searchQuery.set((e.target as HTMLInputElement).value);
    });

    const filtersEl = div({ class: 'active-filters' });

    effect(() => {
      const query = searchQuery.get().trim();
      const tags = selectedTags.get();
      
      filtersEl.innerHTML = '';
      
      if (query || tags.length > 0) {
        filtersEl.appendChild(span({ class: 'filter-label' }, '当前筛选：'));
        
        if (query) {
          const tag = div(
            { class: 'tag-filter-item' },
            span({}, `搜索: "${query}"`)
          );
          filtersEl.appendChild(tag);
        }
        
        tags.forEach((tag) => {
          const tagEl = div(
            { class: 'tag-filter-item' },
            span({}, tag)
          );
          filtersEl.appendChild(tagEl);
        });
        
        const clearBtn = button({ class: 'clear-btn' }, '清除');
        clearBtn.addEventListener('click', clearFilters);
        filtersEl.appendChild(clearBtn);
      }
    });

    const addBtn = button(
      { class: 'add-btn' },
      svg(
        { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' },
        path({ d: 'M12 5v14M5 12h14' })
      ),
      span({}, '添加')
    );

    addBtn.addEventListener('click', () => showForm.set(true));

    return div(
      { class: 'search-section' },
      div(
        { class: 'search-row' },
        div(
          { class: 'search-input-wrapper' },
          svg(
            { class: 'search-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' },
            path({ d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' })
          ),
          inputEl
        ),
        addBtn
      ),
      filtersEl
    );
  },
});
