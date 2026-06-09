import { defineElement } from '@takanashi/rikka-elements';
import { div, h1, p, button, css } from '@takanashi/rikka-dom';
import { effect, signal as rSignal } from '@takanashi/rikka-signal';
import { mode, modeColors, startTimer, pauseTimer, resetTimer, setMode, type TimerMode, activeTask } from '../store.js';
import { locale, setLocale, t, type Locale } from '../i18n.js';
import { content } from '../content.js';
import { modeSelector } from './mode-selector.js';
import { timerDisplay } from './timer-display.js';
import { controls } from './controls.js';
import { stats } from './stats.js';
import { taskList } from './task-list.js';
import { settingsPanel } from './settings-panel.js';

type TabKey = 'tasks' | 'stats' | 'settings';

const tabLabels: Record<TabKey, Record<Locale, string>> = {
  tasks: { en: 'Tasks', zh: '任务' },
  stats: { en: 'Stats', zh: '统计' },
  settings: { en: 'Settings', zh: '设置' },
};

export const app = defineElement('pomodoro-app', {
  attributes: {},
  styles: css`
    :host {
      display: block;
      width: 100%;
      max-width: 480px;
    }

    .app {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(20px);
      border-radius: 1.5rem;
      padding: 1.75rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: background 0.4s ease, border-color 0.4s ease;
    }

    .app-header {
      text-align: center;
      margin-bottom: 1.25rem;
    }

    .app-header h1 {
      color: white;
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .app-header p {
      color: rgba(255, 255, 255, 0.75);
      font-size: 0.85rem;
    }

    .top-bar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin-bottom: 0.5rem;
      gap: 0.5rem;
    }

    .lang-toggle {
      background: rgba(255, 255, 255, 0.15);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }

    .lang-toggle:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .active-task-banner {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 0.75rem;
      padding: 0.5rem 0.75rem;
      margin: 0 0 1rem;
      color: white;
      font-size: 0.85rem;
      text-align: center;
    }

    .tabs {
      display: flex;
      gap: 0.25rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.75rem;
      padding: 0.25rem;
      margin-top: 1.25rem;
    }

    .tab-btn {
      flex: 1;
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      padding: 0.5rem;
      border-radius: 0.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }

    .tab-btn.active {
      background: white;
      color: #1f2937;
    }

    .tab-content {
      margin-top: 1rem;
    }
  `,
  render() {
    const activeTab = rSignal<TabKey>('tasks');

    const appContainer = div({ class: 'app' });
    effect(() => {
      const color = modeColors[mode.get()];
      appContainer.style.borderColor = color;
      appContainer.style.boxShadow = `0 25px 50px -12px ${color}40`;
    });

    // 顶部栏（语言切换）
    const langBtn = button({ class: 'lang-toggle' }, locale.get() === 'en' ? '中文' : 'EN');
    langBtn.addEventListener('click', () => {
      setLocale(locale.get() === 'en' ? 'zh' : 'en');
    });
    effect(() => {
      langBtn.textContent = locale.get() === 'en' ? '中文' : 'EN';
    });

    const titleEl = h1({}, t(content.appTitle));
    const subtitleEl = p({}, t(content.appSubtitle));

    effect(() => {
      titleEl.textContent = t(content.appTitle);
      subtitleEl.textContent = t(content.appSubtitle);
    });

    // 当前任务显示
    const activeTaskBanner = div({ class: 'active-task-banner' });
    const renderActiveTask = () => {
      const at = activeTask.get();
      if (at) {
        activeTaskBanner.style.display = '';
        activeTaskBanner.textContent = `🎯 ${at.text}`;
      } else {
        activeTaskBanner.style.display = 'none';
      }
    };
    renderActiveTask();
    effect(() => { activeTask.get(); renderActiveTask(); });

    // Tab 栏
    const tabs = div({ class: 'tabs' });
    const makeTabBtn = (key: TabKey) => {
      const btn = button({ class: 'tab-btn' + (activeTab.get() === key ? ' active' : '') }, tabLabels[key][locale.get()]);
      btn.addEventListener('click', () => activeTab.set(key));
      effect(() => {
        if (activeTab.get() === key) btn.classList.add('active');
        else btn.classList.remove('active');
        btn.textContent = tabLabels[key][locale.get()];
      });
      return btn;
    };
    tabs.appendChild(makeTabBtn('tasks'));
    tabs.appendChild(makeTabBtn('stats'));
    tabs.appendChild(makeTabBtn('settings'));

    const tabContent = div({ class: 'tab-content' });
    const renderTabContent = () => {
      tabContent.replaceChildren();
      const key = activeTab.get();
      if (key === 'tasks') tabContent.appendChild(taskList.h({}));
      else if (key === 'stats') tabContent.appendChild(stats.h({}));
      else tabContent.appendChild(settingsPanel.h({}));
    };
    renderTabContent();
    effect(() => { activeTab.get(); renderTabContent(); });

    appContainer.appendChild(div({ class: 'top-bar' }, langBtn));
    appContainer.appendChild(
      div({ class: 'app-header' }, titleEl, subtitleEl)
    );
    appContainer.appendChild(activeTaskBanner);
    appContainer.appendChild(modeSelector.h({}));
    appContainer.appendChild(timerDisplay.h({}));
    appContainer.appendChild(controls.h({}));
    appContainer.appendChild(tabs);
    appContainer.appendChild(tabContent);

    return appContainer;
  },
});

// 统一命名导出入口，避免未使用变量警告
export type { TimerMode };
export { startTimer, pauseTimer, resetTimer, setMode };
