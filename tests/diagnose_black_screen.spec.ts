import { test, expect } from '@playwright/test';

test('diagnose black screen', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(`[${msg.type()}] ${text}`);
    console.log(`BROWSER [${msg.type()}]: ${text}`);
  });
  page.on('pageerror', err => {
    logs.push(`[RUNTIME_ERROR] ${err.message}\n${err.stack}`);
    console.error(`BROWSER RUNTIME_ERROR: ${err.message}\n${err.stack}`);
  });
  page.on('requestfailed', request => {
    console.log(`BROWSER REQUEST_FAILED: ${request.url()} - ${request.failure()?.errorText}`);
  });

  console.log('Navigating to http://localhost:5174/ ...');
  await page.goto('http://localhost:5174/');
  
  console.log('Waiting 10 seconds for app to settle...');
  await page.waitForTimeout(10000);
  
  const content = await page.content();
  console.log(`Page content length: ${content.length}`);
  
  await page.screenshot({ path: 'blackscreen_final_debug.png', fullPage: true });
  console.log('Screenshot saved to blackscreen_final_debug.png');
});
