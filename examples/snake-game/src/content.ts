import type { Locale } from './i18n';

export const content = {
  title: { en: '🐍 Snake', zh: '🐍 贪吃蛇' },
  subtitle: { en: 'Eat the food, avoid the walls!', zh: '吃掉食物，避开墙壁！' },
  score: { en: 'Score', zh: '分数' },
  best: { en: 'Best', zh: '最佳' },
  newGame: { en: 'New Game', zh: '新游戏' },
  pause: { en: 'Pause', zh: '暂停' },
  resume: { en: 'Resume', zh: '继续' },
  gameOver: { en: 'Game Over!', zh: '游戏结束!' },
  tryAgain: { en: 'Try Again', zh: '再试一次' },
  paused: { en: 'Paused', zh: '已暂停' },
  pressSpace: { en: 'Press SPACE to pause/resume', zh: '按空格键暂停/继续' },
} satisfies Record<string, Record<Locale, string>>;