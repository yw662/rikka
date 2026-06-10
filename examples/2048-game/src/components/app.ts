import { defineElement } from '@takanashi/rikka-elements';
import { div, h1, p, button, select, option, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { move, restart, continueGame, gameOver, won } from '../store.js';
import { locale, setLocale, t, type Locale } from '../i18n.js';
import { content } from '../content.js';
import { gameBoard } from './game-board.js';
import { scoreBoard } from './score-board.js';

export const app = defineElement('game-2048', {
  attributes: {},
  styles: css`
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .container {
      max-width: 420px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .title-wrap {
      flex: 1;
    }

    .title {
      font-size: 3rem;
      font-weight: bold;
      color: white;
      margin: 0;
      line-height: 1;
    }

    .subtitle {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
      margin: 0.25rem 0 0;
    }

    .header-right {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .new-game-btn {
      background: #6366f1;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.15s;
    }

    .new-game-btn:hover {
      background: #4f46e5;
    }

    .lang-btn {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: white;
      padding: 0.4rem 0.85rem;
      border-radius: 0.5rem;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      min-width: 80px;
    }

    .lang-btn option {
      background: #667eea;
      color: white;
    }

    .game-area {
      background: #faf8ef;
      border-radius: 6px;
      padding: 1rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }

    .instructions {
      margin-top: 1rem;
      text-align: center;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.85rem;
      line-height: 1.5;
    }

    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(238, 228, 218, 0.73);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .overlay-content {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }

    .overlay-title {
      font-size: 2rem;
      font-weight: bold;
      color: #776e65;
      margin: 0 0 1rem;
    }

    .overlay-buttons {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
      margin-top: 1rem;
    }

    .overlay-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.15s;
    }

    .overlay-btn.primary {
      background: #6366f1;
      color: white;
    }

    .overlay-btn.primary:hover {
      background: #4f46e5;
    }

    .overlay-btn.secondary {
      background: #eee4da;
      color: #776e65;
    }

    .overlay-btn.secondary:hover {
      background: #e2dcc8;
    }

    @media (max-width: 480px) {
      .title {
        font-size: 2.5rem;
      }

      .game-area {
        padding: 0.75rem;
      }
    }
  `,
  render() {
    const titleEl = h1({ class: 'title' }, t(content.title));
    const subtitleEl = p({ class: 'subtitle' }, t(content.subtitle));

    const newGameBtn = button({ class: 'new-game-btn' }, t(content.newGame));
    newGameBtn.addEventListener('click', restart);

    const langSelect = select(
      { class: 'lang-btn' },
      option({ value: 'en' }, 'English'),
      option({ value: 'zh' }, '中文')
    );
    langSelect.value = locale.get();
    langSelect.addEventListener('change', (e) => {
      setLocale((e.target as HTMLSelectElement).value as Locale);
    });

    const overlay = div({ class: 'overlay', style: { display: 'none' } });
    const overlayContent = div({ class: 'overlay-content' });
    overlay.appendChild(overlayContent);

    effect(() => {
      titleEl.textContent = t(content.title);
      subtitleEl.textContent = t(content.subtitle);
      newGameBtn.textContent = t(content.newGame);
      langSelect.value = locale.get();
    });

    effect(() => {
      const isGameOver = gameOver.get();
      const isWon = won.get();

      if (isGameOver || isWon) {
        overlay.style.display = '';
        overlayContent.replaceChildren(
          h1({ class: 'overlay-title' }, isWon ? t(content.won) : t(content.gameOver)),
          div({ class: 'overlay-buttons' },
            button({ class: 'overlay-btn primary' }, t(content.tryAgain)).addEventListener('click', () => {
              restart();
              overlay.style.display = 'none';
            }),
            isWon ? button({ class: 'overlay-btn secondary' }, t(content.continue)).addEventListener('click', () => {
              continueGame();
              overlay.style.display = 'none';
            }) : null
          )
        );
      } else {
        overlay.style.display = 'none';
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver.get()) return;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          move('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          move('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          move('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          move('right');
          break;
      }
    };

    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (gameOver.get()) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      const minSwipe = 30;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > minSwipe) {
          move(dx > 0 ? 'right' : 'left');
        }
      } else {
        if (Math.abs(dy) > minSwipe) {
          move(dy > 0 ? 'down' : 'up');
        }
      }
    };

    const container = div({ class: 'container' });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return div({ class: 'app' },
      div({ class: 'container' },
        div({ class: 'header' },
          div({ class: 'title-wrap' }, titleEl, subtitleEl),
          div({ class: 'header-right' }, scoreBoard.h({}), langSelect, newGameBtn)
        ),
        div({ class: 'game-area' }, gameBoard.h({})),
        p({ class: 'instructions' },
          span({}, t(content.howToPlay)),
          span({}, ' '),
          span({}, t(content.instructions))
        )
      ),
      overlay
    );
  },
});