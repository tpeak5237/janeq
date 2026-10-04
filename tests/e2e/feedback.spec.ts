import { expect, test } from '@playwright/test';
import QRCode from 'qrcode';
import { readFile } from 'node:fs/promises';

test('keyboard selection and disclosure stay immediate and focus-visible', async ({ page }) => {
  await page.goto('/');
  const text = page.getByRole('button', { name: /^Text/ });
  await page.getByRole('button', { name: /^Website/ }).focus();
  await page.keyboard.press('Tab');
  await expect(text).toBeFocused();
  await page.keyboard.press('Space');
  await expect(text).toHaveAttribute('aria-pressed', 'true');
  await expect(text).not.toHaveCSS('box-shadow', 'none');
  const disclosure = page.locator('.control-disclosure summary').first();
  await disclosure.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.control-disclosure').first()).toHaveAttribute('open', '');
  await expect(page.locator('.disclosure-icon').first()).toHaveCSS('transition-duration', '0.14s');
});

test('rapid input ends at the latest QR and invalid input disables export', async ({ page }) => {
  await page.goto('/');
  const field = page.getByLabel('Website address');
  for (const value of ['example.com/first', 'example.com/second', 'example.com/final']) await field.fill(value);
  const qr = page.getByTestId('qr-preview').locator('img');
  await expect(qr).toBeVisible();
  await page.locator('.payload-disclosure summary').click();
  await expect(page.locator('.payload-value')).toHaveText('https://example.com/final');
  await field.fill('https://');
  await expect(page.getByRole('button', { name: /^PNG$/ })).toBeDisabled();
  await expect(qr).toHaveCount(0);
  await field.fill('example.com/recovered');
  await expect(page.getByRole('button', { name: /^PNG$/ })).toBeEnabled();
  await expect(page.locator('.payload-value')).toHaveText('https://example.com/recovered');
});

for (const rejected of [false, true]) {
  test(`clipboard ${rejected ? 'failure' : 'success'} shows persistent feedback without moving exports`, async ({ page }) => {
    await page.addInitScript(fail => Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => { if (fail) throw new DOMException('Blocked', 'NotAllowedError'); } },
    }), rejected);
    await page.goto('/');
    await page.getByLabel('Website address').fill('example.com');
    const copy = page.getByRole('button', { name: 'Copy content', exact: true });
    const png = page.getByRole('button', { name: /^PNG$/ });
    await expect(png).toBeEnabled();
    const before = await png.evaluate(e => (e as HTMLElement).offsetTop);
    await copy.click();
    await expect(page.locator('.status-message')).toContainText(rejected ? /clipboard|blocked/i : /copied/i);
    expect(await png.evaluate(e => (e as HTMLElement).offsetTop)).toBe(before);
  });
}

test('PNG export round-trips through the real local image decoder and SVG downloads', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Website address').fill('example.com/export');
  const png = page.getByRole('button', { name: /^PNG$/ });
  await expect(png).toBeEnabled();
  const pendingPng = page.waitForEvent('download');
  await png.click();
  const download = await pendingPng;
  const path = await download.path();
  expect(path).not.toBeNull();
  const pendingSvg = page.waitForEvent('download');
  await page.getByRole('button', { name: /^SVG$/ }).click();
  expect((await pendingSvg).suggestedFilename()).toMatch(/\.svg$/);
  await page.locator('#mode-scan').click();
  await page.getByRole('tab', { name: 'Upload image' }).click();
  await page.locator('input[type=file]').setInputFiles({ name: download.suggestedFilename(), mimeType: 'image/png', buffer: await readFile(path!) });
  await expect(page.locator('.scanner-result-value')).toHaveText('https://example.com/export');
});

test('duplicate camera detections and theme/language changes do not replay acknowledgment', async ({ page }) => {
  const image = await QRCode.toDataURL('https://example.com/camera', { margin: 4, width: 320 });
  await page.addInitScript(source => {
    const state = { acknowledgments: 0 };
    Object.assign(window, { scanFeedbackTest: state });
    document.addEventListener('animationstart', e => { if ((e.target as Element)?.classList.contains('scanner-result-indicator')) state.acknowledgments++; });
    class TestDetector {
      static async getSupportedFormats() { return ['qr_code']; }
      async detect() { return [{ rawValue: 'https://example.com/camera', cornerPoints: [] }, { rawValue: 'https://example.com/camera', cornerPoints: [] }]; }
    }
    Object.assign(window, { BarcodeDetector: TestDetector });
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: {
      enumerateDevices: async () => [],
      getUserMedia: async () => {
        const image = new Image();
        image.src = source;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 320;
        canvas.getContext('2d')!.drawImage(image, 0, 0);
        const stream = canvas.captureStream(30);
        window.setInterval(() => canvas.getContext('2d')!.drawImage(image, 0, 0), 30);
        return stream;
      },
    } });
  }, image);
  await page.goto('/');
  await page.locator('#mode-scan').click();
  await page.getByRole('button', { name: 'Start camera' }).click();
  await expect(page.locator('.scanner-result-value')).toHaveText('https://example.com/camera');
  await expect.poll(() => page.evaluate(() => (window as unknown as { scanFeedbackTest: { acknowledgments: number } }).scanFeedbackTest.acknowledgments)).toBe(1);
  await page.getByRole('button', { name: /Switch to dark mode/ }).click();
  await page.getByRole('button', { name: 'Switch to Thai' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'th');
  await expect(page.locator('.scanner-result-value')).toHaveText('https://example.com/camera');
  expect(await page.evaluate(() => (window as unknown as { scanFeedbackTest: { acknowledgments: number } }).scanFeedbackTest.acknowledgments)).toBe(1);
  await page.locator('.scanner-actions button').last().click();
  await expect(page.locator('.scanner-result-value')).toHaveCount(0);
});
