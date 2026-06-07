import { defineElement } from '@takanashi/rikka-elements';
import { div, button, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { mode, setMode, modeLabel, modeColors, type TimerMode } from '../store.js';

export const modeSelector = defineElement('mode-selector', {
  attributes: {},
  styles: css`
    :host {
      display: block;
      width: 100%;
    }
    
    .mode-selector {
      display: flex;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.5rem;
      border-radius: 1rem;
    }
    
    .mode-btn {
      flex: 1;
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 0.75rem;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      background: transparent;
      color: rgba(255, 255, 255, 0.7);
    }
    
    .mode-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }
    
    .mode-btn.active {
      background: white;
      color: #333;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  `,
  render() {
    const modes: TimerMode[] = ['pomodoro', 'shortBreak', 'longBreak'];
    const buttons = modes.map((m) => 
      button({ 
        class: mode.get() === m ? 'mode-btn active' : 'mode-btn',
        onclick: () => setMode(m)
      }, modeLabel[m])
    );

    effect(() => {
      const currentMode = mode.get();
      modes.forEach((m, i) => {
        buttons[i].className = currentMode === m ? 'mode-btn active' : 'mode-btn';
      });
    });

    return div({ class: 'mode-selector' }, ...buttons);
  },
});
