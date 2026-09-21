import QRCode from "qrcode";
import generatePromptPayPayload from "promptpay-qr";

export type QrType =
  | "url"
  | "text"
  | "email"
  | "phone"
  | "sms"
  | "wifi"
  | "contact"
  | "location"
  | "promptpay";

export type WifiSecurity = "WPA" | "WEP" | "nopass";
export type ErrorCorrection = "L" | "M" | "Q" | "H";
export type ModuleShape = "square" | "rounded";

export interface QrFields {
  url: string;
  text: string;
  email: string;
  emailSubject: string;
  emailBody: string;
  phone: string;
  smsNumber: string;
  smsMessage: string;
  wifiSsid: string;
  wifiPassword: string;
  wifiSecurity: WifiSecurity;
  wifiHidden: boolean;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contactOrganization: string;
  latitude: string;
  longitude: string;
  locationLabel: string;
  promptpayId: string;
  promptpayAmount: string;
}

export interface QrCustomization {
  foreground: string;
  background: string;
  transparent: boolean;
  errorCorrection: ErrorCorrection;
  margin: number;
  outputSize: number;
  moduleShape: ModuleShape;
}

export interface QrMatrix {
  size: number;
  data: boolean[];
}

export interface PayloadResult {
  payload: string | null;
  error: string | null;
  hint: string | null;
}

export interface ReliabilityMessage {
  id: string;
  severity: "info" | "warning";
  title: string;
  body: string;
}

export const DEFAULT_FIELDS: QrFields = {
  url: "https://theerapat.org",
  text: "",
  email: "",
  emailSubject: "",
  emailBody: "",
  phone: "",
  smsNumber: "",
  smsMessage: "",
  wifiSsid: "",
  wifiPassword: "",
  wifiSecurity: "WPA",
  wifiHidden: false,
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  contactOrganization: "",
  latitude: "",
  longitude: "",
  locationLabel: "",
  promptpayId: "",
  promptpayAmount: "",
};

export const DEFAULT_CUSTOMIZATION: QrCustomization = {
  foreground: "#101922",
  background: "#ffffff",
  transparent: false,
  errorCorrection: "M",
  margin: 4,
  outputSize: 512,
  moduleShape: "square",
};

export const QR_TYPE_META: Record<
  QrType,
  { label: string; shortLabel: string; description: string; icon: string }
> = {
  url: {
    label: "Website URL",
    shortLabel: "Website",
    description: "Open a direct web address",
    icon: "↗",
  },
  text: {
    label: "Plain text",
    shortLabel: "Text",
    description: "Share a note or short message",
    icon: "Aa",
  },
  email: {
    label: "Email",
    shortLabel: "Email",
    description: "Compose an email",
    icon: "@",
  },
  phone: {
    label: "Phone",
    shortLabel: "Phone",
    description: "Start a phone call",
    icon: "⌕",
  },
  sms: {
    label: "SMS",
    shortLabel: "SMS",
    description: "Open a text message",
    icon: "••",
  },
  wifi: {
    label: "Wi-Fi",
    shortLabel: "Wi-Fi",
    description: "Share network access",
    icon: "⌁",
  },
  contact: {
    label: "Contact",
    shortLabel: "Contact",
    description: "Save contact information",
    icon: "◎",
  },
  location: {
    label: "Location",
    shortLabel: "Location",
    description: "Open a map location",
    icon: "⌖",
  },
  promptpay: {
    label: "PromptPay",
    shortLabel: "PromptPay",
    description: "Create a Thai payment request",
    icon: "฿",
  },
};

const PHONE_PATTERN = /^\+?[0-9]{5,15}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROMPTPAY_ID_PATTERN = /^(?:0[689][0-9]{8}|[0-9]{13}|[0-9]{15})$/;
const PROMPTPAY_AMOUNT_PATTERN = /^(?:0|[1-9][0-9]*)(?:\.[0-9]{1,2})?$/;

function clean(value: string): string {
  return value.trim();
}

