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

async function revealPayload(page: import("@playwright/test").Page) {
  const payload = page.locator(".payload-value");
  if (await payload.isVisible()) return payload;
  await page.locator(".payload-disclosure summary").click();
  await expect(payload).toBeVisible();
  return payload;
}

async function trackImageObjectUrls(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const state = { created: [] as string[], revoked: [] as string[] };
    const createObjectUrl = URL.createObjectURL.bind(URL);
    const revokeObjectUrl = URL.revokeObjectURL.bind(URL);
    Object.defineProperty(window, "__imageObjectUrls", { value: state });
    URL.createObjectURL = (blob) => {
      const url = createObjectUrl(blob);
      state.created.push(url);
      return url;
    };
    URL.revokeObjectURL = (url) => {
      state.revoked.push(url);
      revokeObjectUrl(url);
    };
  });
}

async function delayNativeQrDetection(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const state: {
      started: boolean;
      resolve: (() => void) | null;
    } = { started: false, resolve: null };
    Object.defineProperty(window, "__controlledQrDetection", { value: state });
    class ControlledBarcodeDetector {
      static async getSupportedFormats() {
        return ["qr_code"];
      }

      async detect() {
        state.started = true;
        return new Promise<Array<{
          rawValue: string;
          cornerPoints: Array<{ x: number; y: number }>;
        }>>((resolve) => {
          state.resolve = () => resolve([{
            rawValue: "https://example.com/late-image-result",
            cornerPoints: [],
          }]);
        });
      }
    }
    Object.defineProperty(window, "BarcodeDetector", {
      configurable: true,
      value: ControlledBarcodeDetector,
    });
  });
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
    await expect(await revealPayload(page)).toHaveText(
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

    await expect(await revealPayload(page)).toContainText("WIFI:T:WPA");
    await expect(page.getByTestId("wifi-privacy")).toHaveText(
      "Stays on this device.",
    );
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
    await expect(await revealPayload(page)).toContainText("5406250.00");
    await expect(page.getByText("081 234 5678", { exact: true })).toBeVisible();
    await expect(page.getByText("฿250.00", { exact: true })).toBeVisible();
    await expect(page.getByTestId("promptpay-disclaimer")).toContainText(
      "cannot confirm whether payment succeeded",
    );
    await expect(
      page.getByRole("button", { name: "Copy payload" }),
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
    await expect(page.getByText("Start the camera to scan")).toBeVisible();

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

  test("shows the unavailable-camera state when the browser has no camera API", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: {},
      });
    });
    await page.goto("/");
    await page.getByRole("tab", { name: "Scan QR" }).click();
    await page.getByRole("button", { name: "Start camera" }).click();

    await expect(
      page.getByText("This browser does not support camera access."),
    ).toBeVisible();
  });

  test("shows the no-camera state when no camera is available", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: {
          getUserMedia: async () => {
            throw new DOMException("No camera available", "NotFoundError");
          },
        },
      });
    });
    await page.goto("/");
    await page.getByRole("tab", { name: "Scan QR" }).click();
    await page.getByRole("button", { name: "Start camera" }).click();

    await expect(page.getByText("No camera was found on this device."))
      .toBeVisible();
  });

  test("stops a late camera stream after cancelling the permission request", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const camera = { resolve: null as null | ((stream: unknown) => void), stopCount: 0 };
      Object.defineProperty(window, "__cameraTest", {
        configurable: false,
        value: camera,
      });
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: {
          getUserMedia: () => new Promise((resolve) => {
            camera.resolve = resolve;
          }),
        },
      });
    });
    await page.goto("/");
    await page.getByRole("tab", { name: "Scan QR" }).click();
    await page.getByRole("button", { name: "Start camera" }).click();
    await expect(page.getByText("Requesting camera permission…")).toBeVisible();
    await page.getByRole("button", { name: "Stop camera" }).click();
    await expect(page.getByText("Start the camera to scan")).toBeVisible();

    await page.evaluate(() => {
      const camera = (window as typeof window & {
        __cameraTest: { resolve: (stream: unknown) => void; stopCount: number };
      }).__cameraTest;
      camera.resolve({
        getTracks: () => [{ stop: () => { camera.stopCount += 1; } }],
      });
    });

    await expect.poll(() => page.evaluate(() =>
      (window as typeof window & { __cameraTest: { stopCount: number } })
        .__cameraTest.stopCount,
    )).toBe(1);
    await expect(page.getByText("Start the camera to scan")).toBeVisible();
  });

  test("stops a late camera stream when navigating away from the scanner", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const camera = { resolve: null as null | ((stream: unknown) => void), stopCount: 0 };
      Object.defineProperty(window, "__cameraTest", {
        configurable: false,
        value: camera,
      });
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: {
          getUserMedia: () => new Promise((resolve) => {
            camera.resolve = resolve;
          }),
        },
      });
    });
    await page.goto("/");
    await page.getByRole("tab", { name: "Scan QR" }).click();
    await page.getByRole("button", { name: "Start camera" }).click();
    await expect(page.getByText("Requesting camera permission…")).toBeVisible();
    await page.getByRole("tab", { name: "Create QR" }).click();
    await expect(page.getByLabel("Website address")).toBeVisible();

    await page.evaluate(() => {
      const camera = (window as typeof window & {
        __cameraTest: { resolve: (stream: unknown) => void; stopCount: number };
      }).__cameraTest;
      camera.resolve({
        getTracks: () => [{ stop: () => { camera.stopCount += 1; } }],
      });
    });

    await expect.poll(() => page.evaluate(() =>
      (window as typeof window & { __cameraTest: { stopCount: number } })
        .__cameraTest.stopCount,
    )).toBe(1);
    await expect(page.getByLabel("Website address")).toBeVisible();
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
    await expect(page.getByRole("link", { name: "Open link" })).toHaveAttribute(
      "target",
      "_blank",
    );
    await expect(page).toHaveURL("http://127.0.0.1:3000/");
    await expect(page.getByText("https://example.com/janeq-test")).toBeVisible();
  });

  test("keeps active URL schemes inert and does not navigate automatically", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Scan QR" }).click();
    await page.getByRole("tab", { name: "Upload image" }).click();
    let popupCount = 0;
    page.on("popup", () => {
      popupCount += 1;
    });

    for (const payload of [
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "file:///etc/passwd",
      "vbscript:msgbox(1)",
      "blob:https://example.com/1234",
    ]) {
      await page.locator('input[type="file"]').setInputFiles(await qrImageFile(payload));
      await expect(page.locator(".scanner-result-value")).toHaveText(payload, {
        timeout: 15_000,
      });
      await expect(page.getByText("This is not a web link")).toBeVisible();
      await expect(page.getByRole("link", { name: "Open link" })).toHaveCount(0);
      await expect(page).toHaveURL("http://127.0.0.1:3000/");
      await expect.poll(() => popupCount).toBe(0);
      if (payload !== "blob:https://example.com/1234") {
        await page.getByRole("button", { name: "Scan another" }).click();
      }
    }
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

  test("rejects invalid and oversized images without creating previews", async ({
    page,
  }) => {
    await trackImageObjectUrls(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "Scan QR" }).click();
    await page.getByRole("tab", { name: "Upload image" }).click();
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: "not-an-image.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("synthetic invalid image fixture"),
    });
    await expect(page.getByText("The scanner could not start. Try another camera or image."))
      .toBeVisible();
    await expect(fileInput).toHaveValue("");

    await fileInput.setInputFiles({
      name: "oversized.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(20 * 1024 * 1024 + 1),
    });
    await expect(page.getByText("The scanner could not start. Try another camera or image."))
      .toBeVisible();
    await expect(fileInput).toHaveValue("");
    await expect.poll(() => page.evaluate(() =>
      (window as typeof window & {
        __imageObjectUrls: { created: string[]; revoked: string[] };
      }).__imageObjectUrls.created.length,
    )).toBe(0);
  });

  test("reselects the same image and revokes each preview when replaced or navigated away", async ({
    page,
  }) => {
    await trackImageObjectUrls(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "Scan QR" }).click();
    await page.getByRole("tab", { name: "Upload image" }).click();
    const fileInput = page.locator('input[type="file"]');
    const file = await qrImageFile("https://example.com/repeated-selection");

    for (const expectedCreated of [1, 2]) {
      await fileInput.setInputFiles(file);
      await expect(page.locator(".scanner-result-value")).toHaveText(
        "https://example.com/repeated-selection",
        { timeout: 15_000 },
      );
      await expect.poll(() => page.evaluate(() =>
        (window as typeof window & {
          __imageObjectUrls: { created: string[]; revoked: string[] };
        }).__imageObjectUrls.created.length,
      )).toBe(expectedCreated);
      await expect.poll(() => page.evaluate(() =>
        (window as typeof window & {
          __imageObjectUrls: { created: string[]; revoked: string[] };
        }).__imageObjectUrls.revoked.length,
      )).toBe(expectedCreated - 1);
    }

    await page.getByRole("tab", { name: "Create QR" }).click();
    await expect(page.getByLabel("Website address")).toBeVisible();
    await expect.poll(() => page.evaluate(() =>
      (window as typeof window & {
        __imageObjectUrls: { created: string[]; revoked: string[] };
      }).__imageObjectUrls.revoked.length,
    )).toBe(2);
  });

  test("cancels an in-flight image decode when switching back to camera", async ({
    page,
  }) => {
    await trackImageObjectUrls(page);
    await delayNativeQrDetection(page);
    await page.goto("/");
    await page.getByRole("tab", { name: "Scan QR" }).click();
    await page.getByRole("tab", { name: "Upload image" }).click();
    await page.locator('input[type="file"]').setInputFiles(
      await qrImageFile("https://example.com/image-that-will-be-cancelled"),
    );
    await page.waitForFunction(() =>
      (window as typeof window & {
        __controlledQrDetection: { started: boolean };
      }).__controlledQrDetection.started,
    );

    await page.getByRole("tab", { name: "Camera" }).click();
    await expect(page.getByText("Start the camera to scan")).toBeVisible();
    await expect.poll(() => page.evaluate(() =>
      (window as typeof window & {
        __imageObjectUrls: { created: string[]; revoked: string[] };
      }).__imageObjectUrls.revoked.length,
    )).toBe(1);

    await page.evaluate(() => {
      const state = (window as typeof window & {
        __controlledQrDetection: { resolve: (() => void) | null };
      }).__controlledQrDetection;
      state.resolve?.();
    });
    await expect(page.getByText("Start the camera to scan")).toBeVisible();
    await expect(page.locator(".scanner-result-value")).toHaveCount(0);
  });

  test("stacks the workspace on a narrow screen", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Preview" }),
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
    await expect(await revealPayload(page)).toHaveText("https://example.com/");

    await page.getByRole("button", { name: "เปลี่ยนเป็นภาษาอังกฤษ" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("keeps language and theme controls usable when browser storage is blocked", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        get() {
          throw new DOMException("Storage access is denied", "SecurityError");
        },
      });
    });
    await page.goto("/");

    await expect(page).toHaveTitle(/JaneQ/);
    await page.getByRole("button", { name: "Switch to Thai" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "th");
    await page.getByRole("button", { name: "เปลี่ยนเป็นโหมดมืด" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});
