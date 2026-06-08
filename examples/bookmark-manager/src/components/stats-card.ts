import { defineElement } from '@takanashi/rikka-elements';
import { div, span, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { stats } from '../store.js';
import { t } from '../i18n.js';
import { content } from '../content.js';

export const statsCard = defineElement('stats-card', {
  attributes: {},
  styles: css`
    :host {
      display: block;
      width: 100%;
    }
    
    .stats-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    
    .stat-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      padding: 1.25rem;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.15);
      transition: all 0.3s ease;
    }
    
    .stat-card:hover {
      transform: translateY(-2px);
      background: rgba(255, 255, 255, 0.15);
    }
    
    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: white;
      line-height: 1;
      margin-bottom: 0.25rem;
    }
    
    .stat-label {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
    }
  `,
  render() {
    const totalEl = span({ class: 'stat-value' }, stats.get().total.toString());
    const favEl = span({ class: 'stat-value' }, stats.get().favorites.toString());
    const tagsEl = span({ class: 'stat-value' }, stats.get().tags.toString());

    const totalLabel = span({ class: 'stat-label' }, t(content.total));
    const favLabel = span({ class: 'stat-label' }, t(content.favorites));
    const tagsLabel = span({ class: 'stat-label' }, t(content.tags));

    effect(() => {
      totalEl.textContent = stats.get().total.toString();
      favEl.textContent = stats.get().favorites.toString();
      tagsEl.textContent = stats.get().tags.toString();
      totalLabel.textContent = t(content.total);
      favLabel.textContent = t(content.favorites);
      tagsLabel.textContent = t(content.tags);
    });

    return div(
      { class: 'stats-container' },
      div(
        { class: 'stat-card' },
        totalEl,
        totalLabel
      ),
      div(
        { class: 'stat-card' },
        favEl,
        favLabel
      ),
      div(
        { class: 'stat-card' },
        tagsEl,
        tagsLabel
      )
    );
  },
});
