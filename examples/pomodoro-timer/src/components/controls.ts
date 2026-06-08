import { defineElement } from '@takanashi/rikka-elements';
import { div, button, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { isRunning, startTimer, pauseTimer, resetTimer } from '../store.js';
import { locale, t } from '../i18n.js';
import { content } from '../content.js';

export const controls = defineElement('timer-controls', {
  attributes: {},
  styles: css`
    :host {
      display: block;
      width: 100%;
    }
    
    .controls {
      display: flex;
      gap: 1rem;
      justify-content: center;
      padding: 1rem;
    }
    
    .control-btn {
      padding: 1rem 2rem;
      border: none;
      border-radius: 1rem;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      min-width: 120px;
    }
    
    .play-btn {
      background: white;
      color: #333;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }
    
    .play-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
    }
    
    .play-btn:active {
      transform: translateY(0);
    }
    
    .reset-btn {
      background: rgba(255, 255, 255, 0.15);
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }
    
    .reset-btn:hover {
      background: rgba(255, 255, 255, 0.25);
    }
  `,
  render() {
    const playBtn = button(
      { class: 'control-btn play-btn', onclick: () => isRunning.get() ? pauseTimer() : startTimer() },
      isRunning.get() ? t(content.pause) : t(content.start)
    );
    const resetBtn = button({ class: 'control-btn reset-btn', onclick: resetTimer }, t(content.reset));

    effect(() => {
      playBtn.textContent = isRunning.get() ? t(content.pause) : t(content.start);
      resetBtn.textContent = t(content.reset);
    });

    return div({ class: 'controls' }, playBtn, resetBtn);
  },
});
