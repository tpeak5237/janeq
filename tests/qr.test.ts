import { describe, expect, it } from "vitest";

import {
  buildPayload,
  contrastRatio,
  createQrMatrix,
  DEFAULT_CUSTOMIZATION,
  DEFAULT_FIELDS,
  formatPromptPayId,
  getReliabilityMessages,
  makeQrFilename,
  normalizePromptPayAmount,
  normalizePromptPayId,
  normalizeUrlInput,
  renderQrSvg,
} from "@/lib/qr";

describe("JaneQ direct payloads", () => {
  it("normalizes a URL for encoding without changing the visible input", () => {
    expect(normalizeUrlInput("example.com/hello?name=Jane")).toEqual({
      value: "https://example.com/hello?name=Jane",
      changed: true,
    });

    const result = buildPayload("url", { ...DEFAULT_FIELDS, url: "example.com/hello?name=Jane" });
    expect(result.payload).toBe("https://example.com/hello?name=Jane");
    expect(result.hint).toContain("https://example.com/hello?name=Jane");
  });

  it("preserves Unicode and Thai text exactly", () => {
    const text = "สวัสดี JaneQ — QR codes should be direct.";
    const result = buildPayload("text", { ...DEFAULT_FIELDS, text });
    expect(result.payload).toBe(text);

    const matrix = createQrMatrix(text, "M");
    expect(matrix.size).toBeGreaterThan(20);
    expect(matrix.data).toHaveLength(matrix.size * matrix.size);
    expect(renderQrSvg(matrix, DEFAULT_CUSTOMIZATION)).toContain("<svg");
  });

  it("builds mailto, phone, and SMS payloads", () => {
    expect(buildPayload("email", { ...DEFAULT_FIELDS, email: "hello@example.com", emailSubject: "Hi JaneQ" }).payload).toBe("mailto:hello@example.com?subject=Hi+JaneQ");
    expect(buildPayload("phone", { ...DEFAULT_FIELDS, phone: "+66 (81) 234-5678" }).payload).toBe("tel:+66812345678");
    expect(buildPayload("sms", { ...DEFAULT_FIELDS, smsNumber: "+66812345678", smsMessage: "See you at 10" }).payload).toBe("SMSTO:+66812345678:See you at 10");
  });

  it("escapes Wi-Fi credentials in the common direct format", () => {
    const result = buildPayload("wifi", {
      ...DEFAULT_FIELDS,
      wifiSsid: "Studio;Network",
      wifiPassword: "p,a:ss\\word",
      wifiHidden: true,
    });
    expect(result.payload).toBe("WIFI:T:WPA;S:Studio\\;Network;P:p\\,a\\:ss\\\\word;H:true;;");
    expect(result.hint).toContain("locally");
  });

  it("validates contact and location fields", () => {
    expect(buildPayload("contact", { ...DEFAULT_FIELDS }).error).toContain("name");
    expect(buildPayload("contact", { ...DEFAULT_FIELDS, contactName: "Jane", contactEmail: "hello@example.com" }).payload).toBe("MECARD:N:Jane;EMAIL:hello@example.com;;");
    expect(buildPayload("location", { ...DEFAULT_FIELDS, latitude: "13.7563", longitude: "100.5018", locationLabel: "Bangkok" }).payload).toBe("geo:13.7563,100.5018?q=Bangkok");
    expect(buildPayload("location", { ...DEFAULT_FIELDS, latitude: "91", longitude: "0" }).error).toContain("latitude");
  });

  it("generates fixed-amount and payer-entered PromptPay payloads", () => {
    const fixed = buildPayload("promptpay", {
      ...DEFAULT_FIELDS,
      promptpayId: "0812345678",
      promptpayAmount: "250.00",
    });
    const payerEntered = buildPayload("promptpay", {
      ...DEFAULT_FIELDS,
      promptpayId: "0812345678",
    });

    expect(fixed.error).toBeNull();
    expect(fixed.payload).toBe(
      "00020101021229370016A000000677010111011300668123456785802TH53037645406250.0063047D89",
    );
    expect(payerEntered.error).toBeNull();
    expect(payerEntered.payload).toBe(
      "00020101021129370016A000000677010111011300668123456785802TH530376463045D82",
    );
    expect(fixed.payload).not.toBe(payerEntered.payload);
    expect(fixed.payload).toContain("5406250.00");
    expect(payerEntered.payload).not.toContain("54");
  });

  it("normalizes and validates PromptPay IDs and amounts", () => {
    expect(normalizePromptPayId("081-234-5678")).toBe("0812345678");
    expect(formatPromptPayId("0812345678")).toBe("081 234 5678");
    expect(normalizePromptPayAmount("20")).toBe("20.00");
    expect(normalizePromptPayAmount("99.5")).toBe("99.50");
    expect(normalizePromptPayAmount("1250.00")).toBe("1250.00");
    expect(normalizePromptPayAmount("0")).toBeNull();
    expect(normalizePromptPayAmount("-1")).toBeNull();
    expect(normalizePromptPayAmount("250.999")).toBeNull();

    expect(
      buildPayload("promptpay", { ...DEFAULT_FIELDS }).error,
    ).toContain("PromptPay ID");
    expect(
      buildPayload("promptpay", {
        ...DEFAULT_FIELDS,
        promptpayId: "081234567x",
      }).error,
    ).toContain("PromptPay ID");
    expect(
      buildPayload("promptpay", {
        ...DEFAULT_FIELDS,
        promptpayId: "0812345678",
        promptpayAmount: "250.999",
      }).error,
    ).toContain("2 decimal places");
  });
});

describe("JaneQ reliability helpers", () => {
  it("reports contrast and quiet-zone risks while keeping safe defaults clean", () => {
    expect(contrastRatio("#101922", "#ffffff")).toBeGreaterThan(7);
    expect(getReliabilityMessages(DEFAULT_CUSTOMIZATION, false)).toEqual([]);

    const messages = getReliabilityMessages(
      { ...DEFAULT_CUSTOMIZATION, foreground: "#999999", background: "#ffffff", margin: 1, outputSize: 128 },
      true,
    );
    expect(messages.map((message) => message.id)).toEqual(["contrast", "quiet-zone", "resolution", "logo-correction"]);
  });

  it("creates predictable filenames for exports", () => {
    expect(makeQrFilename("url", { ...DEFAULT_FIELDS, url: "https://example.com/hello" }, "png")).toBe("janeq-qr-example-com-hello.png");
    expect(makeQrFilename("text", { ...DEFAULT_FIELDS, text: "Hello, JaneQ!" }, "svg")).toBe("janeq-qr-hello-janeq.svg");
    expect(makeQrFilename("promptpay", { ...DEFAULT_FIELDS, promptpayId: "0812345678" }, "png")).toBe("janeq-qr-promptpay.png");
  });
});
