import { test, expect } from '@playwright/test';

test('debug blackscreen and analytics', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));

  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(3000);

  console.log('Console Logs:');
  logs.forEach(log => console.log(log));
  
  await page.screenshot({ path: 'blackscreen_final_debug.png' });
});
