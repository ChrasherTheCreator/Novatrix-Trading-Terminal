import { test, expect } from '@playwright/test';

test('debug session timer on dashboard', async ({ page }) => {
  const timerValues: string[] = [];
  
  await page.goto('http://localhost:5173/');
  
  // 1. Login
  await page.fill('input[type="email"]', 'demo@mail.com');
  await page.fill('input[type="password"]', 'test');
  await page.click('button[type="submit"]');

  // 2. Wait for dashboard
  await page.waitForSelector('.sidebar');
  
  // 3. Monitor Timer for 15 seconds
  console.log('Monitoring timer for 15s...');
  for (let i = 0; i < 15; i++) {
    const timerText = await page.innerText('div[style*="font-size: 2.5rem"]');
    console.log(`T=${i}s: Timer is ${timerText}`);
    timerValues.push(timerText);
    await page.waitForTimeout(1000);
  }

  // 4. Validate movement
  const uniqueValues = new Set(timerValues);
  console.log(`Unique values captured: ${uniqueValues.size}`);
  
  if (uniqueValues.size < 10) {
    console.error('CRITICAL: Timer is stalling! Not enough unique values.');
  } else {
    console.log('Timer seems to be ticking in Playwright environment.');
  }

  await page.screenshot({ path: 'timer_debug.png' });
});
