import { describe, expect, it } from "vitest";

import {
  classifyQrPayload,
  isSafeExternalUrl,
  normalizeScanResult,
} from "@/lib/scanner";

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
});
