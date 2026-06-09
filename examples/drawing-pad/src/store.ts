import { signal, computed, effect } from '@takanashi/rikka-signal';

export type Tool = 'pen' | 'eraser' | 'line' | 'rect' | 'circle';

export const currentColor = signal<string>('#1e293b');
export const currentSize = signal<number>(4);
export const currentTool = signal<Tool>('pen');
export const bgColor = signal<string>('#ffffff');

// 颜色调色板预设
export const PALETTE: string[] = [
  '#000000', '#1e293b', '#475569', '#94a3b8',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#ffffff', '#fef3c7', '#dbeafe', '#fce7f3',
];

// 笔刷大小预设
export const SIZES: number[] = [2, 4, 8, 16, 24, 40];

// 撤销/重做栈
const undoStack: ImageData[] = [];
const redoStack: ImageData[] = [];
export const canUndo = signal<boolean>(false);
export const canRedo = signal<boolean>(false);

export const MAX_HISTORY = 50;

export function pushUndo(data: ImageData) {
  undoStack.push(data);
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack.length = 0;
  canUndo.set(true);
  canRedo.set(false);
}

export function popUndo(): ImageData | null {
  if (undoStack.length === 0) return null;
  const data = undoStack.pop()!;
  canUndo.set(undoStack.length > 0);
  return data;
}

export function pushRedo(data: ImageData) {
  redoStack.push(data);
  canRedo.set(true);
}

export function popRedo(): ImageData | null {
  if (redoStack.length === 0) return null;
  const data = redoStack.pop()!;
  canRedo.set(redoStack.length > 0);
  return data;
}

export function clearHistory() {
  undoStack.length = 0;
  redoStack.length = 0;
  canUndo.set(false);
  canRedo.set(false);
}
