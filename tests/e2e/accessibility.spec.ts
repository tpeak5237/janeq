import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import QRCode from 'qrcode';

for (const locale of ['en', 'th'] as const) for (const theme of ['light', 'dark'] as const) {
  test(`${locale} ${theme} accessible generation and scan feedback`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.addInitScript(l => localStorage.setItem('janeq-locale', l), locale);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await page.getByLabel(locale === 'en' ? 'Website address' : 'ลิงก์เว็บไซต์').fill('https://example.com/');
    await expect(page.getByTestId('qr-preview').locator('img')).toBeVisible();
    for (const state of ['create', 'scan']) {
      if (state === 'scan') {
        await page.locator('#mode-scan').click();
        await page.locator('.scanner-tabs [role=tab]').nth(1).click();
        await page.locator('input[type=file]').setInputFiles({ name: 'qr.png', mimeType: 'image/png', buffer: await QRCode.toBuffer('javascript:alert(1)', { margin: 4, width: 320 }) });
        await expect(page.locator('.scanner-unsafe')).toBeVisible({ timeout: 15_000 });
      }
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      await testInfo.attach(`${state}-axe`, { body: JSON.stringify(results.violations, null, 2), contentType: 'application/json' });
      expect(results.violations).toEqual([]);
    }
  });
}
