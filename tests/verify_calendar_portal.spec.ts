import { test, expect } from '@playwright/test';

test('verify economic calendar modal scroll lock and centering via portal', async ({ page }) => {
  await page.goto('http://localhost:5174/');
  
  // Navigate to Calendar tab
  await page.click('button:has-text("CALENDAR")');
  await page.waitForTimeout(1000);

  // Scroll down to find an event at the bottom
  await page.evaluate(() => {
    const pageArea = document.querySelector('.page-area');
    if (pageArea) {
        pageArea.scrollTop = pageArea.scrollHeight;
    }
  });
  await page.waitForTimeout(500);

  // Click an event
  const events = page.locator('tbody tr');
  await events.first().click();
  await page.waitForTimeout(500);

  // Modal is now in document.body via Portal
  const modal = page.locator('body > div >> .card:has-text("EVENT DETAILS")');
  await expect(modal).toBeVisible();

  // Verify Centering
  const boundingBox = await modal.boundingBox();
  const viewportSize = page.viewportSize();
  if (boundingBox && viewportSize) {
    const modalCenterY = boundingBox.y + boundingBox.height / 2;
    const viewportCenterY = viewportSize.height / 2;
    console.log(`Modal Center Y: ${modalCenterY}, Viewport Center Y: ${viewportCenterY}`);
    expect(Math.abs(modalCenterY - viewportCenterY)).toBeLessThan(50);
  }

  // Verify Scroll Lock
  const overflow = await page.evaluate(() => {
    const pageArea = document.querySelector('.page-area');
    return pageArea ? window.getComputedStyle(pageArea).overflowY : 'not found';
  });
  console.log(`Page Area Overflow: ${overflow}`);
  expect(overflow).toBe('hidden');

  await page.screenshot({ path: 'calendar_portal_test.png' });
});
