import { normalizeScanResult } from "./scanner";

export type ScanSource = "camera" | "image-upload";

/** A local decoder observation, without a business-record or identity claim. */
export interface ScanObservation {
  readonly schemaVersion: 1;
  readonly source: ScanSource;
  readonly payload: string;
}

export function parseScanObservation(input: unknown): ScanObservation {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("Invalid scan observation");
  }
  const record = input as Record<string, unknown>;
  const keys = Object.keys(record);
  if (
    keys.length !== 3 ||
    !keys.every((key) => ["schemaVersion", "source", "payload"].includes(key)) ||
    record.schemaVersion !== 1 ||
    (record.source !== "camera" && record.source !== "image-upload") ||
    typeof record.payload !== "string"
  ) {
    throw new Error("Invalid scan observation");
  }
  return Object.freeze({
    schemaVersion: 1,
    source: record.source,
    payload: normalizeScanResult(record.payload),
  });
}

export function createScanObservation(
  payload: string,
  source: ScanSource,
): ScanObservation {
  return parseScanObservation({ schemaVersion: 1, source, payload });
}
