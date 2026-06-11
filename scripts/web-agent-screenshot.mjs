/**
 * Playwright screenshot script for Rikka Web Agent — WebLLM integration test.
 * Usage: node scripts/web-agent-screenshot.mjs
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = 'http://localhost:3003';
const OUT = path.resolve('./web-agent-screenshots');
fs.mkdirSync(OUT, { recursive: true });

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });
  const page = await ctx.newPage();

  // Collect console errors
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  try {
    // 1. Homepage with agent FAB
    console.log('Navigating to homepage...');
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: `${OUT}/01-homepage.png`, fullPage: false });
    console.log('✓ Screenshot: 01-homepage.png');

    // 2. Open the agent FAB
    const fab = page.locator('rikka-app').locator('pierce/.agent-fab');
    if (await fab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fab.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${OUT}/02-agent-open.png`, fullPage: false });
      console.log('✓ Screenshot: 02-agent-open.png');
    } else {
      console.log('⚠ Agent FAB not visible (WebMCP may not be available)');
    }

    // 3. Open settings overlay
    const settingsBtn = page.locator('rikka-web-agent').locator('pierce/.wa-icon-btn').first();
    if (await settingsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await settingsBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${OUT}/03-settings-overlay.png`, fullPage: false });
      console.log('✓ Screenshot: 03-settings-overlay.png');

      // 4. Check the access mode selector
      const selectEl = page.locator('rikka-web-agent').locator('pierce/select');
      if (await selectEl.isVisible({ timeout: 2000 }).catch(() => false)) {
        await selectEl.selectOption('webllm');
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${OUT}/04-settings-webllm.png`, fullPage: false });
        console.log('✓ Screenshot: 04-settings-webllm.png');

        // 5. Check if model selector is visible
        const modelSelect = page.locator('rikka-web-agent').locator('pierce/select').nth(1);
        if (await modelSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
          await page.screenshot({ path: `${OUT}/05-model-select.png`, fullPage: false });
          console.log('✓ Screenshot: 05-model-select.png');
        }
      }
    } else {
      console.log('⚠ Settings button not visible');
    }

    // Report errors
    if (errors.length > 0) {
      console.log('\n⚠ Console errors detected:');
      errors.forEach((e) => console.log('  -', e));
    } else {
      console.log('\n✓ No console errors');
    }
  } catch (err) {
    console.error('Error during test:', err.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
