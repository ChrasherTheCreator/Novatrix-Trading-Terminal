import { test, expect } from '@playwright/test';

test('force login and debug watchlist', async ({ page }) => {
  // 1. Setup console monitoring
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
    else console.log(`BROWSER LOG: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`PAGE EXCEPTION: ${err.message}`);
  });

  // 2. Go to App
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  // 3. Try to register/login if modal is visible
  const emailInput = page.locator('input[placeholder*="email"]');
  if (await emailInput.count() > 0) {
    console.log('Login modal detected. Attempting login...');
    await emailInput.fill('tester@example.com');
    await page.locator('input[placeholder*="password"]').fill('password123');
    await page.click('button:has-text("Log In"), button:has-text("Sign In")');
    await page.waitForTimeout(3000);
  }

  // 4. Navigate to Watchlist
  console.log('Navigating to Watchlist...');
  const watchlistBtn = page.locator('button:has-text("Watchlist"), [title="Watchlist"]');
  await watchlistBtn.click();
  await page.waitForTimeout(3000);

  // 5. Check for the specific error
  const bodyText = await page.innerText('body');
  if (bodyText.includes('failed to render')) {
    console.log('!!! CONFIRMED: Component failed to render error is visible on screen !!!');
  }

  // 6. Final screenshot
  await page.screenshot({ path: 'watchlist_final_debug.png', fullPage: true });
});
