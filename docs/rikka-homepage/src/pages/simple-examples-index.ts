import { defineElement } from "@takanashi/rikka-elements";
import { css, div, h1, h2, p, a, span } from "@takanashi/rikka-dom";
import { effect } from "@takanashi/rikka-signal";
import { sharedHelpers } from "../shared/helpers";
import { examplePageStyles } from "../shared/page-styles";
import { t, type Locale } from "../shared/i18n";

const examplesContent = {
  title: { en: "Simple Examples", zh: "简单示例" } as Record<Locale, string>,
  subtitle: {
    en: "Interactive examples showcasing Rikka's reactivity system in action. Click any example to see it live.",
    zh: "展示 Rikka 响应式系统的交互式示例。点击任意示例查看实时效果。",
  } as Record<Locale, string>,
  counterDesc: {
    en: "A simple counter demonstrating signal and computed reactivity with real-time updates.",
    zh: "一个简单的计数器，演示 signal 和 computed 响应式与实时更新。",
  } as Record<Locale, string>,
  todoDesc: {
    en: "A reactive todo list with add, toggle, delete operations and remaining count.",
    zh: "一个响应式的待办列表，支持添加、切换、删除操作和剩余计数。",
  } as Record<Locale, string>,
  colorPickerDesc: {
    en: "RGB sliders controlling a color preview in real-time with hex output.",
    zh: "RGB 滑块实时控制颜色预览，输出十六进制值。",
  } as Record<Locale, string>,
  tabsDesc: {
    en: "A tab component with reactive content switching using signals.",
    zh: "使用信号实现响应式内容切换的标签组件。",
  } as Record<Locale, string>,
  liveSearchDesc: {
    en: "A search input that filters a list in real-time as you type.",
    zh: "输入时实时过滤列表的搜索框。",
  } as Record<Locale, string>,
  missionControlDesc: {
    en: "Real-time dashboard with 4 metrics updating every second, peak tracking, and threshold alerts.",
    zh: "实时仪表盘，4 个指标每秒更新，支持峰值追踪和阈值告警。",
  } as Record<Locale, string>,
  kanbanDesc: {
    en: "3-column project board with drag-and-drop cards, priority colors, and stats bar.",
    zh: "三列项目看板，支持拖拽卡片、优先级颜色和统计栏。",
  } as Record<Locale, string>,
  tokenManagerDesc: {
    en: "Design system color manager with groups, theme switching, and CSS export.",
    zh: "设计系统颜色管理器，支持分组、主题切换和 CSS 导出。",
  } as Record<Locale, string>,
  knowledgeBaseDesc: {
    en: "Search interface with facets, history, popular tags, and reactive filtering.",
    zh: "搜索界面，支持分面、历史记录、热门标签和响应式过滤。",
  } as Record<Locale, string>,
  miniIdeDesc: {
    en: "File tree, closable tabs, editor area, and terminal simulator.",
    zh: "文件树、可关闭标签页、编辑区域和终端模拟器。",
  } as Record<Locale, string>,
  collaborationDesc: {
    en: "Team simulator with avatars, status indicators, role filtering, and live updates.",
    zh: "团队模拟器，支持头像、状态指示器、角色过滤和实时更新。",
  } as Record<Locale, string>,
};

const styles = css`
  ${examplePageStyles}

  .examples-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
  }
  .example-card {
    background: var(--color-card-bg);
    border: 1px solid var(--color-card-border);
    border-radius: 0.75rem;
    padding: 1.5rem;
    transition: all 0.3s ease;
    text-decoration: none;
    color: inherit;
    display: block;
    position: relative;
    overflow: hidden;
  }
  .example-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--color-primary), var(--color-secondary), var(--color-primary));
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .example-card:hover::before {
    opacity: 1;
  }
  .example-card:hover {
    border-color: var(--color-primary);
    transform: translateY(-4px);
    box-shadow: 0 12px 35px rgba(99, 102, 241, 0.18);
  }
  .example-icon {
    font-size: 2rem;
    margin-bottom: 0.75rem;
    display: block;
  }
  .example-card h2 {
    color: var(--color-text-primary);
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }
  .example-card p {
    color: var(--color-text-secondary);
    font-size: 0.9375rem;
    line-height: 1.6;
    margin: 0 0 1rem 0;
  }
  .example-tags {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .example-tag {
    background: var(--color-tag-bg);
    color: var(--color-primary-light);
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 500;
    border: 1px solid var(--color-tag-border);
  }
`;

const examples = [
  {
    icon: "🔢",
    title: "Counter",
    descKey: examplesContent.counterDesc,
    href: "#/simple-examples/counter",
    tags: ["signal", "computed"],
  },
  {
    icon: "✅",
    title: "Todo List",
    descKey: examplesContent.todoDesc,
    href: "#/simple-examples/todo",
    tags: ["arrays", "computed", "events"],
  },
  {
    icon: "🎨",
    title: "Color Picker",
    descKey: examplesContent.colorPickerDesc,
    href: "#/simple-examples/color-picker",
    tags: ["multiple signals", "computed"],
  },
  {
    icon: "📑",
    title: "Tabs",
    descKey: examplesContent.tabsDesc,
    href: "#/simple-examples/tabs",
    tags: ["conditional", "events"],
  },
  {
    icon: "🔍",
    title: "Live Search",
    descKey: examplesContent.liveSearchDesc,
    href: "#/simple-examples/live-search",
    tags: ["filter", "computed", "input"],
  },
  {
    icon: "📊",
    title: "Mission Control",
    descKey: examplesContent.missionControlDesc,
    href: "#/simple-examples/mission-control",
    tags: ["effect", "signal", "For"],
  },
  {
    icon: "📋",
    title: "Kanban Board",
    descKey: examplesContent.kanbanDesc,
    href: "#/simple-examples/kanban",
    tags: ["effect", "drag-drop", "computed"],
  },
  {
    icon: "🎨",
    title: "Token Manager",
    descKey: examplesContent.tokenManagerDesc,
    href: "#/simple-examples/token-manager",
    tags: ["signal", "effect", "localStorage"],
  },
  {
    icon: "📚",
    title: "Knowledge Base",
    descKey: examplesContent.knowledgeBaseDesc,
    href: "#/simple-examples/knowledge-base",
    tags: ["computed", "effect", "localStorage"],
  },
  {
    icon: "💻",
    title: "Mini IDE",
    descKey: examplesContent.miniIdeDesc,
    href: "#/simple-examples/mini-ide",
    tags: ["signal", "effect", "For"],
  },
  {
    icon: "👥",
    title: "Collaboration",
    descKey: examplesContent.collaborationDesc,
    href: "#/simple-examples/collaboration",
    tags: ["effect", "computed", "signal"],
  },
];

const SimpleExamplesIndex = defineElement("rikka-simple-examples-index", {
  styles,
  render() {
    return div(
      { class: "example-page" },
      (() => { const el = h1({}); effect(() => { el.textContent = t(examplesContent.title); }); return el; })(),
      (() => {
        const el = p({});
        effect(() => { el.textContent = t(examplesContent.subtitle); });
        return el;
      })(),

      (() => {
        const container = div({ class: "examples-grid" });
        effect(() => {
          container.replaceChildren(...examples.map((example) =>
            a(
              { href: example.href, class: "example-card" },
              span({ class: "example-icon" }, example.icon),
              h2({}, example.title),
              p({}, t(example.descKey)),
              div(
                { class: "example-tags" },
                ...example.tags.map((tag) => span({ class: "example-tag" }, tag)),
              ),
            ),
          ));
        });
        return container;
      })(),
    );
  },
});

export { SimpleExamplesIndex };
