import { test, expect } from '@playwright/test';

test('debug sessions blackscreen', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));

  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);

  console.log('Navigating to Sessions...');
  await page.click('button:has-text("Sessions")');
  
  await page.waitForTimeout(3000);
  
  console.log('Console Logs for Sessions:');
  logs.forEach(log => console.log(log));
  
  await page.screenshot({ path: 'sessions_blackscreen_debug.png' });
});
