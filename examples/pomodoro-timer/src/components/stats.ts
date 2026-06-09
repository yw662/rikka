import { defineElement } from '@takanashi/rikka-elements';
import { div, span, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import {
  pomodorosToday,
  pomodorosCompleted,
  streakDays,
  weeklyStats,
  weeklyMax,
} from '../store.js';
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
      padding: 1rem 0 1.5rem;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 1rem;
      padding: 1rem;
      text-align: center;
    }

    .stat-label {
      display: block;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.75);
      margin-bottom: 0.25rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .stat-value {
      display: block;
      font-size: 1.75rem;
      font-weight: 700;
      color: white;
      font-variant-numeric: tabular-nums;
    }

    .weekly-header {
      color: rgba(255, 255, 255, 0.85);
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      text-align: center;
    }

    .weekly-bars {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.375rem;
      align-items: end;
      height: 80px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.75rem;
      padding: 0.75rem 0.5rem;
    }

    .weekly-bar-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      height: 100%;
      justify-content: flex-end;
    }

    .weekly-bar {
      width: 100%;
      max-width: 24px;
      background: rgba(255, 255, 255, 0.85);
      border-radius: 4px 4px 0 0;
      min-height: 2px;
      transition: height 0.3s ease;
    }

    .weekly-bar-empty {
      background: rgba(255, 255, 255, 0.2);
    }

    .weekly-bar-count {
      color: white;
      font-size: 0.65rem;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    .weekly-bar-day {
      color: rgba(255, 255, 255, 0.65);
      font-size: 0.65rem;
    }
  `,
  render() {
    const todayEl = span({ class: 'stat-value' }, String(pomodorosToday.get()));
    const totalEl = span({ class: 'stat-value' }, String(pomodorosCompleted.get()));
    const streakEl = span({ class: 'stat-value' }, String(streakDays.get()));

    const barsContainer = div({ class: 'weekly-bars' });

    const renderBars = () => {
      const bars = weeklyStats.get();
      const max = weeklyMax.get();
      barsContainer.replaceChildren(
        ...bars.map(b => {
          const heightPct = (b.count / max) * 100;
          const barEl = div({
            class: 'weekly-bar' + (b.count === 0 ? ' weekly-bar-empty' : ''),
            style: `height: ${Math.max(4, heightPct)}%`,
          });
          return div(
            { class: 'weekly-bar-item' },
            barEl,
            span({ class: 'weekly-bar-count' }, b.count > 0 ? String(b.count) : ''),
            span({ class: 'weekly-bar-day' }, b.day)
          );
        })
      );
    };

    renderBars();

    effect(() => { todayEl.textContent = String(pomodorosToday.get()); });
    effect(() => { totalEl.textContent = String(pomodorosCompleted.get()); });
    effect(() => { streakEl.textContent = String(streakDays.get()); });
    effect(() => { weeklyStats.get(); weeklyMax.get(); renderBars(); });

    const weeklyHeader = span({ class: 'weekly-header' }, t(content.weeklyOverview));

    effect(() => {
      weeklyHeader.textContent = t(content.weeklyOverview);
    });

    const todayLabel = span({ class: 'stat-label' }, t(content.today));
    const totalLabel = span({ class: 'stat-label' }, t(content.total));
    const streakLabel = span({ class: 'stat-label' }, t(content.streak));

    effect(() => {
      todayLabel.textContent = t(content.today);
      totalLabel.textContent = t(content.total);
      streakLabel.textContent = t(content.streak);
    });

    return div(
      { class: 'stats' },
      div(
        { class: 'stats-row' },
        div({ class: 'stat-card' }, todayLabel, todayEl),
        div({ class: 'stat-card' }, totalLabel, totalEl),
        div({ class: 'stat-card' }, streakLabel, streakEl)
      ),
      weeklyHeader,
      barsContainer
    );
  },
});
