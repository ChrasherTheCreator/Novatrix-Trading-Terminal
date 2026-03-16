import { test, expect } from '@playwright/test';

test('check news categories', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  
  // Wait for the app to hydrate and potentially fetch data
  await page.waitForTimeout(5000);
  
  // Look for the category buttons
  const cryptoBtn = page.getByRole('button', { name: 'CRYPTO' });
  const forexBtn = page.getByRole('button', { name: 'FOREX' });
  
  const isCryptoVisible = await cryptoBtn.isVisible();
  const isForexVisible = await forexBtn.isVisible();
  
  console.log(`CRYPTO button visible: ${isCryptoVisible}`);
  console.log(`FOREX button visible: ${isForexVisible}`);
  
  await page.screenshot({ path: 'news_categories_check.png', fullPage: true });
  
  if (!isCryptoVisible) {
    console.log('Categories NOT found. Current page content might be stale or failing.');
    const content = await page.content();
    console.log(`Content length: ${content.length}`);
  }
});
