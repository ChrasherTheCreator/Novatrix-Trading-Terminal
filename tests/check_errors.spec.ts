import { test, expect } from '@playwright/test';

test('check for js errors', async ({ page }) => {
  const errors: any[] = [];
  page.on('pageerror', err => {
    errors.push(err);
    console.log('PAGE ERROR:', err.message);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(5000);
  
  console.log('Navigating to Calendar...');
  // Click on Calendar link in sidebar
  await page.click('text=Economic Calendar');
  await page.waitForTimeout(3000);
  
  expect(errors.length).toBe(0);
});
