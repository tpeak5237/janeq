import { describe, expect, it } from "vitest";

import {
  classifyQrPayload,
  isDuplicateScan,
  isSafeExternalUrl,
  normalizeScanResult,
} from "@/lib/scanner";
import {
  prioritizeDetectionRois,
  scoreDetectionGrid,
} from "@/lib/qr-detection";
import { estimateFrameMetrics } from "@/lib/qr-image";

function makeImageData(width: number, height: number, pixel: (x: number, y: number) => number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const value = pixel(x, y);
      const index = (y * width + x) * 4;
      data[index] = value;
      data[index + 1] = value;
      data[index + 2] = value;
      data[index + 3] = 255;
    }
  }
  return { data, width, height } as ImageData;
}

describe("QR scanner payload safety", () => {
  it("offers an explicit open action only for HTTP(S) URLs", () => {
    expect(isSafeExternalUrl("https://example.com/path?q=1")).toBe(true);
    expect(isSafeExternalUrl("http://localhost:3000")).toBe(true);
    expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeExternalUrl("data:text/html,hello")).toBe(false);
    expect(isSafeExternalUrl("//example.com/path")).toBe(false);
  });

  it("classifies common QR payloads without changing the raw value", () => {
    expect(classifyQrPayload("https://example.com")).toEqual({
      kind: "url",
      label: "https://example.com",
      openable: true,
    });
    expect(classifyQrPayload("mailto:hello@example.com").kind).toBe("email");
    expect(classifyQrPayload("WIFI:T:WPA;S:Studio;P:secret;;").kind).toBe(
      "wifi",
    );
    expect(classifyQrPayload("javascript:alert(1)")).toEqual({
      kind: "text",
      label: "javascript:alert(1)",
      openable: false,
    });
  });

  it("trims decoder output while retaining a stable empty-result failure", () => {
    expect(normalizeScanResult("  https://example.com  ")).toBe(
      "https://example.com",
    );
    expect(() => normalizeScanResult(" \n ")).toThrow("No QR code found");
  });

  it("suppresses the same decoded value only during the cooldown window", () => {
    expect(isDuplicateScan("same", "same", 1000, 1500)).toBe(true);
    expect(isDuplicateScan("same", "same", 1000, 2100)).toBe(false);
    expect(isDuplicateScan("new", "same", 1000, 1100)).toBe(false);
  });

  it("scores a logical 10 by 10 grid without decoding every zone", () => {
    const image = makeImageData(100, 100, (x, y) => {
      const inTopCandidate = x < 30 && y < 30;
      const inBottomCandidate = x > 70 && y > 70;
      return inTopCandidate || inBottomCandidate ? (x + y) % 2 * 255 : 128;
    });
    const zones = scoreDetectionGrid(image);

    expect(zones).toHaveLength(100);
    expect(zones[0].score).toBeGreaterThan(zones.at(-1)?.score ?? 1);
  });

  it("expands candidate ROIs to the frame edges instead of centering detection", () => {
    const rois = prioritizeDetectionRois(
      [{
        column: 9,
        row: 9,
        x: 90,
        y: 90,
        width: 10,
        height: 10,
        score: 1,
        contrast: 1,
        edgeDensity: 1,
        transitionDensity: 1,
      }],
      100,
      100,
      1,
    );

    expect(rois).toHaveLength(1);
    expect(rois[0].x + rois[0].width).toBe(100);
    expect(rois[0].y + rois[0].height).toBe(100);
  });

  it("flags a dim frame and identifies a sharp, high-contrast frame", () => {
    const dim = makeImageData(32, 24, () => 18);
    const sharp = makeImageData(32, 24, (x, y) => ((x + y) % 2 ? 255 : 0));

    expect(estimateFrameMetrics(dim).lowLight).toBe(true);
    expect(estimateFrameMetrics(sharp).lowLight).toBe(false);
    expect(estimateFrameMetrics(sharp).sharpness).toBeGreaterThan(
      estimateFrameMetrics(dim).sharpness,
    );
  });
});
