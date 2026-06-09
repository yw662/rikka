import { defineElement } from '@takanashi/rikka-elements';
import { css } from '@takanashi/rikka-dom';
import './drawing-canvas.js';
import { locale, setLocale, type Locale } from '../i18n.js';

export const app = defineElement('drawing-app', {
  attributes: {},
  styles: css`
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #4facfe 100%);
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
      margin-bottom: 1rem;
    }

    .lang-select {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 0.5rem;
      color: white;
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      min-width: 80px;
    }

    .lang-select:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .lang-select option {
      background: #764ba2;
      color: white;
    }

    drawing-canvas::part(*) { }
  `,
  render() {
    const wrap = document.createElement('div');
    wrap.className = 'app-container';

    const topBar = document.createElement('div');
    topBar.className = 'top-bar';

    const langSelect = document.createElement('select');
    langSelect.className = 'lang-select';
    langSelect.innerHTML = '<option value="en">English</option><option value="zh">中文</option>';
    langSelect.value = locale.get();
    langSelect.addEventListener('change', (e) => {
      setLocale((e.target as HTMLSelectElement).value as Locale);
    });

    // Subscribe to locale changes
    locale.subscribe((newLocale) => {
      langSelect.value = newLocale;
    });

    topBar.appendChild(langSelect);
    wrap.appendChild(topBar);

    const canvas = document.createElement('drawing-canvas');
    wrap.appendChild(canvas);
    return wrap;
  },
});
