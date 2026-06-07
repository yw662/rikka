import { defineElement } from "@takanashi/rikka-elements";
import { div, h1, h2, h3, h4, p, a, pre, code, ul, li, h } from "@takanashi/rikka-dom";
import { sharedHelpers } from "../../shared/helpers";
import { showcasePageStyles } from "../../shared/page-styles";

const PomodoroTimer = defineElement("rikka-example-pomodoro-timer", {
  styles: showcasePageStyles,
  render() {
    return div(
      { class: "example-page" },
      h1({}, "🍅 Pomodoro Timer"),
      p({}, "A beautiful, productivity-focused Pomodoro timer built entirely with Rikka through vibe coding. Boost your focus with structured work and break sessions."),
      
      div({
        style: `
          width: 100%;
          height: 600px;
          border: 2px solid var(--color-primary);
          border-radius: var(--radius-lg);
          overflow: hidden;
          margin: 2rem 0;
          box-shadow: var(--shadow-md);
        `,
      }, 
        div({
          style: `
            background: var(--color-surface);
            padding: 0.75rem 1rem;
            border-bottom: 1px solid var(--color-surface-hover);
            display: flex;
            align-items: center;
            justify-content: space-between;
          `,
        },
          div({}, "🍅 Live Demo"),
          a({
            href: "./examples/pomodoro-timer/index.html",
            target: "_blank",
            style: `
              color: var(--color-primary);
              text-decoration: none;
              font-size: 0.875rem;
            `,
          }, "View →"),
        ),
        div({
          style: `
            width: 100%;
            height: calc(100% - 52px);
          `,
        },
          h('iframe', {
            src: "./examples/pomodoro-timer/index.html",
            style: `
              width: 100%;
              height: 100%;
              border: none;
            `,
            title: "Pomodoro Timer Demo",
          }),
        ),
      ),
      
      div({ class: "showcase-hero" },
        h2({}, "Vibe Coding 构建指南"),
        p({}, "通过自然语言描述，让 AI 帮你完成整个应用的构建。以下是我们使用的核心提示词："),
        div({ class: "vibe-prompts" },
          h3({}, "🚀 第一步：创建项目结构"),
          pre({}, code({}, `
# 你可以这样开始：

"创建一个 Pomodoro Timer 应用，使用 Rikka Web Components。
应用需要：
- 三种模式：Pomodoro (25分钟)、Short Break (5分钟)、Long Break (15分钟)
- 圆形进度条显示剩余时间
- 开始/暂停/重置按钮
- 完成次数统计
- 播放提示音
- 数据持久化到 localStorage"

# AI 接下来会帮你：
1. 初始化项目结构
2. 安装 Rikka 依赖
3. 创建响应式状态管理
4. 构建 UI 组件
5. 添加动画效果
`.trim())),
          h3({}, "🔧 第二步：构建响应式状态"),
          pre({}, code({}, `
# 告诉 AI 如何处理状态：

"在 store.ts 中使用 @takanashi/rikka-signal：
- 定义 mode 信号：'pomodoro' | 'shortBreak' | 'longBreak'
- 定义 timeLeft 信号存储剩余秒数
- 定义 isRunning 信号控制计时器状态
- 定义 pomodorosCompleted 记录完成次数
- 使用 computed 计算进度百分比和格式化时间
- 使用 effect 自动保存到 localStorage"

# AI 会生成：
- 类型安全的信号定义
- 自动更新的派生状态
- 响应式的数据持久化
`.trim())),
          h3({}, "🎨 第三步：创建 UI 组件"),
          pre({}, code({}, `
# 使用 defineElement 创建组件：

"创建 TimerDisplay 组件：
- 使用 svg 绘制圆形进度条
- 使用 @takanashi/rikka-dom 的 circle 元素
- 将 computed 信号直接绑定到 stroke-dashoffset
- 添加 smooth 过渡动画
- 支持响应式更新"

# AI 会：
- 使用 defineElement 定义组件
- 绑定响应式数据到 DOM 属性
- 自动追踪依赖并更新视图
`.trim())),
          h3({}, "⏰ 第四步：实现计时逻辑"),
          pre({}, code({}, `
# 让 AI 添加计时器效果：

"在 effect 中实现计时逻辑：
- 当 isRunning 为 true 时启动 setInterval
- 每秒递减 timeLeft
- 时间到时：
  - 切换到下一个模式
  - 如果是 Pomodoro 完成则增加计数
  - 播放提示音
  - 每 4 个 Pomodoro 后切换到长休息"

# Rikka 的 effect 会自动：
- 追踪 isRunning 依赖
- 当状态变化时重新运行
- 处理清理和内存管理
`.trim()))
        ),
        h2({}, "使用的 Rikka 核心功能"),
        div({ class: "feature-grid" },
          div({ class: "feature-card" },
            h3({}, "🎯 Signals 响应式状态"),
            p({}, "使用 signal() 创建响应式状态，自动追踪依赖并更新相关视图。当 timeLeft 变化时，所有使用它的组件都会自动重新渲染。")
          ),
          div({ class: "feature-card" },
            h3({}, "🔗 Computed 派生状态"),
            p({}, "使用 computed() 创建派生状态，如格式化时间、进度百分比。Rikka 会自动追踪依赖并智能缓存结果。")
          ),
          div({ class: "feature-card" },
            h3({}, "⚡ Effects 副作用处理"),
            p({}, "使用 effect() 处理计时器逻辑和 localStorage 持久化。Effect 自动追踪依赖并处理清理函数。")
          ),
          div({ class: "feature-card" },
            h3({}, "🎭 defineElement 组件化"),
            p({}, "使用 defineElement() 创建 Web Components。组件自动隔离 Shadow DOM，支持样式封装和复用。")
          ),
          div({ class: "feature-card" },
            h3({}, "📝 DOM 元素创建"),
            p({}, "使用 @takanashi/rikka-dom 的工厂函数（div, svg, circle 等）以声明式方式构建 DOM 结构。")
          ),
          div({ class: "feature-card" },
            h3({}, "🔄 自动依赖追踪"),
            p({}, "Rikka 的响应式系统自动追踪哪些代码依赖于哪些信号，确保只在必要时更新视图。")
          )
        ),
        h2({}, "Vibe Coding 工作流程"),
        p({}, "通过迭代式的自然语言提示，快速构建应用："),
        div({ class: "workflow-steps" },
          div({ class: "step" },
            h4({}, "1. 描述需求"),
            p({}, "用自然语言描述你想要的功能，如 \"添加一个倒计时器，带有漂亮的圆形进度条\"")
          ),
          div({ class: "step" },
            h4({}, "2. AI 生成代码"),
            p({}, "AI 根据描述生成基于 Rikka 的实现代码")
          ),
          div({ class: "step" },
            h4({}, "3. 预览效果"),
            p({}, "立即在浏览器中看到效果，无需复杂的构建配置")
          ),
          div({ class: "step" },
            h4({}, "4. 迭代优化"),
            p({}, "继续用自然语言调整，如 \"把进度条颜色改成渐变\" 或 \"添加完成时的动画\"")
          )
        ),
        h2({}, "构建步骤"),
        p({}, "这个应用展示了完整的 vibe coding 工作流程："),
        ul({},
          li({}, "Step 1: 定义核心状态 - 使用 signals 管理计时器状态和统计数据"),
          li({}, "Step 2: 创建派生状态 - 使用 computed 自动计算进度和时间格式"),
          li({}, "Step 3: 构建 UI 组件 - 使用 defineElement 创建可复用的组件"),
          li({}, "Step 4: 添加计时逻辑 - 使用 effects 处理计时器自动运行和模式切换"),
          li({}, "Step 5: 美化界面 - 使用 SVG 和 CSS 动画创建流畅的视觉效果"),
          li({}, "Step 6: 数据持久化 - 使用 effects 自动保存和恢复用户数据")
        )
      ),
      
      h2({}, "Project Structure"),
      div({ class: "arch-section" },
        pre({}, code({}, `
pomodoro-timer/
├── index.html              # Entry HTML
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Vite bundler config
└── src/
    ├── index.ts            # App bootstrap
    ├── store.ts            # Reactive state store
    ├── styles/
    │   └── main.css        # Global styles
    └── components/
        ├── app.ts          # Root component
        ├── mode-selector.ts # Mode switcher UI
        ├── timer-display.ts # Timer ring display
        ├── controls.ts     # Play/Pause/Reset
        └── stats.ts        # Session statistics
`.trim()))
      ),
      
      h2({}, "Key Features"),
      div({ class: "feature-grid" },
        div({ class: "feature-card" },
          h3({}, "🎯 Three Timer Modes"),
          p({}, "Pomodoro (25min), Short Break (5min), Long Break (15min) with automatic cycle transitions")
        ),
        div({ class: "feature-card" },
          h3({}, "⏱️ Real-time Reactivity"),
          p({}, "Effects-driven updates every second, efficient derived state for progress calculations")
        ),
        div({ class: "feature-card" },
          h3({}, "🎨 Beautiful UI"),
          p({}, "SVG circular progress indicator with smooth animations and visual feedback")
        ),
        div({ class: "feature-card" },
          h3({}, "📊 Session Statistics"),
          p({}, "Track completed Pomodoros, total focus time, and streaks across sessions")
        ),
        div({ class: "feature-card" },
          h3({}, "🔔 Audio Notifications"),
          p({}, "Web Audio API-based sound effects when timer completes")
        ),
        div({ class: "feature-card" },
          h3({}, "💾 Persistent Storage"),
          p({}, "Session stats saved to localStorage for continuity across browser restarts")
        )
      ),
      
      div({ class: "explanation" },
        h2({}, "State Management Deep Dive"),
        p({}, "The reactive store centralizes all time and session tracking with clean separation of concerns:"),
        div({ class: "arch-section" },
          pre({}, code({}, `
// src/store.ts
import { signal, computed, effect } from '@takanashi/rikka-signal';

// Timer modes configuration
type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';
const MODE_DURATIONS: Record<TimerMode, number> = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

// Reactive state
export const mode = signal<TimerMode>('pomodoro');
export const timeLeft = signal(MODE_DURATIONS.pomodoro);
export const isRunning = signal(false);
export const pomodorosCompleted = signal(0);
export const totalFocusMinutes = signal(0);

// Derived computed state
export const progress = computed(() => {
  const total = MODE_DURATIONS[mode()];
  const elapsed = total - timeLeft();
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
});

export const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft() / 60);
  const seconds = timeLeft() % 60;
  return \`\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
});

// Timer control functions
export function startTimer() { isRunning.set(true); }
export function pauseTimer() { isRunning.set(false); }
export function resetTimer() {
  isRunning.set(false);
  timeLeft.set(MODE_DURATIONS[mode()]);
}
export function setMode(newMode: TimerMode) {
  mode.set(newMode);
  timeLeft.set(MODE_DURATIONS[newMode]);
  isRunning.set(false);
}

// Auto-transition effect
let timerInterval: number | null = null;
effect(() => {
  if (isRunning()) {
    timerInterval = window.setInterval(() => {
      if (timeLeft() > 0) {
        timeLeft.set(t => t - 1);
      } else {
        // Timer complete - handle transition
        isRunning.set(false);
        if (mode() === 'pomodoro') {
          pomodorosCompleted.set(c => c + 1);
          totalFocusMinutes.set(m => m + 25);
          // Auto switch to break
          setMode(pomodorosCompleted() % 4 === 0 ? 'longBreak' : 'shortBreak');
        } else {
          setMode('pomodoro');
        }
        playCompletionSound();
      }
    }, 1000);
  } else {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
  return () => {
    if (timerInterval) clearInterval(timerInterval);
  };
});

// Persistence effect
effect(() => {
  localStorage.setItem('pomodoro:completed', pomodorosCompleted().toString());
  localStorage.setItem('pomodoro:focusMinutes', totalFocusMinutes().toString());
});

// Initialize from storage
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('pomodoro:completed');
  if (saved) pomodorosCompleted.set(parseInt(saved, 10));
  const savedMinutes = localStorage.getItem('pomodoro:focusMinutes');
  if (savedMinutes) totalFocusMinutes.set(parseInt(savedMinutes, 10));
}
`.trim()))
        )
      ),
      
      div({ class: "explanation" },
        h2({}, "Component Architecture"),
        p({}, "The UI is built with composable, reactive Web Components:"),
        div({ class: "arch-section" },
          pre({}, code({}, `
// src/components/timer-display.ts
import { defineElement } from '@takanashi/rikka-elements';
import { svg, circle, div, span } from '@takanashi/rikka-dom';
import { progress, formattedTime, mode } from '../store';

export const TimerDisplay = defineElement('pomodoro-timer-display', {
  render() {
    const circumference = 2 * Math.PI * 45;
    
    return div({ class: 'timer-display' },
      svg({ width: '200', height: '200', viewBox: '0 0 100 100' },
        circle({
          cx: '50', cy: '50', r: '45',
          fill: 'none',
          stroke: 'var(--color-surface)',
          'stroke-width': '8'
        }),
        circle({
          cx: '50', cy: '50', r: '45',
          fill: 'none',
          stroke: 'var(--color-primary)',
          'stroke-width': '8',
          'stroke-linecap': 'round',
          'stroke-dasharray': circumference,
          'stroke-dashoffset': computed(() => 
            circumference - (progress() / 100) * circumference
          ),
          transform: 'rotate(-90 50 50)',
          style: 'transition: stroke-dashoffset 0.5s ease;'
        })
      ),
      div({ class: 'time-text' },
        span({}, formattedTime)
      ),
      div({ class: 'mode-label' },
        span({}, computed(() => mode() === 'pomodoro' ? 'Focus' : 'Break'))
      )
    );
  }
});
`.trim()))
        )
      ),
      
      div({ class: "example-nav" },
        a({ href: "#/examples", class: "prev-link" }, "← All Examples"),
        div({ class: "spacer" }),
        a({ href: "#/examples/bookmark-manager", class: "next-link" }, "Bookmark Manager →")
      )
    );
  }
});

export { PomodoroTimer as ExamplePomodoroTimer };
