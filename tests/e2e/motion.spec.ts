import { expect, test } from '@playwright/test';
import QRCode from 'qrcode';

const imageFile = async (value: string) => ({ name: 'qr.png', mimeType: 'image/png', buffer: await QRCode.toBuffer(value, { width: 320, margin: 4 }) });
async function upload(page: import('@playwright/test').Page, value: string) {
  await page.goto('/');
  await page.locator('#mode-scan').click();
  await page.getByRole('tab', { name: 'Upload image' }).click();
  await page.locator('input[type=file]').setInputFiles(await imageFile(value));
  await expect(page.locator('.scanner-result-value')).toHaveText(value);
}

test('controls consume canonical motion tokens and press immediately', async ({ page }) => {
  await page.goto('/');
  const button = page.locator('.language-button');
  await expect(button).toHaveCSS('transition-duration', '0.14s, 0.14s, 0.14s, 0.14s, 0.14s');
  const tokens = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return ['--motion-fast', '--motion-normal', '--motion-slow', '--ease-standard'].map(t => s.getPropertyValue(t).trim());
  });
  expect(tokens.slice(0, 3).map(t => parseFloat(t) * (t.endsWith('ms') ? 1 : 1000))).toEqual([140, 240, 420]);
  expect(tokens[3].match(/[\d.]+/g)?.map(Number)).toEqual([0.22, 1, 0.36, 1]);
  await button.hover();
  await page.mouse.down();
  expect(await button.evaluate(e => getComputedStyle(e).transform)).toBe('matrix(1, 0, 0, 1, 0, 1)');
  await page.mouse.move(0, 0);
  await page.mouse.up();
  await expect(button).toHaveCSS('transform', 'none');
});

test('scanner acknowledgment never fades warnings, payload or actions', async ({ page }) => {
  await upload(page, 'javascript:alert(1)');
  await expect(page.locator('.scanner-result-panel')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.scanner-result-panel')).toHaveCSS('opacity', '1');
  await expect(page.locator('.scanner-unsafe')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open link' })).toHaveCount(0);
  await expect(page.locator('.scanner-result-indicator')).toHaveCSS('animation-duration', '0.14s');
  await expect(page.getByRole('button', { name: 'Scan another' })).toBeEnabled();
  await page.getByRole('button', { name: 'Scan another' }).click();
  await expect(page.locator('.scanner-result-value')).toHaveCount(0);
});

test('mobile scanner reserves empty, safe and unsafe result space', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.locator('#mode-scan').click();
  const panel = page.locator('.scanner-result-panel');
  const height = (await panel.boundingBox())!.height;
  expect(height).toBeGreaterThanOrEqual(448);
  await page.getByRole('tab', { name: 'Upload image' }).click();
  for (const value of ['https://example.com/', 'javascript:alert(1)']) {
    await page.locator('input[type=file]').setInputFiles(await imageFile(value));
    await expect(page.locator('.scanner-result-value')).toHaveText(value);
    expect((await panel.boundingBox())!.height).toBeCloseTo(height, 0);
    await page.getByRole('button', { name: 'Scan another' }).click();
    expect((await panel.boundingBox())!.height).toBeCloseTo(height, 0);
  }
});

test('reduced motion removes animation and press displacement while keeping scan actions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const button = page.locator('.language-button');
  await button.hover();
  await page.mouse.down();
  expect(await button.evaluate(e => getComputedStyle(e).transform)).toBe('none');
  await page.mouse.move(0, 0);
  await page.mouse.up();
  await upload(page, 'https://example.com/');
  await expect(page.locator('.scanner-result-indicator')).toHaveCSS('animation-name', 'none');
  await expect(page.getByRole('link', { name: 'Open link' })).toHaveAttribute('href', 'https://example.com/');
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
});

test('QR pixels remain static and export feedback does not move actions', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Website address').fill('example.com');
  const qr = page.getByTestId('qr-preview').locator('img');
  await expect(qr).toBeVisible();
  await expect(qr).toHaveCSS('animation-name', 'none');
  await expect(qr).toHaveCSS('opacity', '1');
  const button = page.getByRole('button', { name: /^PNG$/ });
  const before = await button.evaluate(e => (e as HTMLElement).offsetTop);
  const downloaded = page.waitForEvent('download');
  await button.click();
  await downloaded;
  await expect(page.locator('.status-message')).not.toBeEmpty();
  expect(await button.evaluate(e => (e as HTMLElement).offsetTop)).toBeCloseTo(before, 0);
});

test('system theme initializes from preferences and narrow enlarged Thai content stays usable', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Switch to Thai' }).click();
  await page.setViewportSize({ width: 320, height: 812 });
  await page.evaluate(() => document.documentElement.style.fontSize = '200%');
  await page.locator('#mode-scan').click();
  await page.getByRole('tab', { name: 'เลือกรูป' }).click();
  const value = 'javascript:' + 'ก'.repeat(100);
  await page.locator('input[type=file]').setInputFiles(await imageFile(value));
  await expect(page.locator('.scanner-result-value')).toHaveText(value);
  // px-sized payload/feedback text does not inherit a root rem increase.
  // Explicitly double it to exercise text resizing as well as rem geometry.
  await page.locator('.scanner-result-value, .scanner-unsafe, .scanner-copy-notice, .scanner-result-panel .action-button').evaluateAll(elements => {
    for (const element of elements) (element as HTMLElement).style.fontSize = `${parseFloat(getComputedStyle(element).fontSize) * 2}px`;
  });
  await expect(page.locator('.scanner-unsafe')).toHaveCSS('font-size', '24px');
  await expect(page.locator('.scanner-unsafe')).toBeVisible();
  expect(await page.locator('.scanner-unsafe').evaluate(e => e.scrollHeight <= e.clientHeight)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('.scanner-result-value').evaluate(e => e.scrollHeight > e.clientHeight)).toBe(true);
  await expect(page.locator('.scanner-copy-notice')).toHaveCSS('overflow', 'visible');
  const beforeNotice = (await page.locator('.scanner-result-panel').boundingBox())!.height;
  // Synthetic expanded-localization fixture, never a real user payload.
  await page.locator('.scanner-copy-notice').evaluate(e => e.textContent = 'ข้อความแจ้งผลที่ยาวขึ้นต้องอ่านได้ครบและไม่ถูกตัด '.repeat(12));
  expect((await page.locator('.scanner-result-panel').boundingBox())!.height).toBeGreaterThan(beforeNotice);
  expect(await page.locator('.scanner-copy-notice').evaluate(e => e.scrollHeight <= e.clientHeight)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('.scanner-result-panel .action-button').first()).toHaveCSS('font-size', '22px');
});

test('touch controls acknowledge selection without delaying scanner reset', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Uses the mobile project touch context');
  await page.goto('/');
  await page.locator('#mode-scan').tap();
  await page.getByRole('tab', { name: 'Upload image' }).tap();
  await page.locator('input[type=file]').setInputFiles(await imageFile('https://example.com/'));
  await expect(page.locator('.scanner-result-value')).toHaveText('https://example.com/');
  await page.getByRole('button', { name: 'Scan another' }).tap();
  await expect(page.locator('.scanner-result-value')).toHaveCount(0);
});
