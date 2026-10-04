import { expect, test } from '@playwright/test';
import QRCode from 'qrcode';

for (const locale of ['en', 'th'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    for (const motion of ['no-preference', 'reduce'] as const) {
      test(`${locale} ${theme} ${motion} utility evidence`, async ({ page }, testInfo) => {
        await page.emulateMedia({ colorScheme: theme, reducedMotion: motion });
        await page.addInitScript(l => localStorage.setItem('janeq-locale', l), locale);
        await page.goto('/');
        await page.evaluate(() => document.fonts.ready);
        await page.getByLabel(locale === 'en' ? 'Website address' : 'ลิงก์เว็บไซต์').fill('https://theerapat.org/janeq');
        const qr = page.getByTestId('qr-preview').locator('img');
        await expect(qr).toBeVisible();
        // QR pixels are font/platform independent; every variant shares this golden.
        await expect(qr).toHaveScreenshot('qr-code.png', { animations: 'disabled' });
        for (const [state, prepare] of [
          ['create', async () => {}],
          ['scanner-empty', async () => { await page.locator('#mode-scan').click(); }],
          ['scanner-unsafe', async () => {
            await page.locator('.scanner-tabs [role=tab]').nth(1).click();
            await page.locator('input[type=file]').setInputFiles({ name: 'unsafe.png', mimeType: 'image/png', buffer: await QRCode.toBuffer('javascript:alert(1)', { margin: 4, width: 320 }) });
            await expect(page.locator('.scanner-unsafe')).toBeVisible();
          }],
        ] as const) {
          await prepare();
          const path = testInfo.outputPath(`${state}.png`);
          await page.screenshot({ path, fullPage: true, animations: 'disabled' });
          await testInfo.attach(state, { path, contentType: 'image/png' });
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        }
      });
    }
  }
}
