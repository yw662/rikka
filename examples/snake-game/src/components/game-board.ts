import { defineElement } from '@takanashi/rikka-elements';
import { div, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { snake, food, gridSize, cellSize } from '../store.js';

export const gameBoard = defineElement('snake-board', {
  attributes: {},
  styles: css`
    :host { display: block; }

    .board {
      display: grid;
      grid-template-columns: repeat(${gridSize}, ${cellSize}px);
      gap: 1px;
      background: #1a1a2e;
      border: 3px solid #16213e;
      border-radius: 8px;
      padding: 2px;
    }

    .cell {
      width: ${cellSize}px;
      height: ${cellSize}px;
      background: #16213e;
      border-radius: 2px;
    }

    .snake {
      background: linear-gradient(135deg, #10b981, #059669);
      border-radius: 4px;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
    }

    .snake-head {
      background: linear-gradient(135deg, #34d399, #10b981);
      border-radius: 50%;
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.8);
    }

    .food {
      background: linear-gradient(135deg, #f87171, #ef4444);
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(248, 113, 113, 0.6);
      animation: pulse 1s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
  `,
  render() {
    const board = div({ class: 'board' });

    const renderBoard = () => {
      const snakeParts = snake.get();
      const foodPos = food.get();
      
      board.replaceChildren();
      
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const isSnakeHead = snakeParts[0]?.x === x && snakeParts[0]?.y === y;
          const isSnake = snakeParts.some((p, i) => p.x === x && p.y === y && i > 0);
          const isFood = foodPos.x === x && foodPos.y === y;
          
          const cell = div({
            class: 'cell' + 
              (isSnakeHead ? ' snake-head' : '') + 
              (isSnake ? ' snake' : '') + 
              (isFood ? ' food' : '')
          });
          board.appendChild(cell);
        }
      }
    };

    renderBoard();

    effect(() => {
      snake.get();
      food.get();
      renderBoard();
    });

    return board;
  },
});