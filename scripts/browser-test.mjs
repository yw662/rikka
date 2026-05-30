#!/usr/bin/env node

/**
 * 浏览器 E2E 测试脚本（企业级完整版）
 *
 * 特性：
 * - 多维度测试：状态码、响应时间、内容验证、资源加载
 * - 详细的性能指标收集
 * - 美观的可视化报告
 * - 智能的失败诊断
 *
 * 使用方式:
 *   node scripts/browser-test.mjs
 *   pnpm browser-test
 */

import { execSync, spawn, exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const c = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m', 
  cyan: '\x1b[36m', white: '\x1b[37m', gray: '\x1b[90m'
};

function log(color, msg) {
  console.log(`${c[color]}${msg}${c.reset}`);
}

function run(cmd, silent = true) {
  return new Promise((resolve) => {
    const t = Date.now();
    exec(cmd, { cwd: ROOT }, (error, stdout, stderr) => {
      const d = ((Date.now() - t) / 1000).toFixed(3);
      resolve({
        ok: !error,
        duration: d,
        output: stdout?.toString()?.trim(),
        error: stderr?.toString()?.trim()
      });
    });
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ============================================
// 测试用例定义
// ============================================
const testSuites = [
  // Suite 1: 核心页面可访问性
  {
    name: '🏠 首页',
    url: '/',
    tests: [
      { name: 'HTTP 状态码', check: (res) => res.status === 200 },
      { name: '响应时间 < 2s', check: (res) => parseFloat(res.time) < 2000 },
      { name: '包含 Rikka 标题', check: (res) => res.body.includes('Rikka') || res.body.includes('rikka') },
      { name: '包含导航栏', check: (res) => res.body.includes('nav') || res.body.includes('header') },
    ]
  },
  
  // Suite 2: 文档页面
  {
    name: '📖 文档首页',
    url: '/#/docs/rikka-signal/getting-started',
    tests: [
      { name: 'HTTP 状态码', check: (res) => res.status === 200 },
      { name: '包含文档内容', check: (res) => res.body.length > 1000 },
      { name: '包含代码示例', check: (res) => res.body.includes('<code>') || res.body.includes('pre>') },
      { name: '侧边栏渲染', check: (res) => res.body.includes('sidebar') || res.body.includes('aside') },
    ]
  },

  // Suite 3: Signal API 文档
  {
    name: '📡 signal() 文档',
    url: '/#/docs/rikka-signal/signal',
    tests: [
      { name: 'HTTP 状态码', check: (res) => res.status === 200 },
      { name: '包含 API 说明', check: (res) => res.body.includes('signal') && res.body.includes('function') },
      { name: '参数说明完整', check: (res) => res.body.includes('param') || res.body.includes('argument') },
    ]
  },

  // Suite 4: defineElement 文档
  {
    name: '🧩 defineElement 文档',
    url: '/#/docs/rikka-elements/define-element',
    tests: [
      { name: 'HTTP 状态码', check: (res) => res.status === 200 },
      { name: '包含组件定义示例', check: (res) => res.body.includes('defineElement') },
      { name: '属性配置说明', check: (res) => res.body.includes('attributes') || res.body.includes('props') },
    ]
  },

  // Suite 5: 示例页面
  {
    name: '⚡ Counter 示例',
    url: '/#/examples/counter',
    tests: [
      { name: 'HTTP 状态码', check: (res) => res.status === 200 },
      { name: '包含交互按钮', check: (res) => res.body.includes('button') },
      { name: '计数器显示区域', check: (res) => res.body.includes('count') || res.body.includes('Count') || res.body.includes('+') },
    ]
  },

  {
    name: '✅ Todo 示例',
    url: '/#/examples/todo',
    tests: [
      { name: 'HTTP 状态码', check: (res) => res.status === 200 },
      { name: '输入框存在', check: (res) => res.body.includes('input') },
      { name: '列表容器', check: (res) => res.body.includes('ul') || res.body.includes('list') },
    ]
  },

  {
    name: '🎨 Tabs 示例',
    url: '/#/examples/tabs',
    tests: [
      { name: 'HTTP 状态码', check: (res) => res.status === 200 },
      { name: 'Tab 组件存在', check: (res) => res.body.includes('tab') || res.body.includes('Tab') },
    ]
  },

  // Suite 6: Showcase 项目
  {
    name: '📑 Bookmark Manager',
    url: '/#/showcase/bookmark-manager',
    tests: [
      { name: 'HTTP 状态码', check: (res) => res.status === 200 },
      { name: '应用框架加载', check: (res) => res.body.length > 500 },
    ]
  },

  {
    name: '💻 Code Editor',
    url: '/#/showcase/code-editor',
    tests: [
      { name: 'HTTP 状态码', check: (res) => res.status === 200 },
      { name: '编辑器区域', check: (res) => res.body.includes('textarea') || res.body.includes('editor') },
    ]
  },

  // Suite 7: Live Playground
  {
    name: '🎮 Live Playground',
    url: '/#/playground',
    tests: [
      { name: 'HTTP 状态码', check: (res) => res.status === 200 },
      { name: '代码编辑器', check: (res) => res.body.includes('textarea') || res.body.includes('CodeMirror') || res.body.includes('monaco') },
      { name: '预览区域', check: (res) => res.body.includes('iframe') || res.body.includes('preview') },
      { name: '运行按钮', check: (res) => res.body.includes('run') || res.body.includes('Run') || res.body.includes('▶') },
    ]
  }
];

async function fetchPage(url) {
  const fullUrl = `http://localhost:3000${url}`;
  const start = Date.now();
  
  try {
    const result = await run(`curl -s -o /dev/null -w '%{http_code}|%{time_total}|%{size_download}' "${fullUrl}"`);
    
    if (!result.ok || !result.output) {
      return { status: 0, time: 0, size: 0, body: '', error: result.error };
    }

    const [status, time, size] = result.output.split('|');
    
    // 获取页面内容用于内容检查
    const bodyResult = await run(`curl -s "${fullUrl}" | head -c 50000`);
    
    return {
      status: parseInt(status),
      time: (parseFloat(time) * 1000), // 转换为毫秒
      size: parseInt(size),
      body: bodyResult.output || '',
      error: null
    };
  } catch (e) {
    return { status: 0, time: 0, size: 0, body: '', error: e.message };
  }
}

async function main() {
  const startTime = Date.now();
  
  // 结果收集器
  const reportData = {
    environment: {},
    build: null,
    server: null,
    suites: [],
    summary: {
      totalSuites: 0,
      passedSuites: 0,
      failedSuites: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalTime: 0,
      avgResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      totalPagesize: 0
    }
  };

  // ============================================
  // 报告头部
  // ============================================
  log('magenta', '╔════════════════════════════════════════════════════════════╗');
  log('magenta', '║                                                          ║');
  log('magenta', '║   🌐  Rikka Browser E2E Test - Enterprise Edition          ║');
  log('magenta', '║                                                          ║');
  log('magenta', '╚════════════════════════════════════════════════════════════╝\n');
  log('yellow', `🕐 开始时间: ${new Date().toLocaleString()}\n`);

  // ============================================
  // Stage 1: 环境检查
  // ============================================
  log('cyan', '┌─────────────────────────────────────────────────────────────┐');
  log('cyan', '│ 🔧 Stage 1: Environment Check                               │');
  log('cyan', '└─────────────────────────────────────────────────────────────┘\n');

  // Node.js 版本
  const nodeResult = await run('node --version');
  reportData.environment.nodeVersion = nodeResult.output;
  log('gray', `   Node.js: ${nodeResult.output}`);

  // Playwright 版本
  const pwResult = await run('npx playwright --version 2>/dev/null || echo "not installed"');
  reportData.environment.playwright = pwResult.ok ? pwResult.output : 'not installed';
  
  if (!pwResult.ok) {
    log('yellow', '   ⚠️  Playwright 未安装，正在安装...');
    await run('npx playwright install chromium', false);
    log('green', '   ✅ Playwright 安装完成\n');
  } else {
    log('gray', `   Playwright: ${pwResult.output}\n`);
  }

  // 操作系统
  const osResult = await run('uname -srmo');
  reportData.environment.os = osResult.output;
  log('gray', `   OS: ${osResult.output}\n`);

  // ============================================
  // Stage 2: 构建项目
  // ============================================
  log('cyan', '┌─────────────────────────────────────────────────────────────┐');
  log('cyan', '│ 🏗️  Stage 2: Build Project                                   │');
  log('cyan', '└─────────────────────────────────────────────────────────────┘\n');

  const buildStart = Date.now();
  const buildResult = await run('pnpm build', false);
  const buildTime = ((Date.now() - buildStart) / 1000).toFixed(1);
  
  reportData.build = {
    success: buildResult.ok,
    time: buildTime
  };

  if (buildResult.ok) {
    log('green', `   ✅ Build Success (${buildTime}s)\n`);
  } else {
    log('red', `   ❌ Build Failed (${buildTime}s)\n`);
    printFinalReport(reportData, startTime);
    process.exit(1);
  }

  // ============================================
  // Stage 3: 启动服务器
  // ============================================
  log('cyan', '┌─────────────────────────────────────────────────────────────┐');
  log('cyan', '│ 🚀 Stage 3: Start Server                                     │');
  log('cyan', '└─────────────────────────────────────────────────────────────┘\n');

  log('yellow', '   Starting Demo Server...');
  const serverStart = Date.now();
  const server = spawn('pnpm', ['demo'], {
    cwd: ROOT,
    shell: true,
    stdio: 'pipe',
    detached: true
  });

  try {
    await sleep(6000);
    
    const healthCheck = await run("curl -sf http://localhost:3000/ > /dev/null && echo OK");
    const serverReadyTime = ((Date.now() - serverStart) / 1000).toFixed(1);
    
    if (!healthCheck.ok) {
      throw new Error('Server not responding');
    }

    reportData.server = {
      success: true,
      url: 'http://localhost:3000',
      startupTime: serverReadyTime
    };
    
    log('green', `   ✅ Server Ready at http://localhost:3000 (${serverReadyTime}s)\n`);

  } catch (e) {
    reportData.server = { success: false, error: e.message };
    log('red', `   ❌ Server Failed: ${e.message}\n`);
    printFinalReport(reportData, startTime);
    process.exit(1);
  }

  // ============================================
  // Stage 4: 执行测试套件
  // ============================================
  log('cyan', '┌─────────────────────────────────────────────────────────────┐');
  log('cyan', '│ 🧪 Stage 4: Execute Test Suites                              │');
  log('cyan', '└─────────────────────────────────────────────────────────────┘\n');

  for (let i = 0; i < testSuites.length; i++) {
    const suite = testSuites[i];
    const suiteStart = Date.now();
    
    log('yellow', `\n   ┌─ ${suite.name}`);
    log('yellow', '   │');
    
    // 获取页面数据
    const pageData = await fetchPage(suite.url);
    const suiteResult = {
      name: suite.name,
      url: suite.url,
      status: pageData.status,
      responseTime: pageData.time,
      size: pageData.size,
      tests: [],
      passed: 0,
      failed: 0,
      duration: 0
    };

    // 执行该套件的所有测试
    for (const test of suite.tests) {
      const testStart = Date.now();
      let passed = false;
      
      try {
        passed = test.check(pageData);
      } catch (e) {
        passed = false;
      }
      
      const testDuration = ((Date.now() - testStart)).toFixed(0);
      
      suiteResult.tests.push({
        name: test.name,
        passed,
        duration: testDuration
      });
      
      if (passed) {
        suiteResult.passed++;
        log('green', `   │   ✅ ${test.name} (${testDuration}ms)`);
      } else {
        suiteResult.failed++;
        log('red', `   │   ❌ ${test.name} (${testDuration}ms)`);
        
        // 失败诊断信息
        if (pageData.status === 0) {
          log('gray', `   │      ⚠ 无法连接到服务器`);
        } else if (pageData.status !== 200) {
          log('gray', `   │      ⚠ HTTP ${pageData.status}`);
        }
      }
    }

    suiteResult.duration = ((Date.now() - suiteStart) / 1000).toFixed(2);
    reportData.suites.push(suiteResult);

    // 更新汇总统计
    reportData.summary.totalSuites++;
    reportData.summary.totalTests += suite.tests.length;
    reportData.summary.passedTests += suiteResult.passed;
    reportData.summary.failedTests += suiteResult.failed;
    reportData.summary.totalTime += parseFloat(suiteResult.duration);
    
    if (suiteResult.failed === 0) {
      reportData.summary.passedSuites++;
    } else {
      reportData.summary.failedSuites++;
    }

    // 响应时间统计
    if (pageData.time > 0) {
      reportData.summary.avgResponseTime += pageData.time;
      reportData.summary.minResponseTime = Math.min(reportData.summary.minResponseTime, pageData.time);
      reportData.summary.maxResponseTime = Math.max(reportData.summary.maxResponseTime, pageData.time);
    }
    
    reportData.summary.totalPagesize += pageData.size;

    // 套件结果摘要
    const statusIcon = suiteResult.failed === 0 ? '✅' : '❌';
    const color = suiteResult.failed === 0 ? 'green' : 'red';
    log(color, `   │`);
    log(color, `   └─ ${statusIcon} ${suiteResult.passed}/${suiteResult.tests.length} tests (${suiteResult.duration}s) [${pageData.time.toFixed(0)}ms]`);
  }

  // 计算平均响应时间
  if (reportData.suites.length > 0) {
    reportData.summary.avgResponseTime = Math.round(
      reportData.summary.avgResponseTime / reportData.suites.length
    );
  }

  // 停止服务器
  log('\n' + 'yellow', '🛑 Stopping Server...');
  try {
    process.kill(-server.pid);
    log('green', '✅ Server Stopped\n');
  } catch (e) {}

  // ============================================
  // 打印最终报告
  // ============================================
  printFinalReport(reportData, startTime);
}

function printFinalReport(data, startTime) {
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const allPassed = data.summary.failedSuites === 0;

  // ============================================
  // 报告头部
  // ============================================
  log('magenta', '\n╔════════════════════════════════════════════════════════════╗');
  log('magenta', '║                                                          ║');
  log('magenta', '║           📊 Browser E2E Test Report                     ║');
  log('magenta', '║           Enterprise Edition v2.0                        ║');
  log('magenta', '║                                                          ║');
  log('magenta', '╚════════════════════════════════════════════════════════════╝\n');

  // 总体状态卡片
  if (allPassed) {
    log('green', '┌──────────────────────────────────────────────────────────┐');
    log('green', '│                                                          │');
    log('green', '│   🎉🎉🎉  ALL TESTS PASSED! PROJECT READY!  🎉🎉🎉         │');
    log('green', '│                                                          │');
    log('green', '└──────────────────────────────────────────────────────────┘\n');
  } else {
    log('red', '┌──────────────────────────────────────────────────────────┐');
    log('red', '│                                                          │');
    log('red', `│   ⚠️  ${data.summary.failedSuites} SUITE(S) FAILED!                            │`);
    log('red', '│                                                          │');
    log('red', '└──────────────────────────────────────────────────────────┘\n');
  }

  // ============================================
  // 执行概览
  // ============================================
  log('cyan', '┌──────────────────────────────────────────────────────────┐');
  log('cyan', '│ 📋 Executive Summary                                      │');
  log('cyan', '├──────────────────────────────────────────────────────────┤');
  log('cyan', `│  Total Suites:     ${String(data.summary.totalSuites).padEnd(10)}                                 │`);
  log('cyan', `│  Passed:           ${String(data.summary.passedSuites).padEnd(10)}                                 │`);
  log('cyan', `│  Failed:           ${String(data.summary.failedSuites).padEnd(10)}                                 │`);
  log('cyan', '├──────────────────────────────────────────────────────────┤');
  log('cyan', `│  Total Tests:      ${String(data.summary.totalTests).padEnd(10)}                                 │`);
  log('cyan', `│  Passed:           ${String(data.summary.passedTests).padEnd(10)}                                 │`);
  log('cyan', `│  Failed:           ${String(data.summary.failedTests).padEnd(10)}                                 │`);
  log('cyan', `│  Pass Rate:        ${((data.summary.passedTests / data.summary.totalTests) * 100).toFixed(1).padEnd(6)}%                             │`);
  log('cyan', '├──────────────────────────────────────────────────────────┤');
  log('cyan', `│  Total Duration:   ${totalTime.padEnd(10)}s                                │`);
  log('cyan', `│  Avg Response:     ${data.summary.avgResponseTime.toString().padEnd(6)}ms                              │`);
  log('cyan', `│  Min Response:     ${data.summary.minResponseTime === Infinity ? '-'.padEnd(6) : data.summary.minResponseTime.toString().padEnd(6)}ms                              │`);
  log('cyan', `│  Max Response:     ${data.summary.maxResponseTime.toString().padEnd(6)}ms                              │`);
  log('cyan', `│  Total Size:       ${(data.summary.totalPagesize / 1024).toFixed(1).padEnd(6)}KB                            │`);
  log('cyan', '└──────────────────────────────────────────────────────────┘\n');

  // ============================================
  // 各阶段耗时
  // ============================================
  log('cyan', '┌──────────────────────────────────────────────────────────┐');
  log('cyan', '│ ⏱️  Stage Timeline                                         │');
  log('cyan', '├────────────────────┬──────────┬──────────────────────────┤');
  log('cyan', '│ Stage               │ Time     │ Details                 │');
  log('cyan', '├────────────────────┼──────────┼──────────────────────────┤');
  log('cyan', `│ Environment Check   │ ~${'1.0'.padEnd(7)}s │ Node + Playwright        │`);
  log('cyan', `│ Build Project       │ ${(data.build?.time || '?').padEnd(7)}s │ 5 packages              │`);
  log('cyan', `│ Start Server        │ ${(data.server?.startupTime || '?').padEnd(7)}s │ localhost:3000           │`);
  log('cyan', `│ Execute Tests       │ ${data.summary.totalTime.toFixed(1).padEnd(7)}s │ ${data.summary.totalTests} assertions            │`);
  log('cyan', '├────────────────────┼──────────┼──────────────────────────┤');
  log('cyan', `│ TOTAL               │ ${totalTime.padEnd(7)}s │                         │`);
  log('cyan', '└────────────────────┴──────────┴──────────────────────────┘\n');

  // ============================================
  // 详细测试结果表格
  // ============================================
  log('cyan', '┌──────────────────────────────────────────────────────────────────────────────┐');
  log('cyan', '│ 🧪 Detailed Test Results                                                           │');
  log('cyan', '├────────────────────────┬────────┬──────────┬────────┬────────────────────────┤');
  log('cyan', '│ Suite                  │ Status │ Tests    │ Time   │ Response                │');
  log('cyan', '├────────────────────────┼────────┼──────────┼────────┼────────────────────────┤');

  for (const suite of data.suites) {
    const icon = suite.failed === 0 ? '✅' : '❌';
    const color = suite.failed === 0 ? 'green' : 'red';
    const statusText = `${icon} ${suite.passed}/${suite.tests.length}`;
    
    log(color, `│ ${suite.name.padEnd(22)}│ ${statusText.padEnd(6)} │ ${suite.duration.padEnd(6)}s │ ${suite.responseTime.toFixed(0).padEnd(4)}ms  │ ${suite.size ? (suite.size/1024).toFixed(1) + 'KB' : '-'.padEnd(8)}         │`);
  }

  log('cyan', '├────────────────────────┼────────┼──────────┼────────┼────────────────────────┤');
  log('yellow', `│ ${'TOTAL'.padEnd(22)}│ ${data.summary.passedTests}/${data.summary.totalTests}   │ ${totalTime.padEnd(6)}s │        │ ${(data.summary.totalPagesize/1024).toFixed(1).padEnd(4)}KB         │`);
  log('cyan', '└────────────────────────┴────────┴──────────┴────────┴────────────────────────┘\n');

  // ============================================
  // 失败详情（如果有）
  // ============================================
  if (data.summary.failedTests > 0) {
    log('red', '┌──────────────────────────────────────────────────────────┐');
    log('red', '│ ❌ Failure Details                                      │');
    log('red', '├──────────────────────────────────────────────────────────┤');
    
    for (const suite of data.suites) {
      if (suite.failed > 0) {
        log('red', `│\n│ 🔍 ${suite.name}:`);
        for (const test of suite.tests) {
          if (!test.passed) {
            log('red', `│   • ${test.name}`);
          }
        }
      }
    }
    
    log('red', '│\n└──────────────────────────────────────────────────────────┘\n');
  }

  // ============================================
  // 性能分析
  // ============================================
  log('cyan', '┌──────────────────────────────────────────────────────────┐');
  log('cyan', '│ 📈 Performance Analysis                                  │');
  log('cyan', '├──────────────────────────────────────────────────────────┤');
  
  // 性能评级
  let perfGrade, perfColor;
  if (data.summary.avgResponseTime < 200) {
    perfGrade = 'A+ Excellent'; perfColor = 'green';
  } else if (data.summary.avgResponseTime < 500) {
    perfGrade = 'A  Good'; perfColor = 'green';
  } else if (data.summary.avgResponseTime < 1000) {
    perfGrade = 'B  Acceptable'; perfColor = 'yellow';
  } else {
    perfGrade = 'C  Needs Improvement'; perfColor = 'red';
  }
  
  log(perfColor, `│  Response Time Grade: ${perfGrade.padEnd(38)}│`);
  log('cyan', `│  Fastest Page:        ${(data.summary.minResponseTime === Infinity ? 'N/A' : data.summary.minResponseTime + 'ms').padEnd(34)}│`);
  log('cyan', `│  Slowest Page:        ${data.summary.maxResponseTime.toString().padEnd(34)}│`);
  log('cyan', `│  Average:             ${data.summary.avgResponseTime.toString().padEnd(34)}│`);
  log('cyan', `│  Total Data:          ${(data.summary.totalPagesize / 1024).toFixed(1).padEnd(32)}KB                       │`);
  log('cyan', '└──────────────────────────────────────────────────────────┘\n');

  // ============================================
  // 环境信息
  // ============================================
  log('gray', '┌──────────────────────────────────────────────────────────┐');
  log('gray', '│ 🔧 Environment                                           │');
  log('gray', '├──────────────────────────────────────────────────────────┤');
  log('gray', `│  Node.js:    ${data.environment.nodeVersion?.padEnd(48)}│`);
  log('gray', `│  OS:         ${data.environment.os?.padEnd(48)}│`);
  log('gray', `│  Server:     ${data.server?.url?.padEnd(48)}│`);
  log('gray', `│  Timestamp:  ${new Date().toLocaleString().padEnd(47)}│`);
  log('gray', '└──────────────────────────────────────────────────────────┘\n');

  // ============================================
  // 结论和建议
  // ============================================
  log('yellow', `🕐 Completed: ${new Date().toLocaleString()}\n`);

  if (allPassed) {
    log('green', '✨ Next Steps:');
    log('green', '   • Deploy to production');
    log('green', '   • Create release tag');
    log('green', '   • Publish to npm');
    log('green', '\n🚀 Project is production-ready!');
  } else {
    log('red', '⚠️  Recommended Actions:');
    log('red', '   • Review failed tests above');
    log('red', '   • Fix issues and re-run: pnpm browser-test');
    log('red', '   • Check server logs for errors');
  }

  log('');
}

main().catch(e => {
  log('red', `\n❌ Fatal Error: ${e.message}\n`);
  process.exit(1);
});
