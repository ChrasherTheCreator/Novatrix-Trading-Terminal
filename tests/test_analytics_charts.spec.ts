import { test, expect } from '@playwright/test';

test('test analytics charts interaction', async ({ page }) => {
  // 1. Setup logging
  const logs: string[] = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));

  // 2. Go to app
  await page.goto('http://localhost:5173/');
  
  // 3. Login
  await page.fill('input[type="email"]', 'demo@mail.com');
  await page.fill('input[type="password"]', 'test');
  await page.click('button[type="submit"]');

  // Wait for login to complete and dashboard to show
  await page.waitForSelector('.sidebar');

  // 4. Navigate to Analytics
  await page.click('button:has-text("Analytics")');
  await page.waitForSelector('.card-title:has-text("EQUITY PERFORMANCE")');

  // 5. Interact with Equity Chart
  const equityChart = page.locator('canvas').first();
  const box = await equityChart.boundingBox();
  if (box) {
    console.log('Interacting with Equity Chart...');
    // Move mouse across the chart
    for (let x = box.x + 70; x < box.x + box.width - 40; x += 20) {
      await page.mouse.move(x, box.y + box.height / 2);
      await page.waitForTimeout(100);
      // Check if tooltip appears
      const tooltip = page.locator('div:has-text("EQUITY: $")').first();
      const isVisible = await tooltip.isVisible();
      if (isVisible) {
        console.log(`Tooltip visible at x=${x}`);
      }
    }
  }

  // 6. Interact with Drawdown Chart
  const ddChart = page.locator('canvas').nth(1);
  const ddBox = await ddChart.boundingBox();
  if (ddBox) {
    console.log('Interacting with Drawdown Chart...');
    await page.mouse.move(ddBox.x + ddBox.width / 2, ddBox.y + ddBox.height / 2);
    await page.waitForTimeout(500);
    const ddTooltip = page.locator('div:has-text("DRAWDOWN: -")').first();
    expect(await ddTooltip.isVisible()).toBe(true);
  }

  await page.screenshot({ path: 'analytics_test_result.png', fullPage: true });

  console.log('Console Logs during test:');
  logs.forEach(log => console.log(log));
});
