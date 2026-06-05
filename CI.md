# CI/CD 配置说明

本项目提供两套完整的 CI/CD 配置：

- **GitHub Actions**: `.github/workflows/ci.yml`
- **GitLab CI**: `.gitlab-ci.yml`

## 🚀 快速开始

### GitHub Actions

1. 推送代码到 GitHub 仓库
2. CI 会自动在 `push` 和 `pull_request` 时触发
3. 访问仓库的 **Actions** 标签页查看构建状态

**发布流程：**
```bash
# 创建版本 tag 触发自动发布
git tag v0.1.0
git push origin v0.1.0
```

**必需的 Secrets：**
- 在 GitHub 仓库设置中添加：
  - Settings → Secrets and variables → Actions
  - 新建 Repository Secret: `NPM_TOKEN` (npm 发布令牌)

### GitLab CI

1. 推送代码到 GitLab 仓库
2. CI Pipeline 会自动运行
3. 访问项目的 **CI/CD → Pipelines** 查看状态

**发布流程：**
```bash
# 创建版本 tag 触发自动发布
git tag v0.1.0
git push origin v0.1.0
```

**必需的 Variables：**
- 在 GitLab 项目设置中添加：
  - Settings → CI/CD → Variables
  - 添加变量: `NPM_AUTH_TOKEN` (npm 发布令牌)

## 📋 Pipeline 阶段说明

### Stage 1: 🔍 TypeScript 类型检查

检查所有子项目的类型安全：

```bash
# GitHub Actions 输出示例
✅ rikka-signal passed
✅ rikka-dom passed
✅ rikka-elements passed
✅ rikka-live-playground passed
✅ rikka-homepage passed
✅ bookmark-manager passed
✅ code-editor passed
✅ finance-tracker passed
```

