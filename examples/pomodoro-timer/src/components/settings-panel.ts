import { defineElement } from '@takanashi/rikka-elements';
import {
  div,
  span,
  label,
  input,
  button,
  css,
} from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import {
  settings,
  updateSetting,
  resetSettings,
} from '../store.js';
import { locale, t } from '../i18n.js';
import { content } from '../content.js';

export const settingsPanel = defineElement('timer-settings', {
  attributes: {},
  styles: css`
    :host {
      display: block;
      width: 100%;
    }

    .settings-panel {
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 1.25rem;
      padding: 1.25rem;
    }

    .settings-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .settings-title {
      color: white;
      font-size: 1rem;
      font-weight: 700;
    }

    .settings-form {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .setting-label {
      color: rgba(255, 255, 255, 0.85);
      font-size: 0.875rem;
      font-weight: 500;
    }

    .number-input {
      width: 70px;
      padding: 0.375rem 0.5rem;
      border-radius: 0.5rem;
      border: 1px solid rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 0.875rem;
      outline: none;
      text-align: center;
      font-variant-numeric: tabular-nums;
      transition: border-color 0.15s;
    }

    .number-input:focus {
      border-color: rgba(255, 255, 255, 0.7);
    }

    /* 隐藏 number input 的上下箭头，美化外观 */
    .number-input::-webkit-outer-spin-button,
    .number-input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    .number-input {
      -moz-appearance: textfield;
    }

    .toggle {
      position: relative;
      width: 40px;
      height: 22px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.3);
      cursor: pointer;
      transition: background 0.15s;
      flex-shrink: 0;
    }

    .toggle.on {
      background: white;
    }

    .toggle-thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #1f2937;
      transition: transform 0.15s;
    }

    .toggle.on .toggle-thumb {
      transform: translateX(18px);
    }

    .settings-footer {
      margin-top: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      display: flex;
      justify-content: center;
    }

    .reset-btn {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.35);
      color: rgba(255, 255, 255, 0.85);
      padding: 0.375rem 0.875rem;
      border-radius: 0.5rem;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.15s;
    }

    .reset-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      color: white;
    }
  `,
  render() {
    const titleEl = span({ class: 'settings-title' }, t(content.settings));

    const makeNumberInput = (key: 'pomodoroMinutes' | 'shortBreakMinutes' | 'longBreakMinutes' | 'longBreakEvery', min: number, max: number) => {
      const el = input({
        class: 'number-input',
        type: 'number',
        min: String(min),
        max: String(max),
        value: String(settings.get()[key]),
      });
      el.addEventListener('change', () => {
        const v = parseInt((el as HTMLInputElement).value, 10);
        if (!isNaN(v) && v >= min && v <= max) {
          updateSetting(key, v);
        } else {
          (el as HTMLInputElement).value = String(settings.get()[key]);
        }
      });
      effect(() => {
        (el as HTMLInputElement).value = String(settings.get()[key]);
      });
      return el;
    };

    const makeToggle = (key: 'autoStartBreak' | 'autoStartPomodoro' | 'soundEnabled') => {
      const thumb = div({ class: 'toggle-thumb' });
      const el = div(
        { class: 'toggle' + (settings.get()[key] ? ' on' : '') },
        thumb
      );
      el.addEventListener('click', () => {
        updateSetting(key, !settings.get()[key]);
      });
      effect(() => {
        if (settings.get()[key]) el.classList.add('on');
        else el.classList.remove('on');
      });
      return el;
    };

    // 标签元素
    const makeLabel = (text: string) => span({ class: 'setting-label' }, text);

    const row = (labelEl: HTMLElement, control: HTMLElement) =>
      div({ class: 'setting-row' }, labelEl, control);

    const pomodoroLabel = makeLabel(t(content.pomodoroLength));
    const shortLabel = makeLabel(t(content.shortBreakLength));
    const longLabel = makeLabel(t(content.longBreakLength));
    const everyLabel = makeLabel(t(content.longBreakEvery));
    const autoBreakLabel = makeLabel(t(content.autoStartBreak));
    const autoFocusLabel = makeLabel(t(content.autoStartPomodoro));
    const soundLabel = makeLabel(t(content.soundEnabled));

    const resetBtn = button({ class: 'reset-btn' }, t(content.resetSettings));
    resetBtn.addEventListener('click', () => resetSettings());

    effect(() => {
      locale.get();
      titleEl.textContent = t(content.settings);
      pomodoroLabel.textContent = t(content.pomodoroLength);
      shortLabel.textContent = t(content.shortBreakLength);
      longLabel.textContent = t(content.longBreakLength);
      everyLabel.textContent = t(content.longBreakEvery);
      autoBreakLabel.textContent = t(content.autoStartBreak);
      autoFocusLabel.textContent = t(content.autoStartPomodoro);
      soundLabel.textContent = t(content.soundEnabled);
      resetBtn.textContent = t(content.resetSettings);
    });

    return div(
      { class: 'settings-panel' },
      div({ class: 'settings-header' }, titleEl),
      div(
        { class: 'settings-form' },
        row(pomodoroLabel, makeNumberInput('pomodoroMinutes', 1, 120)),
        row(shortLabel, makeNumberInput('shortBreakMinutes', 1, 60)),
        row(longLabel, makeNumberInput('longBreakMinutes', 1, 60)),
        row(everyLabel, makeNumberInput('longBreakEvery', 2, 12)),
        row(autoBreakLabel, makeToggle('autoStartBreak')),
        row(autoFocusLabel, makeToggle('autoStartPomodoro')),
        row(soundLabel, makeToggle('soundEnabled')),
        div({ class: 'settings-footer' }, resetBtn)
      )
    );
  },
});
