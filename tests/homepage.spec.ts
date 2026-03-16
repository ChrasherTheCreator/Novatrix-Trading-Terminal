import { test, expect } from '@playwright/test';

test('Prüfe, ob die Startseite lädt und der Button funktioniert', async ({ page }) => {
  // 1. Gehe zu deiner lokalen URL (oder dem ngrok-Link)
  await page.goto('http://localhost:5173'); 

  // 2. Prüfe, ob der Titel stimmt
  await expect(page).toHaveTitle(/Vite/);

  // 3. Einen Button finden (z.B. über den Text) und klicken
  const meinButton = page.getByRole('button', { name: 'Klick mich' });
  await meinButton.click();

  // 4. Prüfen, ob nach dem Klick etwas passiert (z.B. ein Text erscheint)
  const erfolgsMeldung = page.locator('text=Erfolgreich geklickt');
  await expect(erfolgsMeldung).toBeVisible();
});