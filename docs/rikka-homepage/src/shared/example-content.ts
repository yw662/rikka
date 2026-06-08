import type { Locale } from "./i18n";

export interface ExampleData {
  slug: string;
  title: string;
  description: Record<Locale, string>;
  tags: string[];
  features: Record<Locale, string[]>;
  /** Vibe Coding guide section */
  vibe: {
    heading: Record<Locale, string>;
    intro: Record<Locale, string>;
    steps: {
      title: Record<Locale, string>;
      prompt: Record<Locale, string>;
    }[];
  };
  /** "Core Rikka Features Used" section */
  coreFeatures: {
    title: Record<Locale, string>;
    description: Record<Locale, string>;
  }[];
  /** "Vibe Coding Workflow" section */
  workflow: {
    heading: Record<Locale, string>;
    intro: Record<Locale, string>;
    steps: {
      title: Record<Locale, string>;
      description: Record<Locale, string>;
    }[];
  };
  /** "Build Steps" section */
  buildSteps: {
    heading: Record<Locale, string>;
    intro: Record<Locale, string>;
    steps: Record<Locale, string[]>;
  };
  /** "Key Features" section */
  keyFeatures: {
    title: string;
    description: Record<Locale, string>;
  }[];
}

export const examples: ExampleData[] = [
  {
    slug: "pomodoro-timer",
    title: "🍅 Pomodoro Timer",
    description: {
      en: "A beautiful, productivity-focused Pomodoro timer built entirely with Rikka through vibe coding. Boost your focus with structured work and break sessions.",
      zh: "一个精美的、专注效率的番茄钟应用，完全通过 Rikka 的 Vibe Coding 构建。用结构化的工作和休息时段提升你的专注力。",
    },
    tags: ["Web Components", "Signals", "Effects"],
    features: {
      en: ["Timer Modes", "Progress Ring", "Session Stats"],
      zh: ["计时模式", "进度环", "会话统计"],
    },
    vibe: {
      heading: {
        en: "Vibe Coding Guide",
        zh: "Vibe Coding 构建指南",
      },
      intro: {
        en: "Describe your app in natural language and let AI build it for you. Here are the core prompts we used:",
        zh: "通过自然语言描述，让 AI 帮你完成整个应用的构建。以下是我们使用的核心提示词：",
      },
      steps: [
        {
          title: {
            en: "🚀 Step 1: Create Project Structure",
            zh: "🚀 第一步：创建项目结构",
          },
          prompt: {
            en: `# Start like this:

"Create a Pomodoro Timer app using Rikka Web Components.
The app needs:
- Three modes: Pomodoro (25min), Short Break (5min), Long Break (15min)
- Circular progress bar showing remaining time
- Start/Pause/Reset buttons
- Completed session counter
- Notification sounds
- Data persistence to localStorage"

# AI will then:
1. Initialize project structure
2. Install Rikka dependencies
3. Create reactive state management
4. Build UI components
5. Add animation effects`,
            zh: `# 你可以这样开始：

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
5. 添加动画效果`,
          },
        },
        {
          title: {
            en: "🔧 Step 2: Build Reactive State",
            zh: "🔧 第二步：构建响应式状态",
          },
          prompt: {
            en: `# Tell AI how to handle state:

"In store.ts, use @takanashi/rikka-signal:
- Define mode signal: 'pomodoro' | 'shortBreak' | 'longBreak'
- Define timeLeft signal for remaining seconds
- Define isRunning signal for timer state
- Define pomodorosCompleted to track completed sessions
- Use computed for progress percentage and formatted time
- Use effect for auto-saving to localStorage"

# AI will generate:
- Type-safe signal definitions
- Auto-updating derived state
- Reactive data persistence`,
            zh: `# 告诉 AI 如何处理状态：

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
- 响应式的数据持久化`,
          },
        },
        {
          title: {
            en: "🎨 Step 3: Create UI Components",
            zh: "🎨 第三步：创建 UI 组件",
          },
          prompt: {
            en: `# Use defineElement to create components:

"Create TimerDisplay component:
- Use svg to draw circular progress bar
- Use @takanashi/rikka-dom's circle element
- Bind computed signal directly to stroke-dashoffset
- Add smooth transition animations
- Support reactive updates"

# AI will:
- Use defineElement to define components
- Bind reactive data to DOM attributes
- Automatically track dependencies and update views`,
            zh: `# 使用 defineElement 创建组件：

"创建 TimerDisplay 组件：
- 使用 svg 绘制圆形进度条
- 使用 @takanashi/rikka-dom 的 circle 元素
- 将 computed 信号直接绑定到 stroke-dashoffset
- 添加 smooth 过渡动画
- 支持响应式更新"

# AI 会：
- 使用 defineElement 定义组件
- 绑定响应式数据到 DOM 属性
- 自动追踪依赖并更新视图`,
          },
        },
        {
          title: {
            en: "⏰ Step 4: Implement Timer Logic",
            zh: "⏰ 第四步：实现计时逻辑",
          },
          prompt: {
            en: `# Let AI add timer effects:

"Implement timer logic in an effect:
- Start setInterval when isRunning is true
- Decrement timeLeft every second
- When time is up:
  - Switch to next mode
  - Increment count if Pomodoro completed
  - Play notification sound
  - Switch to long break every 4 Pomodoros"

# Rikka's effect will automatically:
- Track isRunning dependency
- Re-run when state changes
- Handle cleanup and memory management`,
            zh: `# 让 AI 添加计时器效果：

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
- 处理清理和内存管理`,
          },
        },
      ],
    },
    coreFeatures: [
      {
        title: { en: "🎯 Signals Reactive State", zh: "🎯 Signals 响应式状态" },
        description: {
          en: "Use signal() to create reactive state that automatically tracks dependencies and updates related views. When timeLeft changes, all components using it re-render automatically.",
          zh: "使用 signal() 创建响应式状态，自动追踪依赖并更新相关视图。当 timeLeft 变化时，所有使用它的组件都会自动重新渲染。",
        },
      },
      {
        title: { en: "🔗 Computed Derived State", zh: "🔗 Computed 派生状态" },
        description: {
          en: "Use computed() to create derived state like formatted time and progress percentage. Rikka automatically tracks dependencies and intelligently caches results.",
          zh: "使用 computed() 创建派生状态，如格式化时间、进度百分比。Rikka 会自动追踪依赖并智能缓存结果。",
        },
      },
      {
        title: { en: "⚡ Effects Side Effects", zh: "⚡ Effects 副作用处理" },
        description: {
          en: "Use effect() to handle timer logic and localStorage persistence. Effect automatically tracks dependencies and handles cleanup functions.",
          zh: "使用 effect() 处理计时器逻辑和 localStorage 持久化。Effect 自动追踪依赖并处理清理函数。",
        },
      },
      {
        title: { en: "🎭 defineElement Components", zh: "🎭 defineElement 组件化" },
        description: {
          en: "Use defineElement() to create Web Components. Components automatically isolate Shadow DOM, supporting style encapsulation and reusability.",
          zh: "使用 defineElement() 创建 Web Components。组件自动隔离 Shadow DOM，支持样式封装和复用。",
        },
      },
      {
        title: { en: "📝 DOM Element Creation", zh: "📝 DOM 元素创建" },
        description: {
          en: "Use @takanashi/rikka-dom factory functions (div, svg, circle, etc.) to build DOM structures declaratively.",
          zh: "使用 @takanashi/rikka-dom 的工厂函数（div, svg, circle 等）以声明式方式构建 DOM 结构。",
        },
      },
      {
        title: { en: "🔄 Auto Dependency Tracking", zh: "🔄 自动依赖追踪" },
        description: {
          en: "Rikka's reactive system automatically tracks which code depends on which signals, ensuring views update only when necessary.",
          zh: "Rikka 的响应式系统自动追踪哪些代码依赖于哪些信号，确保只在必要时更新视图。",
        },
      },
    ],
    workflow: {
      heading: {
        en: "Vibe Coding Workflow",
        zh: "Vibe Coding 工作流程",
      },
      intro: {
        en: "Build apps quickly through iterative natural language prompts:",
        zh: "通过迭代式的自然语言提示，快速构建应用：",
      },
      steps: [
        {
          title: { en: "1. Describe Requirements", zh: "1. 描述需求" },
          description: {
            en: 'Describe the features you want in natural language, e.g. "Add a countdown timer with a beautiful circular progress bar"',
            zh: '用自然语言描述你想要的功能，如 "添加一个倒计时器，带有漂亮的圆形进度条"',
          },
        },
        {
          title: { en: "2. AI Generates Code", zh: "2. AI 生成代码" },
          description: {
            en: "AI generates Rikka-based implementation code from your description",
            zh: "AI 根据描述生成基于 Rikka 的实现代码",
          },
        },
        {
          title: { en: "3. Preview Results", zh: "3. 预览效果" },
          description: {
            en: "See results instantly in the browser — no complex build configuration needed",
            zh: "立即在浏览器中看到效果，无需复杂的构建配置",
          },
        },
        {
          title: { en: "4. Iterate & Refine", zh: "4. 迭代优化" },
          description: {
            en: 'Continue refining with natural language, e.g. "Change the progress bar color to gradient" or "Add completion animation"',
            zh: '继续用自然语言调整，如 "把进度条颜色改成渐变" 或 "添加完成时的动画"',
          },
        },
      ],
    },
    buildSteps: {
      heading: {
        en: "Build Steps",
        zh: "构建步骤",
      },
      intro: {
        en: "This app demonstrates the complete vibe coding workflow:",
        zh: "这个应用展示了完整的 vibe coding 工作流程：",
      },
      steps: {
        en: [
          "Step 1: Define core state — Use signals for timer state and statistics",
          "Step 2: Create derived state — Use computed for progress and time format",
          "Step 3: Build UI components — Use defineElement for reusable components",
          "Step 4: Add timer logic — Use effects for auto-running and mode switching",
          "Step 5: Polish the UI — Use SVG and CSS animations for smooth visuals",
          "Step 6: Persist data — Use effects for auto-saving and restoring user data",
        ],
        zh: [
          "Step 1: 定义核心状态 - 使用 signals 管理计时器状态和统计数据",
          "Step 2: 创建派生状态 - 使用 computed 自动计算进度和时间格式",
          "Step 3: 构建 UI 组件 - 使用 defineElement 创建可复用的组件",
          "Step 4: 添加计时逻辑 - 使用 effects 处理计时器自动运行和模式切换",
          "Step 5: 美化界面 - 使用 SVG 和 CSS 动画创建流畅的视觉效果",
          "Step 6: 数据持久化 - 使用 effects 自动保存和恢复用户数据",
        ],
      },
    },
    keyFeatures: [
      {
        title: "🎯 Three Timer Modes",
        description: {
          en: "Pomodoro (25min), Short Break (5min), Long Break (15min) with automatic cycle transitions",
          zh: "番茄钟（25分钟）、短休息（5分钟）、长休息（15分钟），支持自动循环切换",
        },
      },
      {
        title: "⏱️ Real-time Reactivity",
        description: {
          en: "Effects-driven updates every second, efficient derived state for progress calculations",
          zh: "每秒由 Effects 驱动的更新，高效的派生状态用于进度计算",
        },
      },
      {
        title: "🎨 Beautiful UI",
        description: {
          en: "SVG circular progress indicator with smooth animations and visual feedback",
          zh: "SVG 圆形进度指示器，带有流畅的动画和视觉反馈",
        },
      },
      {
        title: "📊 Session Statistics",
        description: {
          en: "Track completed Pomodoros, total focus time, and streaks across sessions",
          zh: "追踪已完成的番茄钟数量、总专注时间和跨会话连续记录",
        },
      },
      {
        title: "🔔 Audio Notifications",
        description: {
          en: "Web Audio API-based sound effects when timer completes",
          zh: "计时器完成时基于 Web Audio API 的音效提示",
        },
      },
      {
        title: "💾 Persistent Storage",
        description: {
          en: "Session stats saved to localStorage for continuity across browser restarts",
          zh: "会话统计数据保存到 localStorage，浏览器重启后保持连续性",
        },
      },
    ],
  },
  {
    slug: "bookmark-manager",
    title: "📌 Bookmark Manager",
    description: {
      en: "A beautiful read-it-later application built with Rikka through vibe coding. Save links, organize with tags, and search instantly across your collection.",
      zh: "一个精美的稍后阅读应用，通过 Rikka 的 Vibe Coding 构建。保存链接、用标签整理，并在你的收藏中即时搜索。",
    },
    tags: ["LocalStorage", "Filtering", "CRUD"],
    features: {
      en: ["Search & Filter", "Tag System", "Auto Save"],
      zh: ["搜索与过滤", "标签系统", "自动保存"],
    },
    vibe: {
      heading: {
        en: "Vibe Coding Guide",
        zh: "Vibe Coding 构建指南",
      },
      intro: {
        en: "Bookmark Manager demonstrates how to build data-driven apps through vibe coding. Here are the core prompts we used:",
        zh: "Bookmark Manager 展示了如何通过 vibe coding 构建数据驱动的应用。以下是我们使用的核心提示词：",
      },
      steps: [
        {
          title: {
            en: "🚀 Step 1: Design Data Model",
            zh: "🚀 第一步：设计数据模型",
          },
          prompt: {
            en: `# Start like this:

"Create a bookmark manager app using Rikka Web Components.
The app needs:
- Save links, titles, descriptions, tags
- Search by title, URL, and tags
- Filter by tags
- Add, edit, delete bookmarks
- Data persistence to localStorage"

# AI will then:
1. Design data structures
2. Create type definitions
3. Implement CRUD operations
4. Build search and filter logic`,
            zh: `# 你可以这样开始：

"创建一个书签管理应用，使用 Rikka Web Components。
应用需要：
- 保存链接、标题、描述、标签
- 支持按标题、URL、标签搜索
- 支持按标签筛选
- 添加、编辑、删除书签
- 数据持久化到 localStorage"

# AI 接下来会帮你：
1. 设计数据结构
2. 创建类型定义
3. 实现 CRUD 操作
4. 构建搜索和筛选逻辑`,
          },
        },
        {
          title: {
            en: "🔧 Step 2: Implement Data Management",
            zh: "🔧 第二步：实现数据管理",
          },
          prompt: {
            en: `# Tell AI how to handle data state:

"In store.ts, use @takanashi/rikka-signal:
- Define bookmarks signal for bookmark list
- Define searchQuery and selectedTags signals
- Use computed for allTags (all unique tags)
- Use computed for filteredBookmarks (filtered list)
- Implement CRUD functions: addBookmark, updateBookmark, deleteBookmark
- Use effect for auto-saving to localStorage"

# AI will generate:
- Complete TypeScript interface definitions
- Reactive data operation functions
- Auto-updating filter logic`,
            zh: `# 告诉 AI 如何处理数据状态：

"在 store.ts 中使用 @takanashi/rikka-signal：
- 定义 bookmarks 信号存储书签列表
- 定义 searchQuery 和 selectedTags 信号
- 使用 computed 创建 allTags（所有标签）
- 使用 computed 创建 filteredBookmarks（过滤后的列表）
- 实现 CRUD 函数：addBookmark, updateBookmark, deleteBookmark
- 使用 effect 自动保存到 localStorage"

# AI 会生成：
- 完整的 TypeScript 接口定义
- 响应式的数据操作函数
- 自动更新的过滤逻辑`,
          },
        },
        {
          title: {
            en: "🎨 Step 3: Build Search Components",
            zh: "🎨 第三步：构建搜索组件",
          },
          prompt: {
            en: `# Let AI create search and filter components:

"Create SearchBar and TagFilter components:
- Search bar component: real-time search with debounce
- Tag filter component: display all tags, support multi-select
- Bookmark list component: display filtered bookmark cards
- Each component uses @takanashi/rikka-dom elements"

# Rikka's advantages:
- computed automatically tracks dependencies
- When bookmarks change, all related computed auto-update
- No manual list refresh needed`,
            zh: `# 让 AI 创建搜索和过滤组件：

"创建 SearchBar 和 TagFilter 组件：
- 搜索框组件：实时搜索，支持防抖
- 标签筛选组件：显示所有标签，支持多选
- 书签列表组件：显示过滤后的书签卡片
- 每个组件使用 @takanashi/rikka-dom 的元素"

# Rikka 的优势：
- computed 自动追踪依赖
- 当 bookmarks 变化时，所有相关 computed 自动更新
- 无需手动刷新列表`,
          },
        },
        {
          title: {
            en: "✨ Step 4: Add Interactive Features",
            zh: "✨ 第四步：添加交互功能",
          },
          prompt: {
            en: `# Let AI add edit and delete features:

"Add interactive features:
- Click bookmark card to show details
- Edit button opens edit form
- Delete button with confirmation
- Drag-and-drop sorting
- Keyboard shortcut support"

# Using Rikka:
- onClick and other event handlers
- Reactive state updates
- Automatic UI refresh`,
            zh: `# 让 AI 添加编辑和删除功能：

"添加交互功能：
- 点击书签卡片显示详情
- 编辑按钮打开编辑表单
- 删除按钮确认后删除
- 拖拽排序功能
- 键盘快捷键支持"

# 使用 Rikka 实现：
- onClick 等事件处理
- 响应式状态更新
- 自动 UI 刷新`,
          },
        },
      ],
    },
    coreFeatures: [
      {
        title: { en: "📊 Complex Data Structures", zh: "📊 复杂数据结构" },
        description: {
          en: "Use signal<Bookmark[]> to store complex object arrays. Rikka's reactive system tracks reference changes to the entire array.",
          zh: "使用 signal<Bookmark[]> 存储复杂对象数组。Rikka 的响应式系统会追踪整个数组的引用变化。",
        },
      },
      {
        title: { en: "🔍 Real-time Computed Filtering", zh: "🔍 实时计算过滤" },
        description: {
          en: "Use computed to create filteredBookmarks, automatically tracking bookmarks, searchQuery, and selectedTags dependencies. Any related state change triggers filter recalculation.",
          zh: "使用 computed 创建 filteredBookmarks，自动追踪 bookmarks、searchQuery 和 selectedTags 依赖。任何相关状态变化都会触发过滤重算。",
        },
      },
      {
        title: { en: "🏷️ Dynamic Tag System", zh: "🏷️ 动态标签系统" },
        description: {
          en: "Use computed to extract all tags from bookmark list, creating a Set and converting to a sorted array. Adding new bookmarks automatically updates the tag list.",
          zh: "使用 computed 从书签列表中提取所有标签，创建一个 Set 并转换为排序数组。新的书签添加时自动更新标签列表。",
        },
      },
      {
        title: { en: "💾 Auto Persistence", zh: "💾 自动持久化" },
        description: {
          en: "Use effect to watch bookmarks changes and auto-save to localStorage. App restores data from localStorage on startup.",
          zh: "使用 effect 监听 bookmarks 变化，自动保存到 localStorage。应用启动时从 localStorage 恢复数据。",
        },
      },
      {
        title: { en: "🎯 Event Handling", zh: "🎯 事件处理" },
        description: {
          en: "Rikka's DOM elements support onClick, onInput, and other event handlers, automatically binding event listeners and handling event objects.",
          zh: "Rikka 的 DOM 元素支持 onClick、onInput 等事件处理，自动绑定事件监听器并处理事件对象。",
        },
      },
      {
        title: { en: "🔄 Batch Operations", zh: "🔄 批量操作" },
        description: {
          en: "Use signal.set() with a function to compute new values from current state, ensuring atomic state updates.",
          zh: "使用 signal.set() 方法可以传入函数，基于当前状态计算新值，确保状态更新的原子性。",
        },
      },
    ],
    workflow: {
      heading: {
        en: "Vibe Coding Workflow",
        zh: "Vibe Coding 工作流程",
      },
      intro: {
        en: "Build complex features incrementally through progressive natural language prompts:",
        zh: "通过渐进式的自然语言提示，逐步构建复杂功能：",
      },
      steps: [
        {
          title: { en: "1. Core Features First", zh: "1. 核心功能优先" },
          description: {
            en: 'Start with basic add and list display, e.g. "Show a form to add bookmarks and a bookmark list"',
            zh: '先实现基础的添加和列表显示功能，如 "显示一个添加书签的表单和书签列表"',
          },
        },
        {
          title: { en: "2. Add State Management", zh: "2. 添加状态管理" },
          description: {
            en: 'Add reactive state with prompts like "Store bookmarks in signals, add to list"',
            zh: '用提示词添加响应式状态，如 "将书签存储到信号中，添加到列表"',
          },
        },
        {
          title: { en: "3. Implement Search", zh: "3. 实现搜索功能" },
          description: {
            en: 'Add search incrementally, e.g. "Add a search box that filters bookmarks in real-time"',
            zh: '逐步添加搜索，如 "添加一个搜索框，实时过滤书签"',
          },
        },
        {
          title: { en: "4. Add Advanced Features", zh: "4. 添加高级功能" },
          description: {
            en: 'Add tags and sorting, e.g. "Add tag support for each bookmark, add filtering by tags"',
            zh: '添加标签和排序，如 "为每个书签添加标签支持，添加按标签筛选"',
          },
        },
      ],
    },
    buildSteps: {
      heading: { en: "Build Steps", zh: "构建步骤" },
      intro: {
        en: "This app demonstrates the vibe coding workflow for data-driven applications:",
        zh: "这个应用展示了数据驱动应用的 vibe coding 工作流程：",
      },
      steps: {
        en: [
          "Step 1: Design data model — Define Bookmark interface and TypeScript types",
          "Step 2: Implement state management — Use signals for bookmarks and filter state",
          "Step 3: Create computed properties — Use computed for filter results and tag cloud",
          "Step 4: Build UI components — Create search bar, tag filter, bookmark card components",
          "Step 5: Add interactive logic — Implement add, edit, delete, sort functions",
          "Step 6: Persist data — Use effects for auto-saving and restoring data",
        ],
        zh: [
          "Step 1: 设计数据模型 - 定义 Bookmark 接口和 TypeScript 类型",
          "Step 2: 实现状态管理 - 使用 signals 存储书签和筛选状态",
          "Step 3: 创建计算属性 - 使用 computed 自动计算过滤结果和标签云",
          "Step 4: 构建 UI 组件 - 创建搜索框、标签筛选、书签卡片等组件",
          "Step 5: 添加交互逻辑 - 实现添加、编辑、删除、排序等功能",
          "Step 6: 数据持久化 - 使用 effects 自动保存和恢复数据",
        ],
      },
    },
    keyFeatures: [
      {
        title: "🔍 Live Search",
        description: {
          en: "Instantly search bookmarks by title, URL, description, and tags with fuzzy matching",
          zh: "按标题、URL、描述和标签即时搜索书签，支持模糊匹配",
        },
      },
      {
        title: "🏷️ Smart Tag System",
        description: {
          en: "Organize with tags, auto-complete suggestions, and multi-select filter",
          zh: "用标签整理，自动补全建议，多选过滤",
        },
      },
      {
        title: "💾 Automatic Persistence",
        description: {
          en: "Everything saved to localStorage automatically, no manual save required",
          zh: "所有内容自动保存到 localStorage，无需手动保存",
        },
      },
      {
        title: "🎨 Beautiful Cards",
        description: {
          en: "Rich bookmark cards with favicons, descriptions, and tag badges",
          zh: "丰富的书签卡片，包含网站图标、描述和标签徽章",
        },
      },
      {
        title: "📋 Bulk Operations",
        description: {
          en: "Select multiple bookmarks for bulk tag, delete, or export operations",
          zh: "选择多个书签进行批量标签、删除或导出操作",
        },
      },
      {
        title: "📤 Import/Export",
        description: {
          en: "JSON-based import and export for easy backup and sharing",
          zh: "基于 JSON 的导入和导出，方便备份和分享",
        },
      },
    ],
  },
  {
    slug: "code-editor",
    title: "💻 Code Editor",
    description: {
      en: "A full-featured browser-based IDE built with Rikka through vibe coding. Edit HTML/CSS/JS, run it instantly, and see live preview with integrated console.",
      zh: "一个功能完备的浏览器 IDE，通过 Rikka 的 Vibe Coding 构建。编辑 HTML/CSS/JS，即时运行，并通过集成控制台查看实时预览。",
    },
    tags: ["Iframe", "Tabs", "Live Preview"],
    features: {
      en: ["File System", "Tabs UI", "Console Capture"],
      zh: ["文件系统", "标签页 UI", "控制台捕获"],
    },
    vibe: {
      heading: { en: "Vibe Coding Guide", zh: "Vibe Coding 构建指南" },
      intro: {
        en: "Code Editor demonstrates how to build complex editor apps through vibe coding. Here are the core prompts we used:",
        zh: "Code Editor 展示了如何通过 vibe coding 构建复杂的编辑器应用。以下是我们使用的核心提示词：",
      },
      steps: [
        {
          title: {
            en: "🚀 Step 1: Design Editor Architecture",
            zh: "🚀 第一步：设计编辑器架构",
          },
          prompt: {
            en: `# Start like this:

"Create an online code editor using Rikka Web Components.
The app needs:
- Left file tree, center code editor, right live preview
- Support HTML/CSS/JS files
- Live preview: iframe auto-updates after editing
- Bottom console: capture and display console output
- Tab management: support multi-file switching"

# AI will then:
1. Design file management data structures
2. Create editor UI layout
3. Implement file system CRUD
4. Build preview and console interception system`,
            zh: `# 你可以这样开始：

"创建一个在线代码编辑器，使用 Rikka Web Components。
应用需要：
- 左侧文件树，中间代码编辑区，右侧实时预览
- 支持 HTML/CSS/JS 三个文件
- 实时预览：编辑代码后 iframe 自动更新
- 底部控制台：捕获并显示 console 输出
- 标签页管理：支持多文件切换"

# AI 接下来会帮你：
1. 设计文件管理的数据结构
2. 创建编辑器界面的布局
3. 实现文件系统的增删改查
4. 构建预览和 console 拦截系统`,
          },
        },
        {
          title: {
            en: "🔧 Step 2: Build File Management",
            zh: "🔧 第二步：构建文件管理",
          },
          prompt: {
            en: `# Tell AI how to implement file management:

"In editor-store.ts:
- Define EditorFile interface (id, name, type, content, dirty)
- Define files signal for file list
- Define openTabs and activeFileId signals
- Use computed to get current active file
- Implement createFile, deleteFile, updateFile operations"

# Key Rikka features:
- signal<EditorFile[]> manages file list
- computed auto-tracks current file
- effect watches file changes and saves`,
            zh: `# 告诉 AI 如何实现文件管理：

"在 editor-store.ts 中：
- 定义 EditorFile 接口（id, name, type, content, dirty）
- 定义 files 信号存储文件列表
- 定义 openTabs 和 activeFileId 信号
- 使用 computed 获取当前活动的文件
- 实现 createFile, deleteFile, updateFile 等操作"

# 关键 Rikka 功能：
- signal<EditorFile[]> 管理文件列表
- computed 自动追踪当前文件
- effect 监听文件变化并保存`,
          },
        },
        {
          title: {
            en: "🎨 Step 3: Create Editor UI",
            zh: "🎨 第三步：创建编辑器界面",
          },
          prompt: {
            en: `# Let AI build editor UI:

"Create the following components:
- FileTree: file tree sidebar, click to open file
- TabBar: tab bar, showing open file tabs
- CodeEditor: text editing area, using textarea
- PreviewFrame: iframe preview, watching file changes
- ConsolePanel: console, displaying logs and errors"

# Rikka component approach:
- Each component wrapped with defineElement
- Components share state through signals
- Auto-reactive updates, no manual refresh`,
            zh: `# 让 AI 构建编辑器 UI：

"创建以下组件：
- FileTree：文件树侧边栏，点击打开文件
- TabBar：标签栏，显示打开的文件标签
- CodeEditor：文本编辑区，使用 textarea
- PreviewFrame：iframe 预览，监听文件变化
- ConsolePanel：控制台，显示日志和错误"

# Rikka 组件化：
- 每个组件用 defineElement 封装
- 组件之间通过 signals 共享状态
- 自动响应式更新，无需手动刷新`,
          },
        },
        {
          title: {
            en: "⚡ Step 4: Implement Live Preview",
            zh: "⚡ 第四步：实现实时预览",
          },
          prompt: {
            en: `# Let AI add live preview:

"Implement PreviewFrame component:
- Use iframe's srcdoc attribute
- effect watches file content changes
- Merge HTML/CSS/JS to generate complete page
- Intercept iframe's console output"

# Rikka reactive system:
- Auto dependency tracking
- Preview updates on file changes
- No manual refresh calls`,
            zh: `# 让 AI 添加实时预览功能：

"实现 PreviewFrame 组件：
- 使用 iframe 的 srcdoc 属性
- effect 监听文件内容变化
- 合并 HTML/CSS/JS 生成完整页面
- 拦截 iframe 的 console 输出"

# Rikka 响应式系统：
- 自动追踪依赖
- 文件变化时自动更新预览
- 无需手动调用刷新`,
          },
        },
      ],
    },
    coreFeatures: [
      {
        title: { en: "📁 Virtual File System", zh: "📁 虚拟文件系统" },
        description: {
          en: "Use signals to simulate a file system, supporting file create, read, update, delete. All file operations are reactive.",
          zh: "使用 signals 模拟文件系统，支持文件的创建、读取、更新、删除。所有文件操作都是响应式的。",
        },
      },
      {
        title: { en: "📑 Multi-tab State Management", zh: "📑 多标签状态管理" },
        description: {
          en: "Use signals to manage open tabs and active tab. Tab switching automatically updates editor content.",
          zh: "使用 signals 管理打开的标签页和当前活动标签。标签切换时自动更新编辑器内容。",
        },
      },
      {
        title: { en: "🔄 Auto Preview Refresh", zh: "🔄 自动预览刷新" },
        description: {
          en: "Use computed to merge all file contents, effect watches changes and updates iframe preview. Edit and see results instantly.",
          zh: "使用 computed 合并所有文件内容，effect 监听变化并更新 iframe 预览。编辑即所见即所得。",
        },
      },
      {
        title: { en: "🖥️ Cross-window Communication", zh: "🖥️ 跨窗口通信" },
        description: {
          en: "Intercept iframe console output via postMessage API, displayed in the console panel.",
          zh: "通过 postMessage API 拦截 iframe 中的 console 输出，显示在控制台面板中。",
        },
      },
      {
        title: { en: "⚡ Debounced Auto-save", zh: "⚡ 防抖自动保存" },
        description: {
          en: "Use effect and setTimeout for debounced auto-save, avoiding frequent file updates.",
          zh: "使用 effect 和 setTimeout 实现防抖自动保存，避免频繁的文件更新。",
        },
      },
      {
        title: { en: "🎯 Dirty Flag Tracking", zh: "🎯 脏标记追踪" },
        description: {
          en: "Mark files as dirty after modification, showing unsaved indicators on tabs. Clear dirty flag after saving.",
          zh: "文件修改后标记 dirty 状态，在标签页显示未保存指示器。保存后清除脏标记。",
        },
      },
    ],
    workflow: {
      heading: { en: "Vibe Coding Workflow", zh: "Vibe Coding 工作流程" },
      intro: {
        en: "An editor is a complex app — building it step by step gives better control:",
        zh: "编辑器是一个较复杂的应用，通过分步构建可以更好地控制：",
      },
      steps: [
        {
          title: { en: "1. Start with Single File Editing", zh: "1. 先实现单文件编辑" },
          description: {
            en: 'Start with a simple textarea, e.g. "Create a textarea bound to a content signal"',
            zh: '从简单的单个 textarea 开始，如 "创建一个 textarea，绑定到 content 信号"',
          },
        },
        {
          title: { en: "2. Add Multi-file Support", zh: "2. 添加多文件支持" },
          description: {
            en: 'Extend to multi-file, e.g. "Add file tabs, click to switch between editing different files"',
            zh: '扩展为多文件，如 "添加文件标签页，点击切换编辑不同文件"',
          },
        },
        {
          title: { en: "3. Implement Live Preview", zh: "3. 实现实时预览" },
          description: {
            en: 'Add iframe preview, e.g. "Add an iframe that shows a live HTML preview"',
            zh: '添加 iframe 预览，如 "添加一个 iframe，实时显示 HTML 预览"',
          },
        },
        {
          title: { en: "4. Polish Features", zh: "4. 完善功能细节" },
          description: {
            en: 'Add console and shortcuts, e.g. "Intercept console.log and display in bottom panel"',
            zh: '添加控制台和快捷键，如 "拦截 console.log，显示在底部面板"',
          },
        },
      ],
    },
    buildSteps: {
      heading: { en: "Build Steps", zh: "构建步骤" },
      intro: {
        en: "This app demonstrates the vibe coding workflow for complex editor applications:",
        zh: "这个应用展示了复杂编辑器应用的 vibe coding 工作流程：",
      },
      steps: {
        en: [
          "Step 1: Design file model — Define EditorFile interface and file operation API",
          "Step 2: Build state management — Use signals for file list and tab state",
          "Step 3: Create UI layout — Use defineElement for file tree, editor, preview area",
          "Step 4: Implement editor features — textarea binding, tab switching, file switching",
          "Step 5: Add live preview — effect watches changes and updates iframe srcdoc",
          "Step 6: Implement console — postMessage intercepts console and displays in panel",
        ],
        zh: [
          "Step 1: 设计文件模型 - 定义 EditorFile 接口和文件操作 API",
          "Step 2: 构建状态管理 - 使用 signals 管理文件列表和标签页状态",
          "Step 3: 创建界面布局 - 使用 defineElement 构建文件树、编辑区、预览区",
          "Step 4: 实现编辑器功能 - textarea 绑定、标签切换、文件切换",
          "Step 5: 添加实时预览 - effect 监听变化并更新 iframe srcdoc",
          "Step 6: 实现控制台 - postMessage 拦截 console 并显示在面板中",
        ],
      },
    },
    keyFeatures: [
      {
        title: "📁 Virtual File System",
        description: {
          en: "Manage files and folders with reactive, in-memory file system that supports create, delete, rename",
          zh: "使用响应式的内存文件系统管理文件和文件夹，支持创建、删除、重命名",
        },
      },
      {
        title: "📑 Multi-tab Editing",
        description: {
          en: "Open multiple files simultaneously with tab switching, close buttons, and dirty state indicators",
          zh: "同时打开多个文件，支持标签切换、关闭按钮和脏状态指示器",
        },
      },
      {
        title: "▶️ Live Preview",
        description: {
          en: "Iframe-based preview that automatically updates on edit with debounced rendering",
          zh: "基于 iframe 的预览，编辑时自动更新，带有防抖渲染",
        },
      },
      {
        title: "🖨️ Integrated Console",
        description: {
          en: "Captures console.log, errors, and warnings from preview and displays them with formatting",
          zh: "从预览中捕获 console.log、错误和警告，并格式化显示",
        },
      },
      {
        title: "⌨️ Keyboard Shortcuts",
        description: {
          en: "Common IDE shortcuts like Cmd/Ctrl+S for save, Cmd/Ctrl+P for quick file search",
          zh: "常用 IDE 快捷键，如 Cmd/Ctrl+S 保存，Cmd/Ctrl+P 快速文件搜索",
        },
      },
      {
        title: "🎨 Syntax Highlighting",
        description: {
          en: "Basic syntax highlighting for HTML, CSS, and JavaScript with theme support",
          zh: "HTML、CSS 和 JavaScript 的基础语法高亮，支持主题",
        },
      },
    ],
  },
  {
    slug: "finance-tracker",
    title: "💰 Finance Tracker",
    description: {
      en: "A comprehensive personal finance application built with Rikka through vibe coding. Track income and expenses, get real-time analytics, and visualize your spending with beautiful charts.",
      zh: "一个综合性的个人财务应用，通过 Rikka 的 Vibe Coding 构建。追踪收支、获取实时分析，并通过精美的图表可视化你的支出。",
    },
    tags: ["Charting", "Analytics", "Vite"],
    features: {
      en: ["Income/Expense", "Category Stats", "Persistence"],
      zh: ["收入/支出", "分类统计", "数据持久化"],
    },
    vibe: {
      heading: { en: "Vibe Coding Guide", zh: "Vibe Coding 构建指南" },
      intro: {
        en: "Finance Tracker demonstrates how to build data visualization apps through vibe coding. Here are the core prompts we used:",
        zh: "Finance Tracker 展示了如何通过 vibe coding 构建数据可视化应用。以下是我们使用的核心提示词：",
      },
      steps: [
        {
          title: {
            en: "🚀 Step 1: Design Financial Data Model",
            zh: "🚀 第一步：设计财务数据模型",
          },
          prompt: {
            en: `# Start like this:

"Create a personal finance tracker app using Rikka Web Components.
The app needs:
- Record income and expense transactions
- Categorize by type (food, transport, salary, etc.)
- Display financial stats (total income, total expense, balance)
- Visualize charts showing expense distribution
- Date range filtering
- Data persistence to localStorage"

# AI will then:
1. Design Transaction and Category data structures
2. Create reactive statistical calculations
3. Build transaction list and forms
4. Implement chart visualization`,
            zh: `# 你可以这样开始：

"创建一个个人财务追踪应用，使用 Rikka Web Components。
应用需要：
- 记录收入和支出交易
- 按类别分类（食物、交通、工资等）
- 显示收支统计（总收入、总支出、余额）
- 可视化图表显示支出分布
- 日期范围筛选
- 数据持久化到 localStorage"

# AI 接下来会帮你：
1. 设计 Transaction 和 Category 数据结构
2. 创建响应式的统计计算
3. 构建交易列表和表单
4. 实现图表可视化`,
          },
        },
        {
          title: {
            en: "🔧 Step 2: Implement Statistics",
            zh: "🔧 第二步：实现统计计算",
          },
          prompt: {
            en: `# Tell AI how to implement financial statistics:

"In finance-store.ts:
- Define Transaction interface (id, type, amount, category, date)
- Define Category interface (id, name, type, color, icon)
- Define transactions and categories signals
- Use computed for:
  - stats: { income, expense, net, count }
  - categoryBreakdown: grouped statistics by category
  - filteredTransactions: date-filtered results"

# Rikka's advantages:
- All statistics are auto-computed
- When transactions change, all computed auto-recalculate
- No manual stat updates needed`,
            zh: `# 告诉 AI 如何实现财务统计：

"在 finance-store.ts 中：
- 定义 Transaction 接口（id, type, amount, category, date）
- 定义 Category 接口（id, name, type, color, icon）
- 定义 transactions 和 categories 信号
- 使用 computed 计算：
  - stats: { income, expense, net, count }
  - categoryBreakdown: 按类别分组的统计
  - filteredTransactions: 按日期过滤的结果"

# Rikka 的优势：
- 所有统计都是自动计算的
- 当 transactions 变化时，所有 computed 自动重算
- 无需手动更新统计`,
          },
        },
        {
          title: {
            en: "🎨 Step 3: Build Data Visualization",
            zh: "🎨 第三步：构建数据可视化",
          },
          prompt: {
            en: `# Let AI create chart components:

"Create CategoryChart component:
- Use CSS to implement bar charts
- Each bar height dynamically calculated from categoryBreakdown
- Use computed to bind styles directly to data
- Add transition animations"

# Pure CSS visualization:
- No Chart.js or other libraries needed
- Use computed to calculate height percentages
- Auto-reactive to data changes
- Lightweight and high-performance`,
            zh: `# 让 AI 创建图表组件：

"创建 CategoryChart 组件：
- 使用 CSS 实现柱状图
- 每列高度根据 categoryBreakdown 动态计算
- 使用 computed 直接绑定样式到数据
- 添加过渡动画"

# 纯 CSS 可视化：
- 无需 Chart.js 等库
- 使用 computed 计算高度百分比
- 自动响应数据变化
- 轻量且高性能`,
          },
        },
        {
          title: {
            en: "📅 Step 4: Add Date Filtering",
            zh: "📅 第四步：添加日期筛选",
          },
          prompt: {
            en: `# Let AI implement date filtering:

"Add date filtering:
- Define dateFilter signal: 'all' | 'month' | 'lastMonth' | 'custom'
- Define customDateRange signal for custom range
- Implement filter logic in filteredTransactions computed"

# Rikka implementation:
- computed auto-filters transactions by date
- UI updates are fully reactive
- Filter switching takes effect instantly`,
            zh: `# 让 AI 实现日期筛选功能：

"添加日期筛选：
- 定义 dateFilter 信号：'all' | 'month' | 'lastMonth' | 'custom'
- 定义 customDateRange 信号存储自定义范围
- 在 filteredTransactions computed 中实现过滤逻辑"

# Rikka 实现：
- computed 自动根据日期过滤交易
- UI 更新完全响应式
- 筛选器切换即时生效`,
          },
        },
      ],
    },
    coreFeatures: [
      {
        title: { en: "📊 Complex Statistical Calculations", zh: "📊 复杂统计计算" },
        description: {
          en: "Use multiple computed functions for different statistical metrics: income/expense totals, category breakdown, time-range filtering. Each computed is independent and auto-tracks dependencies.",
          zh: "使用多个 computed 函数计算不同的统计指标：收支总额、分类统计、时间范围过滤。每个 computed 独立且自动追踪依赖。",
        },
      },
      {
        title: { en: "📈 Dynamic Visualization", zh: "📈 动态可视化" },
        description: {
          en: "Use computed to bind styles to DOM attributes for dynamic charts. Charts auto-update when data changes, no manual redraw needed.",
          zh: "使用 computed 绑定样式到 DOM 属性，实现动态图表。数据变化时图表自动更新，无需手动重绘。",
        },
      },
      {
        title: { en: "🏷️ Category System", zh: "🏷️ 类别系统" },
        description: {
          en: "Use signals to store category config (color, icon, name), transactions only store category IDs. Modifying category config automatically affects all related displays.",
          zh: "使用信号存储类别配置（颜色、图标、名称），交易记录只存储类别 ID。修改类别配置自动影响所有相关显示。",
        },
      },
      {
        title: { en: "📅 Date Range Calculations", zh: "📅 日期范围计算" },
        description: {
          en: "Use computed and Date objects for flexible date filtering. Automatically handles month boundaries, timezones, and other complex cases.",
          zh: "使用 computed 和 Date 对象实现灵活的日期过滤。自动处理月份边界、时区等复杂情况。",
        },
      },
      {
        title: { en: "💾 Batch Data Persistence", zh: "💾 批量数据持久化" },
        description: {
          en: "Use effect to persist both transactions and categories to localStorage simultaneously, ensuring data consistency.",
          zh: "使用 effect 同时持久化 transactions 和 categories 到 localStorage，确保数据一致性。",
        },
      },
      {
        title: { en: "🎯 Form & Data Binding", zh: "🎯 表单与数据绑定" },
        description: {
          en: "Transaction forms bind directly to signals, updating the transactions array on submit. All related stats and charts auto-update.",
          zh: "交易表单直接绑定到 signals，提交时更新 transactions 数组。所有相关统计和图表自动更新。",
        },
      },
    ],
    workflow: {
      heading: { en: "Vibe Coding Workflow", zh: "Vibe Coding 工作流程" },
      intro: {
        en: "Step-by-step strategy for building data visualization apps:",
        zh: "数据可视化应用的分步构建策略：",
      },
      steps: [
        {
          title: { en: "1. Start with Basic List", zh: "1. 从基础列表开始" },
          description: {
            en: 'Start with a transaction list, e.g. "Create a transaction list showing amount, category, and date for each entry"',
            zh: '先实现交易列表，如 "创建一个交易列表，显示每条交易的金额、类别和日期"',
          },
        },
        {
          title: { en: "2. Add Form and Stats", zh: "2. 添加表单和统计" },
          description: {
            en: 'Add transaction form and stats cards, e.g. "Add a form to add transactions, and cards showing total income and expenses"',
            zh: '添加交易表单和统计卡片，如 "添加一个表单来添加交易，以及显示总收入和支出的卡片"',
          },
        },
        {
          title: { en: "3. Implement Visualization", zh: "3. 实现可视化" },
          description: {
            en: 'Add charts, e.g. "Create a CSS bar chart showing expense proportion for each category"',
            zh: '添加图表，如 "用 CSS 创建一个柱状图，显示每个类别的支出占比"',
          },
        },
        {
          title: { en: "4. Add Filtering", zh: "4. 添加筛选功能" },
          description: {
            en: 'Add date filters, e.g. "Add filter buttons for this month, last month, and all time"',
            zh: '完善筛选，如 "添加本月、上月、全部时间的筛选按钮"',
          },
        },
      ],
    },
    buildSteps: {
      heading: { en: "Build Steps", zh: "构建步骤" },
      intro: {
        en: "This app demonstrates the vibe coding workflow for data visualization applications:",
        zh: "这个应用展示了数据可视化应用的 vibe coding 工作流程：",
      },
      steps: {
        en: [
          "Step 1: Design data model — Define Transaction and Category interfaces, create default categories",
          "Step 2: Implement statistics — Use multiple computed for income/expense totals, category breakdown, filtered results",
          "Step 3: Build transaction management — Create transaction form and list components with CRUD support",
          "Step 4: Implement chart visualization — Use CSS and computed bindings for dynamic bar charts",
          "Step 5: Add date filtering — Implement flexible date range filter functionality",
          "Step 6: Persist data — Use effect for auto-saving all data to localStorage",
        ],
        zh: [
          "Step 1: 设计数据模型 - 定义 Transaction 和 Category 接口，创建默认类别配置",
          "Step 2: 实现统计计算 - 使用多个 computed 计算收支总额、分类统计、过滤结果",
          "Step 3: 构建交易管理 - 创建交易表单和列表组件，支持增删改操作",
          "Step 4: 实现图表可视化 - 使用 CSS 和 computed 绑定创建动态柱状图",
          "Step 5: 添加日期筛选 - 实现灵活的日期范围过滤功能",
          "Step 6: 数据持久化 - 使用 effect 自动保存所有数据到 localStorage",
        ],
      },
    },
    keyFeatures: [
      {
        title: "📝 Transaction Management",
        description: {
          en: "Full CRUD operations: add, edit, delete income and expense entries with categories",
          zh: "完整的 CRUD 操作：添加、编辑、删除带有类别的收入和支出条目",
        },
      },
      {
        title: "📊 Real-time Analytics",
        description: {
          en: "Live computed statistics: net balance, income vs expense totals, average per category",
          zh: "实时计算统计：净余额、收支总额、每个类别的平均值",
        },
      },
      {
        title: "📈 Category Charts",
        description: {
          en: "CSS-only visualization with dynamic bar heights that react instantly to data changes",
          zh: "纯 CSS 可视化，动态柱状高度即时响应数据变化",
        },
      },
      {
        title: "📅 Date Filtering",
        description: {
          en: "Filter transactions by date range: this month, last month, custom range, or all time",
          zh: "按日期范围过滤交易：本月、上月、自定义范围或全部时间",
        },
      },
      {
        title: "🏷️ Category System",
        description: {
          en: "Customizable categories with icons and color coding for quick visual identification",
          zh: "可自定义类别，带有图标和颜色编码，便于快速视觉识别",
        },
      },
      {
        title: "💾 Auto Persistence",
        description: {
          en: "All data automatically saved to localStorage with no manual export required",
          zh: "所有数据自动保存到 localStorage，无需手动导出",
        },
      },
    ],
  },
];

/** Labels used across example pages */
export const exampleLabels = {
  allExamples: { en: "← All Examples", zh: "← 所有示例" },
  liveDemo: { en: "Live Demo", zh: "实时演示" },
  view: { en: "View →", zh: "查看 →" },
  projectStructure: { en: "Project Structure", zh: "项目结构" },
  keyFeatures: { en: "Key Features", zh: "核心功能" },
  learnMore: { en: "Learn More", zh: "了解更多" },
  viewDemo: { en: "View", zh: "查看" },
  examplesTitle: { en: "Examples", zh: "示例" },
  examplesSubtitle: {
    en: "Complete, real-world applications built with Rikka through vibe coding. Each example is a standalone project you can explore, run, and learn from.",
    zh: "通过 Rikka 的 Vibe Coding 构建的完整、真实的应用。每个示例都是一个独立的项目，你可以探索、运行和学习。",
  },
};
