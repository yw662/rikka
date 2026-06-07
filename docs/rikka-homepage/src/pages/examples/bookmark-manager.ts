import { defineElement } from "@takanashi/rikka-elements";
import { div, h1, h2, h3, p, a, pre, code, ul, li, h } from "@takanashi/rikka-dom";
import { showcasePageStyles } from "../../shared/page-styles";

const BookmarkManager = defineElement("rikka-example-bookmark-manager", {
  styles: showcasePageStyles,
  render() {
    return div(
      { class: "example-page" },
      h1({}, "📌 Bookmark Manager"),
      p({}, "A beautiful read-it-later application built with Rikka through vibe coding. Save links, organize with tags, and search instantly across your collection."),
      
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
          div({}, "📌 Live Demo"),
          a({
            href: "./examples/bookmark-manager/index.html",
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
            src: "./examples/bookmark-manager/index.html",
            style: `
              width: 100%;
              height: 100%;
              border: none;
            `,
            title: "Bookmark Manager Demo",
          }),
        ),
      ),
      
      div({ class: "showcase-hero" },
        h2({}, "Vibe Coding 构建指南"),
        p({}, "Bookmark Manager 展示了如何通过 vibe coding 构建数据驱动的应用。以下是我们使用的核心提示词："),
        div({ class: "vibe-prompts" },
          h3({}, "🚀 第一步：设计数据模型"),
          pre({}, code({}, `
# 你可以这样开始：

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
4. 构建搜索和筛选逻辑
`.trim())),
          h3({}, "🔧 第二步：实现数据管理"),
          pre({}, code({}, `
# 告诉 AI 如何处理数据状态：

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
- 自动更新的过滤逻辑
`.trim())),
          h3({}, "🎨 第三步：构建搜索组件"),
          pre({}, code({}, `
# 让 AI 创建搜索和过滤组件：

"创建 SearchBar 和 TagFilter 组件：
- 搜索框组件：实时搜索，支持防抖
- 标签筛选组件：显示所有标签，支持多选
- 书签列表组件：显示过滤后的书签卡片
- 每个组件使用 @takanashi/rikka-dom 的元素"

# Rikka 的优势：
- computed 自动追踪依赖
- 当 bookmarks 变化时，所有相关 computed 自动更新
- 无需手动刷新列表
`.trim())),
          h3({}, "✨ 第四步：添加交互功能"),
          pre({}, code({}, `
# 让 AI 添加编辑和删除功能：

"添加交互功能：
- 点击书签卡片显示详情
- 编辑按钮打开编辑表单
- 删除按钮确认后删除
- 拖拽排序功能
- 键盘快捷键支持"

# 使用 Rikka 实现：
- onClick 等事件处理
- 响应式状态更新
- 自动 UI 刷新
`.trim()))
        ),
        h2({}, "使用的 Rikka 核心功能"),
        div({ class: "feature-grid" },
          div({ class: "feature-card" },
            h3({}, "📊 复杂数据结构"),
            p({}, "使用 signal<Bookmark[]> 存储复杂对象数组。Rikka 的响应式系统会追踪整个数组的引用变化。")
          ),
          div({ class: "feature-card" },
            h3({}, "🔍 实时计算过滤"),
            p({}, "使用 computed 创建 filteredBookmarks，自动追踪 bookmarks、searchQuery 和 selectedTags 依赖。任何相关状态变化都会触发过滤重算。")
          ),
          div({ class: "feature-card" },
            h3({}, "🏷️ 动态标签系统"),
            p({}, "使用 computed 从书签列表中提取所有标签，创建一个 Set 并转换为排序数组。新的书签添加时自动更新标签列表。")
          ),
          div({ class: "feature-card" },
            h3({}, "💾 自动持久化"),
            p({}, "使用 effect 监听 bookmarks 变化，自动保存到 localStorage。应用启动时从 localStorage 恢复数据。")
          ),
          div({ class: "feature-card" },
            h3({}, "🎯 事件处理"),
            p({}, "Rikka 的 DOM 元素支持 onClick、onInput 等事件处理，自动绑定事件监听器并处理事件对象。")
          ),
          div({ class: "feature-card" },
            h3({}, "🔄 批量操作"),
            p({}, "使用 signal.set() 方法可以传入函数，基于当前状态计算新值，确保状态更新的原子性。")
          )
        ),
        h2({}, "Vibe Coding 工作流程"),
        p({}, "通过渐进式的自然语言提示，逐步构建复杂功能："),
        div({ class: "workflow-steps" },
          div({ class: "step" },
            h4({}, "1. 核心功能优先"),
            p({}, "先实现基础的添加和列表显示功能，如 \"显示一个添加书签的表单和书签列表\"")
          ),
          div({ class: "step" },
            h4({}, "2. 添加状态管理"),
            p({}, "用提示词添加响应式状态，如 \"将书签存储到信号中，添加到列表\"")
          ),
          div({ class: "step" },
            h4({}, "3. 实现搜索功能"),
            p({}, "逐步添加搜索，如 \"添加一个搜索框，实时过滤书签\"")
          ),
          div({ class: "step" },
            h4({}, "4. 添加高级功能"),
            p({}, "添加标签和排序，如 \"为每个书签添加标签支持，添加按标签筛选\"")
          )
        ),
        h2({}, "构建步骤"),
        p({}, "这个应用展示了数据驱动应用的 vibe coding 工作流程："),
        ul({},
          li({}, "Step 1: 设计数据模型 - 定义 Bookmark 接口和 TypeScript 类型"),
          li({}, "Step 2: 实现状态管理 - 使用 signals 存储书签和筛选状态"),
          li({}, "Step 3: 创建计算属性 - 使用 computed 自动计算过滤结果和标签云"),
          li({}, "Step 4: 构建 UI 组件 - 创建搜索框、标签筛选、书签卡片等组件"),
          li({}, "Step 5: 添加交互逻辑 - 实现添加、编辑、删除、排序等功能"),
          li({}, "Step 6: 数据持久化 - 使用 effects 自动保存和恢复数据")
        )
      ),
      
      h2({}, "Project Structure"),
      div({ class: "arch-section" },
        pre({}, code({}, `
bookmark-manager/
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
        ├── search-bar.ts   # Search input component
        ├── tag-filter.ts   # Tag filter selector
        ├── bookmark-form.ts # Add/edit form
        ├── bookmark-list.ts # List display
        └── bookmark-item.ts # Individual card
`.trim()))
      ),
      
      h2({}, "Key Features"),
      div({ class: "feature-grid" },
        div({ class: "feature-card" },
          h3({}, "🔍 Live Search"),
          p({}, "Instantly search bookmarks by title, URL, description, and tags with fuzzy matching")
        ),
        div({ class: "feature-card" },
          h3({}, "🏷️ Smart Tag System"),
          p({}, "Organize with tags, auto-complete suggestions, and multi-select filter")
        ),
        div({ class: "feature-card" },
          h3({}, "💾 Automatic Persistence"),
          p({}, "Everything saved to localStorage automatically, no manual save required")
        ),
        div({ class: "feature-card" },
          h3({}, "🎨 Beautiful Cards"),
          p({}, "Rich bookmark cards with favicons, descriptions, and tag badges")
        ),
        div({ class: "feature-card" },
          h3({}, "📋 Bulk Operations"),
          p({}, "Select multiple bookmarks for bulk tag, delete, or export operations")
        ),
        div({ class: "feature-card" },
          h3({}, "📤 Import/Export"),
          p({}, "JSON-based import and export for easy backup and sharing")
        )
      ),
      
      div({ class: "explanation" },
        h2({}, "Reactive State Architecture"),
        p({}, "The store manages bookmarks, filters, and computed derived state:"),
        div({ class: "arch-section" },
          pre({}, code({}, `
// src/store.ts
import { signal, computed, effect } from '@takanashi/rikka-signal';

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  description?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  favorite: boolean;
}

// Reactive state
export const bookmarks = signal<Bookmark[]>([]);
export const searchQuery = signal('');
export const selectedTags = signal<string[]>([]);
export const sortBy = signal<'date' | 'title'>('date');

// Computed: all unique tags from bookmarks
export const allTags = computed(() => {
  const tagSet = new Set<string>();
  bookmarks().forEach(b => b.tags.forEach(t => tagSet.add(t)));
  return Array.from(tagSet).sort();
});

// Computed: filtered and sorted bookmarks
export const filteredBookmarks = computed(() => {
  let result = [...bookmarks()];
  
  // Search filter
  const query = searchQuery().toLowerCase();
  if (query) {
    result = result.filter(b =>
      b.title.toLowerCase().includes(query) ||
      b.url.toLowerCase().includes(query) ||
      b.description?.toLowerCase().includes(query) ||
      b.tags.some(t => t.toLowerCase().includes(query))
    );
  }
  
  // Tag filter
  if (selectedTags().length > 0) {
    result = result.filter(b =>
      selectedTags().some(tag => b.tags.includes(tag))
    );
  }
  
  // Sort
  result.sort((a, b) => {
    if (sortBy() === 'date') {
      return b.createdAt - a.createdAt;
    } else {
      return a.title.localeCompare(b.title);
    }
  });
  
  return result;
});

// Actions
export function addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) {
  const newBookmark: Bookmark = {
    ...bookmark,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  bookmarks.set(b => [...b, newBookmark]);
}

export function updateBookmark(id: string, updates: Partial<Bookmark>) {
  bookmarks.set(b => b.map(bookmark =>
    bookmark.id === id
      ? { ...bookmark, ...updates, updatedAt: Date.now() }
      : bookmark
  ));
}

export function deleteBookmark(id: string) {
  bookmarks.set(b => b.filter(bookmark => bookmark.id !== id));
}

export function toggleFavorite(id: string) {
  const bookmark = bookmarks().find(b => b.id === id);
  if (bookmark) {
    updateBookmark(id, { favorite: !bookmark.favorite });
  }
}

export function toggleTag(tag: string) {
  selectedTags.set(tags =>
    tags.includes(tag)
      ? tags.filter(t => t !== tag)
      : [...tags, tag]
  );
}

// Persistence effect
effect(() => {
  localStorage.setItem('bookmarks:data', JSON.stringify(bookmarks()));
});

// Initialize from storage
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('bookmarks:data');
  if (saved) {
    try {
      bookmarks.set(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load bookmarks:', e);
    }
  }
}
`.trim()))
        )
      ),
      
      div({ class: "explanation" },
        h2({}, "Search Component Implementation"),
        p({}, "The search bar demonstrates debounced input and reactive filtering:"),
        div({ class: "arch-section" },
          pre({}, code({}, `
// src/components/search-bar.ts
import { defineElement } from '@takanashi/rikka-elements';
import { input, div, span } from '@takanashi/rikka-dom';
import { searchQuery, filteredBookmarks } from '../store';

export const SearchBar = defineElement('bookmark-search-bar', {
  render() {
    let debounceTimer: number | null = null;
    
    const handleInput = (e: Event) => {
      const value = (e.target as HTMLInputElement).value;
      
      // Debounce search input
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        searchQuery.set(value);
      }, 150);
    };
    
    return div({ class: 'search-bar' },
      input({
        type: 'text',
        placeholder: 'Search bookmarks...',
        value: searchQuery,
        onInput: handleInput,
        class: 'search-input'
      }),
      span({ class: 'search-count' },
        computed(() => \`\${filteredBookmarks().length} results\`)
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
        a({ href: "#/examples/code-editor", class: "next-link" }, "Code Editor →")
      )
    );
  }
});

export { BookmarkManager as ExampleBookmarkManager };
