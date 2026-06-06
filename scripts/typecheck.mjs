#!/usr/bin/env node

/**
 * TypeScript 类型检查脚本（并行版）
 *
 * 特性：
 * - 并行执行所有项目的类型检查（速度提升 8x）
 * - 彩色输出，实时显示进度
 * - 汇总结果和耗时统计
 *
 * 使用方式:
 *   node scripts/typecheck.mjs
 *   pnpm typecheck
 */

import { execSync, exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const c = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m'
};

function log(color, msg) {
  console.log(`${c[color]}${msg}${c.reset}`);
}

const projects = [
  { name: '@takanashi/rikka-signal', config: 'utils/rikka-signal/tsconfig.json' },
  { name: '@takanashi/rikka-dom', config: 'utils/rikka-dom/tsconfig.json' },
  { name: '@takanashi/rikka-elements', config: 'utils/rikka-elements/tsconfig.json' },
  { name: 'rikka-live-playground', config: 'components/rikka-live-playground/tsconfig.json' },
  { name: 'rikka-homepage', config: 'docs/rikka-homepage/tsconfig.json' },
  { name: 'bookmark-manager', config: 'examples/bookmark-manager/tsconfig.json' },
  { name: 'code-editor', config: 'examples/code-editor/tsconfig.json' },
  { name: 'finance-tracker', config: 'examples/finance-tracker/tsconfig.json' },
];

function checkProject(project) {
  return new Promise((resolve) => {
    const start = Date.now();
    
    const cmd = `pnpm exec tsc --noEmit --project ${project.config}`;
    const proc = exec(cmd, { cwd: ROOT }, (error) => {
      const duration = ((Date.now() - start) / 1000).toFixed(1);
      
      resolve({
        name: project.name,
        success: !error,
        duration,
        output: error ? error.message : ''
      });
    });
  });
}

async function runParallelCheck() {
  log('magenta', '╔══════════════════════════════════════╗');
  log('magenta', '║   🔍 TypeScript 类型检查 (并行模式)   ║');
  log('magenta', '╚══════════════════════════════════════╝\n');

  const startTime = Date.now();

  // 并行执行所有类型检查
  log('cyan', `⚡ 并行启动 ${projects.length} 个项目...\n`);
  
  const results = await Promise.all(
    projects.map(p => checkProject(p))
  );

  // 显示结果
  let passed = 0;
  let failed = 0;

  log('cyan', '┌─────────────────────┬────────┬──────────┐');
  log('cyan', '│ 项目                │ 状态   │ 耗时     │');
  log('cyan', '├─────────────────────┼────────┼──────────┤');

  for (const result of results) {
    if (result.success) {
      passed++;
      log('green', `│ ${result.name.padEnd(19)}│ ✅ 通过 │ ${result.duration.padStart(5)}s   │`);
    } else {
      failed++;
      log('red', `│ ${result.name.padEnd(19)}│ ❌ 失败 │ ${result.duration.padStart(5)}s   │`);
    }
  }

  log('cyan', '└─────────────────────┴────────┴──────────┘\n');

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  // 汇总
  if (failed === 0) {
    log('green', `🎉 全部通过！(${passed}/${projects.length} 项目, ${totalTime}s)\n`);
    return true;
  } else {
    log('red', `❌ 存在错误！(${failed} 个失败, ${totalTime}s)\n`);
    
    // 显示失败的详细信息
    for (const result of results) {
      if (!result.success) {
        log('yellow', `\n--- ${result.name} 错误详情 ---`);
        log('red', result.output);
      }
    }
    
    return false;
  }
}

// 支持串行模式（用于调试）
async function runSequentialCheck() {
  log('magenta', '╔══════════════════════════════════════╗');
  log('magenta', '║   🔍 TypeScript 类型检查 (串行模式)   ║');
  log('magenta', '╚══════════════════════════════════════╝\n');

  const startTime = Date.now();
  let allPassed = true;

  for (const project of projects) {
    const t = Date.now();
    try {
      execSync(`pnpm exec tsc --noEmit --project ${project.config}`, {
        cwd: ROOT,
        stdio: 'pipe'
      });
      const d = ((Date.now() - t) / 1000).toFixed(1);
      log('green', `✅ ${project.name} (${d}s)`);
    } catch (e) {
      const d = ((Date.now() - t) / 1000).toFixed(1);
      log('red', `❌ ${project.name} (${d}s)`);
      allPassed = false;
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  if (allPassed) {
    log('green', `\n🎉 全部通过！(${totalTime}s)\n`);
  } else {
    log('red', `\n❌ 存在类型错误！(${totalTime}s)\n`);
  }

  return allPassed;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const mode = args.includes('--sequential') ? 'sequential' : 'parallel';
  
  let success;
  
  if (mode === 'sequential') {
    success = await runSequentialCheck();
  } else {
    success = await runParallelCheck();
  }

  process.exit(success ? 0 : 1);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
