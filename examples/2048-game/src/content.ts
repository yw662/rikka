import type { Locale } from './i18n';

export const content = {
  title: { en: '2048', zh: '2048' },
  subtitle: { en: 'Join the numbers and get to the 2048 tile!', zh: '合并数字，达到2048!' },
  score: { en: 'Score', zh: '分数' },
  best: { en: 'Best', zh: '最佳' },
  newGame: { en: 'New Game', zh: '新游戏' },
  howToPlay: { en: 'How to Play', zh: '玩法说明' },
  instructions: {
    en: 'Use your arrow keys or swipe to move the tiles. When two tiles with the same number touch, they merge into one!',
    zh: '使用方向键或滑动来移动方块。当两个相同数字的方块相碰时，它们会合并成一个!'
  },
  gameOver: { en: 'Game Over!', zh: '游戏结束!' },
  won: { en: 'You Win!', zh: '恭喜获胜!' },
  tryAgain: { en: 'Try Again', zh: '再试一次' },
  continue: { en: 'Continue', zh: '继续游戏' },
} satisfies Record<string, Record<Locale, string>>;