import { defineElement } from '@takanashi/rikka-elements';
import { div, css } from '@takanashi/rikka-dom';
import { effect } from '@takanashi/rikka-signal';
import { grid, getTileColor, getTileTextColor, getTileFontSize } from '../store';

export const gameBoard = defineElement('game-board', {
  attributes: {},
  styles: css`
    :host { display: block; }

    .board {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      padding: 12px;
      background: #bbada0;
      border-radius: 6px;
    }

    .cell {
      aspect-ratio: 1;
      background: rgba(238, 228, 218, 0.35);
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    .tile {
      position: absolute;
      inset: 4px;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: #f9f6f2;
      transition: transform 0.15s ease, opacity 0.15s ease;
      animation: appear 0.2s ease;
    }

    @keyframes appear {
      0% {
        transform: scale(0);
        opacity: 0;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    @keyframes pop {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    .tile.merged {
      animation: pop 0.2s ease;
    }
  `,
  render() {
    const board = div({ class: 'board' });

    const renderBoard = () => {
      const currentGrid = grid.get();
      board.replaceChildren();
      
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const cell = div({ class: 'cell' });
          const value = currentGrid[r][c];
          
          if (value !== null) {
            const tile = div({
              class: 'tile',
              style: {
                backgroundColor: getTileColor(value),
                color: getTileTextColor(value),
                fontSize: getTileFontSize(value),
              },
            }, String(value));
            cell.appendChild(tile);
          }
          
          board.appendChild(cell);
        }
      }
    };

    renderBoard();

    effect(() => {
      grid.get();
      renderBoard();
    });

    return board;
  },
});