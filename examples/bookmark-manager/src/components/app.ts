import { defineElement } from '@takanashi/rikka-elements';
import { div, h1, p, svg, path, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { t } from '../i18n.js';
import { content } from '../content.js';
import { statsCard } from './stats-card.js';
import { searchBar } from './search-bar.js';
import { tagFilter } from './tag-filter.js';
import { bookmarkForm } from './bookmark-form.js';
import { bookmarkList } from './bookmark-list.js';

export const app = defineElement('bookmark-app', {
  attributes: {},
  styles: css`
    :host {
      display: block;
      width: 100%;
    }
    
    .app-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }
    
    .app-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .app-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      color: white;
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
    }
    
    .app-title svg {
      width: 32px;
      height: 32px;
    }
    
    .app-subtitle {
      color: rgba(255, 255, 255, 0.7);
      font-size: 1rem;
      margin: 0;
    }
  `,
  render() {
    const titleEl = h1(
      { class: 'app-title' },
      svg(
        { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor' },
        path({ d: 'M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z' })
      ),
      t(content.appTitle)
    );
    const subtitleEl = p({ class: 'app-subtitle' }, t(content.appSubtitle));

    effect(() => {
      titleEl.lastChild!.textContent = t(content.appTitle);
      subtitleEl.textContent = t(content.appSubtitle);
    });

    return div(
      { class: 'app-container' },
      div(
        { class: 'app-header' },
        titleEl,
        subtitleEl
      ),
      statsCard.h({}),
      searchBar.h({}),
      tagFilter.h({}),
      bookmarkList.h({}),
      bookmarkForm.h({})
    );
  },
});
