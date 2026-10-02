import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import QRCode from "qrcode";

async function qrImageFile(value: string) {
  return {
    name: "janeq-test.png",
    mimeType: "image/png",
    buffer: await QRCode.toBuffer(value, { type: "png", margin: 4, width: 320 }),
  };
}

function pngWithTextChunk(png: Buffer, metadata: string) {
  const type = Buffer.from("tEXt");
  const data = Buffer.concat([Buffer.from("Comment\0"), Buffer.from(metadata)]);
  const crcInput = Buffer.concat([type, data]);
  let crc = 0xffffffff;
  for (const byte of crcInput) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 1) === 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  crc = (crc ^ 0xffffffff) >>> 0;

  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc);
  const chunk = Buffer.concat([length, type, data, checksum]);
  const iendStart = png.length - 12;
  return Buffer.concat([png.subarray(0, iendStart), chunk, png.subarray(iendStart)]);
}

function qrLogoFileWithMetadata(metadata: string) {
  const png = blankImageFile().buffer;
  return {
    name: "synthetic-logo.png",
    mimeType: "image/png",
    buffer: pngWithTextChunk(png, metadata),
  };
}

async function rasterizeSvg(page: import("@playwright/test").Page, svg: string) {
  const bytes = await page.evaluate(async (source) => {
    const objectUrl = URL.createObjectURL(
      new Blob([source], { type: "image/svg+xml;charset=utf-8" }),
    );
    try {
      const image = new Image();
      image.src = objectUrl;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas rendering is unavailable.");
      context.drawImage(image, 0, 0);
      const png = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) =>
          blob ? resolve(blob) : reject(new Error("PNG export failed.")),
          "image/png",
        );
      });
      return Array.from(new Uint8Array(await png.arrayBuffer()));
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }, svg);
  return Buffer.from(bytes);
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

async function expectNoWcagViolations(page: import("@playwright/test").Page) {
  await page.waitForTimeout(250);
  const violations = await page.evaluate(async () => {
    type Axe = {
      run: (
        context: Document,
        options: unknown,
      ) => Promise<{
        violations: Array<{
          id: string;
          impact: string | null;
          nodes: Array<{ target: string[] }>;
        }>;
      }>;
    };
    const axe = (window as typeof window & { axe: Axe }).axe;
    const results = await axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
    });
    return results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      targets: violation.nodes.map((node) => node.target),
    }));
  });
  expect(violations).toEqual([]);
}

