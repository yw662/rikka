import { signal, computed, effect } from '@takanashi/rikka-signal';
import type { Locale } from './i18n.js';

export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  pomodorosCompleted: number;
  pomodorosEstimate: number;
  createdAt: number;
}

export interface Settings {
  pomodoroMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakEvery: number;
  autoStartBreak: boolean;
  autoStartPomodoro: boolean;
  soundEnabled: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  pomodoroMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
  autoStartBreak: false,
  autoStartPomodoro: false,
  soundEnabled: true,
};

export const mode = signal<TimerMode>('pomodoro');
export const isRunning = signal(false);

// --- 状态持久化 ---
function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem('pomodoro-settings');
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

function loadTasks(): Task[] {
  try {
    const stored = localStorage.getItem('pomodoro-tasks');
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function loadStats(): Record<string, number> {
  try {
    const stored = localStorage.getItem('pomodoro-daily-stats');
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

export const settings = signal<Settings>(loadSettings());
export const tasks = signal<Task[]>(loadTasks());
export const activeTaskId = signal<string | null>(null);
export const dailyStats = signal<Record<string, number>>(loadStats()); // { 'YYYY-MM-DD': count }

// --- 持久化 effect ---
effect(() => {
  localStorage.setItem('pomodoro-settings', JSON.stringify(settings.get()));
});
effect(() => {
  localStorage.setItem('pomodoro-tasks', JSON.stringify(tasks.get()));
});
effect(() => {
  localStorage.setItem('pomodoro-daily-stats', JSON.stringify(dailyStats.get()));
});

// --- 派生状态 ---
export const durations = computed(() => ({
  pomodoro: settings.get().pomodoroMinutes * 60,
  shortBreak: settings.get().shortBreakMinutes * 60,
  longBreak: settings.get().longBreakMinutes * 60,
}));

export const timeLeft = signal<number>(durations.get().pomodoro);

export const progress = computed(() => {
  const total = durations.get()[mode.get()];
  const elapsed = total - timeLeft.get();
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
});

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const displayTime = computed(() => formatTime(timeLeft.get()));

export const modeLabel: Record<TimerMode, Record<Locale, string>> = {
  pomodoro: { en: 'Focus', zh: '专注' },
  shortBreak: { en: 'Short Break', zh: '短休息' },
  longBreak: { en: 'Long Break', zh: '长休息' },
};

export const modeColors: Record<TimerMode, string> = {
  pomodoro: '#ef4444',
  shortBreak: '#22c55e',
  longBreak: '#3b82f6',
};

export const modeBgGradients: Record<TimerMode, string> = {
  pomodoro: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)',
  shortBreak: 'linear-gradient(135deg, #4ade80 0%, #16a34a 100%)',
  longBreak: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
};

// --- 每日统计 ---
function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export const pomodorosToday = computed(() => dailyStats.get()[todayKey()] ?? 0);
export const pomodorosCompleted = computed(() => {
  const stats = dailyStats.get();
  let total = 0;
  for (const k in stats) total += stats[k];
  return total;
});

export const streakDays = computed(() => {
  const stats = dailyStats.get();
  let streak = 0;
  let d = new Date();
  while (true) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if ((stats[key] ?? 0) > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
});

export const weeklyStats = computed(() => {
  const result: { day: string; count: number; date: string }[] = [];
  const stats = dailyStats.get();
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    result.push({
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
      date: key,
      count: stats[key] ?? 0,
    });
  }
  return result;
});

export const weeklyMax = computed(() => {
  const stats = weeklyStats.get();
  return Math.max(1, ...stats.map(s => s.count));
});

// --- 任务管理 ---
export const activeTask = computed(() => {
  const id = activeTaskId.get();
  if (!id) return null;
  return tasks.get().find(t => t.id === id) ?? null;
});

export const incompleteTasks = computed(() =>
  tasks.get().filter(t => !t.completed)
);

export const completedTasks = computed(() =>
  tasks.get().filter(t => t.completed)
);

function generateTaskId(): string {
  return 't_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function addTask(text: string, estimate: number = 1) {
  const t: Task = {
    id: generateTaskId(),
    text,
    completed: false,
    pomodorosCompleted: 0,
    pomodorosEstimate: Math.max(1, estimate),
    createdAt: Date.now(),
  };
  tasks.set([t, ...tasks.get()]);
}

export function toggleTask(id: string) {
  tasks.set(tasks.get().map(t =>
    t.id === id ? { ...t, completed: !t.completed } : t
  ));
}

export function deleteTask(id: string) {
  tasks.set(tasks.get().filter(t => t.id !== id));
  if (activeTaskId.get() === id) activeTaskId.set(null);
}

export function setActiveTask(id: string | null) {
  activeTaskId.set(id);
}

export function updateTaskEstimate(id: string, estimate: number) {
  tasks.set(tasks.get().map(t =>
    t.id === id ? { ...t, pomodorosEstimate: Math.max(1, estimate) } : t
  ));
}

export function clearCompletedTasks() {
  tasks.set(tasks.get().filter(t => !t.completed));
}

// --- 设置管理 ---
export function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  settings.set({ ...settings.get(), [key]: value });
}

export function resetSettings() {
  settings.set({ ...DEFAULT_SETTINGS });
}

// --- 计时器逻辑 ---
let intervalId: number | null = null;

export const startTimer = () => {
  if (isRunning.get()) return;
  isRunning.set(true);
  intervalId = window.setInterval(() => {
    const current = timeLeft.get();
    if (current <= 1) {
      completeTimer();
    } else {
      timeLeft.set(current - 1);
    }
  }, 1000);
};

export const pauseTimer = () => {
  isRunning.set(false);
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

export const resetTimer = () => {
  pauseTimer();
  timeLeft.set(durations.get()[mode.get()]);
};

export const setMode = (newMode: TimerMode) => {
  pauseTimer();
  mode.set(newMode);
  timeLeft.set(durations.get()[newMode]);
};

// 当设置变化时，如果没有运行，更新剩余时间
effect(() => {
  if (!isRunning.get()) {
    timeLeft.set(durations.get()[mode.get()]);
  }
});

let completedInSession = 0;

export const completeTimer = () => {
  pauseTimer();

  const finishedMode = mode.get();

  if (finishedMode === 'pomodoro') {
    // 更新每日统计
    const key = todayKey();
    const stats = { ...dailyStats.get() };
    stats[key] = (stats[key] ?? 0) + 1;
    dailyStats.set(stats);

    // 更新活动任务
    const activeId = activeTaskId.get();
    if (activeId) {
      tasks.set(tasks.get().map(t =>
        t.id === activeId ? { ...t, pomodorosCompleted: t.pomodorosCompleted + 1 } : t
      ));
    }

    completedInSession += 1;

    // 播放声音
    if (settings.get().soundEnabled) playNotification();

    const every = settings.get().longBreakEvery;
    if (completedInSession % every === 0) {
      setMode('longBreak');
    } else {
      setMode('shortBreak');
    }

    if (settings.get().autoStartBreak) {
      setTimeout(() => startTimer(), 500);
    }
  } else {
    if (settings.get().soundEnabled) playNotification();
    setMode('pomodoro');
    if (settings.get().autoStartPomodoro) {
      setTimeout(() => startTimer(), 500);
    }
  }
};

const playNotification = () => {
  try {
    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();

    oscillator.connect(gain);
    gain.connect(audio.destination);

    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    gain.gain.setValueAtTime(0.001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, audio.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.6);

    oscillator.start();
    oscillator.stop(audio.currentTime + 0.6);
  } catch {}
};
