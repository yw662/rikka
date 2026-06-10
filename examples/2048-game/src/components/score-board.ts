import { defineElement } from '@takanashi/rikka-elements';
import { div, span, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { score, bestScore } from '../store';
import { locale, t } from '../i18n';
import { content } from '../content';

export const scoreBoard = defineElement('score-board', {
  attributes: {},
  styles: css`
    :host { display: flex; gap: 8px; }

    .score-box {
      flex: 1;
      background: #bbada0;
      border-radius: 4px;
      padding: 8px 16px;
      text-align: center;
      min-width: 80px;
    }

    .score-label {
      font-size: 0.7rem;
      font-weight: bold;
      color: #eee4da;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .score-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: white;
      line-height: 1.2;
    }
  `,
  render() {
    const scoreBox = div({ class: 'score-box' },
      span({ class: 'score-label' }, t(content.score)),
      span({ class: 'score-value' }, String(score.get()))
    );

    const bestBox = div({ class: 'score-box' },
      span({ class: 'score-label' }, t(content.best)),
      span({ class: 'score-value' }, String(bestScore.get()))
    );

    effect(() => {
      score.get();
      const valueEl = scoreBox.querySelector('.score-value') as HTMLElement;
      if (valueEl) valueEl.textContent = String(score.get());
    });

    effect(() => {
      bestScore.get();
      const valueEl = bestBox.querySelector('.score-value') as HTMLElement;
      if (valueEl) valueEl.textContent = String(bestScore.get());
    });

    effect(() => {
      locale.get();
      const scoreLabel = scoreBox.querySelector('.score-label') as HTMLElement;
      const bestLabel = bestBox.querySelector('.score-label') as HTMLElement;
      if (scoreLabel) scoreLabel.textContent = t(content.score);
      if (bestLabel) bestLabel.textContent = t(content.best);
    });

    return div({ class: 'score-board' }, scoreBox, bestBox);
  },
});