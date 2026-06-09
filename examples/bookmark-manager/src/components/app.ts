import { defineElement } from '@takanashi/rikka-elements';
import { div, h1, p, button, svg, path, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { t, locale, setLocale } from '../i18n.js';
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
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .app-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .top-bar {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .lang-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      padding: 0.4rem 0.85rem;
      border-radius: 0.5rem;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }

    .lang-btn:hover {
      background: rgba(255, 255, 255, 0.18);
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
    const langBtn = button({ class: 'lang-btn' }, locale.get() === 'en' ? '中文' : 'EN');
    langBtn.addEventListener('click', () => {
      setLocale(locale.get() === 'en' ? 'zh' : 'en');
    });

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
      const newLang = locale.get() === 'en' ? '中文' : 'EN';
      langBtn.textContent = newLang;
      if (titleEl.childNodes.length > 1) {
        const last = titleEl.childNodes[titleEl.childNodes.length - 1];
        if (last.nodeType === Node.TEXT_NODE) last.textContent = t(content.appTitle);
      }
      subtitleEl.textContent = t(content.appSubtitle);
    });

    return div({ class: 'app-container' },
      div({ class: 'top-bar' }, langBtn),
      div({ class: 'app-header' }, titleEl, subtitleEl),
      statsCard.h({}),
      searchBar.h({}),
      tagFilter.h({}),
      bookmarkList.h({}),
      bookmarkForm.h({})
    );
  },
});
