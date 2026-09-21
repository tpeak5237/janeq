export type ScanPayloadKind =
  | "url"
  | "email"
  | "phone"
  | "sms"
  | "wifi"
  | "location"
  | "contact"
  | "promptpay"
  | "text";

export interface ScanPayloadClassification {
  kind: ScanPayloadKind;
  label: string;
  openable: boolean;
}

export function normalizeScanResult(value: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error("No QR code found");
  return normalized;
}

export function getSafeExternalUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export function isSafeExternalUrl(value: string): boolean {
  return getSafeExternalUrl(value) !== null;
}

function isPromptPayPayload(value: string): boolean {
  return value.startsWith("000201") && value.includes("A000000677010111");
}

export function classifyQrPayload(value: string): ScanPayloadClassification {
  const raw = normalizeScanResult(value);
  if (isSafeExternalUrl(raw)) {
    return { kind: "url", label: raw, openable: true };
  }
  if (/^mailto:/i.test(raw)) {
    return { kind: "email", label: raw, openable: false };
  }
  if (/^(tel:|phone:)/i.test(raw)) {
    return { kind: "phone", label: raw, openable: false };
  }
  if (/^(sms:|smsto:)/i.test(raw)) {
    return { kind: "sms", label: raw, openable: false };
  }
  if (/^wifi:/i.test(raw)) {
    return { kind: "wifi", label: raw, openable: false };
  }
  if (/^geo:/i.test(raw)) {
    return { kind: "location", label: raw, openable: false };
  }
  if (/^mecard:/i.test(raw) || /^begin:vcard/i.test(raw)) {
    return { kind: "contact", label: raw, openable: false };
  }
  if (isPromptPayPayload(raw)) {
    return { kind: "promptpay", label: raw, openable: false };
  }
  return { kind: "text", label: raw, openable: false };
}