function normalizePhone(value: string): string {
  const trimmed = clean(value);
  const hasLeadingPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^0-9]/g, "");
  return hasLeadingPlus ? `+${digits}` : digits;
}

export function normalizePromptPayId(value: string): string {
  return clean(value).replace(/[\s-]/g, "");
}

export function formatPromptPayId(value: string): string {
  const normalized = normalizePromptPayId(value);
  return normalized.length === 10
    ? normalized.replace(/^(...)(...)(....)$/, "$1 $2 $3")
    : normalized;
}

export function normalizePromptPayAmount(value: string): string | null {
  const amount = clean(value);
  if (!amount || !PROMPTPAY_AMOUNT_PATTERN.test(amount)) return null;

  const [whole, fraction = ""] = amount.split(".");
  const normalized = `${whole}.${fraction.padEnd(2, "0")}`;
  const numericAmount = Number(normalized);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) return null;
  return normalized;
}

function escapeWifiValue(value: string): string {
  return value.replace(/([\\;,:])/g, "\\$1");
}

function escapeMecardValue(value: string): string {
  return value.replace(/([\\;,:])/g, "\\$1");
}

export interface NormalizedUrl {
  value: string;
  changed: boolean;
}

export function normalizeUrlInput(value: string): NormalizedUrl | null {
  const input = clean(value);
  if (!input) return null;

  const hasWebProtocol = /^https?:\/\//i.test(input);
  const candidate = hasWebProtocol ? input : `https://${input}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return { value: url.toString(), changed: !hasWebProtocol };
  } catch {
    return null;
  }
}

function result(
  payload: string | null,
  error: string | null = null,
  hint: string | null = null,
): PayloadResult {
  return { payload, error, hint };
}

export function buildPayload(type: QrType, fields: QrFields): PayloadResult {
  switch (type) {
    case "url": {
      const normalized = normalizeUrlInput(fields.url);
      if (!normalized) {
        return result(null, "Enter a valid website address, such as https://example.com.");
      }
      return result(
        normalized.value,
        null,
        normalized.changed
          ? `This will encode as ${normalized.value}. The field itself stays unchanged.`
          : "The full URL, including its path and query, is encoded directly.",
      );
    }
    case "text": {
      if (!fields.text.trim()) return result(null, "Enter some text to encode.");
      return result(fields.text, null, "Text is encoded exactly as entered.");
    }
    case "email": {
      const address = clean(fields.email);
      if (!EMAIL_PATTERN.test(address)) return result(null, "Enter a valid email address.");
      const query = new URLSearchParams();
      if (fields.emailSubject) query.set("subject", fields.emailSubject);
      if (fields.emailBody) query.set("body", fields.emailBody);
      const suffix = query.toString();
      return result(`mailto:${address}${suffix ? `?${suffix}` : ""}`, null, "A mailto link opens the user’s mail app.");
    }
    case "phone": {
      const phone = normalizePhone(fields.phone);
      if (!PHONE_PATTERN.test(phone)) return result(null, "Enter a phone number with 5–15 digits.");
      return result(`tel:${phone}`, null, "The number is encoded directly; JaneQ never calls it.");
    }
    case "sms": {
      const phone = normalizePhone(fields.smsNumber);
      if (!PHONE_PATTERN.test(phone)) return result(null, "Enter a phone number with 5–15 digits.");
      if (!fields.smsMessage.trim()) return result(null, "Add a message for this SMS code.");
      return result(`SMSTO:${phone}:${fields.smsMessage}`, null, "The code opens a pre-filled SMS composer.");
    }
    case "wifi": {
      const ssid = clean(fields.wifiSsid);
      if (!ssid) return result(null, "Enter the network name (SSID).");
      if (fields.wifiSecurity !== "nopass" && !fields.wifiPassword) {
        return result(null, "Enter the Wi-Fi password or choose No password.");
      }
      const password = fields.wifiSecurity === "nopass" ? "" : escapeWifiValue(fields.wifiPassword);
      const hidden = fields.wifiHidden ? "true" : "false";
      const payload = `WIFI:T:${fields.wifiSecurity};S:${escapeWifiValue(ssid)};P:${password};H:${hidden};;`;
      return result(payload, null, "Wi-Fi credentials stay locally in this browser and are never uploaded.");
    }
    case "contact": {
      const name = clean(fields.contactName);
      const phone = normalizePhone(fields.contactPhone);
      const email = clean(fields.contactEmail);
      const organization = clean(fields.contactOrganization);
      if (!name && !phone && !email) return result(null, "Add a name, phone number, or email address.");
      if (phone && !PHONE_PATTERN.test(phone)) return result(null, "Check the contact phone number.");
      if (email && !EMAIL_PATTERN.test(email)) return result(null, "Check the contact email address.");
      const payload = [
        "MECARD:",
        name ? `N:${escapeMecardValue(name)};` : "",
        phone ? `TEL:${phone};` : "",
        email ? `EMAIL:${escapeMecardValue(email)};` : "",
        organization ? `ORG:${escapeMecardValue(organization)};` : "",
        ";",
      ].join("");
      return result(payload, null, "The contact card is encoded directly in the QR image.");
    }
    case "location": {
      const latitude = Number(clean(fields.latitude));
      const longitude = Number(clean(fields.longitude));
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        return result(null, "Enter a latitude between -90 and 90.");
      }
      if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        return result(null, "Enter a longitude between -180 and 180.");
      }
      const label = clean(fields.locationLabel);
      return result(`geo:${latitude},${longitude}${label ? `?q=${encodeURIComponent(label)}` : ""}`, null, "The location opens in a map app that supports geo links.");
    }
    case "promptpay": {
      const promptpayId = normalizePromptPayId(fields.promptpayId);
      if (!PROMPTPAY_ID_PATTERN.test(promptpayId)) {
        return result(null, "Enter a supported PromptPay ID.");
      }

      const rawAmount = clean(fields.promptpayAmount);
      const amount = rawAmount ? normalizePromptPayAmount(rawAmount) : null;
      if (rawAmount && !amount) {
        return result(null, "Enter a positive amount with up to 2 decimal places.");
      }

      const payload = generatePromptPayPayload(
        promptpayId,
        amount ? { amount: Number(amount) } : {},
      );
      return result(
        payload,
        null,
        amount
          ? "The amount is pre-filled for the payer in a compatible banking app."
          : "The payer enters the amount in their banking app.",
      );
    }
  }
}

export function payloadLabel(type: QrType, fields: QrFields): string {
  switch (type) {
    case "url":
      return clean(fields.url) || "website URL";
    case "text":
      return clean(fields.text).slice(0, 50) || "plain text";
    case "email":
      return clean(fields.email) || "email address";
    case "phone":
      return clean(fields.phone) || "phone number";
    case "sms":
      return clean(fields.smsNumber) || "SMS message";
    case "wifi":
      return clean(fields.wifiSsid) || "Wi-Fi network";
    case "contact":
      return clean(fields.contactName) || "contact card";
    case "location":
      return clean(fields.locationLabel) || "map location";
    case "promptpay":
      return "promptpay";
  }
}

export function makeQrFilename(type: QrType, fields: QrFields, extension: "png" | "svg"): string {
  if (type === "promptpay") return `janeq-qr-promptpay.${extension}`;
  const source = payloadLabel(type, fields)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42);
  return `janeq-qr-${source || "code"}.${extension}`;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

function relativeLuminance(rgb: [number, number, number]): number {
  const channels = rgb.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function contrastRatio(foreground: string, background: string): number | null {
  const foregroundRgb = hexToRgb(foreground);
  const backgroundRgb = hexToRgb(background);
  if (!foregroundRgb || !backgroundRgb) return null;
  const first = relativeLuminance(foregroundRgb);
  const second = relativeLuminance(backgroundRgb);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getReliabilityMessages(
  customization: QrCustomization,
  hasLogo: boolean,
): ReliabilityMessage[] {
  const messages: ReliabilityMessage[] = [];
  if (!customization.transparent) {
    const ratio = contrastRatio(customization.foreground, customization.background);
    if (ratio !== null && ratio < 7) {
      messages.push({
        id: "contrast",
        severity: "warning",
        title: "Contrast is getting soft",
        body: `The current colors measure ${ratio.toFixed(1)}:1. QR scanners prefer a much darker foreground against its background.`,
      });
    }
  } else {
    messages.push({
      id: "transparent",
      severity: "info",
      title: "Transparent background",
      body: "Place the downloaded code on a light, plain surface so the quiet zone stays visible.",
    });
  }
  if (customization.margin < 4) {
    messages.push({
      id: "quiet-zone",
      severity: "warning",
      title: "Quiet zone is tight",
      body: "A margin of 4 modules or more gives scanners the breathing room they expect.",
    });
  }
  if (customization.outputSize < 256) {
    messages.push({
      id: "resolution",
      severity: "warning",
      title: "Output is small",
      body: "Use at least 256 px for a reliable screen or print result.",
    });
  }
  if (customization.moduleShape === "rounded") {
    messages.push({
      id: "rounded",
      severity: "info",
      title: "Rounded modules enabled",
      body: "Rounded modules are kept inside each cell; test the downloaded code at its intended size.",
    });
  }
  if (hasLogo && customization.errorCorrection !== "H") {
    messages.push({
      id: "logo-correction",
      severity: "warning",
      title: "Use high correction with a logo",
      body: "High error correction gives the center mark more recovery room. JaneQ will still generate this code.",
    });
  }
  return messages;
}

interface GeneratedQrInternal {
  modules: {
    size: number;
    data: ArrayLike<number | boolean>;
  };
}

export function createQrMatrix(payload: string, errorCorrection: ErrorCorrection): QrMatrix {
  const generated = QRCode.create(payload, {
    errorCorrectionLevel: errorCorrection,
  }) as unknown as GeneratedQrInternal;
  return {
    size: generated.modules.size,
    data: Array.from(generated.modules.data, (cell) => Boolean(cell)),
  };
}

function escapeXmlAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function drawSvgModule(
  x: number,
  y: number,
  moduleSize: number,
  foreground: string,
  shape: ModuleShape,
): string {
  if (shape === "rounded") {
    const radius = Math.max(0.6, moduleSize * 0.22);
    return `<rect x="${x.toFixed(3)}" y="${y.toFixed(3)}" width="${(moduleSize + 0.06).toFixed(3)}" height="${(moduleSize + 0.06).toFixed(3)}" rx="${radius.toFixed(3)}" fill="${foreground}"/>`;
  }
  return `<rect x="${x.toFixed(3)}" y="${y.toFixed(3)}" width="${(moduleSize + 0.06).toFixed(3)}" height="${(moduleSize + 0.06).toFixed(3)}" fill="${foreground}"/>`;
}

export function renderQrSvg(
  matrix: QrMatrix,
  customization: QrCustomization,
  logoDataUrl: string | null = null,
): string {
  const moduleCount = matrix.size + customization.margin * 2;
  const moduleSize = customization.outputSize / moduleCount;
  const background = customization.transparent ? "none" : customization.background;
  const modules: string[] = [];

  matrix.data.forEach((isDark, index) => {
    if (!isDark) return;
    const x = (index % matrix.size + customization.margin) * moduleSize;
    const y = (Math.floor(index / matrix.size) + customization.margin) * moduleSize;
    modules.push(drawSvgModule(x, y, moduleSize, customization.foreground, customization.moduleShape));
  });

  const logoMarkup = logoDataUrl
    ? (() => {
        const logoSize = customization.outputSize * 0.18;
        const panelSize = logoSize * 1.28;
        const offset = (customization.outputSize - panelSize) / 2;
        const imageOffset = (customization.outputSize - logoSize) / 2;
        const panelFill = customization.transparent ? "#ffffff" : customization.background;
        return `<rect x="${offset.toFixed(2)}" y="${offset.toFixed(2)}" width="${panelSize.toFixed(2)}" height="${panelSize.toFixed(2)}" rx="${(panelSize * 0.16).toFixed(2)}" fill="${panelFill}"/><image href="${escapeXmlAttribute(logoDataUrl)}" x="${imageOffset.toFixed(2)}" y="${imageOffset.toFixed(2)}" width="${logoSize.toFixed(2)}" height="${logoSize.toFixed(2)}" preserveAspectRatio="xMidYMid meet"/>`;
      })()
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${customization.outputSize}" height="${customization.outputSize}" viewBox="0 0 ${customization.outputSize} ${customization.outputSize}" role="img" aria-label="JaneQ QR code">
  <rect width="100%" height="100%" fill="${background}"/>
  <g shape-rendering="${customization.moduleShape === "square" ? "crispEdges" : "geometricPrecision"}">${modules.join("")}</g>
  ${logoMarkup}
</svg>`;
}

