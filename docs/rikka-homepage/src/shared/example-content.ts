import type { Locale } from "./i18n";

export interface ExampleData {
  slug: string;
  title: string;
  description: Record<Locale, string>;
  tags: string[];
  features: Record<Locale, string[]>;
  /** Vibe Coding section - combines guide and workflow */
  vibe: {
    heading: Record<Locale, string>;
    intro: Record<Locale, string>;
    workflow: {
      title: Record<Locale, string>;
      steps: {
        title: Record<Locale, string>;
        description: Record<Locale, string>;
      }[];
    };
    prompts: {
      title: Record<Locale, string>;
      steps: {
        title: Record<Locale, string>;
        prompt: Record<Locale, string>;
      }[];
    };
  };
  /** "Core Rikka Features Used" section */
  coreFeatures: {
    title: Record<Locale, string>;
    description: Record<Locale, string>;
  }[];
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
        en: "Vibe Coding with Rikka",
        zh: "使用 Rikka 进行 Vibe Coding",
      },
      intro: {
        en: "Describe your app in natural language and let AI build it for you. Here's how we built this Pomodoro Timer:",
        zh: "通过自然语言描述你的应用，让 AI 帮你完成构建。以下是我们构建这个番茄钟的过程：",
      },
      workflow: {
        title: {
          en: "The Vibe Coding Workflow",
          zh: "Vibe Coding 工作流程",
        },
        steps: [
          {
            title: { en: "1. Describe", zh: "1. 描述需求" },
            description: {
              en: "Start with a clear description of what you want to build",
              zh: "用清晰的语言描述你想要构建的内容",
            },
          },
          {
            title: { en: "2. Generate", zh: "2. 生成代码" },
            description: {
              en: "AI generates Rikka-based implementation from your description",
              zh: "AI 根据描述生成基于 Rikka 的实现代码",
            },
          },
          {
            title: { en: "3. Preview", zh: "3. 预览效果" },
            description: {
              en: "See results instantly in browser — no complex setup needed",
              zh: "立即在浏览器中预览效果，无需复杂配置",
            },
          },
          {
            title: { en: "4. Iterate", zh: "4. 迭代优化" },
            description: {
              en: "Refine by giving more specific prompts to improve the implementation",
              zh: "通过更具体的提示词来优化实现",
            },
          },
        ],
      },
      prompts: {
        title: {
          en: "Key Prompts Used",
          zh: "使用的关键提示词",
        },
        steps: [
          {
            title: {
              en: "🚀 Project Setup",
              zh: "🚀 项目初始化",
            },
            prompt: {
              en: `"Create a Pomodoro Timer app using Rikka Web Components.
The app needs:
- Three modes: Pomodoro (25min), Short Break (5min), Long Break (15min)
- Circular progress bar showing remaining time
- Start/Pause/Reset buttons
- Completed session counter
- Data persistence to localStorage"`,
              zh: `"创建一个 Pomodoro Timer 应用，使用 Rikka Web Components。
应用需要：
- 三种模式：Pomodoro (25分钟)、Short Break (5分钟)、Long Break (15分钟)
- 圆形进度条显示剩余时间
- 开始/暂停/重置按钮
- 完成次数统计
- 数据持久化到 localStorage"`,
            },
          },
          {
            title: {
              en: "🔧 Reactive State",
              zh: "🔧 响应式状态",
            },
            prompt: {
              en: `"In store.ts, use @takanashi/rikka-signal:
- Define mode, timeLeft, isRunning, pomodorosCompleted signals
- Use computed for progress percentage and formatted time
- Use effect for auto-saving to localStorage"`,
              zh: `"在 store.ts 中使用 @takanashi/rikka-signal：
- 定义 mode、timeLeft、isRunning、pomodorosCompleted 信号
- 使用 computed 计算进度百分比和格式化时间
- 使用 effect 自动保存到 localStorage"`,
            },
          },
          {
            title: {
              en: "🎨 UI Components",
              zh: "🎨 UI 组件",
            },
            prompt: {
              en: `"Create TimerDisplay component with:
- SVG circular progress bar
- Bind computed signal to stroke-dashoffset
- Add smooth transition animations"`,
              zh: `"创建 TimerDisplay 组件：
- SVG 圆形进度条
- 将 computed 信号绑定到 stroke-dashoffset
- 添加平滑过渡动画"`,
            },
          },
          {
            title: {
              en: "⏰ Timer Logic",
              zh: "⏰ 计时逻辑",
            },
            prompt: {
              en: `"Implement timer logic in an effect:
- Start setInterval when isRunning is true
- Switch modes automatically when time ends
- Play notification sound
- Switch to long break every 4 Pomodoros"`,
              zh: `"在 effect 中实现计时逻辑：
- 当 isRunning 为 true 时启动 setInterval
- 时间结束时自动切换模式
- 播放提示音
- 每 4 个 Pomodoro 后切换到长休息"`,
            },
          },
        ],
      },
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
        en: "Vibe Coding with Rikka",
        zh: "使用 Rikka 进行 Vibe Coding",
      },
      intro: {
        en: "Bookmark Manager demonstrates how to build data-driven apps through vibe coding. Here's how we built it:",
        zh: "Bookmark Manager 展示了如何通过 vibe coding 构建数据驱动的应用。以下是构建过程：",
      },
      workflow: {
        title: {
          en: "The Vibe Coding Workflow",
          zh: "Vibe Coding 工作流程",
        },
        steps: [
          {
            title: { en: "1. Describe", zh: "1. 描述需求" },
            description: {
              en: "Start with a clear description of what you want to build",
              zh: "用清晰的语言描述你想要构建的内容",
            },
          },
          {
            title: { en: "2. Generate", zh: "2. 生成代码" },
            description: {
              en: "AI generates Rikka-based implementation from your description",
              zh: "AI 根据描述生成基于 Rikka 的实现代码",
            },
          },
          {
            title: { en: "3. Preview", zh: "3. 预览效果" },
            description: {
              en: "See results instantly in browser — no complex setup needed",
              zh: "立即在浏览器中预览效果，无需复杂配置",
            },
          },
          {
            title: { en: "4. Iterate", zh: "4. 迭代优化" },
            description: {
              en: "Refine by giving more specific prompts to improve the implementation",
              zh: "通过更具体的提示词来优化实现",
            },
          },
        ],
      },
      prompts: {
        title: {
          en: "Key Prompts Used",
          zh: "使用的关键提示词",
        },
        steps: [
          {
            title: {
              en: "🚀 Project Setup",
              zh: "🚀 项目初始化",
            },
            prompt: {
              en: `"Create a bookmark manager app using Rikka Web Components.
The app needs:
- Save links, titles, descriptions, tags
- Search by title, URL, and tags
- Filter by tags
- Add, edit, delete bookmarks
- Data persistence to localStorage"`,
              zh: `"创建一个书签管理应用，使用 Rikka Web Components。
应用需要：
- 保存链接、标题、描述、标签
- 支持按标题、URL、标签搜索
- 支持按标签筛选
- 添加、编辑、删除书签
- 数据持久化到 localStorage"`,
            },
          },
          {
            title: {
              en: "🔧 Data Management",
              zh: "🔧 数据管理",
            },
            prompt: {
              en: `"In store.ts, use @takanashi/rikka-signal:
- Define bookmarks signal for bookmark list
- Define searchQuery and selectedTags signals
- Use computed for allTags and filteredBookmarks
- Implement CRUD functions: addBookmark, updateBookmark, deleteBookmark
- Use effect for auto-saving to localStorage"`,
              zh: `"在 store.ts 中使用 @takanashi/rikka-signal：
- 定义 bookmarks 信号存储书签列表
- 定义 searchQuery 和 selectedTags 信号
- 使用 computed 创建 allTags 和 filteredBookmarks
- 实现 CRUD 函数：addBookmark, updateBookmark, deleteBookmark
- 使用 effect 自动保存到 localStorage"`,
            },
          },
          {
            title: {
              en: "🎨 Search Components",
              zh: "🎨 搜索组件",
            },
            prompt: {
              en: `"Create SearchBar and TagFilter components:
- Search bar with real-time debounced search
- Tag filter displaying all tags with multi-select
- Bookmark list showing filtered cards"`,
              zh: `"创建 SearchBar 和 TagFilter 组件：
- 搜索框支持实时防抖搜索
- 标签筛选显示所有标签并支持多选
- 书签列表显示过滤后的卡片"`,
            },
          },
          {
            title: {
              en: "✨ Interactive Features",
              zh: "✨ 交互功能",
            },
            prompt: {
              en: `"Add interactive features:
- Click bookmark card to show details
- Edit button opens edit form
- Delete button with confirmation
- Drag-and-drop sorting"`,
              zh: `"添加交互功能：
- 点击书签卡片显示详情
- 编辑按钮打开编辑表单
- 删除按钮确认后删除
- 拖拽排序功能"`,
            },
          },
        ],
      },
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
      heading: {
        en: "Vibe Coding with Rikka",
        zh: "使用 Rikka 进行 Vibe Coding",
      },
      intro: {
        en: "Code Editor demonstrates how to build complex editor apps through vibe coding. Here's how we built it:",
        zh: "Code Editor 展示了如何通过 vibe coding 构建复杂的编辑器应用。以下是构建过程：",
      },
      workflow: {
        title: {
          en: "The Vibe Coding Workflow",
          zh: "Vibe Coding 工作流程",
        },
        steps: [
          {
            title: { en: "1. Describe", zh: "1. 描述需求" },
            description: {
              en: "Start with a clear description of what you want to build",
              zh: "用清晰的语言描述你想要构建的内容",
            },
          },
          {
            title: { en: "2. Generate", zh: "2. 生成代码" },
            description: {
              en: "AI generates Rikka-based implementation from your description",
              zh: "AI 根据描述生成基于 Rikka 的实现代码",
            },
          },
          {
            title: { en: "3. Preview", zh: "3. 预览效果" },
            description: {
              en: "See results instantly in browser — no complex setup needed",
              zh: "立即在浏览器中预览效果，无需复杂配置",
            },
          },
          {
            title: { en: "4. Iterate", zh: "4. 迭代优化" },
            description: {
              en: "Refine by giving more specific prompts to improve the implementation",
              zh: "通过更具体的提示词来优化实现",
            },
          },
        ],
      },
      prompts: {
        title: {
          en: "Key Prompts Used",
          zh: "使用的关键提示词",
        },
        steps: [
          {
            title: {
              en: "🚀 Editor Architecture",
              zh: "🚀 编辑器架构",
            },
            prompt: {
              en: `"Create an online code editor using Rikka Web Components.
The app needs:
- Left file tree, center code editor, right live preview
- Support HTML/CSS/JS files
- Live preview: iframe auto-updates after editing
- Bottom console: capture and display console output
- Tab management: support multi-file switching"`,
              zh: `"创建一个在线代码编辑器，使用 Rikka Web Components。
应用需要：
- 左侧文件树，中间代码编辑区，右侧实时预览
- 支持 HTML/CSS/JS 三个文件
- 实时预览：编辑代码后 iframe 自动更新
- 底部控制台：捕获并显示 console 输出
- 标签页管理：支持多文件切换"`,
            },
          },
          {
            title: {
              en: "🔧 File Management",
              zh: "🔧 文件管理",
            },
            prompt: {
              en: `"In editor-store.ts:
- Define EditorFile interface (id, name, type, content, dirty)
- Define files signal for file list
- Define openTabs and activeFileId signals
- Use computed to get current active file
- Implement createFile, deleteFile, updateFile operations"`,
              zh: `"在 editor-store.ts 中：
- 定义 EditorFile 接口（id, name, type, content, dirty）
- 定义 files 信号存储文件列表
- 定义 openTabs 和 activeFileId 信号
- 使用 computed 获取当前活动的文件
- 实现 createFile, deleteFile, updateFile 等操作"`,
            },
          },
          {
            title: {
              en: "🎨 Editor UI",
              zh: "🎨 编辑器界面",
            },
            prompt: {
              en: `"Create components: FileTree sidebar, TabBar with open files, CodeEditor textarea, PreviewFrame iframe, ConsolePanel for logs"`,
              zh: `"创建组件：FileTree 侧边栏、TabBar 标签栏、CodeEditor 编辑区、PreviewFrame 预览、ConsolePanel 控制台"`,
            },
          },
          {
            title: {
              en: "⚡ Live Preview",
              zh: "⚡ 实时预览",
            },
            prompt: {
              en: `"Implement PreviewFrame: use iframe srcdoc, effect watches file changes, merge HTML/CSS/JS to generate page, intercept console output"`,
              zh: `"实现 PreviewFrame：使用 iframe srcdoc，effect 监听文件变化，合并 HTML/CSS/JS 生成页面，拦截 console 输出"`,
            },
          },
        ],
      },
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
      heading: {
        en: "Vibe Coding with Rikka",
        zh: "使用 Rikka 进行 Vibe Coding",
      },
      intro: {
        en: "Finance Tracker demonstrates how to build data visualization apps through vibe coding. Here's how we built it:",
        zh: "Finance Tracker 展示了如何通过 vibe coding 构建数据可视化应用。以下是构建过程：",
      },
      workflow: {
        title: {
          en: "The Vibe Coding Workflow",
          zh: "Vibe Coding 工作流程",
        },
        steps: [
          {
            title: { en: "1. Describe", zh: "1. 描述需求" },
            description: {
              en: "Start with a clear description of what you want to build",
              zh: "用清晰的语言描述你想要构建的内容",
            },
          },
          {
            title: { en: "2. Generate", zh: "2. 生成代码" },
            description: {
              en: "AI generates Rikka-based implementation from your description",
              zh: "AI 根据描述生成基于 Rikka 的实现代码",
            },
          },
          {
            title: { en: "3. Preview", zh: "3. 预览效果" },
            description: {
              en: "See results instantly in browser — no complex setup needed",
              zh: "立即在浏览器中预览效果，无需复杂配置",
            },
          },
          {
            title: { en: "4. Iterate", zh: "4. 迭代优化" },
            description: {
              en: "Refine by giving more specific prompts to improve the implementation",
              zh: "通过更具体的提示词来优化实现",
            },
          },
        ],
      },
      prompts: {
        title: {
          en: "Key Prompts Used",
          zh: "使用的关键提示词",
        },
        steps: [
          {
            title: {
              en: "🚀 Data Model",
              zh: "🚀 数据模型",
            },
            prompt: {
              en: `"Create a personal finance tracker app using Rikka Web Components.
The app needs:
- Record income and expense transactions
- Categorize by type (food, transport, salary, etc.)
- Display financial stats (total income, total expense, balance)
- Visualize charts showing expense distribution
- Date range filtering
- Data persistence to localStorage"`,
              zh: `"创建一个个人财务追踪应用，使用 Rikka Web Components。
应用需要：
- 记录收入和支出交易
- 按类别分类（食物、交通、工资等）
- 显示收支统计（总收入、总支出、余额）
- 可视化图表显示支出分布
- 日期范围筛选
- 数据持久化到 localStorage"`,
            },
          },
          {
            title: {
              en: "🔧 Statistics",
              zh: "🔧 统计计算",
            },
            prompt: {
              en: `"In finance-store.ts:
- Define Transaction and Category interfaces
- Define transactions and categories signals
- Use computed for stats (income, expense, net), categoryBreakdown, filteredTransactions"`,
              zh: `"在 finance-store.ts 中：
- 定义 Transaction 和 Category 接口
- 定义 transactions 和 categories 信号
- 使用 computed 计算 stats（收入、支出、余额）、categoryBreakdown、filteredTransactions"`,
            },
          },
          {
            title: {
              en: "🎨 Visualization",
              zh: "🎨 可视化",
            },
            prompt: {
              en: `"Create CategoryChart component:
- Use CSS to implement bar charts
- Each bar height dynamically calculated from categoryBreakdown
- Use computed to bind styles directly to data
- Add transition animations"`,
              zh: `"创建 CategoryChart 组件：
- 使用 CSS 实现柱状图
- 每列高度根据 categoryBreakdown 动态计算
- 使用 computed 直接绑定样式到数据
- 添加过渡动画"`,
            },
          },
          {
            title: {
              en: "📅 Date Filtering",
              zh: "📅 日期筛选",
            },
            prompt: {
              en: `"Add date filtering:
- Define dateFilter signal: 'all' | 'month' | 'lastMonth' | 'custom'
- Define customDateRange signal
- Implement filter logic in filteredTransactions computed"`,
              zh: `"添加日期筛选：
- 定义 dateFilter 信号：'all' | 'month' | 'lastMonth' | 'custom'
- 定义 customDateRange 信号存储自定义范围
- 在 filteredTransactions computed 中实现过滤逻辑"`,
            },
          },
        ],
      },
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
  {
    slug: "todo-list",
    title: "✅ Todo List",
    description: {
      en: "A beautifully designed task management app built with Rikka through vibe coding. Create tasks with priorities, tags, and filters to organize your day with clarity.",
      zh: "一个精美的任务管理应用，通过 Rikka 的 Vibe Coding 构建。创建带优先级、标签和筛选的任务，让你的一天井井有条。",
    },
    tags: ["State Management", "Filters", "Signals"],
    features: {
      en: ["Priorities", "Tags", "Filters"],
      zh: ["优先级", "标签", "筛选器"],
    },
    vibe: {
      heading: {
        en: "Vibe Coding with Rikka",
        zh: "使用 Rikka 进行 Vibe Coding",
      },
      intro: {
        en: "Todo List demonstrates how to build interactive list apps through vibe coding. Here's how we built it:",
        zh: "Todo List 展示了如何通过 vibe coding 构建交互式列表应用。以下是构建过程：",
      },
      workflow: {
        title: {
          en: "The Vibe Coding Workflow",
          zh: "Vibe Coding 工作流程",
        },
        steps: [
          {
            title: { en: "1. Describe", zh: "1. 描述需求" },
            description: {
              en: "Start with a clear description of what you want to build",
              zh: "用清晰的语言描述你想要构建的内容",
            },
          },
          {
            title: { en: "2. Generate", zh: "2. 生成代码" },
            description: {
              en: "AI generates Rikka-based implementation from your description",
              zh: "AI 根据描述生成基于 Rikka 的实现代码",
            },
          },
          {
            title: { en: "3. Preview", zh: "3. 预览效果" },
            description: {
              en: "See results instantly in browser — no complex setup needed",
              zh: "立即在浏览器中预览效果，无需复杂配置",
            },
          },
          {
            title: { en: "4. Iterate", zh: "4. 迭代优化" },
            description: {
              en: "Refine by giving more specific prompts to improve the implementation",
              zh: "通过更具体的提示词来优化实现",
            },
          },
        ],
      },
      prompts: {
        title: {
          en: "Key Prompts Used",
          zh: "使用的关键提示词",
        },
        steps: [
          {
            title: {
              en: "🚀 Task Model",
              zh: "🚀 任务模型",
            },
            prompt: {
              en: `"Create a Todo List app using Rikka Web Components.
The app needs:
- Create, edit, delete tasks with checkboxes for completion
- Priority levels: high/medium/low with visual indicators
- Tag system: add custom tags to any task
- Filter views: all / active / completed / by priority / by tag
- Data persistence to localStorage
- Compact stats: active count, completed count"`,
              zh: `"创建一个 Todo List 应用，使用 Rikka Web Components。
应用需要：
- 创建、编辑、删除任务，支持勾选完成
- 优先级：高/中/低，带视觉指示
- 标签系统：为任务添加自定义标签
- 筛选视图：全部 / 进行中 / 已完成 / 按优先级 / 按标签
- 数据持久化到 localStorage
- 精简统计：进行中数量、已完成数量"`,
            },
          },
          {
            title: {
              en: "🔧 State Management",
              zh: "🔧 状态管理",
            },
            prompt: {
              en: `"In store.ts:
- Define Todo interface (id, text, completed, priority, tags, createdAt)
- Define todos and activeFilter signals
- Use computed for: activeTodos, completedTodos, filteredTodos
- Implement addTodo, toggleTodo, deleteTodo, editTodo operations"`,
              zh: `"在 store.ts 中：
- 定义 Todo 接口（id, text, completed, priority, tags, createdAt）
- 定义 todos 和 activeFilter 信号
- 使用 computed 计算：activeTodos, completedTodos, filteredTodos
- 实现 addTodo, toggleTodo, deleteTodo, editTodo 操作"`,
            },
          },
          {
            title: {
              en: "🏷️ Priority & Tags",
              zh: "🏷️ 优先级和标签",
            },
            prompt: {
              en: `"Add priority levels and tags:
- Define Priority type: 'low' | 'medium' | 'high'
- Create priority selector with color-coded UI
- Implement tag chips with add/remove capability
- Use computed to build filter by priority and by tag"`,
              zh: `"添加优先级和标签：
- 定义 Priority 类型：'low' | 'medium' | 'high'
- 创建带颜色标识的优先级选择器
- 实现标签芯片（chip），支持添加和删除
- 使用 computed 构建按优先级和标签的筛选"`,
            },
          },
          {
            title: {
              en: "🔍 Filter & Search",
              zh: "🔍 筛选和搜索",
            },
            prompt: {
              en: `"Add filter bar and search:
- Define searchQuery signal for input
- Define viewFilter signal: 'all' | 'active' | 'completed'
- Combine in filteredTodos computed: filter by view + text search + priority
- Display count badges next to each filter option"`,
              zh: `"添加筛选栏和搜索：
- 定义 searchQuery 信号用于输入
- 定义 viewFilter 信号：'all' | 'active' | 'completed'
- 在 filteredTodos computed 中组合：按视图 + 文本搜索 + 优先级筛选
- 为每个筛选选项显示数量徽章"`,
            },
          },
        ],
      },
    },
    coreFeatures: [
      {
        title: { en: "📋 Reactive Task State", zh: "📋 响应式任务状态" },
        description: {
          en: "Use signal to manage an array of tasks; each edit, toggle, or deletion triggers automatic UI updates across all components.",
          zh: "使用 signal 管理任务数组；每次编辑、勾选或删除都会自动更新所有相关组件的 UI。",
        },
      },
      {
        title: { en: "🔍 Multi-criteria Filtering", zh: "🔍 多条件筛选" },
        description: {
          en: "Use computed to combine status filter, priority filter, tag filter, and text search into a single reactive list.",
          zh: "使用 computed 将状态筛选、优先级筛选、标签筛选和文本搜索组合为单一响应式列表。",
        },
      },
      {
        title: { en: "🏷️ Priority & Tag System", zh: "🏷️ 优先级和标签系统" },
        description: {
          en: "Color-coded priority levels and a flexible tag chip system, all implemented with declarative signal bindings.",
          zh: "带颜色标识的优先级和灵活的标签芯片系统，全部通过声明式 signal 绑定实现。",
        },
      },
      {
        title: { en: "💾 Auto Persistence", zh: "💾 自动持久化" },
        description: {
          en: "effect watches the todos signal and writes to localStorage on every change. Data is restored on page load.",
          zh: "effect 监听 todos 信号，每次变化即写入 localStorage。页面加载时自动恢复数据。",
        },
      },
      {
        title: { en: "📊 Live Stats Badges", zh: "📊 实时统计徽章" },
        description: {
          en: "Computed properties track active vs completed counts and update badge numbers reactively.",
          zh: "computed 属性追踪进行中与已完成数量，响应式更新徽章数字。",
        },
      },
      {
        title: { en: "🎯 Inline Edit Experience", zh: "🎯 内联编辑体验" },
        description: {
          en: "Click a task to edit inline; Rikka signals handle form state and commit without any boilerplate.",
          zh: "点击任务即可内联编辑；Rikka signals 处理表单状态和提交，无需任何样板代码。",
        },
      },
    ],
    buildSteps: {
      heading: { en: "Build Steps", zh: "构建步骤" },
      intro: {
        en: "This app demonstrates the vibe coding workflow for task management applications:",
        zh: "这个应用展示了任务管理应用的 vibe coding 工作流程：",
      },
      steps: {
        en: [
          "Step 1: Design data model — Define Todo interface with priority and tags, create store with signal",
          "Step 2: Build task list — Use component + signal binding for list rendering with checkboxes",
          "Step 3: Add inline edit — Toggle between display and edit mode with per-task signal state",
          "Step 4: Implement filters — Combine view filter, priority filter, tag filter, and search in computed",
          "Step 5: Add badge counts — Use computed for reactive active/completed counters",
          "Step 6: Persist data — Use effect to auto-save and restore tasks from localStorage",
        ],
        zh: [
          "Step 1: 设计数据模型 - 定义带优先级和标签的 Todo 接口，用 signal 创建 store",
          "Step 2: 构建任务列表 - 使用组件 + signal 绑定渲染带勾选框的列表",
          "Step 3: 添加内联编辑 - 通过 per-task signal 状态切换显示和编辑模式",
          "Step 4: 实现筛选 - 在 computed 中组合视图筛选、优先级筛选、标签筛选和搜索",
          "Step 5: 添加徽章统计 - 使用 computed 响应式计算进行中/已完成数量",
          "Step 6: 数据持久化 - 使用 effect 自动保存和恢复 localStorage 中的任务",
        ],
      },
    },
    keyFeatures: [
      {
        title: "✅ Full CRUD Operations",
        description: {
          en: "Create, edit, complete, and delete tasks with fluid keyboard-friendly interactions",
          zh: "创建、编辑、完成和删除任务，流畅且支持键盘交互",
        },
      },
      {
        title: "🎯 Priority Levels",
        description: {
          en: "Color-coded high/medium/low priorities with one-click switching",
          zh: "带颜色标识的高/中/低优先级，一键切换",
        },
      },
      {
        title: "🏷️ Flexible Tag System",
        description: {
          en: "Add custom tags to any task; filter by tag with a single click",
          zh: "为任务添加自定义标签；一键按标签筛选",
        },
      },
      {
        title: "🔍 Smart Filtering",
        description: {
          en: "Filter by status, priority, and tag; live text search across all tasks",
          zh: "按状态、优先级、标签筛选；实时文本搜索所有任务",
        },
      },
      {
        title: "📊 Live Counters",
        description: {
          en: "Active and completed count badges that update in real-time",
          zh: "进行中和已完成数量徽章，实时更新",
        },
      },
      {
        title: "💾 Auto Save",
        description: {
          en: "Every change persists to localStorage; restore on reload",
          zh: "每次更改自动持久化到 localStorage；重新加载即恢复",
        },
      },
    ],
  },
  {
    slug: "drawing-pad",
    title: "🎨 Drawing Pad",
    description: {
      en: "A creative canvas drawing app built with Rikka through vibe coding. Freehand sketch, use shapes, pick colors, undo/redo, and export to PNG.",
      zh: "一个创意画板应用，通过 Rikka 的 Vibe Coding 构建。自由涂鸦、绘制图形、选择颜色、撤销重做，并导出为 PNG。",
    },
    tags: ["Canvas API", "Events", "Shapes"],
    features: {
      en: ["Pen/Shapes", "Palette", "Undo/Redo"],
      zh: ["画笔/图形", "调色板", "撤销/重做"],
    },
    vibe: {
      heading: {
        en: "Vibe Coding with Rikka",
        zh: "使用 Rikka 进行 Vibe Coding",
      },
      intro: {
        en: "Drawing Pad demonstrates how to build canvas-based creative apps through vibe coding. Here's how we built it:",
        zh: "Drawing Pad 展示了如何通过 vibe coding 构建基于 Canvas 的创意应用。以下是构建过程：",
      },
      workflow: {
        title: {
          en: "The Vibe Coding Workflow",
          zh: "Vibe Coding 工作流程",
        },
        steps: [
          {
            title: { en: "1. Describe", zh: "1. 描述需求" },
            description: {
              en: "Start with a clear description of what you want to build",
              zh: "用清晰的语言描述你想要构建的内容",
            },
          },
          {
            title: { en: "2. Generate", zh: "2. 生成代码" },
            description: {
              en: "AI generates Rikka-based implementation from your description",
              zh: "AI 根据描述生成基于 Rikka 的实现代码",
            },
          },
          {
            title: { en: "3. Preview", zh: "3. 预览效果" },
            description: {
              en: "See results instantly in browser — no complex setup needed",
              zh: "立即在浏览器中预览效果，无需复杂配置",
            },
          },
          {
            title: { en: "4. Iterate", zh: "4. 迭代优化" },
            description: {
              en: "Refine by giving more specific prompts to improve the implementation",
              zh: "通过更具体的提示词来优化实现",
            },
          },
        ],
      },
      prompts: {
        title: {
          en: "Key Prompts Used",
          zh: "使用的关键提示词",
        },
        steps: [
          {
            title: {
              en: "🚀 Canvas Setup",
              zh: "🚀 画布设置",
            },
            prompt: {
              en: `"Create a drawing pad app using Rikka Web Components.
The app needs:
- A Canvas element as the drawing surface
- Drawing tools: pen, eraser, line, rectangle, circle
- Color palette and brush size selector
- Background color picker
- Undo/redo history stack
- Save to PNG and JSON export/import
- Mouse and touch input support"`,
              zh: `"创建一个画板应用，使用 Rikka Web Components。
应用需要：
- 一个 Canvas 元素作为绘图画布
- 绘图工具：画笔、橡皮、直线、矩形、圆形
- 调色板和笔刷尺寸选择器
- 背景颜色选择器
- 撤销/重做历史栈
- 保存为 PNG 和 JSON 导入导出
- 支持鼠标和触摸输入"`,
            },
          },
          {
            title: {
              en: "🔧 Drawing State",
              zh: "🔧 绘制状态",
            },
            prompt: {
              en: `"In store.ts:
- Define Tool type: 'pen' | 'eraser' | 'line' | 'rect' | 'circle'
- Define currentTool, currentColor, currentSize signals
- Define undoStack and redoStack arrays with ImageData snapshots
- Define bgColor signal for background
- Implement pushUndo, popUndo, pushRedo, popRedo operations"`,
              zh: `"在 store.ts 中：
- 定义 Tool 类型：'pen' | 'eraser' | 'line' | 'rect' | 'circle'
- 定义 currentTool, currentColor, currentSize 信号
- 定义 undoStack 和 redoStack 数组存储 ImageData 快照
- 定义 bgColor 信号控制背景
- 实现 pushUndo, popUndo, pushRedo, popRedo 操作"`,
            },
          },
          {
            title: {
              en: "✏️ Drawing Logic",
              zh: "✏️ 绘制逻辑",
            },
            prompt: {
              en: `"Add drawing event handlers:
- On pointer down: snapshot canvas to undo stack, mark start point
- On pointer move for pen/eraser: draw segments with currentColor/currentSize
- On pointer move for shapes: restore snapshot + draw shape from start to current
- On pointer up: finalize
- Use lineCap='round' and lineJoin='round' for smooth pen strokes"`,
              zh: `"添加绘制事件处理：
- 指针按下：保存画布快照到撤销栈，记录起点
- 画笔/橡皮移动：用 currentColor/currentSize 绘制线段
- 图形移动：恢复快照 + 从起点到当前点绘制图形
- 指针松开：完成
- 使用 lineCap='round' 和 lineJoin='round' 让笔画更平滑"`,
            },
          },
          {
            title: {
              en: "📤 Export & History",
              zh: "📤 导出与历史",
            },
            prompt: {
              en: `"Add file operations:
- Save PNG: draw to temp canvas with bg fill, call toDataURL, download via anchor
- Save JSON: serialize bg + image data
- Load JSON: parse, set bg, draw image onto canvas
- Keyboard Ctrl+Z / Ctrl+Shift+Z for undo/redo
- Ctrl+S to save PNG"`,
              zh: `"添加文件操作：
- 保存 PNG：绘制到带背景填充的临时 canvas，调用 toDataURL，通过链接下载
- 保存 JSON：序列化背景 + 图像数据
- 加载 JSON：解析、设置背景、在 canvas 上绘制图像
- 键盘 Ctrl+Z / Ctrl+Shift+Z 触发撤销/重做
- Ctrl+S 保存 PNG"`,
            },
          },
        ],
      },
    },
    coreFeatures: [
      {
        title: { en: "🎨 Canvas + Signal Integration", zh: "🎨 Canvas + Signal 集成" },
        description: {
          en: "Native HTML Canvas API wrapped in a Rikka component. Signal state drives the active tool, color, and brush size.",
          zh: "原生 HTML Canvas API 包装在 Rikka 组件中。Signal 状态驱动激活的工具、颜色和笔刷尺寸。",
        },
      },
      {
        title: { en: "🖌️ Multiple Drawing Tools", zh: "🖌️ 多种绘图工具" },
        description: {
          en: "Freehand pen, eraser, straight line, rectangle, and ellipse — each tool changes event handling reactively.",
          zh: "自由画笔、橡皮、直线、矩形、椭圆 — 每种工具响应式地改变事件处理。",
        },
      },
      {
        title: { en: "🎨 Color & Size Palette", zh: "🎨 颜色和尺寸调色板" },
        description: {
          en: "Click-to-select color swatches and size chips; all driven by signal bindings with zero boilerplate.",
          zh: "点击选择的色块和尺寸芯片；全部由 signal 绑定驱动，零样板代码。",
        },
      },
      {
        title: { en: "↩️ Snapshot Undo/Redo", zh: "↩️ 快照式撤销/重做" },
        description: {
          en: "ImageData snapshots capture canvas state before each stroke. Undo pops a snapshot; redo restores it.",
          zh: "ImageData 快照在每笔前捕获画布状态。撤销弹出一个快照；重做恢复它。",
        },
      },
      {
        title: { en: "📤 PNG & JSON Export", zh: "📤 PNG & JSON 导出" },
        description: {
          en: "Export drawings as PNG images or as JSON (bg + base64 image data) with load/restore capability.",
          zh: "将画作导出为 PNG 图片或 JSON（背景 + base64 图像数据），支持加载/恢复。",
        },
      },
      {
        title: { en: "📱 Mouse & Touch Support", zh: "📱 鼠标与触摸支持" },
        description: {
          en: "Unified pointer handling for mouse and touch events. Works on desktop, tablets, and mobile devices.",
          zh: "统一的指针事件处理，同时支持鼠标和触摸。适用于桌面、平板和移动设备。",
        },
      },
    ],
    buildSteps: {
      heading: { en: "Build Steps", zh: "构建步骤" },
      intro: {
        en: "This app demonstrates the vibe coding workflow for creative canvas applications:",
        zh: "这个应用展示了创意画布应用的 vibe coding 工作流程：",
      },
      steps: {
        en: [
          "Step 1: Set up canvas — Create a canvas element with fixed dimensions and get the 2D context",
          "Step 2: Build state store — Use signals to track current tool, color, size, and background",
          "Step 3: Implement tool handlers — Add pointer down/move/up listeners that dispatch based on active tool",
          "Step 4: Add shape preview — Use ImageData snapshots to preview shape on move without leaving trails",
          "Step 5: Build toolbar UI — Buttons and swatches that bind to signal state with active highlighting",
          "Step 6: Implement history & export — Undo/redo stacks, PNG toDataURL export, JSON serialize/load",
        ],
        zh: [
          "Step 1: 设置画布 - 创建固定尺寸的 canvas 元素，获取 2D context",
          "Step 2: 构建状态 store - 使用 signals 追踪当前工具、颜色、尺寸和背景",
          "Step 3: 实现工具处理 - 添加指针按下/移动/松开监听器，根据激活的工具分发",
          "Step 4: 添加图形预览 - 使用 ImageData 快照在移动时预览图形，不留痕迹",
          "Step 5: 构建工具栏 UI - 按钮和色块绑定到 signal 状态，带激活高亮",
          "Step 6: 实现历史与导出 - 撤销/重做栈、PNG toDataURL 导出、JSON 序列化/加载",
        ],
      },
    },
    keyFeatures: [
      {
        title: "🖌️ Multiple Drawing Tools",
        description: {
          en: "Pen, eraser, line, rectangle, and ellipse tools with live preview for shapes",
          zh: "画笔、橡皮、直线、矩形、椭圆工具，支持图形实时预览",
        },
      },
      {
        title: "🎨 Color Palette",
        description: {
          en: "Curated palette swatches plus a custom background color picker",
          zh: "精选调色板色块 + 自定义背景颜色选择器",
        },
      },
      {
        title: "📐 Adjustable Brush Size",
        description: {
          en: "Multiple brush sizes from thin to thick, previewed as chip size indicators",
          zh: "从细到粗的多个笔刷尺寸，以芯片尺寸指示预览",
        },
      },
      {
        title: "↩️ Undo & Redo",
        description: {
          en: "Full snapshot-based history with keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z)",
          zh: "基于完整快照的历史，支持键盘快捷键（Ctrl+Z / Ctrl+Shift+Z）",
        },
      },
      {
        title: "📥 PNG & JSON Export",
        description: {
          en: "Export to PNG image or save/load drawings as JSON with background data",
          zh: "导出为 PNG 图片，或将画作保存/加载为带背景数据的 JSON",
        },
      },
      {
        title: "📱 Touch & Mouse",
        description: {
          en: "Works seamlessly with mouse, touch, and stylus input across devices",
          zh: "无缝支持鼠标、触摸、触笔输入，跨设备使用",
        },
      },
    ],
  },
  {
    slug: "2048-game",
    title: "🎮 2048 Game",
    description: {
      en: "The classic 2048 puzzle game built with Rikka through vibe coding. Slide tiles, merge numbers, and reach the elusive 2048 tile!",
      zh: "经典的 2048 益智游戏，通过 Rikka 的 Vibe Coding 构建。滑动方块、合并数字，挑战神秘的 2048！",
    },
    tags: ["Game", "Animation", "Reactive State"],
    features: {
      en: ["Tile Merging", "Score Tracking", "Touch Support"],
      zh: ["方块合并", "分数追踪", "触摸支持"],
    },
    vibe: {
      heading: {
        en: "Vibe Coding with Rikka",
        zh: "使用 Rikka 进行 Vibe Coding",
      },
      intro: {
        en: "2048 Game demonstrates how to build reactive puzzle games through vibe coding. Here's how we built it:",
        zh: "2048 游戏展示了如何通过 vibe coding 构建响应式益智游戏。以下是构建过程：",
      },
      workflow: {
        title: {
          en: "The Vibe Coding Workflow",
          zh: "Vibe Coding 工作流程",
        },
        steps: [
          {
            title: { en: "1. Describe", zh: "1. 描述需求" },
            description: {
              en: "Start with a clear description of what you want to build",
              zh: "用清晰的语言描述你想要构建的内容",
            },
          },
          {
            title: { en: "2. Generate", zh: "2. 生成代码" },
            description: {
              en: "AI generates Rikka-based implementation from your description",
              zh: "AI 根据描述生成基于 Rikka 的实现代码",
            },
          },
          {
            title: { en: "3. Preview", zh: "3. 预览效果" },
            description: {
              en: "See results instantly in browser — no complex setup needed",
              zh: "立即在浏览器中预览效果，无需复杂配置",
            },
          },
          {
            title: { en: "4. Iterate", zh: "4. 迭代优化" },
            description: {
              en: "Refine by giving more specific prompts to improve the implementation",
              zh: "通过更具体的提示词来优化实现",
            },
          },
        ],
      },
      prompts: {
        title: {
          en: "Key Prompts Used",
          zh: "使用的关键提示词",
        },
        steps: [
          {
            title: {
              en: "🚀 Game Architecture",
              zh: "🚀 游戏架构",
            },
            prompt: {
              en: `"Create a 2048 game using Rikka Web Components.
The app needs:
- 4x4 grid with tiles that slide when arrow keys are pressed
- Tiles merge when they touch (same numbers)
- Score tracking with best score saved to localStorage
- Game over detection when no moves are possible
- Win detection when 2048 is reached
- Touch swipe support for mobile"`,
              zh: `"创建一个 2048 游戏，使用 Rikka Web Components。
应用需要：
- 4x4 网格，按下方向键时方块滑动
- 相同数字的方块相碰时合并
- 分数追踪，最佳分数保存到 localStorage
- 无法移动时游戏结束检测
- 达到 2048 时胜利检测
- 移动端触摸滑动支持"`,
            },
          },
          {
            title: {
              en: "🔧 Game Logic",
              zh: "🔧 游戏逻辑",
            },
            prompt: {
              en: `"Implement the core 2048 game logic:
- Create a grid signal as a 2D array of numbers/null
- Implement slideLeft/right/up/down functions
- When sliding, merge adjacent equal numbers
- Add random tiles after each move
- Track score increment on merge"`,
              zh: `"实现核心 2048 游戏逻辑：
- 创建 grid signal 作为数字/null 的二维数组
- 实现 slideLeft/right/up/down 函数
- 滑动时合并相邻的相同数字
- 每次移动后添加随机方块
- 合并时追踪分数增加"`,
            },
          },
          {
            title: {
              en: "🎨 UI Components",
              zh: "🎨 UI 组件",
            },
            prompt: {
              en: `"Create the game board and score display:
- Game board as a 4x4 grid with CSS grid
- Tile colors based on value (2=light, 2048=gold)
- Score board showing current and best score
- Game over overlay with try again button
- Win overlay with continue option"`,
              zh: `"创建游戏面板和分数显示：
- 游戏面板作为 4x4 CSS grid
- 方块颜色根据值变化（2=浅色，2048=金色）
- 分数板显示当前和最佳分数
- 游戏结束覆盖层，带重新开始按钮
- 胜利覆盖层，带继续选项"`,
            },
          },
          {
            title: {
              en: "⚡ Interactions",
              zh: "⚡ 交互功能",
            },
            prompt: {
              en: `"Add keyboard and touch controls:
- Arrow key handlers for desktop
- Touch swipe detection for mobile
- New game button
- Language switcher
- Use effect() to set up keyboard listeners and clean them up automatically"`,
              zh: `"添加键盘和触摸控制：
- 桌面端方向键处理
- 移动端触摸滑动检测
- 新游戏按钮
- 语言切换器
- 使用 effect() 设置键盘监听器并自动清理"`,
            },
          },
        ],
      },
    },
    coreFeatures: [
      {
        title: { en: "🎮 Reactive Game State", zh: "🎮 响应式游戏状态" },
        description: {
          en: "Signals manage the grid, score, and game status. When any state changes, the UI updates automatically without manual DOM manipulation.",
          zh: "Signals 管理网格、分数和游戏状态。任何状态变化时，UI 自动更新，无需手动操作 DOM。",
        },
      },
      {
        title: { en: "🔄 Computed Derived State", zh: "🔄 计算派生状态" },
        description: {
          en: "Computed signals track empty cells and game conditions. The game automatically detects when no moves are possible.",
          zh: "Computed signals 追踪空单元格和游戏条件。游戏自动检测何时无法移动。",
        },
      },
      {
        title: { en: "💾 Auto Persistence", zh: "💾 自动持久化" },
        description: {
          en: "Effects save score and best score to localStorage. The game remembers progress across browser sessions.",
          zh: "Effects 将分数和最佳分数保存到 localStorage。游戏在浏览器会话间记住进度。",
        },
      },
      {
        title: { en: "📱 Touch & Keyboard", zh: "📱 触摸与键盘" },
        description: {
          en: "Native keyboard events and touch swipe detection provide a seamless experience on all devices.",
          zh: "原生键盘事件和触摸滑动检测在所有设备上提供无缝体验。",
        },
      },
    ],
    buildSteps: {
      heading: { en: "Build Steps", zh: "构建步骤" },
      intro: {
        en: "This game demonstrates the vibe coding workflow for puzzle games:",
        zh: "这个游戏展示了益智游戏的 vibe coding 工作流程：",
      },
      steps: {
        en: [
          "Step 1: Design state model — Define grid, score, bestScore, gameOver signals",
          "Step 2: Implement game logic — slide functions, merge logic, random tile addition",
          "Step 3: Add computed state — track empty cells, check win/lose conditions",
          "Step 4: Build game board — CSS grid with reactive tile rendering",
          "Step 5: Add score display — reactive score cards with animations",
          "Step 6: Implement controls — keyboard events and touch swipe handlers",
          "Step 7: Add overlays — game over and win modals with continue/try again",
        ],
        zh: [
          "Step 1: 设计状态模型 - 定义 grid、score、bestScore、gameOver signals",
          "Step 2: 实现游戏逻辑 - 滑动函数、合并逻辑、随机方块添加",
          "Step 3: 添加计算状态 - 追踪空单元格、检查胜负条件",
          "Step 4: 构建游戏面板 - CSS grid 带响应式方块渲染",
          "Step 5: 添加分数显示 - 带动画的响应式分数卡片",
          "Step 6: 实现控制 - 键盘事件和触摸滑动处理",
          "Step 7: 添加覆盖层 - 游戏结束和胜利模态框，带继续/重试",
        ],
      },
    },
    keyFeatures: [
      {
        title: "🎯 Classic 2048 Gameplay",
        description: {
          en: "Slide tiles with arrow keys or swipe, merge matching numbers to reach 2048",
          zh: "使用方向键或滑动移动方块，合并相同数字以达到 2048",
        },
      },
      {
        title: "📊 Score Tracking",
        description: {
          en: "Real-time score updates with best score persistence across sessions",
          zh: "实时分数更新，最佳分数跨会话持久化",
        },
      },
      {
        title: "🎉 Win/Lose Detection",
        description: {
          en: "Automatic detection of win (2048 tile) and game over (no moves)",
          zh: "自动检测胜利（达到 2048）和游戏结束（无法移动）",
        },
      },
      {
        title: "📱 Touch Friendly",
        description: {
          en: "Full touch swipe support for mobile devices",
          zh: "完整的触摸滑动支持，适配移动设备",
        },
      },
      {
        title: "🌍 Multi-language",
        description: {
          en: "English and Chinese language support",
          zh: "支持英语和中文",
        },
      },
    ],
  },
  {
    slug: "snake-game",
    title: "🐍 Snake Game",
    description: {
      en: "The classic Snake game built with Rikka through vibe coding. Control the snake, eat food to grow, and avoid walls and yourself!",
      zh: "经典的贪吃蛇游戏，通过 Rikka 的 Vibe Coding 构建。控制蛇、吃食物成长、避开墙壁和自己！",
    },
    tags: ["Game", "Animation", "Timer"],
    features: {
      en: ["Snake Movement", "Growth Mechanics", "Pause Support"],
      zh: ["蛇移动", "成长机制", "暂停支持"],
    },
    vibe: {
      heading: {
        en: "Vibe Coding with Rikka",
        zh: "使用 Rikka 进行 Vibe Coding",
      },
      intro: {
        en: "Snake Game demonstrates how to build real-time games with Rikka signals. Here's how we built it:",
        zh: "贪吃蛇游戏展示了如何用 Rikka signals 构建实时游戏。以下是构建过程：",
      },
      workflow: {
        title: {
          en: "The Vibe Coding Workflow",
          zh: "Vibe Coding 工作流程",
        },
        steps: [
          {
            title: { en: "1. Describe", zh: "1. 描述需求" },
            description: {
              en: "Start with a clear description of what you want to build",
              zh: "用清晰的语言描述你想要构建的内容",
            },
          },
          {
            title: { en: "2. Generate", zh: "2. 生成代码" },
            description: {
              en: "AI generates Rikka-based implementation from your description",
              zh: "AI 根据描述生成基于 Rikka 的实现代码",
            },
          },
          {
            title: { en: "3. Preview", zh: "3. 预览效果" },
            description: {
              en: "See results instantly in browser — no complex setup needed",
              zh: "立即在浏览器中预览效果，无需复杂配置",
            },
          },
          {
            title: { en: "4. Iterate", zh: "4. 迭代优化" },
            description: {
              en: "Refine by giving more specific prompts to improve the implementation",
              zh: "通过更具体的提示词来优化实现",
            },
          },
        ],
      },
      prompts: {
        title: {
          en: "Key Prompts Used",
          zh: "使用的关键提示词",
        },
        steps: [
          {
            title: {
              en: "🚀 Game Architecture",
              zh: "🚀 游戏架构",
            },
            prompt: {
              en: `"Create a Snake game using Rikka Web Components.
The game needs:
- Snake that moves continuously in a direction
- Food that randomly appears on the grid
- Score that increases when food is eaten
- Game over when snake hits wall or itself
- Pause/resume functionality
- Use signals for state and effects for the game loop"`,
              zh: `"创建一个贪吃蛇游戏，使用 Rikka Web Components。
游戏需要：
- 蛇持续向一个方向移动
- 食物随机出现在网格上
- 吃到食物时分数增加
- 蛇撞到墙壁或自己时游戏结束
- 暂停/继续功能
- 使用 signals 管理状态，effects 处理游戏循环"`,
            },
          },
          {
            title: {
              en: "🔧 Snake Logic",
              zh: "🔧 蛇逻辑",
            },
            prompt: {
              en: `"Implement snake movement logic:
- Snake as array of points (head + body segments)
- Direction signal that determines movement
- Collision detection with walls and self
- Food spawning in random empty positions
- Snake growth when food is eaten
- Use effect() to run the game loop with setInterval"`,
              zh: `"实现蛇移动逻辑：
- 蛇作为点数组（头部 + 身体段）
- 决定移动方向的 signal
- 墙壁和自身碰撞检测
- 食物在随机空位生成
- 吃到食物时蛇成长
- 使用 effect() 通过 setInterval 运行游戏循环"`,
            },
          },
          {
            title: {
              en: "🎨 Visual Design",
              zh: "🎨 视觉设计",
            },
            prompt: {
              en: `"Create the game visuals:
- Dark theme with glowing snake segments
- Animated food with pulsing effect
- Score display with current and best score
- Pause overlay with resume option
- Use CSS grid for the board"`,
              zh: `"创建游戏视觉效果：
- 深色主题，蛇身带发光效果
- 带脉冲动画的食物
- 显示当前和最佳分数
- 带继续选项的暂停覆盖层
- 使用 CSS grid 创建面板"`,
            },
          },
          {
            title: {
              en: "⚡ Controls",
              zh: "⚡ 控制",
            },
            prompt: {
              en: `"Add game controls:
- Arrow keys and WASD for direction control
- Spacebar for pause/resume
- Touch swipe support for mobile
- New game button
- Debounce direction changes to prevent 180-degree turns"`,
              zh: `"添加游戏控制：
- 方向键和 WASD 控制方向
- 空格键暂停/继续
- 移动端触摸滑动支持
- 新游戏按钮
- 对方向变化进行防抖处理，防止 180 度转向"`,
            },
          },
        ],
      },
    },
    coreFeatures: [
      {
        title: { en: "🐍 Reactive Snake State", zh: "🐍 响应式蛇状态" },
        description: {
          en: "The snake's position is stored as a signal array. When it changes, the board re-renders automatically through Rikka's reactive system.",
          zh: "蛇的位置存储为 signal 数组。变化时，面板通过 Rikka 的响应式系统自动重新渲染。",
        },
      },
      {
        title: { en: "⏱️ Effect-based Game Loop", zh: "⏱️ 基于 Effect 的游戏循环" },
        description: {
          en: "The game loop runs inside an effect, which automatically starts, pauses, and stops based on game state signals.",
          zh: "游戏循环在 effect 中运行，根据游戏状态 signals 自动启动、暂停和停止。",
        },
      },
      {
        title: { en: "💾 Score Persistence", zh: "💾 分数持久化" },
        description: {
          en: "Effects save scores to localStorage. Best score persists across browser sessions.",
          zh: "Effects 将分数保存到 localStorage。最佳分数跨浏览器会话持久化。",
        },
      },
      {
        title: { en: "🎮 Multi-input Support", zh: "🎮 多输入支持" },
        description: {
          en: "Keyboard, WASD, touch swipe, and button controls all work seamlessly together.",
          zh: "键盘、WASD、触摸滑动和按钮控制无缝配合。",
        },
      },
    ],
    buildSteps: {
      heading: { en: "Build Steps", zh: "构建步骤" },
      intro: {
        en: "This game demonstrates the vibe coding workflow for real-time games:",
        zh: "这个游戏展示了实时游戏的 vibe coding 工作流程：",
      },
      steps: {
        en: [
          "Step 1: Define state — snake array, food position, direction, score signals",
          "Step 2: Implement movement — update snake position at regular intervals",
          "Step 3: Add collision detection — wall boundaries and self-collision",
          "Step 4: Implement food mechanics — spawn random positions, grow snake on eat",
          "Step 5: Build game board — CSS grid with snake/food rendering",
          "Step 6: Add controls — keyboard, WASD, touch swipe handlers",
          "Step 7: Add pause/resume — control game loop with signals",
          "Step 8: Style and polish — animations, glow effects, responsive design",
        ],
        zh: [
          "Step 1: 定义状态 - snake 数组、食物位置、方向、分数 signals",
          "Step 2: 实现移动 - 定期更新蛇位置",
          "Step 3: 添加碰撞检测 - 墙壁边界和自身碰撞",
          "Step 4: 实现食物机制 - 随机生成位置，吃到时蛇成长",
          "Step 5: 构建游戏面板 - CSS grid 带蛇/食物渲染",
          "Step 6: 添加控制 - 键盘、WASD、触摸滑动处理",
          "Step 7: 添加暂停/继续 - 用 signals 控制游戏循环",
          "Step 8: 样式和完善 - 动画、发光效果、响应式设计",
        ],
      },
    },
    keyFeatures: [
      {
        title: "🐍 Classic Snake Gameplay",
        description: {
          en: "Control the snake with arrow keys or swipe, eat food to grow, avoid walls and yourself",
          zh: "使用方向键或滑动控制蛇，吃食物成长，避开墙壁和自己",
        },
      },
      {
        title: "⏸️ Pause/Resume",
        description: {
          en: "Pause the game with spacebar and resume whenever you want",
          zh: "按空格键暂停游戏，随时恢复",
        },
      },
      {
        title: "📊 Score Tracking",
        description: {
          en: "Real-time score with best score persistence",
          zh: "实时分数，最佳分数持久化",
        },
      },
      {
        title: "🎨 Visual Effects",
        description: {
          en: "Glowing snake segments, pulsing food, dark theme with gradient",
          zh: "发光的蛇身、脉冲食物、深色渐变主题",
        },
      },
      {
        title: "📱 Mobile Friendly",
        description: {
          en: "Full touch swipe support for mobile devices",
          zh: "完整的触摸滑动支持，适配移动设备",
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
