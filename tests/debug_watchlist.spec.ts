import { test, expect } from '@playwright/test';

test('debug watchlist rendering and console errors', async ({ page }) => {
  const logs: string[] = [];
  const errors: string[] = [];

  page.on('console', msg => {
    const text = msg.text();
    logs.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') errors.push(text);
  });

  page.on('pageerror', err => {
    errors.push(`PAGE ERROR: ${err.message}`);
  });

  // Navigate to the app
  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173');
  
  // Wait for login or main app to load
  await page.waitForTimeout(5000);

  // Go to Watchlist
  console.log('Attempting to click Watchlist button...');
  const watchlistBtn = page.locator('button:has-text("Watchlist")');
  if (await watchlistBtn.count() > 0) {
    await watchlistBtn.click();
    console.log('Watchlist clicked.');
  } else {
    console.log('Watchlist button not found, checking if already on page or if sidebar is visible.');
    await page.screenshot({ path: 'debug_initial_state.png' });
  }

  // Wait for rendering and data
  await page.waitForTimeout(5000);

  // Take a full page screenshot
  await page.screenshot({ path: 'watchlist_error_debug.png', fullPage: true });

  console.log('--- BROWSER LOGS ---');
  logs.forEach(l => console.log(l));

  if (errors.length > 0) {
    console.log('--- CRITICAL ERRORS DETECTED ---');
    errors.forEach(e => console.error(e));
  } else {
    console.log('No critical JS errors detected in console.');
  }

  // Final check for the specific "failed to render" text
  const content = await page.content();
  if (content.includes('failed to render')) {
    console.log('MATCH FOUND: "failed to render" text exists on page.');
  }
});
