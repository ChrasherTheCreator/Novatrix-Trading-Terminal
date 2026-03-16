import { test, expect } from '@playwright/test';

test('debug white screen', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));

  await page.goto('http://localhost:5173/');
  
  // Wait for potential app hydration
  await page.waitForTimeout(3000);
  
  console.log('Console Logs during white screen:');
  logs.forEach(log => console.log(log));
  
  await page.screenshot({ path: 'white_screen_debug.png' });
});
