"use client";

import {
  ChangeEvent,
  InputHTMLAttributes,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Icon } from "@/components/icons";
import { JaneQMark } from "@/components/janeq-mark";
import {
  localizedPayloadMessage,
  localizedReliabilityMessage,
  translate,
  useCopy,
  type TranslationKey,
} from "@/lib/i18n";
import {
  buildPayload,
  createQrMatrix,
  dataUrlToBlob,
  DEFAULT_CUSTOMIZATION,
  DEFAULT_FIELDS,
  formatPromptPayId,
  getReliabilityMessages,
  makeQrFilename,
  normalizePromptPayAmount,
  payloadLabel,
  processLogoFile,
  QR_TYPE_META,
  QrCustomization,
  QrFields,
  QrType,
  renderQrCanvas,
  renderQrSvg,
  svgDataUrl,
} from "@/lib/qr";

const QR_TYPES: QrType[] = [
  "url",
  "text",
  "email",
  "phone",
  "sms",
  "wifi",
  "contact",
  "location",
  "promptpay",
];

const TYPE_COPY_KEYS: Record<
  QrType,
  { label: TranslationKey; short: TranslationKey; description: TranslationKey }
> = {
  url: {
    label: "typeWebsiteLong",
    short: "typeWebsite",
    description: "typeWebsiteDescription",
  },
  text: {
    label: "typeTextLong",
    short: "typeText",
    description: "typeTextDescription",
  },
  email: {
    label: "typeEmail",
    short: "typeEmail",
    description: "typeEmailDescription",
  },
  phone: {
    label: "typePhone",
    short: "typePhone",
    description: "typePhoneDescription",
  },
  sms: {
    label: "typeSms",
    short: "typeSms",
    description: "typeSmsDescription",
  },
  wifi: {
    label: "typeWifi",
    short: "typeWifi",
    description: "typeWifiDescription",
  },
  contact: {
    label: "typeContact",
    short: "typeContact",
    description: "typeContactDescription",
  },
  location: {
    label: "typeLocation",
    short: "typeLocation",
    description: "typeLocationDescription",
  },
  promptpay: {
    label: "typePromptpay",
    short: "typePromptpay",
    description: "typePromptpayDescription",
  },
};

const PRESET_LOGO_DATA_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    <rect width="128" height="128" rx="28" fill="#101922"/>
    <path d="M73 22H53v22H35v20h18v28h20V64h20V44H73V22Z" fill="#fbfcfa"/>
    <circle cx="96" cy="95" r="8" fill="#e9674f"/>
  </svg>
`)}`;

interface QrArtifact {
  key: string;
  pngDataUrl: string;
  svg: string;
  error?: string;
}

type LogoSource = "none" | "preset" | "upload";

