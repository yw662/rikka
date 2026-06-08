import { signal, computed, effect } from '@takanashi/rikka-signal';
import type { Locale } from './i18n.js';

export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

export const mode = signal<TimerMode>('pomodoro');
export const timeLeft = signal(25 * 60); // 25 minutes in seconds
export const isRunning = signal(false);
export const pomodorosCompleted = signal(0);

const durations: Record<TimerMode, number> = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export const progress = computed(() => {
  const currentMode = mode.get() as TimerMode;
  const total = durations[currentMode];
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
  const currentMode = mode.get() as TimerMode;
  timeLeft.set(durations[currentMode]);
};

export const setMode = (newMode: TimerMode) => {
  pauseTimer();
  mode.set(newMode);
  timeLeft.set(durations[newMode]);
};

export const completeTimer = () => {
  pauseTimer();
  
  if (mode.get() === 'pomodoro') {
    const newCount = pomodorosCompleted.get() + 1;
    pomodorosCompleted.set(newCount);
    
    if (newCount % 4 === 0) {
      setMode('longBreak');
    } else {
      setMode('shortBreak');
    }
  } else {
    setMode('pomodoro');
  }
  
  playNotification();
};

const playNotification = () => {
  const audio = new AudioContext();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  
  oscillator.connect(gain);
  gain.connect(audio.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  gain.gain.value = 0.3;
  
  oscillator.start();
  oscillator.stop(audio.currentTime + 0.3);
};
