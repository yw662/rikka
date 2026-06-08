import { defineElement } from '@takanashi/rikka-elements';
import { div, h1, p, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { mode, modeColors, type TimerMode } from '../store.js';
import { modeSelector } from './mode-selector.js';
import { timerDisplay } from './timer-display.js';
import { controls } from './controls.js';
import { stats } from './stats.js';
import { locale, t } from '../i18n.js';
import { content } from '../content.js';

export const app = defineElement('pomodoro-app', {
  attributes: {},
  styles: css`
    :host {
      display: block;
      width: 100%;
      max-width: 420px;
    }
    
    .app {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(20px);
      border-radius: 2rem;
      padding: 2.5rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.5s ease;
    }
    
    .app-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }
    
    .app-header h1 {
      color: white;
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    
    .app-header p {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.95rem;
    }
  `,
  render() {
    const appContainer = div({ class: 'app' });

    effect(() => {
      const color = modeColors[mode.get()];
      appContainer.style.borderColor = color;
      appContainer.style.boxShadow = `0 25px 50px -12px ${color}40`;
    });

    const titleEl = h1({}, t(content.appTitle));
    const subtitleEl = p({}, t(content.appSubtitle));

    effect(() => {
      titleEl.textContent = t(content.appTitle);
      subtitleEl.textContent = t(content.appSubtitle);
    });

    appContainer.appendChild(
      div(
        { class: 'app-header' },
        titleEl,
        subtitleEl
      )
    );
    appContainer.appendChild(modeSelector.h({}));
    appContainer.appendChild(timerDisplay.h({}));
    appContainer.appendChild(controls.h({}));
    appContainer.appendChild(stats.h({}));

    return appContainer;
  },
});
