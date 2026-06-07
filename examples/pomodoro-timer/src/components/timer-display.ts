import { defineElement } from '@takanashi/rikka-elements';
import { div, span, svg, circle, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { displayTime, progress, modeColors, mode, type TimerMode } from '../store.js';

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
      padding: 2rem;
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
    
    .timer-circle circle {
      fill: none;
      stroke-width: 8;
    }
    
    .bg-circle {
      stroke: rgba(255, 255, 255, 0.2);
    }
    
    .progress-circle {
      stroke-linecap: round;
      transition: stroke-dashoffset 0.35s ease;
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
    }
  `,
  render() {
    const timeText = span({ class: 'time-text' }, displayTime.get());
    const progressCircle = circle({
      class: 'progress-circle',
      cx: '110',
      cy: '110',
      r: '90',
      'stroke-dasharray': CIRCUMFERENCE.toString(),
      'stroke-dashoffset': '0',
      stroke: modeColors[mode.get()]
    });

    effect(() => {
      timeText.textContent = displayTime.get();
    });

    effect(() => {
      const offset = CIRCUMFERENCE - (progress.get() / 100) * CIRCUMFERENCE;
      progressCircle.setAttribute('stroke-dashoffset', offset.toString());
    });

    effect(() => {
      progressCircle.setAttribute('stroke', modeColors[mode.get()]);
    });

    return div(
      { class: 'timer-display' },
      div(
        { class: 'timer-circle' },
        svg(
          { viewBox: '0 0 220 220' },
          circle({ class: 'bg-circle', cx: '110', cy: '110', r: '90' }),
          progressCircle
        ),
        timeText
      )
    );
  },
});
