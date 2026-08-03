import { expect, test } from "@playwright/test";

test.describe("JaneQ visual evidence", () => {
  test("captures the desktop utility state", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Website address").fill("https://theerapat.org/janeq");
    await expect(page.getByTestId("qr-preview").locator("img")).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: "docs/screenshots/janeq-desktop.png", fullPage: true });
  });

  test("captures the mobile utility state", async ({ browser }) => {
    const page = await browser.newPage({ isMobile: true, viewport: { width: 375, height: 812 } });
    await page.goto("/");
    await page.getByLabel("Website address").fill("https://theerapat.org/janeq");
    await expect(page.getByTestId("qr-preview").locator("img")).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: "docs/screenshots/janeq-mobile.png", fullPage: true });
    await page.close();
  });

  test("captures the dark theme state", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Website address").fill("https://theerapat.org/janeq");
    await page.getByRole("button", { name: /Switch to dark mode/ }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: "docs/screenshots/janeq-dark.png", fullPage: true });
  });

  test("captures the Thai mobile state", async ({ browser }) => {
    const page = await browser.newPage({ isMobile: true, viewport: { width: 375, height: 812 } });
    await page.goto("/#generator");
    await page.getByRole("button", { name: "Switch to Thai" }).click();
    await page.getByLabel("ที่อยู่เว็บไซต์").fill("https://theerapat.org/janeq");
    await expect(page.getByTestId("qr-preview").locator("img")).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: "docs/screenshots/janeq-thai-mobile.png", fullPage: true });
    await page.close();
  });
});
