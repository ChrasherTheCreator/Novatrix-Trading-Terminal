import { test, expect } from '@playwright/test';

test('systematic debug of watchlist rendering', async ({ page }) => {
  const browserLogs: string[] = [];
  
  // Capture all logs and errors
  page.on('console', msg => {
    browserLogs.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    browserLogs.push(`PAGE ERROR: ${err.message}\nStack: ${err.stack}`);
  });

  // 1. Go to app
  console.log('Navigating to app...');
  try {
    await page.goto('http://localhost:5173', { timeout: 10000 });
  } catch (e) {
    console.log('Could not reach frontend. Is npm run dev running?');
    return;
  }

  // 2. Wait for hydration/loading
  await page.waitForTimeout(3000);

  // 3. Automated Login Bypass (if possible)
  const isAuthVisible = await page.isVisible('text=Login');
  if (isAuthVisible) {
    console.log('Login required. Filling credentials...');
    await page.fill('input[type="email"], input[placeholder*="email"]', 'tester@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Log In"), button:has-text("Sign In")');
    await page.waitForTimeout(3000);
  }

  // 4. Navigate to Watchlist
  console.log('Clicking Watchlist button...');
  const watchlistBtn = page.locator('button:has-text("Watchlist"), [title="Watchlist"]');
  if (await watchlistBtn.isVisible()) {
    await watchlistBtn.click();
    console.log('Navigated to Watchlist.');
  } else {
    console.log('Watchlist button not found. Checking if already on page...');
  }

  // 5. Wait for the crash to happen
  await page.waitForTimeout(5000);

  // 6. Capture State
  await page.screenshot({ path: 'blackscreen_final_debug.png', fullPage: true });
  
  // 7. Extract Error Information from the UI if present
  const errorElement = page.locator('text=failed to render, text=Something went wrong');
  if (await errorElement.isVisible()) {
    const errorText = await errorElement.innerText();
    console.log('--- UI ERROR DETECTED ---');
    console.log(errorText);
  }

  console.log('--- FULL BROWSER LOGS ---');
  browserLogs.forEach(log => console.log(log));
  
  // Save logs to file for me to read
  const fs = require('fs');
  fs.writeFileSync('browser_crash_report.txt', browserLogs.join('\n'));
});
