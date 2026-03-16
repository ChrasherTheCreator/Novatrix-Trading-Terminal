import { test, expect } from '@playwright/test';

test('diagnose news feed and market data', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:5173');
  
  // Wait for hydration
  await page.waitForTimeout(3000);
  
  // 1. Take a screenshot of the initial dashboard/watchlist
  await page.screenshot({ path: 'news_feed_debug.png', fullPage: true });
  
  // 2. Check for "Component failed to render" error message
  const errorText = await page.innerText('body');
  if (errorText.includes('failed to render') || errorText.includes('Error')) {
    console.log('CRITICAL: Render error detected!');
  }

  // 3. Check Watchlist specifically
  const watchlistBtn = page.locator('button:has-text("Watchlist")');
  if (await watchlistBtn.count() > 0) {
    await watchlistBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'watchlist_debug.png', fullPage: true });
  }

  // 4. Capture console logs
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
});
