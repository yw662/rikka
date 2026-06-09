import { defineElement } from '@takanashi/rikka-elements';
import { css } from '@takanashi/rikka-dom';
import './drawing-canvas.js';

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

    drawing-canvas::part(*) { }
  `,
  render() {
    const wrap = document.createElement('div');
    wrap.className = 'app-container';

    const canvas = document.createElement('drawing-canvas');
    wrap.appendChild(canvas);
    return wrap;
  },
});