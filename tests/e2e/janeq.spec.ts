import { expect, test } from "@playwright/test";
import QRCode from "qrcode";

async function qrImageFile(value: string) {
  return {
    name: "janeq-test.png",
    mimeType: "image/png",
    buffer: await QRCode.toBuffer(value, { type: "png", margin: 4, width: 320 }),
  };
}

function blankImageFile() {
  return {
    name: "blank.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ),
  };
}

test.describe("JaneQ generator", () => {
  test("opens directly into the generator and exposes export actions", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/JaneQ/);
    await expect(page.getByRole("tab", { name: "Create QR" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.getByLabel("Website address").fill("example.com/classes?room=4");

    await expect(page.getByTestId("qr-preview").locator("img")).toBeVisible();
    await expect(page.locator(".payload-value")).toHaveText(
      "https://example.com/classes?room=4",
    );
    await expect(page.getByRole("button", { name: /^PNG$/ })).toBeEnabled();
    await expect(page.getByRole("button", { name: /^SVG$/ })).toBeEnabled();
  });

  test("builds a Wi-Fi code and keeps the privacy boundary visible", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Wi-Fi/ }).click();
    await page.getByLabel("Network name (SSID)").fill("Library Wi-Fi");
    await page.getByLabel("Password").fill("local-only-123");

    await expect(page.getByText(/WIFI:T:WPA/)).toBeVisible();
    await expect(
      page.getByText(/processed locally in this browser/),
    ).toBeVisible();
    await expect(page.getByTestId("qr-preview").locator("img")).toBeVisible();
  });

  test("generates a local PromptPay payment request with an optional amount", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /PromptPay/ }).click();

    await expect(page.getByLabel("PromptPay ID")).toBeVisible();
    await page.getByLabel("PromptPay ID").fill("081-234-5678");
    await page.getByLabel("Amount").fill("250.00");

    await expect(page.getByTestId("qr-preview").locator("img")).toBeVisible();
    await expect(page.locator(".payload-value")).toContainText("5406250.00");
    await expect(page.getByText("081 234 5678", { exact: true })).toBeVisible();
    await expect(page.getByText("฿250.00", { exact: true })).toBeVisible();
    await expect(page.getByText(/Generated locally in your browser/)).toBeVisible();
    await expect(
      page.getByText(/cannot verify whether a payment has been completed/),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Copy QR payload" }),
    ).toBeEnabled();

    await page.getByLabel("Amount").fill("");
    await expect(page.getByText("Amount entered by payer", { exact: true })).toBeVisible();
    await expect(page.locator(".payload-value")).not.toContainText("5406");
  });

  test("shows validation and remains usable with keyboard focus", async ({
    page,
  }) => {
    await page.goto("/");
    const urlField = page.getByLabel("Website address");
    await urlField.fill("https://");
    await expect(
      page.getByRole("region", { name: "QR code settings" }).getByRole("alert"),
    ).toContainText("valid website address");
    await urlField.focus();
    await expect(urlField).toBeFocused();
  });

  test("switches modes without requesting the camera until asked", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Scan QR" }).click();
    await expect(page.locator("#utility-heading")).toHaveText("Scan QR");
    await expect(page.getByText("Ready to start the camera")).toBeVisible();

    await page.getByRole("tab", { name: "Create QR" }).click();
    await expect(page.getByLabel("Website address")).toBeVisible();
  });

  test("shows the permission-denied state without crashing", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: {
          getUserMedia: async () => {
            throw new DOMException("Permission denied", "NotAllowedError");
          },
        },
      });
    });
    await page.goto("/");
    await page.getByRole("tab", { name: "Scan QR" }).click();
    await page.getByRole("button", { name: "Start camera" }).click();
    await expect(
      page.getByText(/Camera permission was denied/),
    ).toBeVisible();
  });

  test("decodes an uploaded QR image and offers explicit safe link actions", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Scan QR" }).click();
    await page.getByRole("tab", { name: "Upload image" }).click();
    await page.locator('input[type="file"]').setInputFiles(
      await qrImageFile("https://example.com/janeq-test"),
    );

    await expect(
      page.getByRole("region", { name: "QR scanner" }).getByText("QR detected").last(),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("example.com", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open link" })).toHaveAttribute(
      "href",
      "https://example.com/janeq-test",
    );
    await expect(page.getByText("https://example.com/janeq-test")).toBeVisible();
  });

  test("does not offer an Open link action for javascript payloads", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Scan QR" }).click();
    await page.getByRole("tab", { name: "Upload image" }).click();
    await page.locator('input[type="file"]').setInputFiles(
      await qrImageFile("javascript:alert(1)"),
    );

    await expect(
      page.getByRole("region", { name: "QR scanner" }).getByText("QR detected").last(),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("javascript:alert(1)")).toBeVisible();
    await expect(page.getByRole("link", { name: "Open link" })).toHaveCount(0);
  });

  test("shows a clear no-result state for an image without a QR code", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Scan QR" }).click();
    await page.getByRole("tab", { name: "Upload image" }).click();
    await page.locator('input[type="file"]').setInputFiles(blankImageFile());

    await expect(page.getByText("No QR code found in this image.")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("stacks the workspace on a narrow screen", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
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
    await page.goto("/");
    await page.getByRole("button", { name: "Switch to Thai" }).click();

    await expect(page.locator("html")).toHaveAttribute("lang", "th");
    await expect(page.getByRole("heading", { name: "สร้าง QR" })).toBeVisible();
    await expect(page.getByLabel("ลิงก์เว็บไซต์")).toBeVisible();
    await page.getByLabel("ลิงก์เว็บไซต์").fill("example.com");
    await expect(page.locator(".payload-value")).toHaveText(
      "https://example.com/",
    );

    await page.getByRole("button", { name: "เปลี่ยนเป็นภาษาอังกฤษ" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});
