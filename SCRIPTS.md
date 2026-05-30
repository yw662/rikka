# 本地 CI 脚本使用指南

## 📦 3个独立脚本

| 脚本 | 命令 | 用途 | 耗时 |
|------|------|------|------|
| [`scripts/typecheck.mjs`](file:///home/yw662/文档/projects/rikka/scripts/typecheck.mjs) | `pnpm typecheck` | TypeScript 类型检查 | ~9s |
| [`scripts/browser-test.mjs`](file:///home/yw662/文档/projects/rikka/scripts/browser-test.mjs) | `pnpm browser-test` | 浏览器 E2E 测试 | ~15s |
| [`scripts/ci.mjs`](file:///home/yw662/文档/projects/rikka/scripts/ci.mjs) | `pnpm ci` | 完整流程（typecheck + build + test + browser） | ~40s |

---

## 🚀 快速使用

### 1️⃣ TypeCheck - 类型检查
```bash
pnpm typecheck
```

**输出示例**:
```
╔══════════════════════════════╗
║   🔍 TypeScript 类型检查      ║
╚══════════════════════════════╝

▶ rikka-signal
✅ 通过 (1.0s)

▶ rikka-dom
✅ 通过 (1.4s)

... (共8个项目)

🎉 全部通过！(9.3s)
```

**何时使用**: 日常开发、提交前、修改类型定义后

---

### 2️⃣ Browser-Test - 浏览器测试
```bash
pnpm browser-test
```

**执行流程**:
1. 检查 Playwright 安装状态
2. 构建项目 (`pnpm build`)
3. 启动 Demo 服务器 (http://localhost:3000)
4. 运行冒烟测试:
   - ✅ 首页可访问
   - ✅ 文档页加载
   - ✅ 示例页渲染
   - ✅ Playground 可用
5. 自动停止服务器

**输出示例**:
```
╔══════════════════════════════╗
║   🌐 浏览器 E2E 测试          ║
╚══════════════════════════════╝

🔧 检查 Playwright...
🏗️  构建项目... ✅ (7.7s)

🚀 启动 Demo 服务器... ✅
🧪 运行冒烟测试...

   ✅ 首页
   ✅ 文档页
   ✅ 示例页
   ✅ Playground

📊 结果: 4/4 通过

🎉 浏览器测试完成！(14.7s)
```

**何时使用**: 修改UI后、部署前、验证demo站点

---

### 3️⃣ CI - 完整流程
```bash
pnpm ci
```

**按顺序执行全部4个阶段**:
```
Stage 1: 🔍 TypeCheck     → 8个项目类型检查
Stage 2: 🏗️  Build        → 构建5个包+文档站
Stage 3: 🧪  Test         → 运行481个单元测试
Stage 4: 🌐 Browser Test  → Demo冒烟测试(4项)
```

**输出示例**:
```
╔═════════════════════════════════════════╗
║       🚀 Rikka 完整 CI Pipeline          ║
╚═════════════════════════════════════════╝

========================================
🔍 Stage 1: TypeScript 类型检查
========================================
✅ 完成 (9.3s)

========================================
🏗️  Stage 2: 构建项目
========================================
✅ 完成 (7.7s)

========================================
🧪 Stage 3: 单元测试
========================================
✅ 完成 (15.1s)

========================================
🌐 Stage 4: 浏览器 E2E 测试
========================================
✅ 完成 (14.7s)

╔═════════════════════════════════════════╗
║   🎉 全部检查通过！项目已准备就绪     ║
║   ⏱️  总耗时: 46.8s                     ║
╚═════════════════════════════════════════╝
```

**何时使用**: 发布版本前、PR提交前、CI失败后本地复现

---

## 🎯 推荐工作流

### 日常开发
```bash
# 写完代码后（每10分钟）
pnpm typecheck        # 9秒快速检查
```

### 功能开发完成
```bash
# 改完功能后
pnpm typecheck && pnpm test    # ~24s
```

### 准备提交
```bash
# 提交前完整验证
pnpm ci                        # ~47s

git add .
git commit -m "feat: ..."
git push
```

### 发布新版本
```bash
# 最终发布检查
pnpm ci                        # 确保一切正常

npm version patch              # 0.1.0 → 0.1.1
git push --follow-tags         # 触发自动发布到npm
```

---

## ⚙️ 自定义配置

### 修改 typecheck 项目列表

编辑 [`scripts/typecheck.mjs`](file:///home/yw662/文档/projects/rikka/scripts/typecheck.mjs#L40-L48):
```javascript
const projects = [
  ['rikka-signal', 'utils/rikka-signal/tsconfig.json'],
  // ... 添加或删除项目
];
```

### 修改 browser-test URL 列表

编辑 [`scripts/browser-test.mjs`](file:///home/yw662/文档/projects/rikka/scripts/browser-test.mjs#L80-L86):
```javascript
const tests = [
  ['首页', '/'],
  ['文档页', '/#/docs/rikka-signal/getting-started'],
  // ... 添加更多测试URL
];
```

### 修改 CI 流程顺序

编辑 [`scripts/ci.mjs`](file:///home/yw662/文档/projects/rikka/scripts/ci.mjs#L60-L80)，调整 stage 执行顺序。

---

## ❓ 常见问题

**Q: browser-test 提示端口被占用？**
```bash
lsof -i :3000           # 查找占用进程
kill -9 <PID>          # 杀掉进程
pnpm browser-test       # 重新运行
```

**Q: Playwright 未安装？**
```bash
npx playwright install chromium
```

**Q: 只想跑部分阶段？**
```bash
# 组合使用
pnpm typecheck && pnpm test    # 不跑 build 和 browser
pnpm build && pnpm browser-test  # 只测构建和浏览器
```

---

## 📊 性能参考

在我的机器上 (Ubuntu 24.04, 16GB RAM):

| 命令 | 首次 | 有缓存 |
|------|------|--------|
| `pnpm typecheck` | 9.3s | 5.2s |
| `pnpm browser-test` | 14.7s | 10.1s |
| `pnpm ci` | 46.8s | 32.5s |

---

## 💡 技巧

### Git Hook 自动运行
```bash
# .git/hooks/pre-commit
#!/bin/bash
pnpm typecheck || exit 1
```

### VS Code 快捷键
在 `.vscode/tasks.json` 中添加：
```json
{
  "label": "TypeCheck",
  "type": "shell",
  "command": "pnpm typecheck",
  "group": { "kind": "test", "isDefault": true }
}
```
