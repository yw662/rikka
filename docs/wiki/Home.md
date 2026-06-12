# Rikka — 现代化 Web Components 工具集

> 🌠 **Rikka** 是一个零依赖、基于 TC39 Signals 提案、TypeScript 优先的 Web Components 工具集。它提供响应式状态、DOM 创建、自定义元素定义等能力，全部基于 Web 标准，可与任何框架共存。

- ✅ **零运行时依赖** — 构建产物 gzipped ~16KB
- ✅ **TC39 Signals 响应式** — 标准提案驱动，未来可与原生实现无缝切换
- ✅ **TypeScript-first** — 严格类型推导，attributes/events/methods 全链路类型安全
- ✅ **LLM/Agent 友好** — 附带 `skills/` 目录与 `llms.txt`，为 AI 代理提供文档入口
- ✅ **Shadow DOM + CSS 嵌套** — 完整的 Web Components 原生封装能力

## 📦 包结构

```
utils/
  ├─ rikka-signal/       # 响应式原语 (signal, computed, effect)
  ├─ rikka-dom/          # DOM 创建与响应式渲染 (h, tags, For/Show, css)
  └─ rikka-elements/     # 自定义元素定义 (defineElement, 属性/事件/方法)
components/
  └─ rikka-live-playground/  # 可复用的交互式代码编辑运行时组件
docs/
  └─ rikka-homepage/     # 官方文档站点 (基于 rikka-dom 自举)
examples/                # 各种示例应用
scripts/                 # 测试、构建、CI 脚本
skills/                  # LLM 代理技能目录 (agentskills.io 格式)
```

## 📖 文档导航

| 主题 | 页面 |
|------|------|
| 快速上手 | [Getting Started](Getting-Started) |
| 架构设计 | [Architecture Overview](Architecture-Overview) |
| 响应式系统 | [rikka-signal API](rikka-signal) |
| DOM 创建 | [rikka-dom API](rikka-dom) |
| 自定义元素 | [rikka-elements API](rikka-elements) |
| 交互组件 | [rikka-live-playground](rikka-live-playground) |
| 示例与模式 | [Examples & Patterns](Examples-and-Patterns) |
| 开发与 CI | [Development & CI](Development-and-CI) |
| LLM/Agent 使用 | [For LLMs and Agents](For-LLMs-and-Agents) |

## 🚀 安装

```bash
# 全部安装
pnpm add @takanashi/rikka-signal @takanashi/rikka-dom @takanashi/rikka-elements

# 或单独安装
npm install @takanashi/rikka-signal
```

## 🔗 相关链接

- **Live Demo**: https://yw662.github.io/rikka/
- **源码**: https://github.com/yw662/rikka
- **TC39 Signals 提案**: https://github.com/tc39/proposal-signals
- **signal-polyfill**: https://github.com/proposal-signals/signal-polyfill
