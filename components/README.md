# Rikka Components

> `components/` 目录下的包是基于 `utils/` 层原语构建的可复用 Web Components 和工具。

## 定位

```
utils/rikka-signal      响应式原语（signal, computed, effect）
utils/rikka-dom         DOM 创建（h, tag helpers, For, Show, css）
utils/rikka-elements    Custom Element 定义（defineElement）
        ↓
components/*            基于 utils 层构建的可复用组件和工具
        ↓
examples/*              具体应用
docs/rikka-homepage     文档站
```

`components/` 与 `utils/` 的区别：

| <br />   | `utils/`          | `components/`                |
| -------- | ----------------- | ---------------------------- |
| 性质     | 原语 / 工具       | 基于原语构建的成品           |
| 依赖     | 不依赖 components | 依赖 utils                   |
| 可替代性 | 不可替代          | 可被用户自行实现替代         |
| 目标用户 | 所有 rikka 用户   | 需要"开箱即用"复杂交互的用户 |

## 什么应该放在 components/

**准入标准**：满足以下任一条件，且同时满足通用性要求：

1. **陷阱密集** —— LLM 自行实现时容易出错，存在非显而易见的陷阱（如 Combobox 的 `aria-activedescendant` 焦点管理、IME 输入法期间误触 Enter、Dropdown Menu 的点击冒泡导致刚打开就关闭）
2. **逻辑复杂但通用** —— 逻辑足够复杂，即使 LLM 能写对，每次重复实现也是浪费（如 Virtual List 的视口计算和变高测量、Toast 的全局协调和定时器管理）

**通用性要求**（必须满足）：

- 多数应用都会遇到的交互模式
- 不与浏览器原生能力重叠

**不放入 components/ 的**：

- 浏览器已原生提供的（`<dialog>`, `<details>`, `<input>`, `<select>`, `popover` 属性）
- 纯样式组件（Badge, Card, Avatar）—— LLM 自己写的样式更贴合项目
- 布局模板（Tabs, Sidebar）—— LLM 用 flex/grid 自行实现更灵活
- 高度领域化的（Chart）—— 依赖第三方库，不属于基础组件层
- 复杂但不通用的（如 async-button）—— 逻辑虽复杂，但适用面太窄

## 现有包

### @takanashi/rikka-live-playground

实时代码编辑器组件。使用 Sucrase 在浏览器中擦除 TypeScript 类型，用 CodeJar + highlight.js 提供可编辑的语法高亮，在沙箱 iframe 中运行用户代码。

