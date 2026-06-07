import { defineElement } from "@takanashi/rikka-elements";
import { div, h1, h2, h3, p, a, pre, code, ul, li, h } from "@takanashi/rikka-dom";
import { showcasePageStyles } from "../../shared/page-styles";

const FinanceTracker = defineElement("rikka-example-finance-tracker", {
  styles: showcasePageStyles,
  render() {
    return div(
      { class: "example-page" },
      h1({}, "💰 Finance Tracker"),
      p({}, "A comprehensive personal finance application built with Rikka through vibe coding. Track income and expenses, get real-time analytics, and visualize your spending with beautiful charts."),
      
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
          div({}, "💰 Live Demo"),
          a({
            href: "./examples/finance-tracker/index.html",
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
            src: "./examples/finance-tracker/index.html",
            style: `
              width: 100%;
              height: 100%;
              border: none;
            `,
            title: "Finance Tracker Demo",
          }),
        ),
      ),
      
      div({ class: "showcase-hero" },
        h2({}, "Vibe Coding 构建指南"),
        p({}, "Finance Tracker 展示了如何通过 vibe coding 构建数据可视化应用。以下是我们使用的核心提示词："),
        div({ class: "vibe-prompts" },
          h3({}, "🚀 第一步：设计财务数据模型"),
          pre({}, code({}, `
# 你可以这样开始：

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
4. 实现图表可视化
`.trim())),
          h3({}, "🔧 第二步：实现统计计算"),
          pre({}, code({}, `
# 告诉 AI 如何实现财务统计：

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
- 无需手动更新统计
`.trim())),
          h3({}, "🎨 第三步：构建数据可视化"),
          pre({}, code({}, `
# 让 AI 创建图表组件：

"创建 CategoryChart 组件：
- 使用 CSS 实现柱状图
- 每列高度根据 categoryBreakdown 动态计算
- 使用 computed 直接绑定样式到数据
- 添加过渡动画"

# 纯 CSS 可视化：
- 无需 Chart.js 等库
- 使用 computed 计算高度百分比
- 自动响应数据变化
- 轻量且高性能
`.trim())),
          h3({}, "📅 第四步：添加日期筛选"),
          pre({}, code({}, `
# 让 AI 实现日期筛选功能：

"添加日期筛选：
- 定义 dateFilter 信号：'all' | 'month' | 'lastMonth' | 'custom'
- 定义 customDateRange 信号存储自定义范围
- 在 filteredTransactions computed 中实现过滤逻辑"

# Rikka 实现：
- computed 自动根据日期过滤交易
- UI 更新完全响应式
- 筛选器切换即时生效
`.trim()))
        ),
        h2({}, "使用的 Rikka 核心功能"),
        div({ class: "feature-grid" },
          div({ class: "feature-card" },
            h3({}, "📊 复杂统计计算"),
            p({}, "使用多个 computed 函数计算不同的统计指标：收支总额、分类统计、时间范围过滤。每个 computed 独立且自动追踪依赖。")
          ),
          div({ class: "feature-card" },
            h3({}, "📈 动态可视化"),
            p({}, "使用 computed 绑定样式到 DOM 属性，实现动态图表。数据变化时图表自动更新，无需手动重绘。")
          ),
          div({ class: "feature-card" },
            h3({}, "🏷️ 类别系统"),
            p({}, "使用信号存储类别配置（颜色、图标、名称），交易记录只存储类别 ID。修改类别配置自动影响所有相关显示。")
          ),
          div({ class: "feature-card" },
            h3({}, "📅 日期范围计算"),
            p({}, "使用 computed 和 Date 对象实现灵活的日期过滤。自动处理月份边界、时区等复杂情况。")
          ),
          div({ class: "feature-card" },
            h3({}, "💾 批量数据持久化"),
            p({}, "使用 effect 同时持久化 transactions 和 categories 到 localStorage，确保数据一致性。")
          ),
          div({ class: "feature-card" },
            h3({}, "🎯 表单与数据绑定"),
            p({}, "交易表单直接绑定到 signals，提交时更新 transactions 数组。所有相关统计和图表自动更新。")
          )
        ),
        h2({}, "Vibe Coding 工作流程"),
        p({}, "数据可视化应用的分步构建策略："),
        div({ class: "workflow-steps" },
          div({ class: "step" },
            h4({}, "1. 从基础列表开始"),
            p({}, "先实现交易列表，如 \"创建一个交易列表，显示每条交易的金额、类别和日期\"")
          ),
          div({ class: "step" },
            h4({}, "2. 添加表单和统计"),
            p({}, "添加交易表单和统计卡片，如 \"添加一个表单来添加交易，以及显示总收入和支出的卡片\"")
          ),
          div({ class: "step" },
            h4({}, "3. 实现可视化"),
            p({}, "添加图表，如 \"用 CSS 创建一个柱状图，显示每个类别的支出占比\"")
          ),
          div({ class: "step" },
            h4({}, "4. 添加筛选功能"),
            p({}, "完善筛选，如 \"添加本月、上月、全部时间的筛选按钮\"")
          )
        ),
        h2({}, "构建步骤"),
        p({}, "这个应用展示了数据可视化应用的 vibe coding 工作流程："),
        ul({},
          li({}, "Step 1: 设计数据模型 - 定义 Transaction 和 Category 接口，创建默认类别配置"),
          li({}, "Step 2: 实现统计计算 - 使用多个 computed 计算收支总额、分类统计、过滤结果"),
          li({}, "Step 3: 构建交易管理 - 创建交易表单和列表组件，支持增删改操作"),
          li({}, "Step 4: 实现图表可视化 - 使用 CSS 和 computed 绑定创建动态柱状图"),
          li({}, "Step 5: 添加日期筛选 - 实现灵活的日期范围过滤功能"),
          li({}, "Step 6: 数据持久化 - 使用 effect 自动保存所有数据到 localStorage")
        )
      ),
      
      h2({}, "Project Structure"),
      div({ class: "arch-section" },
        pre({}, code({}, `
finance-tracker/
├── index.html              # Entry HTML
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Vite bundler config
└── src/
    ├── index.ts            # App bootstrap
    ├── finance-store.ts    # Reactive state store
    ├── styles/
    │   └── finance.css     # Chart & theme styles
    └── components/
        ├── app.ts          # Root component
        ├── stats-panel.ts  # Summary statistics
        ├── transaction-form.ts # Add/edit form
        ├── transaction-list.ts # Transaction table
        ├── category-chart.ts # Category breakdown chart
        └── time-chart.ts   # Timeline visualization
`.trim()))
      ),
      
      h2({}, "Key Features"),
      div({ class: "feature-grid" },
        div({ class: "feature-card" },
          h3({}, "📝 Transaction Management"),
          p({}, "Full CRUD operations: add, edit, delete income and expense entries with categories")
        ),
        div({ class: "feature-card" },
          h3({}, "📊 Real-time Analytics"),
          p({}, "Live computed statistics: net balance, income vs expense totals, average per category")
        ),
        div({ class: "feature-card" },
          h3({}, "📈 Category Charts"),
          p({}, "CSS-only visualization with dynamic bar heights that react instantly to data changes")
        ),
        div({ class: "feature-card" },
          h3({}, "📅 Date Filtering"),
          p({}, "Filter transactions by date range: this month, last month, custom range, or all time")
        ),
        div({ class: "feature-card" },
          h3({}, "🏷️ Category System"),
          p({}, "Customizable categories with icons and color coding for quick visual identification")
        ),
        div({ class: "feature-card" },
          h3({}, "💾 Auto Persistence"),
          p({}, "All data automatically saved to localStorage with no manual export required")
        )
      ),
      
      div({ class: "explanation" },
        h2({}, "Finance Store Architecture"),
        p({}, "The reactive store manages transactions and computes sophisticated analytics:"),
        div({ class: "arch-section" },
          pre({}, code({}, `
// src/finance-store.ts
import { signal, computed, effect } from '@takanashi/rikka-signal';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: number; // timestamp
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}

// Default categories
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food & Dining', type: 'expense', color: '#ef4444', icon: '🍔' },
  { id: 'transport', name: 'Transportation', type: 'expense', color: '#f59e0b', icon: '🚗' },
  { id: 'housing', name: 'Housing', type: 'expense', color: '#8b5cf6', icon: '🏠' },
  { id: 'salary', name: 'Salary', type: 'income', color: '#10b981', icon: '💰' },
  { id: 'investment', name: 'Investments', type: 'income', color: '#3b82f6', icon: '📈' },
];

// Reactive state
export const transactions = signal<Transaction[]>([]);
export const categories = signal<Category[]>(DEFAULT_CATEGORIES);
export const dateFilter = signal<'all' | 'month' | 'lastMonth' | 'custom'>('month');
export const customDateRange = signal<{ start: number; end: number } | null>(null);

// Computed: filtered transactions based on date
export const filteredTransactions = computed(() => {
  let result = [...transactions()];
  const now = Date.now();
  
  switch (dateFilter()) {
    case 'month':
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      result = result.filter(t => t.date >= monthStart.getTime());
      break;
    case 'lastMonth':
      const lastMonthStart = new Date();
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
      lastMonthStart.setDate(1);
      lastMonthStart.setHours(0, 0, 0, 0);
      const lastMonthEnd = new Date();
      lastMonthEnd.setDate(0);
      lastMonthEnd.setHours(23, 59, 59, 999);
      result = result.filter(
        t => t.date >= lastMonthStart.getTime() && t.date <= lastMonthEnd.getTime()
      );
      break;
    case 'custom':
      const range = customDateRange();
      if (range) {
        result = result.filter(
          t => t.date >= range.start && t.date <= range.end
        );
      }
      break;
  }
  
  return result.sort((a, b) => b.date - a.date);
});

// Computed: financial statistics
export const stats = computed(() => {
  const tx = filteredTransactions();
  
  const income = tx
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expense = tx
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  return {
    income,
    expense,
    net: income - expense,
    transactionCount: tx.length,
    averageTransaction: tx.length > 0 ? (income + expense) / tx.length : 0,
  };
});

// Computed: category breakdown
export const categoryBreakdown = computed(() => {
  const tx = filteredTransactions();
  const breakdown = new Map<string, { total: number; count: number; type: TransactionType }>();
  
  tx.forEach(t => {
    const existing = breakdown.get(t.category) || { total: 0, count: 0, type: t.type };
    breakdown.set(t.category, {
      ...existing,
      total: existing.total + t.amount,
      count: existing.count + 1,
    });
  });
  
  const maxTotal = Math.max(...Array.from(breakdown.values()).map(v => v.total), 1);
  
  return Array.from(breakdown.entries())
    .map(([categoryId, data]) => {
      const category = categories().find(c => c.id === categoryId);
      return {
        categoryId,
        categoryName: category?.name || categoryId,
        color: category?.color || '#6b7280',
        icon: category?.icon || '📦',
        ...data,
        percentage: (data.total / (data.type === 'income' ? stats().income : stats().expense)) * 100,
        relativeHeight: (data.total / maxTotal) * 100,
      };
    })
    .sort((a, b) => b.total - a.total);
});

// Computed: daily timeline
export const dailyTimeline = computed(() => {
  const tx = filteredTransactions();
  const daily = new Map<string, { income: number; expense: number; date: Date }>();
  
  tx.forEach(t => {
    const date = new Date(t.date);
    const key = date.toISOString().split('T')[0];
    const existing = daily.get(key) || { income: 0, expense: 0, date };
    if (t.type === 'income') {
      existing.income += t.amount;
    } else {
      existing.expense += t.amount;
    }
    daily.set(key, existing);
  });
  
  return Array.from(daily.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime());
});

// Actions
export function addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>) {
  const newTx: Transaction = {
    ...tx,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  transactions.set(t => [...t, newTx]);
}

export function updateTransaction(id: string, updates: Partial<Transaction>) {
  transactions.set(t => t.map(tx =>
    tx.id === id ? { ...tx, ...updates } : tx
  ));
}

export function deleteTransaction(id: string) {
  transactions.set(t => t.filter(tx => tx.id !== id));
}

export function addCategory(category: Omit<Category, 'id'>) {
  categories.set(c => [...c, { ...category, id: crypto.randomUUID() }]);
}

// Persistence effect
effect(() => {
  localStorage.setItem('finance:transactions', JSON.stringify(transactions()));
  localStorage.setItem('finance:categories', JSON.stringify(categories()));
});

// Initialize from storage
if (typeof window !== 'undefined') {
  const savedTx = localStorage.getItem('finance:transactions');
  const savedCats = localStorage.getItem('finance:categories');
  if (savedTx) transactions.set(JSON.parse(savedTx));
  if (savedCats) categories.set(JSON.parse(savedCats));
}
`.trim()))
        )
      ),
      
      div({ class: "explanation" },
        h2({}, "CSS Chart Implementation"),
        p({}, "The category chart demonstrates reactive CSS with computed values:"),
        div({ class: "arch-section" },
          pre({}, code({}, `
// src/components/category-chart.ts
import { defineElement, css } from '@takanashi/rikka-elements';
import { div, span } from '@takanashi/rikka-dom';
import { categoryBreakdown, stats } from '../finance-store';

const chartStyles = css\`
  .category-chart {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    background: var(--color-surface);
    border-radius: var(--radius-lg);
  }
  
  .chart-bar {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  
  .bar-container {
    height: 200px;
    width: 100%;
    display: flex;
    align-items: flex-end;
    background: var(--color-surface-hover);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }
  
  .bar {
    width: 100%;
    transition: height 0.3s ease, background-color 0.2s ease;
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  }
  
  .bar-label {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    text-align: center;
  }
  
  .bar-value {
    font-weight: 600;
    color: var(--color-text-primary);
  }
\`;

export const CategoryChart = defineElement('finance-category-chart', {
  styles: chartStyles,
  render() {
    const breakdown = categoryBreakdown();
    const { income, expense } = stats();
    
    return div({ class: 'category-chart' },
      ...breakdown.map(item =>
        div({ class: 'chart-bar', key: item.categoryId },
          div({ class: 'bar-container' },
            div({
              class: 'bar',
              style: \`
                height: \${item.relativeHeight}%;
                background-color: \${item.color};
              \`
            })
          ),
          span({ class: 'bar-value' },
            \`\${item.type === 'expense' ? '-' : '+'}\$\${item.amount.toFixed(2)}\`
          ),
          span({ class: 'bar-label' }, \`\${item.icon} \${item.categoryName}\`)
        )
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
        a({ href: "#/examples/pomodoro-timer", class: "next-link" }, "Pomodoro Timer →")
      )
    );
  }
});

export { FinanceTracker as ExampleFinanceTracker };
