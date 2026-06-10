import { defineElement } from '@takanashi/rikka-elements';
import { div, h1, p, span, button, select, option, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { moveSnake, setDirection, restart, togglePause, gameOver, isPaused } from '../store';
import { locale, setLocale, t, type Locale } from '../i18n';
import { content } from '../content';
import { gameBoard } from './game-board';
import { scoreBoard } from './score-board';

export const app = defineElement('snake-game', {
  attributes: {},
  styles: css`
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .container {
      max-width: 550px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .title-wrap {
      flex: 1;
    }

    .title {
      font-size: 2.5rem;
      font-weight: bold;
      color: white;
      margin: 0;
      line-height: 1;
    }

    .subtitle {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.7);
      margin: 0.25rem 0 0;
    }

    .header-right {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn.new-game {
      background: #6366f1;
      color: white;
    }

    .btn.new-game:hover {
      background: #4f46e5;
    }

    .btn.pause {
      background: rgba(255, 255, 255, 0.15);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.25);
    }

    .btn.pause:hover {
      background: rgba(255, 255, 255, 0.25);
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
      background: #1a1a2e;
      color: white;
    }

    .game-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .instructions {
      text-align: center;
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.85rem;
      margin-top: 1rem;
    }

    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(22, 33, 62, 0.9);
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
      background: #1a1a2e;
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .overlay-title {
      font-size: 2.5rem;
      font-weight: bold;
      color: white;
      margin: 0 0 1rem;
    }

    .overlay-subtitle {
      font-size: 1.25rem;
      color: rgba(255, 255, 255, 0.7);
      margin: 0 0 1.5rem;
    }

    .overlay-buttons {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }

    .overlay-btn {
      padding: 0.875rem 1.75rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
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

    .pause-overlay {
      position: absolute;
      inset: 0;
      background: rgba(22, 33, 62, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      z-index: 10;
    }

    .pause-text {
      font-size: 1.5rem;
      font-weight: bold;
      color: white;
    }

    .controls-hint {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: center;
      margin-top: 0.5rem;
    }

    .control-key {
      background: rgba(255, 255, 255, 0.1);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.8);
    }

    @media (max-width: 480px) {
      .title {
        font-size: 2rem;
      }

      .header {
        flex-direction: column;
        text-align: center;
      }
    }
  `,
  render() {
    const titleEl = h1({ class: 'title' }, t(content.title));
    const subtitleEl = p({ class: 'subtitle' }, t(content.subtitle));

    const newGameBtn = button({ class: 'btn new-game' }, t(content.newGame));
    newGameBtn.addEventListener('click', restart);

    const pauseBtn = button({ class: 'btn pause' }, t(content.pause));
    pauseBtn.addEventListener('click', togglePause);

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

    const pauseOverlay = div({ class: 'pause-overlay', style: { display: 'none' } });
    pauseOverlay.appendChild(div({ class: 'pause-text' }, t(content.paused)));

    effect(() => {
      titleEl.textContent = t(content.title);
      subtitleEl.textContent = t(content.subtitle);
      newGameBtn.textContent = t(content.newGame);
      pauseBtn.textContent = isPaused.get() ? t(content.resume) : t(content.pause);
      langSelect.value = locale.get();
      const pt = pauseOverlay.querySelector('.pause-text');
      if (pt) pt.textContent = t(content.paused);
    });

    effect(() => {
      const isGameOver = gameOver.get();

      if (isGameOver) {
        overlay.style.display = '';
        overlayContent.replaceChildren(
          h1({ class: 'overlay-title' }, t(content.gameOver)),
          p({ class: 'overlay-subtitle' }, `${t(content.score)}: ${score.get()}`),
          div({ class: 'overlay-buttons' },
            button({ class: 'overlay-btn primary' }, t(content.tryAgain)).addEventListener('click', () => {
              restart();
              overlay.style.display = 'none';
            })
          )
        );
      } else {
        overlay.style.display = 'none';
      }
    });

    effect(() => {
      pauseOverlay.style.display = isPaused.get() && !gameOver.get() ? '' : 'none';
      pauseBtn.textContent = isPaused.get() ? t(content.resume) : t(content.pause);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver.get()) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          setDirection('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          setDirection('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          setDirection('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          setDirection('right');
          break;
        case ' ':
          e.preventDefault();
          togglePause();
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
          setDirection(dx > 0 ? 'right' : 'left');
        }
      } else {
        if (Math.abs(dy) > minSwipe) {
          setDirection(dy > 0 ? 'down' : 'up');
        }
      }
    };

    const container = div({ class: 'container' });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    const gameArea = div({ class: 'game-area', style: { position: 'relative' } });
    gameArea.appendChild(gameBoard.h({}));
    gameArea.appendChild(pauseOverlay);

    let gameLoop: number;
    effect(() => {
      if (!gameOver.get() && !isPaused.get()) {
        gameLoop = window.setInterval(moveSnake, 120);
      }
      return () => {
        if (gameLoop) clearInterval(gameLoop);
      };
    });

    return div({ class: 'app' },
      div({ class: 'container' },
        div({ class: 'header' },
          div({ class: 'title-wrap' }, titleEl, subtitleEl),
          div({ class: 'header-right' }, scoreBoard.h({}), newGameBtn, pauseBtn, langSelect)
        ),
        gameArea,
        p({ class: 'instructions' },
          span({}, t(content.pressSpace)),
          div({ class: 'controls-hint' },
            span({ class: 'control-key' }, '↑'),
            span({ class: 'control-key' }, '↓'),
            span({ class: 'control-key' }, '←'),
            span({ class: 'control-key' }, '→'),
            span({ class: 'control-key' }, 'WASD')
          )
        )
      ),
      overlay
    );
  },
});