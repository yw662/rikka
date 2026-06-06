# Local CI Scripts Guide

## 📦 3 Independent Scripts

| Script | Command | Purpose | Duration |
|------|------|------|------|
| [`scripts/typecheck.mjs`](file:///home/yw662/文档/projects/rikka/scripts/typecheck.mjs) | `pnpm typecheck` | TypeScript type checking | ~9s |
| [`scripts/browser-test.mjs`](file:///home/yw662/文档/projects/rikka/scripts/browser-test.mjs) | `pnpm browser-test` | Browser E2E testing | ~15s |
| [`scripts/ci.mjs`](file:///home/yw662/文档/projects/rikka/scripts/ci.mjs) | `pnpm test:all` | Full pipeline (typecheck + build + test + browser) | ~40s |

---

## 🚀 Quick Usage

### 1️⃣ TypeCheck - Type Checking
```bash
pnpm typecheck
```

**Example output**:
```
╔══════════════════════════════╗
║   🔍 TypeScript Type Checking   ║
╚══════════════════════════════╝

▶ rikka-signal
✅ Passed (1.0s)

▶ rikka-dom
✅ Passed (1.4s)

... (8 projects total)

🎉 All passed! (9.3s)
```

**When to use**: Daily development, before committing, after modifying type definitions

---

### 2️⃣ Browser-Test - Browser Testing
```bash
pnpm browser-test
```

**Execution flow**:
1. Check Playwright installation status
2. Build project (`pnpm build`)
3. Start Demo server (http://localhost:3000)
4. Run smoke tests:
   - ✅ Homepage accessible
   - ✅ Docs page loads
   - ✅ Example page renders
   - ✅ Playground works
5. Automatically stop server

**Example output**:
```
╔══════════════════════════════╗
║   🌐 Browser E2E Testing        ║
╚══════════════════════════════╝

🔧 Checking Playwright...
🏗️  Building project... ✅ (7.7s)

🚀 Starting Demo server... ✅
🧪 Running smoke tests...

   ✅ Homepage
   ✅ Docs page
   ✅ Examples page
   ✅ Playground

📊 Results: 4/4 passed

🎉 Browser tests complete! (14.7s)
```

**When to use**: After modifying UI, before deployment, verifying demo site

---

### 3️⃣ CI - Full Pipeline
```bash
pnpm test:all
```

**Executes all 4 stages in order**:
```
Stage 1: 🔍 TypeCheck     → Type check 8 projects
Stage 2: 🏗️  Build        → Build 5 packages + docs site
Stage 3: 🧪  Test         → Run 313 unit tests
Stage 4: 🌐 Browser Test  → Demo smoke tests (4 items)
```

**Example output**:
```
╔═════════════════════════════════════════╗
║       🚀 Rikka Full CI Pipeline            ║
╚═════════════════════════════════════════╝

========================================
🔍 Stage 1: TypeScript Type Checking
========================================
✅ Done (9.3s)

========================================
🏗️  Stage 2: Build Project
========================================
✅ Done (7.7s)

========================================
🧪  Stage 3: Unit Tests
========================================
✅ Done (15.1s)

========================================
🌐 Stage 4: Browser E2E Testing
========================================
✅ Done (14.7s)

╔═════════════════════════════════════════╗
║   🎉 All checks passed! Project is ready   ║
║   ⏱️  Total time: 46.8s                    ║
╚═════════════════════════════════════════╝
```

**When to use**: Before releasing a version, before submitting a PR, reproducing CI failures locally

---

## 🎯 Recommended Workflow

### Daily Development
```bash
# After writing code (every 10 minutes)
pnpm typecheck        # 9-second quick check
```

### Feature Development Complete
```bash
# After finishing a feature
pnpm typecheck && pnpm test    # ~24s
```

### Ready to Commit
```bash
# Full verification before committing
pnpm test:all                  # ~47s

git add .
git commit -m "feat: ..."
git push
```

### Release New Version
```bash
# Final release check
pnpm test:all                  # Ensure everything is fine

npm version patch              # 0.1.0 → 0.1.1
git push --follow-tags         # Trigger automatic publish to npm
```

---

## ⚙️ Custom Configuration

### Modify TypeCheck Project List

Edit [`scripts/typecheck.mjs`](file:///home/yw662/文档/projects/rikka/scripts/typecheck.mjs#L40-L48):
```javascript
const projects = [
  ['@takanashi/rikka-signal', 'utils/rikka-signal/tsconfig.json'],
  // ... add or remove projects
];
```

### Modify Browser-Test URL List

Edit [`scripts/browser-test.mjs`](file:///home/yw662/文档/projects/rikka/scripts/browser-test.mjs#L80-L86):
```javascript
const tests = [
  ['Homepage', '/'],
  ['Docs page', '/#/docs/rikka-signal/getting-started'],
  // ... add more test URLs
];
```

### Modify CI Pipeline Order

Edit [`scripts/ci.mjs`](file:///home/yw662/文档/projects/rikka/scripts/ci.mjs#L60-L80) to adjust the stage execution order.

---

## ❓ FAQ

**Q: browser-test reports port in use?**
```bash
lsof -i :3000           # Find the process using the port
kill -9 <PID>          # Kill the process
pnpm browser-test       # Re-run
```

**Q: Playwright not installed?**
```bash
npx playwright install chromium
```

**Q: Only want to run certain stages?**
```bash
# Combine as needed
pnpm typecheck && pnpm test    # Skip build and browser
pnpm build && pnpm browser-test  # Only test build and browser
```

---

## 📊 Performance Reference

On my machine (Ubuntu 24.04, 16GB RAM):

| Command | First run | With cache |
|------|------|--------|
| `pnpm typecheck` | 9.3s | 5.2s |
| `pnpm browser-test` | 14.7s | 10.1s |
| `pnpm test:all` | 46.8s | 32.5s |

---

## 💡 Tips

### Git Hook Auto-Run
```bash
# .git/hooks/pre-commit
#!/bin/bash
pnpm typecheck || exit 1
```

### VS Code Shortcut
Add to `.vscode/tasks.json`:
```json
{
  "label": "TypeCheck",
  "type": "shell",
  "command": "pnpm typecheck",
  "group": { "kind": "test", "isDefault": true }
}
```