function Field({
  hint,
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  hint?: string;
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <input
        aria-describedby={hint ? `${id}-hint` : undefined}
        autoComplete="off"
        className="field-input"
        id={id}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {hint ? (
        <span className="field-hint" id={`${id}-hint`}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="field field-full">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <textarea
        className="field-textarea"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}

export function QrStudio() {
  const { locale, t } = useCopy();
  const [type, setType] = useState<QrType>("url");
  const [fields, setFields] = useState<QrFields>(DEFAULT_FIELDS);
  const [customization, setCustomization] = useState<QrCustomization>(
    DEFAULT_CUSTOMIZATION,
  );
  const [logoSource, setLogoSource] = useState<LogoSource>("none");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoLabel, setLogoLabel] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [artifact, setArtifact] = useState<QrArtifact | null>(null);
  const [isLogoProcessing, setIsLogoProcessing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const payloadResult = useMemo(
    () => buildPayload(type, fields),
    [fields, type],
  );
  const promptpayAmount = useMemo(
    () =>
      type === "promptpay"
        ? normalizePromptPayAmount(fields.promptpayAmount)
        : null,
    [fields.promptpayAmount, type],
  );
  const generationKey = useMemo(
    () =>
      payloadResult.payload
        ? JSON.stringify([payloadResult.payload, customization, logoDataUrl])
        : null,
    [customization, logoDataUrl, payloadResult.payload],
  );
  const reliabilityMessages = useMemo(
    () => getReliabilityMessages(customization, Boolean(logoDataUrl)),
    [customization, logoDataUrl],
  );
  const localizedPayload = useMemo(
    () => localizedPayloadMessage(locale, type, fields, payloadResult),
    [fields, locale, payloadResult, type],
  );
  const localizedReliabilityMessages = useMemo(
    () =>
      reliabilityMessages.map((message) =>
        localizedReliabilityMessage(locale, message),
      ),
    [locale, reliabilityMessages],
  );

  useEffect(() => {
    let cancelled = false;
    if (!payloadResult.payload || !generationKey)
      return () => {
        cancelled = true;
      };

    const payload = payloadResult.payload;
    const key = generationKey;
    void Promise.resolve()
      .then(() => {
        const matrix = createQrMatrix(payload, customization.errorCorrection);
        const svg = renderQrSvg(matrix, customization, logoDataUrl);
        return renderQrCanvas(matrix, customization, logoDataUrl)
          .then((canvas) => ({
            pngDataUrl: canvas.toDataURL("image/png"),
            svg,
          }))
          .catch(() => ({ pngDataUrl: "", svg }));
      })
      .then(({ pngDataUrl, svg }) => {
        if (cancelled) return;
        setArtifact({ key, pngDataUrl, svg });
      })
      .catch(() => {
        if (cancelled) return;
        setArtifact({
          key,
          pngDataUrl: "",
          svg: "",
          error: translate(locale, "noticeTooLarge"),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [
    customization,
    generationKey,
    locale,
    logoDataUrl,
    payloadResult.payload,
  ]);

  function updateField<Key extends keyof QrFields>(
    key: Key,
    value: QrFields[Key],
  ) {
    setFields((current) => ({ ...current, [key]: value }));
    setNotice(null);
  }

  function updateCustomization<Key extends keyof QrCustomization>(
    key: Key,
    value: QrCustomization[Key],
  ) {
    setCustomization((current) => ({ ...current, [key]: value }));
    setNotice(null);
  }

  async function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsLogoProcessing(true);
    setLogoError(null);
    try {
      const processedLogo = await processLogoFile(file);
      setLogoDataUrl(processedLogo);
      setLogoSource("upload");
      setLogoLabel(file.name);
      setNotice(t("noticeLogoProcessing"));
    } catch (error) {
      setLogoDataUrl(null);
      setLogoSource("none");
      setLogoLabel(null);
      const message =
        error instanceof Error
          ? error.message
          : "The logo could not be processed.";
      setLogoError(
        message.includes("PNG") ||
          message.includes("JPEG") ||
          message.includes("WebP")
          ? t("errorLogoType")
          : message.includes("2 MB")
            ? t("errorLogoSize")
            : message.includes("decoded")
              ? t("errorLogoDecode")
              : message.includes("dimensions")
                ? t("errorLogoDimensions")
                : t("errorLogoProcess"),
      );
    } finally {
      setIsLogoProcessing(false);
      event.target.value = "";
    }
  }

  function chooseLogo(source: LogoSource) {
    setLogoSource(source);
    setLogoError(null);
    if (source === "none") {
      setLogoDataUrl(null);
      setLogoLabel(null);
    }
    if (source === "preset") {
      setLogoDataUrl(PRESET_LOGO_DATA_URL);
      setLogoLabel("theerapat.org mark");
    }
  }

  function triggerDownload(blob: Blob, filename: string) {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  function downloadPng() {
    if (!artifact?.pngDataUrl) return;
    triggerDownload(
      dataUrlToBlob(artifact.pngDataUrl),
      makeQrFilename(type, fields, "png"),
    );
    setNotice(t("noticeDownloadPng"));
  }

  function downloadSvg() {
    if (!artifact?.svg) return;
    triggerDownload(
      new Blob([artifact.svg], { type: "image/svg+xml;charset=utf-8" }),
      makeQrFilename(type, fields, "svg"),
    );
    setNotice(t("noticeDownloadSvg"));
  }

  async function copyContent() {
    if (!payloadResult.payload || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(payloadResult.payload);
      setNotice(t("noticeCopyContent"));
    } catch {
      setNotice(t("noticeClipboardBlocked"));
    }
  }

  async function copyImage() {
    if (
      !artifact?.pngDataUrl ||
      !navigator.clipboard?.write ||
      typeof ClipboardItem === "undefined"
    ) {
      setNotice(t("noticeImageUnsupported"));
      return;
    }
    try {
      const blob = dataUrlToBlob(artifact.pngDataUrl);
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setNotice(t("noticeCopyImage"));
    } catch {
      setNotice(t("noticeImageBlocked"));
    }
  }

  function printCode() {
    if (!artifact?.svg) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setNotice(t("noticePrintBlocked"));
      return;
    }
    const document = printWindow.document;
    document.title = `JaneQ — ${payloadLabel(type, fields)}`;
    const style = document.createElement("style");
    style.textContent =
      "body{align-items:center;display:flex;flex-direction:column;font-family:system-ui,sans-serif;gap:18px;justify-content:center;min-height:100vh;margin:0}img{height:min(70vw,480px);max-width:70vw}p{color:#52606a;font-size:14px}";
    const image = document.createElement("img");
    image.alt = t("altQr", { label: payloadLabel(type, fields) });
    image.src = svgDataUrl(artifact.svg);
    const caption = document.createElement("p");
    caption.textContent = t("printCaption");
    document.body.replaceChildren(style, image, caption);
    printWindow.focus();
    printWindow.setTimeout(() => printWindow.print(), 250);
    setNotice(t("noticePrintOpened"));
  }

  const currentArtifact =
    generationKey && artifact?.key === generationKey ? artifact : null;
  const isGenerating = Boolean(payloadResult.payload && !currentArtifact);
  const isValid = Boolean(payloadResult.payload && currentArtifact?.svg);
  const previewSource = currentArtifact?.svg
    ? svgDataUrl(currentArtifact.svg)
    : null;

  return (
    <div className="workspace-shell">
      <section aria-label={t("workspaceAria")} className="workspace-controls">
        <div className="workspace-heading">
          <div>
            <span className="workspace-kicker">{t("workspaceKicker")}</span>
            <h3>{t("workspaceQuestion")}</h3>
          </div>
          <span className="control-caption">
            {t(TYPE_COPY_KEYS[type].label)}
          </span>
        </div>

        <div
          aria-label={t("qrTypeAria")}
          className="type-selector"
          role="group"
        >
          {QR_TYPES.map((qrType) => {
            const meta = QR_TYPE_META[qrType];
            const copyKeys = TYPE_COPY_KEYS[qrType];
            return (
              <button
                aria-pressed={type === qrType}
                className="type-button"
                key={qrType}
                onClick={() => {
                  setType(qrType);
                  setNotice(null);
                }}
                type="button"
              >
                <span aria-hidden="true" className="type-button-icon">
                  {meta.icon}
                </span>
                <span className="type-button-label">{t(copyKeys.short)}</span>
                <span className="type-button-description">
                  {t(copyKeys.description)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="control-section">
          <div className="control-section-heading">
            <h4>
              {t(TYPE_COPY_KEYS[type].label)}
              {t("detailsSuffix") ? <> {t("detailsSuffix")}</> : null}
            </h4>
            <span className="control-caption">{t("requiredCaption")}</span>
          </div>
          {type === "url" ? (
            <div className="field-grid">
              <Field
                hint={t("websiteHint")}
                id="qr-url"
                label={t("websiteAddress")}
                onChange={(value) => updateField("url", value)}
                placeholder={t("websitePlaceholder")}
                value={fields.url}
              />
            </div>
          ) : null}
          {type === "text" ? (
            <div className="field-grid">
              <TextAreaField
                id="qr-text"
                label={t("textToEncode")}
                onChange={(value) => updateField("text", value)}
                placeholder={t("textPlaceholder")}
                value={fields.text}
              />
            </div>
          ) : null}
          {type === "email" ? (
            <div className="field-grid">
              <Field
                id="qr-email"
                label={t("emailAddress")}
                onChange={(value) => updateField("email", value)}
                placeholder={t("emailPlaceholder")}
                type="email"
                value={fields.email}
              />
              <Field
                id="qr-email-subject"
                label={t("subjectOptional")}
                onChange={(value) => updateField("emailSubject", value)}
                placeholder={t("subjectPlaceholder")}
                value={fields.emailSubject}
              />
              <TextAreaField
                id="qr-email-body"
                label={t("messageOptional")}
                onChange={(value) => updateField("emailBody", value)}
                placeholder={t("messagePlaceholder")}
                value={fields.emailBody}
              />
            </div>
          ) : null}
          {type === "phone" ? (
            <div className="field-grid">
              <Field
                hint={t("phoneHint")}
                id="qr-phone"
                label={t("phoneNumber")}
                onChange={(value) => updateField("phone", value)}
                placeholder={t("phonePlaceholder")}
                type="tel"
                value={fields.phone}
              />
            </div>
          ) : null}
          {type === "sms" ? (
            <div className="field-grid">
              <Field
                id="qr-sms-number"
                label={t("phoneNumber")}
                onChange={(value) => updateField("smsNumber", value)}
                placeholder={t("phonePlaceholder")}
                type="tel"
                value={fields.smsNumber}
              />
              <TextAreaField
                id="qr-sms-message"
                label={t("smsMessage")}
                onChange={(value) => updateField("smsMessage", value)}
                placeholder={t("smsPlaceholder")}
                value={fields.smsMessage}
              />
            </div>
          ) : null}
          {type === "wifi" ? (
            <div className="field-grid">
              <Field
                id="qr-wifi-ssid"
                label={t("ssid")}
                onChange={(value) => updateField("wifiSsid", value)}
                placeholder={t("ssidPlaceholder")}
                value={fields.wifiSsid}
              />
              <Field
                id="qr-wifi-password"
                label={t("password")}
                onChange={(value) => updateField("wifiPassword", value)}
                placeholder={t("passwordPlaceholder")}
                type="password"
                value={fields.wifiPassword}
              />
              <div className="field">
                <label className="field-label" htmlFor="qr-wifi-security">
                  {t("security")}
                </label>
                <select
                  className="field-select"
                  id="qr-wifi-security"
                  onChange={(event) =>
                    updateField(
                      "wifiSecurity",
                      event.target.value as QrFields["wifiSecurity"],
                    )
                  }
                  value={fields.wifiSecurity}
                >
                  <option value="WPA">{t("securityWpa")}</option>
                  <option value="WEP">{t("securityWep")}</option>
                  <option value="nopass">{t("securityNone")}</option>
                </select>
              </div>
              <label className="check-row" htmlFor="qr-wifi-hidden">
                <input
                  checked={fields.wifiHidden}
                  className="check-input"
                  id="qr-wifi-hidden"
                  onChange={(event) =>
                    updateField("wifiHidden", event.target.checked)
                  }
                  type="checkbox"
                />
                <span className="check-label">{t("hiddenNetwork")}</span>
              </label>
              <div className="field-full privacy-inline" role="note">
                <Icon name="shield" size={16} />
                <span>{t("wifiPrivacy")}</span>
              </div>
            </div>
          ) : null}
          {type === "contact" ? (
            <div className="field-grid">
              <Field
                id="qr-contact-name"
                label={t("name")}
                onChange={(value) => updateField("contactName", value)}
                placeholder={t("namePlaceholder")}
                value={fields.contactName}
              />
              <Field
                id="qr-contact-organization"
                label={t("organizationOptional")}
                onChange={(value) => updateField("contactOrganization", value)}
                placeholder={t("organizationPlaceholder")}
                value={fields.contactOrganization}
              />
              <Field
                id="qr-contact-phone"
                label={`${t("phoneNumber")} (optional)`}
                onChange={(value) => updateField("contactPhone", value)}
                placeholder={t("phonePlaceholder")}
                type="tel"
                value={fields.contactPhone}
              />
              <Field
                id="qr-contact-email"
                label={`${t("emailAddress")} (optional)`}
                onChange={(value) => updateField("contactEmail", value)}
                placeholder={t("emailPlaceholder")}
                type="email"
                value={fields.contactEmail}
              />
            </div>
          ) : null}
          {type === "location" ? (
            <div className="field-grid">
              <Field
                hint={t("latitudeHint")}
                id="qr-latitude"
                label={t("latitude")}
                onChange={(value) => updateField("latitude", value)}
                placeholder={t("latitudePlaceholder")}
                type="number"
                value={fields.latitude}
              />
              <Field
                hint={t("longitudeHint")}
                id="qr-longitude"
                label={t("longitude")}
                onChange={(value) => updateField("longitude", value)}
                placeholder={t("longitudePlaceholder")}
                type="number"
                value={fields.longitude}
              />
              <Field
                id="qr-location-label"
                label={t("labelOptional")}
                onChange={(value) => updateField("locationLabel", value)}
                placeholder={t("labelPlaceholder")}
                value={fields.locationLabel}
              />
            </div>
          ) : null}
          {type === "promptpay" ? (
            <div className="field-grid">
              <Field
                hint={t("promptpayIdHint")}
                id="qr-promptpay-id"
                label={t("promptpayId")}
                onChange={(value) => updateField("promptpayId", value)}
                placeholder={t("promptpayIdPlaceholder")}
                type="tel"
                value={fields.promptpayId}
              />
              <Field
                hint={t("promptpayAmountHint")}
                id="qr-promptpay-amount"
                inputMode="decimal"
                label={t("promptpayAmount")}
                onChange={(value) => updateField("promptpayAmount", value)}
                placeholder={t("promptpayAmountPlaceholder")}
                type="text"
                value={fields.promptpayAmount}
              />
              <div className="field-full privacy-inline" role="note">
                <Icon name="shield" size={16} />
                <span>{t("promptpayPrivacy")}</span>
              </div>
            </div>
          ) : null}
          {localizedPayload.error ? (
            <div aria-live="polite" className="validation-stack">
              <div
                className="validation-message validation-message-warning"
                role="alert"
              >
                <Icon name="warning" size={16} />
                <span>{localizedPayload.error}</span>
              </div>
            </div>
          ) : null}
          {localizedPayload.hint && !localizedPayload.error ? (
            <p className="field-hint" style={{ marginTop: 14 }}>
              {localizedPayload.hint}
            </p>
          ) : null}
        </div>

        <div className="control-section">
          <div className="control-section-heading">
            <h4>{t("reliableHeading")}</h4>
            <span className="control-caption">{t("reliableCaption")}</span>
          </div>
          <div className="field-grid">
            <div className="field">
              <span className="field-label">{t("foreground")}</span>
              <div className="color-control">
                <input
                  aria-label={t("foreground")}
                  onChange={(event) =>
                    updateCustomization("foreground", event.target.value)
                  }
                  type="color"
                  value={customization.foreground}
                />
                <span aria-hidden="true" className="field-hint">
                  {customization.foreground}
                </span>
              </div>
            </div>
            <div className="field">
              <span className="field-label">{t("background")}</span>
              <div className="color-control">
                <input
                  aria-label={t("background")}
                  disabled={customization.transparent}
                  onChange={(event) =>
                    updateCustomization("background", event.target.value)
                  }
                  type="color"
                  value={customization.background}
                />
                <span aria-hidden="true" className="field-hint">
                  {customization.transparent
                    ? t("transparentValue")
                    : customization.background}
                </span>
              </div>
            </div>
            <label className="switch-row field-full" htmlFor="qr-transparent">
              <span>
                <span className="switch-label">{t("transparent")}</span>
                <span className="switch-description">
                  {t("transparentDescription")}
                </span>
              </span>
              <input
                checked={customization.transparent}
                className="switch-input"
                id="qr-transparent"
                onChange={(event) =>
                  updateCustomization("transparent", event.target.checked)
                }
                type="checkbox"
              />
            </label>
            <div className="field">
              <label className="field-label" htmlFor="qr-correction">
                {t("errorCorrection")}
              </label>
              <select
                className="field-select"
                id="qr-correction"
                onChange={(event) =>
                  updateCustomization(
                    "errorCorrection",
                    event.target.value as QrCustomization["errorCorrection"],
                  )
                }
                value={customization.errorCorrection}
              >
                <option value="L">{t("correctionLow")}</option>
                <option value="M">{t("correctionMedium")}</option>
                <option value="Q">{t("correctionQuartile")}</option>
                <option value="H">{t("correctionHigh")}</option>
              </select>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="qr-output-size">
                {t("outputSize")}
              </label>
              <select
                className="field-select"
                id="qr-output-size"
                onChange={(event) =>
                  updateCustomization("outputSize", Number(event.target.value))
                }
                value={customization.outputSize}
              >
                {[256, 384, 512, 768, 1024].map((size) => (
                  <option key={size} value={size}>
                    {size} × {size} px
                  </option>
                ))}
              </select>
            </div>
            <div className="field field-full">
              <div className="field-label-row">
                <label htmlFor="qr-margin">{t("quietZone")}</label>
                <output htmlFor="qr-margin">
                  {customization.margin} {t("modules")}
                </output>
              </div>
              <div className="range-row">
                <input
                  aria-label={t("quietZone")}
                  id="qr-margin"
                  max="8"
                  min="0"
                  onChange={(event) =>
                    updateCustomization("margin", Number(event.target.value))
                  }
                  type="range"
                  value={customization.margin}
                />
              </div>
            </div>
            <div className="field field-full">
              <span className="field-label">{t("moduleShape")}</span>
              <div
                aria-label={t("moduleShape")}
                className="logo-options"
                role="group"
              >
                <button
                  aria-pressed={customization.moduleShape === "square"}
                  className="segmented-button"
                  onClick={() => updateCustomization("moduleShape", "square")}
                  type="button"
                >
                  {t("squareModules")}
                </button>
                <button
                  aria-pressed={customization.moduleShape === "rounded"}
                  className="segmented-button"
                  onClick={() => updateCustomization("moduleShape", "rounded")}
                  type="button"
                >
                  {t("roundedModules")}
                </button>
              </div>
            </div>
          </div>
          <div className="validation-stack">
            {localizedReliabilityMessages.map((message) => (
              <div
                className={`validation-message validation-message-${message.severity}`}
                key={message.id}
                role={message.severity === "warning" ? "status" : undefined}
              >
                <Icon
                  name={message.severity === "warning" ? "warning" : "shield"}
                  size={16}
                />
                <span>
                  <strong>{message.title}</strong>
                  {message.body}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="control-section">
          <div className="control-section-heading">
            <h4>{t("logoHeading")}</h4>
            <span className="control-caption">{t("logoCaption")}</span>
          </div>
          <div className="logo-options">
            <button
              aria-pressed={logoSource === "none"}
              className="segmented-button"
              onClick={() => chooseLogo("none")}
              type="button"
            >
              {t("noLogo")}
            </button>
            <button
              aria-pressed={logoSource === "preset"}
              className="segmented-button"
              onClick={() => chooseLogo("preset")}
              type="button"
            >
              {t("presetLogo")}
            </button>
            <label
              className={`upload-label ${logoSource === "upload" ? "upload-label-active" : ""}`}
            >
              <Icon name="upload" size={15} />
              {isLogoProcessing ? t("processing") : t("uploadLogo")}
              <input
                accept="image/png,image/jpeg,image/webp"
                disabled={isLogoProcessing}
                onChange={handleLogoUpload}
                type="file"
              />
            </label>
          </div>
          {logoLabel ? (
            <p className="logo-file-note">
              {t("logoUsing", { name: logoLabel })}
            </p>
          ) : null}
          {logoError ? (
            <p className="logo-file-note error" role="alert">
              {logoError}
            </p>
          ) : null}
        </div>
      </section>

      <section aria-label={t("previewAria")} className="workspace-preview">
        <div className="preview-heading">
          <div>
            <span className="preview-kicker">{t("livePreview")}</span>
            <h3>{t("directCode")}</h3>
          </div>
          <span aria-live="polite" className="status-label">
            {isGenerating ? t("updating") : t("browserOnly")}
          </span>
        </div>
        <div
          className={`preview-stage ${customization.transparent ? "" : "has-solid-background"}`}
          data-testid="qr-preview"
        >
          {previewSource ? (
            <img
              alt={t("altQr", { label: payloadLabel(type, fields) })}
              className="qr-preview-image"
              src={previewSource}
            />
          ) : (
            <div className="qr-empty-state">
              <span className="qr-empty-mark">
                <JaneQMark size={38} />
              </span>
              <strong>
                {isGenerating ? t("drawingCode") : t("emptyPreview")}
              </strong>
              <p>{localizedPayload.error ?? t("emptyPrompt")}</p>
            </div>
          )}
        </div>
        <div aria-live="polite" className="preview-content">
          <div className="status-row">
            <span
              className={`status-pill ${isValid ? "status-pill-valid" : localizedPayload.error ? "status-pill-error" : "status-pill-neutral"}`}
            >
              <span aria-hidden="true">
                {isValid ? "●" : localizedPayload.error ? "!" : "○"}
              </span>
              {isValid
                ? t("readyDownload")
                : localizedPayload.error
                  ? t("needsInput")
                  : t("waitingInput")}
            </span>
          </div>
          <p className="status-message">
            {notice ?? (isValid ? t("statusValid") : t("statusWaiting"))}
          </p>
          {type === "promptpay" && payloadResult.payload ? (
            <div className="promptpay-summary" role="note">
              <span className="promptpay-summary-label">{t("typePromptpay")}</span>
              <strong>{formatPromptPayId(fields.promptpayId)}</strong>
              <strong>
                {promptpayAmount
                  ? t("promptpayAmountSummary", { amount: promptpayAmount })
                  : t("promptpayAmountPayer")}
              </strong>
            </div>
          ) : null}
          {payloadResult.payload ? (
            <div className="payload-box">
              <span className="payload-label">{t("payloadLabel")}</span>
              <code className="payload-value">{payloadResult.payload}</code>
            </div>
          ) : null}
          <div className="preview-meta">
            <span>✓ {t("directPayload")}</span>
            <span>✓ {t("noAccount")}</span>
            <span>✓ {t("noExpiry")}</span>
          </div>
          <div className="action-row">
            <button
              className="action-button action-button-primary"
              disabled={!isValid || !currentArtifact?.pngDataUrl}
              onClick={downloadPng}
              type="button"
            >
              <Icon name="download" size={15} /> {t("png")}
            </button>
            <button
              className="action-button"
              disabled={!isValid}
              onClick={downloadSvg}
              type="button"
            >
              <Icon name="download" size={15} /> {t("svg")}
            </button>
            <button
              className="action-button"
              disabled={!isValid || !currentArtifact?.pngDataUrl}
              onClick={copyImage}
              type="button"
            >
              <Icon name="copy" size={15} /> {t("copyImage")}
            </button>
            <button
              className="action-button"
              disabled={!payloadResult.payload}
              onClick={copyContent}
              type="button"
            >
              <Icon name="copy" size={15} />
              {type === "promptpay" ? t("copyQrPayload") : t("copyContent")}
            </button>
            <button
              className="action-button"
              disabled={!isValid}
              onClick={printCode}
              type="button"
            >
              <Icon name="printer" size={15} /> {t("print")}
            </button>
          </div>
        </div>
        {type === "promptpay" && payloadResult.payload ? (
          <div className="promptpay-notes" role="note">
            <p>{t("promptpayRecipientCheck")}</p>
            <p>{t("promptpayPaymentDisclaimer")}</p>
          </div>
        ) : null}
        <p className="limit-note">
          <Icon name="warning" size={16} />
          <span>
            <strong>{t("staticLabel")}</strong> {t("staticBody")}
          </span>
        </p>
      </section>
    </div>
  );
}
