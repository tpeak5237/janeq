"use client";

import {
  type ChangeEvent,
  type DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  classifyQrPayload,
  getSafeExternalUrl,
  normalizeScanResult,
  type ScanPayloadClassification,
} from "@/lib/scanner";
import {
  QrCameraPipeline,
  type CameraInfo,
} from "@/lib/qr-camera-pipeline";
import { useCopy } from "@/lib/i18n";

type InputMode = "camera" | "upload";
type ScannerStatus =
  | "idle"
  | "requesting"
  | "scanning"
  | "decoding"
  | "detected"
  | "permission-denied"
  | "no-camera"
  | "insecure"
  | "unsupported"
  | "no-result"
  | "error";

const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

function cameraErrorStatus(error: unknown): ScannerStatus {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return "insecure";
    }
  }
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "permission-denied";
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "no-camera";
    }
  }
  return "error";
}

export function QrScanner() {
  const { t } = useCopy();
  const videoRef = useRef<HTMLVideoElement>(null);
  const pipelineRef = useRef<QrCameraPipeline | null>(null);
  const detectedRef = useRef(false);
  const imageObjectUrlRef = useRef<string | null>(null);
  const startingCameraRef = useRef(false);
  const [inputMode, setInputMode] = useState<InputMode>("camera");
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [result, setResult] = useState<ScanPayloadClassification | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | undefined>();
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [lowLight, setLowLight] = useState(false);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  function clearImagePreview() {
    if (imageObjectUrlRef.current) {
      URL.revokeObjectURL(imageObjectUrlRef.current);
      imageObjectUrlRef.current = null;
    }
    setImagePreviewUrl(null);
  }

  function handleDecodedValue(value: string) {
    if (detectedRef.current) return;
    try {
      const classification = classifyQrPayload(normalizeScanResult(value));
      detectedRef.current = true;
      pipelineRef.current?.stop();
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(35);
      }
      setResult(classification);
      setStatus("detected");
    } catch {
      setStatus("no-result");
    }
  }

  async function startCamera(deviceId?: string) {
    if (startingCameraRef.current) return;
    if (typeof window === "undefined") return;
    if (!window.isSecureContext) {
      const hostname = window.location.hostname;
      if (hostname !== "localhost" && hostname !== "127.0.0.1") {
        setStatus("insecure");
        return;
      }
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }

    startingCameraRef.current = true;
    detectedRef.current = false;
    setResult(null);
    setCopyNotice(null);
    setLowLight(false);
    setStatus("requesting");

    try {
      await pipelineRef.current?.start(deviceId);
    } catch (error) {
      pipelineRef.current?.stop();
      setStatus(cameraErrorStatus(error));
    } finally {
      startingCameraRef.current = false;
    }
  }

  function stopCamera() {
    detectedRef.current = false;
    pipelineRef.current?.stop();
    setLowLight(false);
    setHasTorch(false);
    setTorchOn(false);
    setActiveDeviceId(undefined);
    setStatus("idle");
  }

  async function toggleTorch() {
    const nextValue = await pipelineRef.current?.toggleTorch();
    if (typeof nextValue === "boolean") setTorchOn(nextValue);
  }

  function resetResult() {
    detectedRef.current = false;
    setResult(null);
    setCopyNotice(null);
    setStatus("idle");
  }

  function selectInputMode(nextMode: InputMode) {
    if (nextMode === inputMode) return;
    if (nextMode === "upload") {
      pipelineRef.current?.stop();
      setLowLight(false);
      setHasTorch(false);
      setTorchOn(false);
    }
    resetResult();
    setInputMode(nextMode);
  }

  async function decodeImage(file: File) {
    clearImagePreview();
    resetResult();
    if (!file.type.startsWith("image/")) {
      setStatus("error");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setStatus("error");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    imageObjectUrlRef.current = objectUrl;
    setImagePreviewUrl(objectUrl);
    setStatus("decoding");
    try {
      pipelineRef.current?.stop();
      const decoded = await pipelineRef.current?.decodeImage(file);
      if (decoded) handleDecodedValue(decoded);
    } catch {
      setStatus("no-result");
    } finally {
      clearImagePreview();
    }
  }

  function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void decodeImage(file);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) void decodeImage(file);
  }

  async function copyResult() {
    if (!result) return;
    if (!navigator.clipboard?.writeText) {
      setCopyNotice(t("clipboardUnavailable"));
      return;
    }
    try {
      await navigator.clipboard.writeText(result.label);
      setCopyNotice(t("copyResultDone"));
    } catch {
      setCopyNotice(t("clipboardUnavailable"));
    }
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const pipeline = new QrCameraPipeline(video, {
      onDecoded: handleDecodedValue,
      onLightingChange: (isLowLight) => setLowLight(isLowLight),
      onReady: ({ cameras: availableCameras, activeDeviceId: nextDeviceId, hasTorch: torchSupported }) => {
        setCameras(availableCameras);
        setActiveDeviceId(nextDeviceId);
        setHasTorch(torchSupported);
        setTorchOn(false);
        setStatus("scanning");
      },
    });
    pipelineRef.current = pipeline;
    return () => {
      pipeline.destroy();
      pipelineRef.current = null;
      clearImagePreview();
    };
  }, []);

  const safeUrl = result?.openable ? getSafeExternalUrl(result.label) : null;
  const statusMessage = {
    idle: inputMode === "camera" ? t("cameraReady") : t("chooseImage"),
    requesting: t("requestingCamera"),
    scanning: t("scanning"),
    decoding: t("processingImage"),
    detected: t("qrDetected"),
    "permission-denied": t("cameraPermissionDenied"),
    "no-camera": t("noCamera"),
    insecure: t("cameraRequiresHttps"),
    unsupported: t("cameraUnsupported"),
    "no-result": t("noQrFound"),
    error: t("scannerError"),
  }[status];

  return (
    <section aria-label={t("scannerAria")} className="scanner-shell">
      <div className="scanner-heading">
        <div>
          <span className="workspace-kicker">{t("processedLocally")}</span>
          <h2>{t("scanQr")}</h2>
        </div>
        <p>{t("scannerDescription")}</p>
      </div>

      <div aria-label={t("scannerInputAria")} className="scanner-tabs" role="tablist">
        <button
          aria-selected={inputMode === "camera"}
          className="segmented-button"
          onClick={() => selectInputMode("camera")}
          role="tab"
          type="button"
        >
          {t("camera")}
        </button>
        <button
          aria-selected={inputMode === "upload"}
          className="segmented-button"
          onClick={() => selectInputMode("upload")}
          role="tab"
          type="button"
        >
          {t("uploadImage")}
        </button>
      </div>

      <div className="scanner-grid">
        <div className="scanner-source">
          {inputMode === "camera" ? (
            <div className="camera-panel">
              <div className="camera-frame">
                <video
                  aria-label={t("cameraPreview")}
                  autoPlay
                  muted
                  playsInline
                  ref={videoRef}
                />
                <div aria-hidden="true" className="finder-frame" />
                {status !== "scanning" ? (
                  <div className="camera-placeholder">{t("cameraIdle")}</div>
                ) : null}
              </div>
              <p className="scanner-full-frame-hint">{t("scannerFullFrameHint")}</p>
              <div className="scanner-actions">
                {status === "scanning" || status === "requesting" ? (
                  <button
                    className="action-button action-button-primary"
                    onClick={stopCamera}
                    type="button"
                  >
                    {t("stopCamera")}
                  </button>
                ) : (
                  <button
                    className="action-button action-button-primary"
                    onClick={() => void startCamera()}
                    type="button"
                  >
                    {t("startCamera")}
                  </button>
                )}
                {hasTorch && status === "scanning" ? (
                  <button
                    aria-pressed={torchOn}
                    className="action-button"
                    onClick={() => void toggleTorch()}
                    type="button"
                  >
                    {torchOn ? t("turnTorchOff") : t("turnTorchOn")}
                  </button>
                ) : null}
                {cameras.length > 1 && status === "scanning" ? (
                  <button
                    className="action-button"
                    onClick={() => {
                      const currentIndex = cameras.findIndex(
                        (camera) => camera.id === activeDeviceId,
                      );
                      const nextCamera =
                        cameras[(currentIndex + 1) % cameras.length];
                      void startCamera(nextCamera.id);
                    }}
                    type="button"
                  >
                    {t("switchCamera")}
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <label
              className="image-dropzone"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              <span className="image-dropzone-mark" aria-hidden="true">QR</span>
              <strong>{t("chooseImage")}</strong>
              <span>{t("dropImageHere")}</span>
              <input
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                type="file"
              />
              {imagePreviewUrl ? (
                <img alt={t("uploadedImagePreview")} src={imagePreviewUrl} />
              ) : null}
            </label>
          )}
          <p aria-live="polite" className="scanner-status">
            <span aria-hidden="true" className={`status-dot status-${status}`} />
            {statusMessage}
          </p>
          {lowLight && inputMode === "camera" && status === "scanning" ? (
            <p aria-live="polite" className="scanner-light-hint">
              {t("lowLightHint")}
            </p>
          ) : null}
        </div>

        <div
          className={`scanner-result-panel ${result ? "scanner-result-panel-success" : "scanner-result-panel-empty"}`}
          aria-live="polite"
        >
          {result ? (
            <>
              <span className="workspace-kicker">{t("qrDetected")}</span>
              {safeUrl ? (
                <p className="scanner-hostname">{safeUrl.hostname}</p>
              ) : null}
              <code className="scanner-result-value">{result.label}</code>
              <div className="scanner-actions">
                <button className="action-button" onClick={() => void copyResult()} type="button">
                  {t("copyResult")}
                </button>
                {safeUrl ? (
                  <a
                    className="action-button action-button-primary"
                    href={safeUrl.href}
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    {t("openLink")}
                  </a>
                ) : null}
                <button className="action-button" onClick={resetResult} type="button">
                  {t("scanAnother")}
                </button>
              </div>
              {copyNotice ? <p className="scanner-copy-notice">{copyNotice}</p> : null}
            </>
          ) : (
            <div className="scanner-empty-state">
              <span className="workspace-kicker">{t("scanResult")}</span>
              <p>{t("scannerResultHint")}</p>
            </div>
          )}
        </div>
      </div>

      <p className="scanner-privacy-note">{t("scannerPrivacy")}</p>
    </section>
  );
}
