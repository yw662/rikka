import { signal, computed, effect } from '@takanashi/rikka-signal';

export type Tile = number | null;
export type Grid = Tile[][];

const GRID_SIZE = 4;
const STORAGE_KEY = 'rikka-2048';

function createEmptyGrid(): Grid {
  return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
}

function getEmptyCells(grid: Grid): { row: number; col: number }[] {
  const empty: { row: number; col: number }[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === null) {
        empty.push({ row: r, col: c });
      }
    }
  }
  return empty;
}

function addRandomTile(grid: Grid): Grid {
  const empty = getEmptyCells(grid);
  if (empty.length === 0) return grid;
  
  const newGrid = grid.map(row => [...row]);
  const { row, col } = empty[Math.floor(Math.random() * empty.length)];
  newGrid[row][col] = Math.random() < 0.9 ? 2 : 4;
  return newGrid;
}

function cloneGrid(grid: Grid): Grid {
  return grid.map(row => [...row]);
}

function slideRowLeft(row: Tile[]): { row: Tile[]; score: number; moved: boolean } {
  let newRow = row.filter(cell => cell !== null) as number[];
  let score = 0;
  let moved = false;
  
  for (let i = 0; i < newRow.length - 1; i++) {
    if (newRow[i] === newRow[i + 1]) {
      newRow[i] *= 2;
      score += newRow[i];
      newRow.splice(i + 1, 1);
      moved = true;
    }
  }
  
  while (newRow.length < GRID_SIZE) {
    newRow.push(null);
  }
  
  for (let i = 0; i < GRID_SIZE; i++) {
    if (row[i] !== newRow[i]) moved = true;
  }
  
  return { row: newRow as Tile[], score, moved };
}

function rotateGrid(grid: Grid): Grid {
  const newGrid = createEmptyGrid();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      newGrid[c][GRID_SIZE - 1 - r] = grid[r][c];
    }
  }
  return newGrid;
}

function moveLeft(grid: Grid): { grid: Grid; score: number; moved: boolean } {
  let totalScore = 0;
  let moved = false;
  const newGrid = grid.map(row => {
    const result = slideRowLeft(row);
    totalScore += result.score;
    if (result.moved) moved = true;
    return result.row;
  });
  return { grid: newGrid, score: totalScore, moved };
}

function moveRight(grid: Grid): { grid: Grid; score: number; moved: boolean } {
  const rotated = rotateGrid(rotateGrid(grid));
  const result = moveLeft(rotated);
  return {
    grid: rotateGrid(rotateGrid(result.grid)),
    score: result.score,
    moved: result.moved,
  };
}

function moveUp(grid: Grid): { grid: Grid; score: number; moved: boolean } {
  const rotated = rotateGrid(rotateGrid(rotateGrid(grid)));
  const result = moveLeft(rotated);
  return {
    grid: rotateGrid(result.grid),
    score: result.score,
    moved: result.moved,
  };
}

function moveDown(grid: Grid): { grid: Grid; score: number; moved: boolean } {
  const rotated = rotateGrid(grid);
  const result = moveLeft(rotated);
  return {
    grid: rotateGrid(rotateGrid(rotateGrid(result.grid))),
    score: result.score,
    moved: result.moved,
  };
}

function canMove(grid: Grid): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === null) return true;
      if (c < GRID_SIZE - 1 && grid[r][c] === grid[r][c + 1]) return true;
      if (r < GRID_SIZE - 1 && grid[r][c] === grid[r + 1][c]) return true;
    }
  }
  return false;
}

function hasWon(grid: Grid): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 2048) return true;
    }
  }
  return false;
}

function loadGame(): { grid: Grid; score: number; bestScore: number } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return {
        grid: data.grid || createEmptyGrid(),
        score: data.score || 0,
        bestScore: data.bestScore || 0,
      };
    }
  } catch {}
  
  let grid = addRandomTile(addRandomTile(createEmptyGrid()));
  return { grid, score: 0, bestScore: 0 };
}

const saved = loadGame();

export const grid = signal<Grid>(saved.grid);
export const score = signal(saved.score);
export const bestScore = signal(saved.bestScore);
export const gameOver = signal(false);
export const won = signal(false);
export const wonShown = signal(false);

effect(() => {
  const data = {
    grid: grid.get(),
    score: score.get(),
    bestScore: bestScore.get(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
});

export function move(direction: 'up' | 'down' | 'left' | 'right') {
  if (gameOver.get()) return;
  
  const currentGrid = grid.get();
  let result: { grid: Grid; score: number; moved: boolean };
  
  switch (direction) {
    case 'up': result = moveUp(currentGrid); break;
    case 'down': result = moveDown(currentGrid); break;
    case 'left': result = moveLeft(currentGrid); break;
    case 'right': result = moveRight(currentGrid); break;
  }
  
  if (result.moved) {
    const newGrid = addRandomTile(result.grid);
    grid.set(newGrid);
    score.set(score.get() + result.score);
    
    if (score.get() > bestScore.get()) {
      bestScore.set(score.get());
    }
    
    if (hasWon(newGrid) && !won.get()) {
      won.set(true);
    }
    
    if (!canMove(newGrid)) {
      gameOver.set(true);
    }
  }
}

export function restart() {
  grid.set(addRandomTile(addRandomTile(createEmptyGrid())));
  score.set(0);
  gameOver.set(false);
  won.set(false);
  wonShown.set(false);
}

export function continueGame() {
  won.set(false);
  wonShown.set(true);
}

export const hasEmptyCells = computed(() => getEmptyCells(grid.get()).length > 0);

export function getTileColor(value: number): string {
  const colors: Record<number, string> = {
    2: '#eee4da',
    4: '#ede0c8',
    8: '#f2b179',
    16: '#f59563',
    32: '#f67c5f',
    64: '#f65e3b',
    128: '#edcf72',
    256: '#edcc61',
    512: '#edc850',
    1024: '#edc53f',
    2048: '#edc22e',
  };
  return colors[value] || '#3c3a32';
}

export function getTileTextColor(value: number): string {
  return value <= 4 ? '#776e65' : '#f9f6f2';
}

export function getTileFontSize(value: number): string {
  if (value >= 1000) return '2rem';
  if (value >= 100) return '2.5rem';
  return '3rem';
}