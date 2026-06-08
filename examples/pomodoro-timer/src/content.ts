import type { Locale } from './i18n';

export const content = {
  appTitle: { en: '🍅 Pomodoro Timer', zh: '🍅 番茄钟' },
  appSubtitle: { en: 'Focus on work, rest efficiently', zh: '专注工作，高效休息' },
  start: { en: 'Start', zh: '开始' },
  pause: { en: 'Pause', zh: '暂停' },
  reset: { en: 'Reset', zh: '重置' },
  completed: { en: 'Completed: ', zh: '已完成: ' },
  pomodoros: { en: ' pomodoros', zh: ' 个番茄' },
  focus: { en: 'Focus', zh: '专注' },
  shortBreak: { en: 'Short Break', zh: '短休息' },
  longBreak: { en: 'Long Break', zh: '长休息' },
} satisfies Record<string, Record<Locale, string>>;