function roundedCanvasModule(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  shape: ModuleShape,
): void {
  if (shape === "square") {
    context.fillRect(x, y, Math.ceil(size + 0.5), Math.ceil(size + 0.5));
    return;
  }
  const radius = Math.max(1, size * 0.22);
  if (typeof context.roundRect !== "function") {
    context.fillRect(x, y, Math.ceil(size + 0.5), Math.ceil(size + 0.5));
    return;
  }
  context.beginPath();
  context.roundRect(x, y, Math.ceil(size + 0.5), Math.ceil(size + 0.5), radius);
  context.fill();
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The image could not be decoded."));
    image.src = source;
  });
}

export async function renderQrCanvas(
  matrix: QrMatrix,
  customization: QrCustomization,
  logoDataUrl: string | null = null,
): Promise<HTMLCanvasElement> {
  if (typeof document === "undefined") throw new Error("Canvas rendering requires a browser.");
  const canvas = document.createElement("canvas");
  canvas.width = customization.outputSize;
  canvas.height = customization.outputSize;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is not available in this browser.");

  context.clearRect(0, 0, canvas.width, canvas.height);
  if (!customization.transparent) {
    context.fillStyle = customization.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  const moduleCount = matrix.size + customization.margin * 2;
  const moduleSize = customization.outputSize / moduleCount;
  context.fillStyle = customization.foreground;
  matrix.data.forEach((isDark, index) => {
    if (!isDark) return;
    const x = (index % matrix.size + customization.margin) * moduleSize;
    const y = (Math.floor(index / matrix.size) + customization.margin) * moduleSize;
    roundedCanvasModule(context, x, y, moduleSize, customization.moduleShape);
  });

  if (logoDataUrl) {
    const logo = await loadImage(logoDataUrl);
    const logoSize = customization.outputSize * 0.18;
    const panelSize = logoSize * 1.28;
    const panelOffset = (customization.outputSize - panelSize) / 2;
    const imageOffset = (customization.outputSize - logoSize) / 2;
    context.fillStyle = customization.transparent ? "#ffffff" : customization.background;
    if (typeof context.roundRect === "function") {
      context.beginPath();
      context.roundRect(panelOffset, panelOffset, panelSize, panelSize, panelSize * 0.16);
      context.fill();
    } else {
      context.fillRect(panelOffset, panelOffset, panelSize, panelSize);
    }
    context.drawImage(logo, imageOffset, imageOffset, logoSize, logoSize);
  }
  return canvas;
}

export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [metadata, encoded] = dataUrl.split(",");
  const mime = metadata.match(/data:([^;]+)/)?.[1] ?? "application/octet-stream";
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mime });
}

export function validateLogoFile(file: File): string | null {
  const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedTypes.includes(file.type)) return "Choose a PNG, JPEG, or WebP image.";
  if (file.size > 2 * 1024 * 1024) return "Logo files must be 2 MB or smaller.";
  return null;
}

export async function processLogoFile(file: File): Promise<string> {
  const validationError = validateLogoFile(file);
  if (validationError) throw new Error(validationError);
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
    if (!longestSide) throw new Error("The image has no readable dimensions.");
    const scale = Math.min(1, 256 / longestSide);
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("The image could not be processed locally.");
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
