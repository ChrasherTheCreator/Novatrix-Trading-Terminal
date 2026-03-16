import { test, expect } from '@playwright/test';

test('verify economic calendar modal scroll lock and centering', async ({ page }) => {
  await page.goto('http://localhost:5174/');
  
  // Navigate to Calendar tab
  await page.click('button:has-text("CALENDAR")');
  await page.waitForTimeout(1000);

  // Scroll down to find an event at the bottom
  await page.evaluate(() => {
    const pageArea = document.querySelector('.page-area');
    if (pageArea) pageArea.scrollTop = pageArea.scrollHeight;
  });
  await page.waitForTimeout(500);

  // Click the last event in the list
  const events = page.locator('tbody tr');
  const lastEvent = events.last();
  await lastEvent.click();
  await page.waitForTimeout(500);

  // Check if modal is visible
  const modal = page.locator('.card:has-text("EVENT DETAILS")');
  await expect(modal).toBeVisible();

  // Verify positioning - should be in viewport
  const boundingBox = await modal.boundingBox();
  const viewportSize = page.viewportSize();
  if (boundingBox && viewportSize) {
    // Center of modal should be roughly center of viewport
    const modalCenterY = boundingBox.y + boundingBox.height / 2;
    const viewportCenterY = viewportSize.height / 2;
    console.log(`Modal Center Y: ${modalCenterY}, Viewport Center Y: ${viewportCenterY}`);
    expect(Math.abs(modalCenterY - viewportCenterY)).toBeLessThan(100);
  }

  // Verify scroll lock on .page-area
  const overflow = await page.evaluate(() => {
    const pageArea = document.querySelector('.page-area');
    return pageArea ? window.getComputedStyle(pageArea).overflowY : 'not found';
  });
  console.log(`Page Area Overflow: ${overflow}`);
  expect(overflow).toBe('hidden');

  await page.screenshot({ path: 'calendar_modal_test.png' });
});
