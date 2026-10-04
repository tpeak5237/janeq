import { describe, expect, it } from "vitest";

import { createScanObservation, parseScanObservation } from "@/lib/scan-observation";
import { classifyQrPayload } from "@/lib/scanner";

describe("shared scan observation contract v1", () => {
  it.each(["camera", "image-upload"] as const)(
    "round-trips a %s observation through JSON without browser APIs",
    (source) => {
      const observation = createScanObservation("  https://example.com/a?b=1  ", source);
      const parsed = parseScanObservation(JSON.parse(JSON.stringify(observation)));
      expect(parsed).toEqual({ schemaVersion: 1, source, payload: "https://example.com/a?b=1" });
      expect(Object.isFrozen(parsed)).toBe(true);
      expect(classifyQrPayload(parsed.payload).openable).toBe(true);
    },
  );

  it("preserves Unicode and markup as inert decoded text", () => {
    const payload = "สวัสดี — <script>synthetic()</script>";
    const observation = createScanObservation(payload, "image-upload");
    expect(observation.payload).toBe(payload);
    expect(classifyQrPayload(observation.payload)).toEqual({ kind: "text", label: payload, openable: false });
  });

  it("keeps an active scheme non-openable after the consumer parses it", () => {
    const observation = parseScanObservation({ schemaVersion: 1, source: "camera", payload: "javascript:synthetic()" });
    expect(classifyQrPayload(observation.payload).openable).toBe(false);
  });

  it.each([null, [], "text", {}, { schemaVersion: 2, source: "camera", payload: "synthetic" }, { schemaVersion: 1, source: "server", payload: "synthetic" }, { schemaVersion: 1, source: "camera", payload: 42 }])(
    "rejects an unsupported serialized envelope: %j",
    (input) => expect(() => parseScanObservation(input)).toThrow("Invalid scan observation"),
  );

  it.each(["tenantId", "actorId", "recordId", "paymentVerified", "openable"])(
    "rejects an extra %s claim rather than carrying it into a consumer",
    (key) => expect(() => parseScanObservation({ schemaVersion: 1, source: "camera", payload: "synthetic", [key]: true })).toThrow("Invalid scan observation"),
  );

  it("retains the existing empty decoder result failure", () => {
    expect(() => createScanObservation(" \n ", "camera")).toThrow("No QR code found");
  });
});
