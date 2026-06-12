# Development & CI

本项目使用 **pnpm workspace + catalog** 管理多包 monorepo，借助 `rslib`（`@rslib/core`）构建，使用 `@rstest/core`（Vitest 生态）+ `happy-dom` 运行单元测试，配合 Playwright 做浏览器 E2E，使用 `changesets` 管理版本与发布。

## 工作流命令

```bash
pnpm install               # 安装所有依赖（workspace hoisting）
pnpm build                 # 构建所有包 (rslib build)
pnpm test                  # 单元测试（Vitest + happy-dom）
pnpm typecheck             # 全量类型检查
pnpm browser-test          # Playwright E2E（需先 build）
pnpm test:all              # = lint + typecheck + test + browser-test
pnpm demo                  # 启动文档站点 (rsbuild dev -- docs/rikka-homepage)
pnpm changeset             # 创建 changeset 条目
pnpm version-packages      # bump 版本 + 生成 changelog
pnpm release               # 发布到 npm
```

## Monorepo 结构

```
root package.json / pnpm-workspace.yaml (catalog: strict)
 ├─ utils/
 │   ├─ rikka-signal/        (peer: signal-polyfill)
 │   ├─ rikka-dom/           (depends: rikka-signal)
 │   └─ rikka-elements/      (depends: rikka-signal, rikka-dom)
 ├─ components/
 │   └─ rikka-live-playground/
 ├─ docs/
 │   └─ rikka-homepage/
 ├─ examples/
 │   ├─ 2048-game, bookmark-manager, code-editor, drawing-pad
 │   ├─ finance-tracker, pomodoro-timer, snake-game, todo-list
 └─ scripts/                  # 顶层 CI 脚本
     ├─ ci.mjs
     ├─ test.mjs
     ├─ typecheck.mjs
     └─ browser-test.mjs
```

### Catalog 模式

`pnpm-workspace.yaml` 的 `catalog` 统一声明所有共享依赖版本，各包只需写 `"catalog:"` 占位 — 便于统一升级。

```yaml
catalog:
  '@rslib/core': ^0.21.0
  '@rstest/core': ^0.10.3
  happy-dom: ^20.9.0
  signal-polyfill: ^0.2.2
  typescript: ^6.0.3
  playwright: ^1.60.0
  sucrase: ^3.35.0
  highlight.js: ^11.11.1
  codejar: ^4.3.0
catalogMode: strict
```

## 构建 (rslib)

每个包的 `rslib.config.ts` 声明入口与输出格式（ESM-only）：

```ts
// utils/rikka-signal/rslib.config.ts
import { defineConfig } from "@rslib/core";

export default defineConfig({
  lib: [
    { format: "esm", source: { input: ["src/**/*.ts", "!src/**/*.test.ts"] } },
  ],
});
```

运行：`pnpm build`（顶层）或每个包中的 `pnpm -C utils/rikka-signal build`。

## 测试

### 单元测试 (Vitest + happy-dom)

每个包提供 `rstest.config.ts`：

```ts
import { defineConfig } from "@rstest/core";
export default defineConfig({
  test: { environment: "happy-dom" },
});
```

运行：

```bash
pnpm test                       # 顶层 → 执行全部包
pnpm --filter rikka-dom test    # 单包
```

测试文件命名：`src/**.test.ts` 或 `test/**.test.ts`。

### 浏览器 E2E (Playwright)

`scripts/browser-test.mjs` + Playwright 驱动真实浏览器，验证 DOM 行为与自定义元素。在 CI 中通过 `test:all` 触发。

## 类型检查

`scripts/typecheck.mjs` 遍历所有包调用 `tsc --noEmit`：

```bash
pnpm typecheck
```

建议在 VS Code 中开启 `strict: true`，与项目的 `tsconfig.json` 一致。

## CI/CD

GitHub Actions 工作流：

- `.github/workflows/ci.yml` — 每次 PR / push 到 main：install → build → typecheck → test → browser-test
- `.github/workflows/deploy.yml` — 部署文档站点到 GitHub Pages
- `.github/workflows/release.yml` — Changesets 驱动版本发布到 npm

## Changesets 发布流程

1. 在功能分支提交后执行：
   ```bash
   pnpm changeset
   # 选择受影响的包和升级级别 (major/minor/patch)
   ```
2. 合并 PR 到 main
3. `release.yml` 自动：
   - 执行 `pnpm changeset version` 更新版本号并生成 `CHANGELOG.md`
   - 创建版本 PR
4. 版本 PR 合并后，`release.yml` 发布到 npm

## 脚本包 (`scripts/`)

| 文件 | 职责 |
|------|------|
| `scripts/ci.mjs` | orchestrator：依次调用 typecheck → test → browser-test |
| `scripts/test.mjs` | 遍历 workspace 包 → `rstest` 执行单测 |
| `scripts/typecheck.mjs` | 遍历 → `tsc --noEmit` |
| `scripts/browser-test.mjs` | Playwright E2E runner |
| `scripts/README.md` | 脚本说明 |

## 开发建议

- 使用 `pnpm demo` 在本地并行查看文档与示例
- 写新功能前：先在对应的 `utils/*/test/` 下加测试（TDD 友好）
- 如需全局依赖升级，编辑 `pnpm-workspace.yaml` 的 catalog，然后 `pnpm install` 自动同步
- 不要直接更改发布包的 `package.json` `version`；使用 `changeset` 管理
- 命名约定：
  - 公共 API 全在 `src/index.ts` re-export
  - 内部工具函数放在 `src/*.ts`（如 `signal-utils.ts`, `utils.ts`）
  - 测试文件命名 `*.test.ts`

## 下一步

- 查看 [For LLMs and Agents](For-LLMs-and-Agents) — 如何让 AI 更高效地写 Rikka 代码