async function trackImageObjectUrls(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const state = { created: [] as string[], revoked: [] as string[] };
    const trackedUrls = new Set<string>();
    const createObjectUrl = URL.createObjectURL.bind(URL);
    const revokeObjectUrl = URL.revokeObjectURL.bind(URL);
    Object.defineProperty(window, "__imageObjectUrls", { value: state });
    URL.createObjectURL = (blob) => {
      const url = createObjectUrl(blob);
      if (blob instanceof File) {
        state.created.push(url);
        trackedUrls.add(url);
      }
      return url;
    };
    URL.revokeObjectURL = (url) => {
      if (trackedUrls.delete(url)) state.revoked.push(url);
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

async function hasCreatedImageObjectUrl(
  page: import("@playwright/test").Page,
  url: string,
) {
  return page.evaluate((trackedUrl) =>
    (window as typeof window & {
      __imageObjectUrls: { created: string[]; revoked: string[] };
    }).__imageObjectUrls.created.includes(trackedUrl),
  url);
}

async function hasRevokedImageObjectUrl(
  page: import("@playwright/test").Page,
  url: string,
) {
  return page.evaluate((trackedUrl) =>
    (window as typeof window & {
      __imageObjectUrls: { created: string[]; revoked: string[] };
    }).__imageObjectUrls.revoked.includes(trackedUrl),
  url);
}

async function delayFirstLogoDecode(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const descriptor = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      "src",
    );
    if (!descriptor?.get || !descriptor.set) return;

    const state: {
      started: boolean;
      release: (() => void) | null;
    } = { started: false, release: null };
    Object.defineProperty(window, "__delayedLogoDecode", { value: state });
    let delayed = false;
    Object.defineProperty(HTMLImageElement.prototype, "src", {
      configurable: true,
      enumerable: descriptor.enumerable,
      get: descriptor.get,
      set(value: string) {
        if (!delayed && value.startsWith("data:image/svg+xml")) {
          delayed = true;
          state.started = true;
          state.release = () => descriptor.set?.call(this, value);
          return;
        }
        descriptor.set?.call(this, value);
      },
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
    const pngButton = page.getByRole("button", { name: /^PNG$/ });
    await pngButton.focus();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      pngButton.press("Enter"),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.png$/);
    await expect(pngButton).toBeFocused();
    await expect(page.getByText("PNG downloaded.")).toBeVisible();
  });

  test("ignores a cancelled QR render when an older logo decode finishes late", async ({
    page,
  }) => {
    await delayFirstLogoDecode(page);
    await page.goto("/");
    await page
      .locator(".control-disclosure")
      .filter({
        has: page.locator("button").filter({ hasText: "theerapat.org mark" }),
      })
      .locator("summary")
      .click();
    await page.getByRole("button", { name: "theerapat.org mark" }).click();
    await page.getByLabel("Website address").fill("https://example.com/first");

    await expect
      .poll(() =>
        page.evaluate(() =>
          (window as typeof window & {
            __delayedLogoDecode: { started: boolean };
          }).__delayedLogoDecode.started,
        ),
      )
      .toBe(true);

    const website = page.getByLabel("Website address");
    await website.fill("https://example.com/latest");
    await expect(await revealPayload(page)).toHaveText(
      "https://example.com/latest",
    );
    const preview = page.getByTestId("qr-preview").locator("img");
    await expect(preview).toBeVisible();
    const latestPreview = await preview.getAttribute("src");

    await page.evaluate(() => {
      (window as typeof window & {
        __delayedLogoDecode: { release: (() => void) | null };
      }).__delayedLogoDecode.release?.();
    });

    await expect(preview).toHaveAttribute("src", latestPreview!);
    await expect(page.getByRole("button", { name: /^PNG$/ })).toBeEnabled();
    await expect(page.getByRole("button", { name: /^SVG$/ })).toBeEnabled();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /^SVG$/ }).click(),
    ]);
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    await expect(await readFile(downloadPath!, "utf8")).toBe(
      decodeURIComponent(latestPreview!.split(",")[1]),
    );
  });

  test("exports inert, decodable QR files from hostile text and logo metadata", async ({
    page,
  }) => {
    const hostileText = '</svg><script>alert("synthetic")</script>& + %2F';
    const hostileMetadata = 'marker <script onload="alert(1)"> & closing tag </svg>';
    await page.goto("/");
    await page
      .getByRole("group", { name: "QR code type" })
      .getByRole("button", { name: "Text" })
      .click();
    await page.getByLabel("Text").fill(hostileText);
    await page
      .locator(".control-disclosure")
      .filter({
        has: page.locator('input[accept="image/png,image/jpeg,image/webp"]'),
      })
      .locator("summary")
      .click();
    await page
      .locator('input[accept="image/png,image/jpeg,image/webp"]')
      .setInputFiles(await qrLogoFileWithMetadata(hostileMetadata));
    await expect(page.getByText("synthetic-logo.png")).toBeVisible();
    await expect(page.getByRole("button", { name: /^SVG$/ })).toBeEnabled();

    const preview = page.getByTestId("qr-preview").locator("img");
    await expect(preview).toBeVisible();
    const previewUrl = await preview.getAttribute("src");
    expect(previewUrl).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
    const previewSvg = decodeURIComponent(previewUrl!.split(",")[1]);
    const embeddedLogo = previewSvg.match(
      /<image href="data:image\/png;base64,([^"]+)"/,
    )?.[1];
    expect(embeddedLogo).toBeTruthy();
    expect(Buffer.from(embeddedLogo!, "base64").includes(Buffer.from(hostileMetadata)))
      .toBe(false);
    expect(previewSvg).not.toContain(hostileText);
    expect(previewSvg).not.toContain(hostileMetadata);
    expect(previewSvg).not.toContain("<script");
    expect(previewSvg).not.toContain("onload=");

    const [svgDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /^SVG$/ }).click(),
    ]);
    const svgPath = await svgDownload.path();
    expect(svgPath).toBeTruthy();
    const downloadedSvg = await readFile(svgPath!, "utf8");
    expect(downloadedSvg).toBe(previewSvg);

    const [pngDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /^PNG$/ }).click(),
    ]);
    const pngPath = await pngDownload.path();
    expect(pngPath).toBeTruthy();
    const downloadedPng = await readFile(pngPath!);
    const rasterizedSvg = await rasterizeSvg(page, downloadedSvg);

    await page.getByRole("tab", { name: "Scan QR" }).click();
    await page.getByRole("tab", { name: "Upload image" }).click();
    const scanInput = page.locator('input[type="file"]');
    await scanInput.setInputFiles({
      name: "generated.png",
      mimeType: "image/png",
      buffer: downloadedPng,
    });
    await expect(page.locator(".scanner-result-value")).toHaveText(hostileText, {
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "Scan another" }).click();
    await scanInput.setInputFiles({
      name: "generated-from-svg.png",
      mimeType: "image/png",
      buffer: rasterizedSvg,
    });
    await expect(page.locator(".scanner-result-value")).toHaveText(hostileText, {
      timeout: 15_000,
    });
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
    const createTab = page.getByRole("tab", { name: "Create QR" });
    await createTab.focus();
    await createTab.press("ArrowRight");
    const scanTab = page.getByRole("tab", { name: "Scan QR" });
    await expect(scanTab).toHaveAttribute("aria-selected", "true");
    await expect(scanTab).toBeFocused();
    await expect(page.locator("#utility-heading")).toHaveText("Scan QR");
    await expect(page.getByText("Start the camera to scan")).toBeVisible();

    const cameraTab = page.getByRole("tab", { name: "Camera" });
    await cameraTab.focus();
    await cameraTab.press("ArrowRight");
    const uploadTab = page.getByRole("tab", { name: "Upload image" });
    await expect(uploadTab).toHaveAttribute("aria-selected", "true");
    await expect(uploadTab).toBeFocused();
    await uploadTab.press("ArrowLeft");
    await expect(cameraTab).toHaveAttribute("aria-selected", "true");
    await expect(cameraTab).toBeFocused();

    await scanTab.focus();
    await scanTab.press("ArrowLeft");
    await expect(createTab).toHaveAttribute("aria-selected", "true");
    await expect(createTab).toBeFocused();
    await expect(page.getByLabel("Website address")).toBeVisible();
  });

  test("announces camera permission failure and keeps keyboard focus", async ({ page }) => {
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
    await page.addScriptTag({
      path: resolve(process.cwd(), "node_modules/axe-core/axe.min.js"),
    });
    await expectNoWcagViolations(page);
    await page.getByRole("button", { name: "Switch to dark mode" }).click();
    await expectNoWcagViolations(page);
    await page.getByRole("button", { name: "Switch to light mode" }).click();
    await page.getByRole("button", { name: /PromptPay/ }).click();
    await page.getByLabel("PromptPay ID").fill("081-234-5678");
    await expectNoWcagViolations(page);
    await page.getByRole("tab", { name: "Scan QR" }).click();
    await expectNoWcagViolations(page);
    const startCamera = page.getByRole("button", { name: "Start camera" });
    await startCamera.focus();
    await startCamera.press("Enter");
    const status = page.locator(".scanner-status");
    await expect(status).toContainText("Camera permission was denied");
    await expect(status).toHaveAttribute("aria-live", "polite");
    await expect(page.getByRole("button", { name: "Start camera" })).toBeFocused();
    await expectNoWcagViolations(page);

    await page.getByRole("tab", { name: "Upload image" }).click();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(await qrImageFile("https://example.com/a11y-result"));
    await expect(page.locator(".scanner-result-value")).toHaveText(
      "https://example.com/a11y-result",
      { timeout: 15_000 },
    );
    await expectNoWcagViolations(page);

    const scanAnother = page.getByRole("button", { name: "Scan another" });
    await scanAnother.focus();
    await scanAnother.press("Enter");
    await expect(fileInput).toBeFocused();
    await expectNoWcagViolations(page);
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
    await expect(page.getByRole("button", { name: "Start camera" })).toBeFocused();

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
    const scanAnother = page.getByRole("button", { name: "Scan another" });
    await scanAnother.focus();
    await scanAnother.press("Enter");
    await expect(page.locator('input[type="file"]')).toBeFocused();
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

    const previewUrls: string[] = [];
    for (let selection = 0; selection < 2; selection += 1) {
      const previousPreviewUrl = previewUrls.at(-1);
      await fileInput.setInputFiles(file);
      await expect(fileInput).toHaveValue("");
      await expect.poll(() => page.locator('img[alt="Selected QR image preview"]')
        .getAttribute("src")).not.toBe(previousPreviewUrl);
      await expect(page.locator(".scanner-result-value")).toHaveText(
        "https://example.com/repeated-selection",
        { timeout: 15_000 },
      );
      const previewUrl = await page.locator('img[alt="Selected QR image preview"]')
        .getAttribute("src");
      expect(previewUrl).toBeTruthy();
      previewUrls.push(previewUrl as string);
      await expect.poll(() => hasCreatedImageObjectUrl(page, previewUrl as string))
        .toBe(true);
      if (previousPreviewUrl) {
        await expect.poll(() => hasRevokedImageObjectUrl(page, previousPreviewUrl))
          .toBe(true);
      }
    }

    await page.getByRole("tab", { name: "Create QR" }).click();
    await expect(page.getByLabel("Website address")).toBeVisible();
    await expect.poll(() => hasRevokedImageObjectUrl(page, previewUrls[1]))
      .toBe(true);
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
    const previewUrl = await page.locator('img[alt="Selected QR image preview"]')
      .getAttribute("src");
    expect(previewUrl).toBeTruthy();

    await page.getByRole("tab", { name: "Camera" }).click();
    await expect(page.getByText("Start the camera to scan")).toBeVisible();
    await expect(page.locator('img[alt="Selected QR image preview"]')).toHaveCount(0);
    await expect.poll(() => hasRevokedImageObjectUrl(page, previewUrl as string))
      .toBe(true);

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


  test("keeps quota-limited language changes and cross-tab updates in sync", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const nativeSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === "janeq-locale") {
          throw new DOMException("Storage quota is exhausted", "QuotaExceededError");
        }
        nativeSetItem.call(this, key, value);
      };
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Switch to Thai" }).click();

    await expect(page.locator("html")).toHaveAttribute("lang", "th");
    await expect(page.getByRole("button", { name: "เปลี่ยนเป็นภาษาอังกฤษ" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "สร้าง QR" })).toBeVisible();

    const otherPage = await page.context().newPage();
    await otherPage.goto("/");
    await otherPage.evaluate(() => window.localStorage.setItem("janeq-locale", "en"));

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("button", { name: "Switch to Thai" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Create QR" })).toBeVisible();
    await otherPage.close();
  });

  test("keeps the current synthetic scan visible when local storage is denied", async ({
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
    await page.getByRole("tab", { name: "Scan QR" }).click();
    await page.getByRole("tab", { name: "Upload image" }).click();
    await page.locator('input[type="file"]').setInputFiles(
      await qrImageFile("https://example.com/storage-denied-scan"),
    );

    await expect(page.locator(".scanner-result-value")).toHaveText(
      "https://example.com/storage-denied-scan",
      { timeout: 15_000 },
    );
    await page.getByRole("button", { name: "Scan another" }).click();
    await expect(page.locator(".scanner-result-value")).toHaveCount(0);
  });

  test("keeps the current synthetic scan visible when local storage is full", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: {
          getItem: () => null,
          setItem: () => {
            throw new DOMException("Storage quota is exhausted", "QuotaExceededError");
          },
        },
      });
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Switch to dark mode" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("button", { name: "Switch to light mode" })).toBeVisible();
    await page.getByRole("tab", { name: "Scan QR" }).click();
    await page.getByRole("tab", { name: "Upload image" }).click();
    await page.locator('input[type="file"]').setInputFiles(
      await qrImageFile("https://example.com/storage-quota-scan"),
    );

    await expect(page.locator(".scanner-result-value")).toHaveText(
      "https://example.com/storage-quota-scan",
      { timeout: 15_000 },
    );
    await page.getByRole("button", { name: "Scan another" }).click();
    await expect(page.locator(".scanner-result-value")).toHaveCount(0);
  });
});
