import { signal, computed, effect } from '@takanashi/rikka-signal';

export type Direction = 'up' | 'down' | 'left' | 'right';
export interface Point { x: number; y: number; }

const GRID_SIZE = 20;
const CELL_SIZE = 25;
const STORAGE_KEY = 'rikka-snake';

function createInitialSnake(): Point[] {
  return [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
}

function getRandomPosition(): Point {
  return {
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE),
  };
}

function isCollision(point: Point, snake: Point[]): boolean {
  return snake.some(segment => segment.x === point.x && segment.y === point.y);
}

function generateFood(snake: Point[]): Point {
  let food = getRandomPosition();
  while (isCollision(food, snake)) {
    food = getRandomPosition();
  }
  return food;
}

function loadGame(): { score: number; bestScore: number } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return {
        score: data.score || 0,
        bestScore: data.bestScore || 0,
      };
    }
  } catch {}
  return { score: 0, bestScore: 0 };
}

const saved = loadGame();

export const snake = signal<Point[]>(createInitialSnake());
export const food = signal<Point>(generateFood(createInitialSnake()));
export const direction = signal<Direction>('right');
export const nextDirection = signal<Direction>('right');
export const score = signal(saved.score);
export const bestScore = signal(saved.bestScore);
export const gameOver = signal(false);
export const isPaused = signal(false);

effect(() => {
  const data = {
    score: score.get(),
    bestScore: bestScore.get(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
});

export function moveSnake() {
  if (gameOver.get() || isPaused.get()) return;

  direction.set(nextDirection.get());
  const head = snake.get()[0];
  let newHead: Point;

  switch (direction.get()) {
    case 'up':
      newHead = { x: head.x, y: head.y - 1 };
      break;
    case 'down':
      newHead = { x: head.x, y: head.y + 1 };
      break;
    case 'left':
      newHead = { x: head.x - 1, y: head.y };
      break;
    case 'right':
      newHead = { x: head.x + 1, y: head.y };
      break;
  }

  if (
    newHead.x < 0 ||
    newHead.x >= GRID_SIZE ||
    newHead.y < 0 ||
    newHead.y >= GRID_SIZE ||
    isCollision(newHead, snake.get())
  ) {
    gameOver.set(true);
    return;
  }

  const newSnake = [newHead, ...snake.get().slice(0, -1)];

  if (newHead.x === food.get().x && newHead.y === food.get().y) {
    newSnake.push(snake.get()[snake.get().length - 1]);
    food.set(generateFood(newSnake));
    score.set(score.get() + 10);
    if (score.get() > bestScore.get()) {
      bestScore.set(score.get());
    }
  }

  snake.set(newSnake);
}

export function setDirection(newDir: Direction) {
  const current = direction.get();
  if (
    (newDir === 'up' && current !== 'down') ||
    (newDir === 'down' && current !== 'up') ||
    (newDir === 'left' && current !== 'right') ||
    (newDir === 'right' && current !== 'left')
  ) {
    nextDirection.set(newDir);
  }
}

export function restart() {
  snake.set(createInitialSnake());
  food.set(generateFood(createInitialSnake()));
  direction.set('right');
  nextDirection.set('right');
  score.set(0);
  gameOver.set(false);
  isPaused.set(false);
}

export function togglePause() {
  isPaused.set(!isPaused.get());
}

export const gridSize = GRID_SIZE;
export const cellSize = CELL_SIZE;

export const isPlaying = computed(() => !gameOver.get() && !isPaused.get());