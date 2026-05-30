#!/usr/bin/env node

/**
 * 完整 CI 流程脚本（带多阶段汇总）
 *
 * 按顺序执行：typecheck → build → test → browser-test
 *
 * 使用方式:
 *   node scripts/ci.mjs
 *   pnpm test:all
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const c = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', cyan: '\x1b[36m', magenta: '\x1b[35m'
};

function log(color, msg) {
  console.log(`${c[color]}${msg}${c.reset}`);
}

function stage(name, icon, num) {
  log('magenta', `\n${'='.repeat(60)}`);
  log('magenta', `${icon} Stage ${num}: ${name}`);
  log('magenta', `${'='.repeat(60)}\n`);
}

function run(cmd, desc) {
  log('cyan', `▶ ${desc}...`);
  const t = Date.now();
  try {
    execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
    const d = ((Date.now() - t) / 1000).toFixed(1);
    log('green', `✅ 完成 (${d}s)\n`);
    return { success: true, duration: d };
  } catch (e) {
    const d = ((Date.now() - t) / 1000).toFixed(1);
    log('red', `❌ 失败 (${d}s)\n`);
    return { success: false, duration: d };
  }
}

async function main() {
  const startTime = Date.now();
  
  // 收集所有阶段的结果
  const results = [];

  log('cyan', '╔═══════════════════════════════════════════════════════╗');
  log('cyan', '║           🚀 Rikka 完整 CI Pipeline                    ║');
  log('cyan', '╚═══════════════════════════════════════════════════════╝');
  log('yellow', `\n🕐 开始时间: ${new Date().toLocaleString()}\n`);

  // ============================================
  // Stage 1: TypeCheck
  // ============================================
  stage('TypeScript 类型检查', '🔍', 1);
  const tc = run('node scripts/typecheck.mjs', '类型检查 (8个项目)');
  results.push({ name: 'TypeCheck', ...tc });

  if (!tc.success) {
    printFinalReport(results, startTime);
    process.exit(1);
  }

  // ============================================
  // Stage 2: Build
  // ============================================
  stage('构建项目', '🏗️ ', 2);
  const build = run('pnpm build', '构建所有包和文档站点');
  results.push({ name: 'Build', ...build });

  if (!build.success) {
    printFinalReport(results, startTime);
    process.exit(1);
  }

  // ============================================
  // Stage 3: Test
  // ============================================
  stage('单元测试', '🧪', 3);
  const test = run('pnpm test', '运行全部测试用例');
  results.push({ name: 'Test', ...test });

  if (!test.success) {
    printFinalReport(results, startTime);
    process.exit(1);
  }

  // ============================================
  // Stage 4: Browser Test
  // ============================================
  stage('浏览器 E2E 测试', '🌐', 4);
  const browser = run('node scripts/browser-test.mjs', '浏览器冒烟测试');
  results.push({ name: 'Browser Test', ...browser });

  if (!browser.success) {
    printFinalReport(results, startTime);
    process.exit(1);
  }

  // ============================================
  // 最终汇总
  // ============================================
  printFinalReport(results, startTime);
}

function printFinalReport(results, startTime) {
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const allPassed = results.every(r => r.success);

  // 最终状态横幅
  log('magenta', '\n╔═══════════════════════════════════════════════════════╗');
  
  if (allPassed) {
    log('green', '║                                                       ║');
    log('green', '║   🎉🎉🎉  所有检查通过！项目已准备就绪！ 🎉🎉🎉        ║');
    log('green', '║                                                       ║');
  } else {
    const failedCount = results.filter(r => !r.success).length;
    log('red', '║                                                       ║');
    log('red', `║   ❌❌❌  存在 ${failedCount} 个失败的阶段！ ❌❌❌                ║`);
    log('red', '║                                                       ║');
  }
  
  log('magenta', '╚═══════════════════════════════════════════════════════╝\n');

  // 各阶段结果表格
  log('cyan', '┌─────────────────────┬────────┬──────────┬──────────────┐');
  log('cyan', '│ 阶段                │ 状态   │ 耗时     │ 占总时间比   │');
  log('cyan', '├─────────────────────┼────────┼──────────┼──────────────┤');

  for (const r of results) {
    const status = r.success ? '✅ 通过' : '❌ 失败';
    const color = r.success ? 'green' : 'red';
    const pct = ((parseFloat(r.duration) / parseFloat(totalTime)) * 100).toFixed(1);
    
    log(color, `│ ${r.name.padEnd(19)}│ ${status.padEnd(6)} │ ${r.duration.padEnd(6)}s │ ${pct.padStart(5)}%       │`);
  }

  log('cyan', '├─────────────────────┼────────┼──────────┼──────────────┤');
  log('yellow', `│ ${'总计'.padEnd(19)}│        │ ${totalTime.padEnd(6)}s │ 100.0%      │`);
  log('cyan', '└─────────────────────┴────────┴──────────┴──────────────┘\n');

  // 统计信息
  const passedCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  log('cyan', '📊 统计摘要:');
  log('cyan', `   • 总阶段数:     ${totalCount}`);
  log('cyan', `   • 通过阶段:     ${passedCount}`);
  log('cyan', `   • 失败阶段:     ${totalCount - passedCount}`);
  log('cyan', `   • 成功率:       ${((passedCount / totalCount) * 100).toFixed(0)}%`);
  log('cyan', `   • 总耗时:       ${totalTime}s\n`);

  // 时间戳
  log('yellow', `🕐 完成时间: ${new Date().toLocaleString()}`);

  // 下一步建议
  if (allPassed) {
    log('green', '\n✨ 接下来可以:');
    log('green', '   • git add . && git commit -m "chore: pass all checks"');
    log('green', '   • git push');
    log('green', '   • npm version patch/minor/major && git push --follow-tags');
    log('green', '\n🚀 项目已准备好发布到 npm！');
  } else {
    const failedStages = results.filter(r => !r.success).map(r => r.name);
    log('red', '\n⚠️  请修复以下失败阶段:');
    failedStages.forEach((name, i) => {
      log('red', `   ${i + 1}. ${name}`);
    });
    log('yellow', '\n💡 提示:');
    log('yellow', '   • 运行单个阶段进行调试: pnpm <stage-command>');
    log('yellow', '   • 查看上方日志获取详细错误信息');
  }

  log(''); // 空行
}

main().catch(e => {
  log('red', `\n❌ 致命错误: ${e.message}\n`);
  process.exit(1);
});
