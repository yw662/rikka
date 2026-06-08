import { defineElement } from '@takanashi/rikka-elements';
import { div, span, svg, path, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { pomodorosCompleted } from '../store.js';
import { locale, t } from '../i18n.js';
import { content } from '../content.js';

export const stats = defineElement('timer-stats', {
  attributes: {},
  styles: css`
    :host {
      display: block;
      width: 100%;
    }
    
    .stats {
      text-align: center;
      padding: 1.5rem;
    }
    
    .stats-content {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.75rem 1.5rem;
      border-radius: 2rem;
    }
    
    .stats-icon {
      width: 24px;
      height: 24px;
      color: rgba(255, 255, 255, 0.9);
    }
    
    .stats-text {
      color: rgba(255, 255, 255, 0.9);
      font-size: 1rem;
      font-weight: 500;
    }
    
    .stats-count {
      font-weight: 700;
      font-size: 1.2rem;
      color: white;
    }
  `,
  render() {
    const countSpan = span({ class: 'stats-count' }, String(pomodorosCompleted.get()));

    const statsText = span({ class: 'stats-text' }, t(content.completed), countSpan, t(content.pomodoros));

    effect(() => {
      countSpan.textContent = String(pomodorosCompleted.get());
    });

    effect(() => {
      // Re-render the stats text when locale changes
      statsText.textContent = '';
      statsText.appendChild(document.createTextNode(t(content.completed)));
      statsText.appendChild(countSpan);
      statsText.appendChild(document.createTextNode(t(content.pomodoros)));
    });

    return div(
      { class: 'stats' },
      div(
        { class: 'stats-content' },
        svg(
          { class: 'stats-icon', xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', fill: 'currentColor' },
          path({ d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' })
        ),
        statsText
      )
    );
  },
});