**覆盖范围：**
- ✅ 3 个核心库 (utils/*)
- ✅ 1 个组件包 (components/*)
- ✅ 文档站点 (docs/*)
- ✅ 3 个示例项目 (examples/*)

### Stage 2: 🏗️ 构建项目

使用 Rslib + Rsbuild 构建所有包：

```bash
# 构建产物
utils/rikka-signal/dist/      # 6.9 kB (gzip: 1.6 kB)
utils/rikka-dom/dist/         # 25.8 kB (gzip: 6.3 kB)
utils/rikka-elements/dist/    # 14.4 kB (gzip: 3.3 kB)
components/rikka-live-playground/dist/  # 15.6 kB (gzip: 4.2 kB)
docs/rikka-homepage/dist/         # 完整文档站点
```

**产物保留时间：** 7 天（可下载用于调试）

### Stage 3: 🧪 运行测试

执行全部 313 个单元测试：

```bash
# 测试结果示例
🧪 Testing utils/rikka-signal...
   Status: PASS | Tests: 202 | Failed: 0 | Duration: 2030ms

🧪 Testing utils/rikka-dom...
   Status: PASS | Tests: 161 | Failed: 0 | Duration: 3788ms

🧪 Testing utils/rikka-elements...
   Status: PASS | Tests: 72 | Failed: 0 | Duration: 2718ms

🧪 Testing components/rikka-live-playground...
   Status: PASS | Tests: 50 | Failed: 0 | Duration: 3650ms

========================================
✅ Total: 313 tests | 0 failures
========================================
```

**测试报告：**
- 测试结果会作为 Artifact 上传
- 保留 30 天供分析

**覆盖率报告：**
- `pnpm test` 默认使用 v8 provider 收集覆盖率
- 每个包在各自 `coverage/` 下生成 `lcov.info` + HTML 报告
- CI 会把 `utils/*/coverage/` 和 `components/*/coverage/` 上传为 `coverage` artifact
- 当前未设置 threshold（仅收集数据）

### Stage 4: 🌐 浏览器 E2E 测试

启动 Demo 服务器并进行冒烟测试：

```bash
# E2E 测试内容
✅ Homepage is accessible (http://localhost:3000/)
✅ Documentation pages load correctly
✅ Examples render properly
✅ Live Playground functional
```

**测试环境：**
- Playwright Chromium 浏览器
- Node.js 24 LTS
- Ubuntu Latest

### Stage 5: 🚀 发布到 npm (可选)

**触发条件：**
- GitHub: push tag `v*` 到 main 分支
- GitLab: 创建 `v*` 格式的 tag

**发布的包：**
```
@rikka/signal          # 响应式原语
@rikka/dom             # DOM 工具函数
@rikka-elements        # Web Components 定义
@rikka/live-playground # 实时代码编辑器
```

**发布后操作：**
- 自动更新 npm registry
- 可选：创建 GitHub Release
- 可选：部署文档站点到 GitLab Pages

## ⚙️ 自定义配置

### 修改 Node.js 版本

**GitHub Actions:**
```yaml
env:
  NODE_VERSION: "24"  # 修改此处
```

**GitLab CI:**
```yaml
variables:
  NODE_VERSION: "24"  # 修改此处
```

### 跳过特定阶段

**GitHub Actions:** 编辑 `.github/workflows/ci.yml`，注释掉不需要的 job

**GitLab CI:** 编辑 `.gitlab-ci.yml`，添加规则或注释 stage

### 添加 Lint 检查

在 typecheck stage 后添加：

```yaml
# GitHub Actions 示例
lint:
  name: 🎨 Code Linting
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4
    - run: pnpm install --frozen-lockfile
    - run: pnpm lint  # 如果有配置 ESLint
```

### 添加覆盖率报告

在 test job 中添加：

```yaml
# GitHub Actions 示例
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: ./coverage/lcov.info
```

## 🔧 本地调试 CI

### GitHub Actions

1. 安装 [act](https://github.com/nektos/act) 工具：
```bash
brew install act  # macOS
# 或
cargo install act  # 或从 GitHub Releases 下载
```

2. 运行本地 CI：
```bash
act -j typecheck  # 仅运行类型检查
act               # 运行完整 pipeline
```

### GitLab CI

1. 安装 [gitlab-runner](https://docs.gitlab.com/runner/)：
```bash
# Linux/macOS
curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh | sudo bash
sudo apt-get install gitlab-runner
```

2. 注册并运行：
```bash
sudo gitlab-runner register
sudo gitlab-runner run
```

## 📊 监控和通知

### Slack 通知 (GitHub Actions)

```yaml
# 在 test job 后添加
- name: Notify Slack
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "❌ Rikka CI Failed: ${{ github.repository }}"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### Email 通知 (GitLab CI)

```yaml
# 在 .gitlab-ci.yml 全局添加
notifications:
  email:
    on_failure: always
    recipients:
      - your-email@example.com
```

## 🎯 最佳实践

1. **保持 lockfile 同步**
   ```bash
   pnpm install && pnpm-lock.yaml 提交到版本控制
   ```

2. **定期更新依赖**
   ```bash
   pnpm update --latest
   ```

3. **缓存优化**
   - 两个 CI 系统都已配置 pnpm 缓存
   - 首次运行较慢，后续会显著加速

4. **并行化策略**
   - 类型检查任务已并行化（8个并行 job）
   - 构建、测试、E2E 串行依赖前一阶段

5. **安全性**
   - 使用 `--frozen-lockfile` 确保依赖一致性
   - 敏感信息通过 Secrets/Variables 管理
   - 最小权限原则（仅 publish 需要 NPM_TOKEN）

## ❓ 常见问题

### Q: 如何跳过 CI？
```bash
# GitHub: 在 commit message 中包含 [skip ci]
git commit -m "chore: update docs [skip ci]"

# GitLab: 在 commit message 中包含 [ci skip]
git commit -m "chore: update docs [ci skip]"
```

### Q: 如何重新运行失败的 job？
- **GitHub**: Actions 标签页 → 选择 workflow → Re-run failed jobs
- **GitLab**: Pipelines 页面 → Retry 或 Replay

### Q: 如何查看详细日志？
- **GitHub**: 点击具体的 job → 查看实时日志输出
- **GitLab**: 点击 job 名称 → 查看 Trace 日志

### Q: 构建太慢怎么办？
1. 确保 pnpm cache 正常工作（首次后会加速）
2. 考虑拆分更细粒度的并行 job
3. 使用自托管 Runner（如果网络慢）

---

## 📝 更新日志

### v1.0.0 (2026-05-30)
- ✅ 初始版本
- ✅ 支持 GitHub Actions 和 GitLab CI
- ✅ 5 个 pipeline stages
- ✅ 完整的类型检查、构建、测试、E2E、发布流程
- ✅ 自动化 npm 发布
- ✅ GitLab Pages 文档部署支持
