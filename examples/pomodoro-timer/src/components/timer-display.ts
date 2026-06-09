import { defineElement } from '@takanashi/rikka-elements';
import { div, span, svg, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { displayTime, progress, modeColors, mode } from '../store.js';

const CIRCUMFERENCE = 2 * Math.PI * 90;

export const timerDisplay = defineElement('timer-display', {
  attributes: {},
  styles: css`
    :host {
      display: block;
      width: 100%;
    }

    .timer-display {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem 0 0.5rem;
    }

    .timer-circle {
      width: 220px;
      height: 220px;
      position: relative;
    }

    .timer-circle svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .time-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 3rem;
      font-weight: 700;
      color: white;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.05em;
    }
  `,
  render() {
    const timeText = span({ class: 'time-text' }, displayTime.get());

    // 背景圆
    const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgCircle.setAttribute('cx', '110');
    bgCircle.setAttribute('cy', '110');
    bgCircle.setAttribute('r', '90');
    bgCircle.setAttribute('fill', 'none');
    bgCircle.setAttribute('stroke', 'rgba(255, 255, 255, 0.2)');
    bgCircle.setAttribute('stroke-width', '8');

    // 进度圆
    const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    progressCircle.setAttribute('cx', '110');
    progressCircle.setAttribute('cy', '110');
    progressCircle.setAttribute('r', '90');
    progressCircle.setAttribute('fill', 'none');
    progressCircle.setAttribute('stroke-width', '8');
    progressCircle.setAttribute('stroke-linecap', 'round');
    progressCircle.setAttribute('stroke-dasharray', String(CIRCUMFERENCE));
    progressCircle.setAttribute('stroke-dashoffset', '0');
    progressCircle.setAttribute('stroke', modeColors[mode.get()]);
    progressCircle.style.transition = 'stroke-dashoffset 0.35s ease, stroke 0.3s ease';

    const svgEl = svg({ viewBox: '0 0 220 220' });
    svgEl.appendChild(bgCircle);
    svgEl.appendChild(progressCircle);

    effect(() => {
      timeText.textContent = displayTime.get();
    });

    effect(() => {
      const offset = CIRCUMFERENCE - (progress.get() / 100) * CIRCUMFERENCE;
      progressCircle.setAttribute('stroke-dashoffset', String(offset));
    });

    effect(() => {
      progressCircle.setAttribute('stroke', modeColors[mode.get()]);
    });

    return div(
      { class: 'timer-display' },
      (() => {
        const wrap = div({ class: 'timer-circle' });
        wrap.appendChild(svgEl);
        wrap.appendChild(timeText);
        return wrap;
      })()
    );
  },
});