**为什么放在 components/**：编辑器集成、iframe 沙箱、代码转译 —— 这些不是原语级别的工具，而是基于 rikka-elements 构建的完整组件。

## 计划中的包

### @takanashi/rikka-ui

复杂交互组件集合。提供 LLM 难以正确自行实现的 UI 行为。

**为什么是单个包而非多个包**：这些组件共享内部基础设施（定位计算、键盘导航模式），拆成多个包会导致循环依赖或代码重复。用户 tree-shake 只引入需要的组件。

#### 组件清单

每个组件标注准入条件：**陷阱密集** / **逻辑复杂** / **两者兼有**。

##### Combobox（搜索选择框）— 两者兼有

**Tag**: `r-combobox` + `r-combobox-option`

**为什么需要**：`<datalist>` 无法自定义样式、无法异步搜索、无法控制下拉行为。Combobox 是 Web 上陷阱最密集的交互模式，同时其焦点管理和键盘导航逻辑也足够复杂。

**陷阱**：

- 用 `focus` 移动到 option 元素而非 `aria-activedescendant`
- 不处理 IME 输入法（`compositionstart/end`），导致组合输入时 Enter 错误触发
- 异步搜索时竞态条件（后发的请求先返回）
- 缺少 `role="combobox"` / `role="listbox"` / `role="option"` 的 ARIA 结构
- Home/End/PageUp/PageDown 键未处理

**复杂逻辑**：焦点管理 + 键盘导航 + ARIA + IME + 异步竞态

**API**：

```typescript
const Combobox = defineElement("r-combobox", {
  attributes: {
    value: StringAttr,
    placeholder: StringAttr,
    disabled: BooleanAttr,
  },
  events: {
    change: (e: CustomEvent) => e.detail,
    input: (e: CustomEvent) => e.detail,
    open: undefined,
    close: undefined,
  },
});

const ComboboxOption = defineElement("r-combobox-option", {
  attributes: {
    value: StringAttr,
    disabled: BooleanAttr,
  },
});
```

##### Dropdown Menu（下拉菜单）— 陷阱密集

**Tag**: `r-dropdown-menu` + `r-dropdown-menu-item` + `r-dropdown-menu-separator`

**为什么需要**：`<select>` 无法自定义内容（图标、快捷键、子菜单）。Popover API 只处理显示/隐藏，不处理键盘导航和焦点管理。

**陷阱**：

- 点击外部关闭时冒泡陷阱（open → 冒泡 click → 立即 close）
- 关闭后不恢复焦点到触发元素
- 键盘导航（上下箭头、Home/End）缺失
- 不处理 `overflow: hidden` 祖先裁切

**API**：

```typescript
const DropdownMenu = defineElement("r-dropdown-menu", {
  attributes: {
    open: Boolean,
    placement: { toProp: (v) => v ?? "bottom-start", toAttribute: (v) => v },
  },
  events: {
    open: undefined,
    close: (e: CustomEvent) => e.detail,
  },
});

const DropdownMenuItem = defineElement("r-dropdown-menu-item", {
  attributes: {
    disabled: Boolean,
    variant: String,
  },
  events: {
    select: undefined,
  },
});
```

##### Toast（通知协调器）— 逻辑复杂

**Tag**: `r-toast-container` + 命令式 API

**为什么需要**：Toast 需要全局单例协调器。多个 Toast 堆叠、自动消失、动画协调是一个系统问题，不是单个组件。即使 LLM 能写对，每次重新实现这套协调逻辑也是浪费。

**陷阱**：

- 定时器未清理导致内存泄漏
- 鼠标悬停时不暂停自动消失计时器
- 快速连续触发时 Toast 堆叠而非合并
- 组件卸载后仍在操作 DOM
- `visibilitychange` 时不暂停/恢复计时器

**复杂逻辑**：全局状态协调 + 定时器管理 + 动画编排

**API**：

```typescript
// 命令式
export const toast = {
  show(messageOrOptions: string | ToastOptions): string,
  success(message: string): string,
  error(message: string): string,
  promise<T>(promise: Promise<T>, messages: PromiseMessages): string,
  dismiss(id: string): void,
};

// 容器组件
const ToastContainer = defineElement('r-toast-container', {
  attributes: {
    placement: { toProp: (v) => v ?? 'bottom-right', toAttribute: (v) => v },
  },
});
```

##### Virtual List（虚拟滚动列表）— 逻辑复杂

**形态**：渲染工具函数（类似 `For()`）

**为什么需要**：列表项超过几百个时直接渲染导致严重性能问题。`For()` 不处理虚拟化。视口计算、变高测量、滚动条同步是通用但复杂的逻辑，不值得每个项目重复实现。

**陷阱**：

- 滚动位置在数据变化时跳动
- 滚动条滑块大小/位置不正确
- 变高项需要二次测量导致布局抖动
- 快速滚动时白屏

**复杂逻辑**：滚动数学 + 视口计算 + 变高测量

**API**：

```typescript
function VirtualList<T>(
  source: Signal.State<T[]> | Signal.Computed<T[]>,
  render: (item: T, index: number) => Element,
  options: VirtualListOptions<T>,
): Element;

interface VirtualListOptions<T> {
  keyFn?: (item: T, index: number) => unknown;
  itemHeight?: number;
  estimatedHeight?: number;
  overscan?: number;
  containerHeight: number;
}
```

##### DatePicker（日期选择器）— 逻辑复杂

**Tag**: `r-date-picker` + `r-calendar`

**为什么需要**：`<input type="date">` 无法自定义样式、无法选择日期范围、无法禁用特定日期。日历网格计算、月份边界处理、闰年、周起始日、键盘导航（在日期网格中移动焦点）是通用但复杂的逻辑。

**陷阱**：

- 月份边界日期计算错误（如 1月31日 + 1个月 ≠ 2月31日）
- 闰年 2月 29日处理
- 键盘导航在 7 列网格中的焦点移动（左右跨行、Home/End 跳到行首行尾）
- 日期范围选择的 ARIA（`aria-multiselectable`、`aria-selected`）
- 时区问题（Date 对象的本地时区 vs UTC）

**复杂逻辑**：日历网格生成 + 日期算术 + 键盘导航 + 日期范围 + ARIA

**API**：

```typescript
const DatePicker = defineElement('r-date-picker', {
  attributes: {
    value: StringAttr,
    min: StringAttr,
    max: StringAttr,
    disabled: BooleanAttr,
    placeholder: StringAttr,
  },
  events: {
    change: (e: CustomEvent) => e.detail,
  },
});

const Calendar = defineElement('r-calendar', {
  attributes: {
    value: String,
    min: String,
    max: String,
    disabledDates: String,
    weekStartsOn: { toProp: (v) => v ?? '0', toAttribute: (v) => v },
    selectionMode: { toProp: (v) => v ?? 'single', toAttribute: (v) => v },
  },
  events: {
    change: (e: CustomEvent) => e.detail,
    'month-change': (e: CustomEvent) => e.detail,
  },
});
```

##### DataTable（数据表格）— 逻辑复杂

**Tag**: `r-data-table` + `r-data-table-column`

**为什么需要**：排序、筛选、分页、行选择（含 Shift 范围选）、列排序状态管理的组合逻辑复杂且通用。几乎所有业务应用都需要数据表格，但每次重新实现排序+分页+行选择的组合逻辑是浪费。

**陷阱**：

- Shift + Click 范围选择时索引计算（排序后索引 vs 原始数据索引）
- 多列排序的优先级管理
- 分页 + 排序 + 筛选的状态组合（排序后筛选、筛选后排序结果不同）
- 全选逻辑（当前页全选 vs 全部数据全选）
- 大数据量时排序性能（不应在渲染线程做全量排序）

**复杂逻辑**：排序 + 筛选 + 分页 + 行选择 + 状态组合

**API**：

```typescript
const DataTable = defineElement('r-data-table', {
  attributes: {
    data: Array,
    selection: Array,
    sortKey: String,
    sortDirection: String,
    page: Number,
    pageSize: Number,
    selectable: Boolean,
  },
  events: {
    'sort-change': (e: CustomEvent) => e.detail,
    'selection-change': (e: CustomEvent) => e.detail,
    'page-change': (e: CustomEvent) => e.detail,
  },
});

const DataTableColumn = defineElement('r-data-table-column', {
  attributes: {
    key: StringAttr,
    label: StringAttr,
    sortable: BooleanAttr,
    width: StringAttr,
    align: StringAttr,
  },
});
```

##### Drag（拖拽行为）— 两者兼有

**形态**：行为工具函数（`draggable()` / `droppable()`）

**为什么需要**：HTML5 DnD API 在移动端完全不可用。触摸拖拽需要自行实现，且手势识别、自动滚动、拖拽预览的逻辑复杂且通用。

**陷阱**：

- 不支持触摸设备
- 触摸滚动与拖拽手势冲突
- `elementFromPoint` 返回拖拽预览元素而非下方目标
- 不处理拖拽过程中的自动滚动
- 缺少 ARIA

**复杂逻辑**：触摸兼容 + 手势识别 + 拖拽预览 + 自动滚动

**API**：

```typescript
function draggable(
  element: Element,
  config?: DragConfig,
): { destroy: () => void };
function droppable(
  element: Element,
  config?: DropConfig,
): { destroy: () => void };

const dragState: {
  isDragging: Signal.Computed<boolean>;
  source: Signal.Computed<Element | null>;
  position: Signal.Computed<{ x: number; y: number }>;
};
```

## 包结构

```
components/
  rikka-live-playground/        @takanashi/rikka-live-playground    已有
  rikka-ui/                     @takanashi/rikka-ui                 计划中
    src/
      index.ts
      combobox.ts
      dropdown-menu.ts
      toast.ts
      virtual-list.ts
      drag.ts
      date-picker.ts
      calendar.ts
      data-table.ts
    package.json
    rslib.config.ts
    tsconfig.json
```

## 依赖关系

```
@takanashi/rikka-ui
  ├── @takanashi/rikka-elements   (defineElement)
  ├── @takanashi/rikka-dom        (h, tag helpers, For, Show, css)
  └── @takanashi/rikka-signal     (signal, computed, effect)
```

不引入任何外部依赖。定位计算、键盘导航、触摸处理全部自行实现。

## 不做的事

| 不做                  | 理由                                                   |
| --------------------- | ------------------------------------------------------ |
| Tooltip 组件          | CSS Anchor Positioning + `popover="hint"` 已原生解决   |
| Dialog 组件           | `<dialog>` + `showModal()` 已原生解决焦点陷阱和 Escape |
| Accordion 组件        | `<details>/<summary>` 已原生解决                       |
| 样式系统 / 主题 token | LLM 在具体项目中自己写的样式更适配                     |
| CSS 变量接口          | 组件不包含视觉样式，无需 CSS 变量层                    |
| Chart                 | 依赖第三方库，不属于基础组件层                         |
