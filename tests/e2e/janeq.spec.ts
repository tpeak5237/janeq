import { expect, test } from "@playwright/test";

test.describe("JaneQ generator", () => {
  test("generates a direct URL code and exposes export actions", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/JaneQ/);
    await page.getByRole("link", { name: "Create a QR code" }).click();
    await page.getByLabel("Website address").fill("example.com/classes?room=4");

    await expect(page.getByTestId("qr-preview").locator("img")).toBeVisible();
    await expect(page.locator(".payload-value")).toHaveText(
      "https://example.com/classes?room=4",
    );
    await expect(page.getByRole("button", { name: /^PNG$/ })).toBeEnabled();
    await expect(page.getByRole("button", { name: /^SVG$/ })).toBeEnabled();
    await expect(
      page
        .locator(".preview-meta")
        .getByText("✓ Direct payload", { exact: true }),
    ).toBeVisible();
  });

  test("builds a Wi-Fi code and keeps the privacy boundary visible", async ({
    page,
  }) => {
    await page.goto("/#generator");
    await page.getByRole("button", { name: /Wi-Fi/ }).click();
    await page.getByLabel("Network name (SSID)").fill("Library Wi-Fi");
    await page.getByLabel("Password").fill("local-only-123");

    await expect(page.getByText(/WIFI:T:WPA/)).toBeVisible();
    await expect(
      page.getByText(/processed locally in this browser/),
    ).toBeVisible();
    await expect(page.getByTestId("qr-preview").locator("img")).toBeVisible();
  });

  test("shows validation and remains usable with keyboard focus", async ({
    page,
  }) => {
    await page.goto("/#generator");
    const urlField = page.getByLabel("Website address");
    await urlField.fill("https://");
    await expect(
      page.getByRole("region", { name: "QR code settings" }).getByRole("alert"),
    ).toContainText("valid website address");
    await urlField.focus();
    await expect(urlField).toBeFocused();
  });

  test("stacks the workspace on a narrow screen", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/#generator");
    await expect(
      page.getByRole("heading", { name: "Your direct code" }),
    ).toBeVisible();
    await expect(page.locator("body")).toHaveCSS("overflow-x", "visible");
  });

  test("switches the interface to Thai and keeps generation working", async ({
    page,
  }) => {
    await page.addInitScript(() =>
      window.localStorage.removeItem("janeq-locale"),
    );
    await page.goto("/#generator");
    await page.getByRole("button", { name: "Switch to Thai" }).click();

    await expect(page.locator("html")).toHaveAttribute("lang", "th");
    await expect(
      page.getByRole("heading", { name: "ทำไม QR โค้ดต้องมีโฆษณาคั่นกลาง?" }),
    ).toBeVisible();
    await expect(page.getByLabel("ลิงก์เว็บไซต์")).toBeVisible();
    await page.getByLabel("ลิงก์เว็บไซต์").fill("example.com");
    await expect(page.locator(".payload-value")).toHaveText(
      "https://example.com/",
    );

    await page.getByRole("button", { name: "เปลี่ยนเป็นภาษาอังกฤษ" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});
