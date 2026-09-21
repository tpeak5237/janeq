import QrScanner from "qr-scanner";

import {
  prioritizeDetectionRois,
  scoreDetectionGrid,
  type DetectionRect,
} from "@/lib/qr-detection";
import {
  estimateFrameMetrics,
  renderEnhancedFrame,
  type EnhancementMode,
  type FrameMetrics,
} from "@/lib/qr-image";
import { isDuplicateScan } from "@/lib/scanner";

const METRICS_WIDTH = 96;
const METRICS_HEIGHT = 64;
const FAST_FRAME_WIDTH = 640;
const HIGH_RES_FRAME_WIDTH = 1600;
const ROI_SCALE = 1.65;
const FULL_FRAME_FALLBACK_MS = 1200;
const DUPLICATE_COOLDOWN_MS = 1000;
const INITIAL_SCAN_INTERVAL_MS = 65;
const MIN_SCAN_INTERVAL_MS = 45;
const MAX_SCAN_INTERVAL_MS = 220;
const ENHANCEMENT_MODES: EnhancementMode[] = [
  "grayscale",
  "contrast",
  "adaptive",
];

interface NativeQrEngine {
  detect(source: CanvasImageSource): Promise<
    Array<{
      rawValue: string;
      cornerPoints: Array<{ x: number; y: number }>;
    }>
  >;
}

type QrEngine = Worker | NativeQrEngine;
type FrameCallback = (now: number, metadata: VideoFrameCallbackMetadata) => void;
type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: FrameCallback) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

interface VideoFrameCallbackMetadata {
  mediaTime: number;
  presentedFrames: number;
  expectedDisplayTime: number;
  width: number;
  height: number;
}

export interface CameraInfo {
  id: string;
  label: string;
}

export interface CameraPipelineState {
  cameras: CameraInfo[];
  activeDeviceId?: string;
  hasTorch: boolean;
}

export interface QrCameraPipelineCallbacks {
  onDecoded: (value: string) => void;
  onLightingChange?: (lowLight: boolean, metrics: FrameMetrics) => void;
  onReady?: (state: CameraPipelineState) => void;
}

interface ExtendedTrackCapabilities extends MediaTrackCapabilities {
  focusMode?: string[];
  exposureMode?: string[];
  whiteBalanceMode?: string[];
  torch?: boolean;
}

interface ExtendedTrackConstraintSet extends MediaTrackConstraintSet {
  focusMode?: string;
  exposureMode?: string;
  whiteBalanceMode?: string;
  torch?: boolean;
}

function hasDetector(engine: QrEngine): engine is NativeQrEngine {
  return typeof (engine as { detect?: unknown }).detect === "function";
}

function isWorker(engine: QrEngine): engine is Worker {
  return typeof Worker !== "undefined" && engine instanceof Worker;
}

function clampScanInterval(duration: number): number {
  if (duration <= 30) return MIN_SCAN_INTERVAL_MS;
  return Math.min(MAX_SCAN_INTERVAL_MS, Math.max(MIN_SCAN_INTERVAL_MS, Math.ceil(duration * 1.25 + 25)));
}

function cameraConstraints(deviceId?: string): MediaStreamConstraints {
  const video: MediaTrackConstraints = {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 60, max: 60 },
    ...(deviceId
      ? { deviceId: { exact: deviceId } }
      : { facingMode: { ideal: "environment" } }),
  };
  return { audio: false, video };
}

function getVideoDimensions(video: HTMLVideoElement): { width: number; height: number } | null {
  if (!video.videoWidth || !video.videoHeight) return null;
  return { width: video.videoWidth, height: video.videoHeight };
}

function setCanvasSize(canvas: HTMLCanvasElement, width: number, height: number): void {
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
}

export class QrCameraPipeline {
  private readonly video: HTMLVideoElement;
  private readonly callbacks: QrCameraPipelineCallbacks;
  private readonly metricsCanvas = document.createElement("canvas");
  private readonly fastCanvas = document.createElement("canvas");
  private readonly fastDecodeCanvas = document.createElement("canvas");
  private readonly enhancedCanvas = document.createElement("canvas");
  private readonly roiCanvas = document.createElement("canvas");
  private readonly roiEnhancedCanvas = document.createElement("canvas");
  private readonly roiDecodeCanvas = document.createElement("canvas");
  private readonly fullDecodeCanvas = document.createElement("canvas");
  private engine: QrEngine | null = null;
  private fallbackWorker: Worker | null = null;
  private stream: MediaStream | null = null;
  private runId = 0;
  private imageDecodeId = 0;
  private frameCallbackId: number | null = null;
  private timeoutId: number | null = null;
  private scanTask: Promise<void> | null = null;
  private running = false;
  private starting = false;
  private busy = false;
  private nextScanAt = 0;
  private scanInterval = INITIAL_SCAN_INTERVAL_MS;
  private frameNumber = 0;
  private failureCount = 0;
  private lastFullFallbackAt = 0;
  private enhancementIndex = 0;
  private lastDecodedValue = "";
  private lastDecodedAt = 0;
  private startedAt = 0;
  private firstDecodeLogged = false;
  private nativeDetectorFailed = false;
  private lowLight = false;
  private lastLightingReportAt = 0;
  private torchOn = false;

  constructor(video: HTMLVideoElement, callbacks: QrCameraPipelineCallbacks) {
    this.video = video;
    this.callbacks = callbacks;
  }

  async start(deviceId?: string): Promise<void> {
    if (this.starting) return;
    this.starting = true;
    const run = ++this.runId;
    this.stopResources();
    const pendingScan = this.scanTask;
    if (pendingScan) await pendingScan.catch(() => undefined);
    if (run !== this.runId) {
      this.starting = false;
      return;
    }
    this.resetScanState();

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(cameraConstraints(deviceId));
      } catch (error) {
        if (!deviceId || (error instanceof DOMException && error.name !== "OverconstrainedError" && error.name !== "NotFoundError")) {
          throw error;
        }
        stream = await navigator.mediaDevices.getUserMedia(cameraConstraints());
      }

      if (run !== this.runId) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      this.stream = stream;
      this.video.srcObject = stream;
      await this.video.play();
      await this.applyContinuousCameraControls();
      this.engine = (await QrScanner.createQrEngine()) as QrEngine;

      if (run !== this.runId) {
        this.stopResources();
        return;
      }

      const track = stream.getVideoTracks()[0];
      const settings = track?.getSettings();
      const cameras = await QrScanner.listCameras();
      const capabilities = (track?.getCapabilities?.() ?? {}) as ExtendedTrackCapabilities;
      this.running = true;
      this.startedAt = performance.now();
      this.callbacks.onReady?.({
        cameras,
        activeDeviceId: settings?.deviceId ?? deviceId,
        hasTorch: capabilities.torch === true,
      });
      this.scheduleNextFrame(run);
    } finally {
      this.starting = false;
    }
  }

  stop(): void {
    this.runId += 1;
    this.imageDecodeId += 1;
    this.stopResources();
  }

  destroy(): void {
    this.stop();
  }

  async toggleTorch(): Promise<boolean> {
    const track = this.stream?.getVideoTracks()[0];
    if (!track) return false;
    const capabilities = (track.getCapabilities?.() ?? {}) as ExtendedTrackCapabilities;
    if (capabilities.torch !== true) return false;

    const nextValue = !this.torchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: nextValue } as ExtendedTrackConstraintSet],
      });
      this.torchOn = nextValue;
      return this.torchOn;
    } catch {
      return this.torchOn;
    }
  }

  async decodeImage(file: File): Promise<string> {
    const decodeId = ++this.imageDecodeId;
    const engine = (await QrScanner.createQrEngine()) as QrEngine;
    let fallbackWorker: Worker | null = null;
    try {
      try {
        const decoded = await QrScanner.scanImage(file, {
          qrEngine: engine,
          returnDetailedScanResult: true,
        });
        if (decodeId !== this.imageDecodeId) throw new Error("Image scan cancelled");
        return decoded.data;
      } catch (error) {
        if (!hasDetector(engine)) throw error;
        const workerModule = await import("qr-scanner/qr-scanner-worker.min.js");
        fallbackWorker = workerModule.createWorker();
        const decoded = await QrScanner.scanImage(file, {
          qrEngine: fallbackWorker,
          returnDetailedScanResult: true,
        });
        if (decodeId !== this.imageDecodeId) throw new Error("Image scan cancelled");
        return decoded.data;
      }
    } finally {
      if (isWorker(engine)) engine.terminate();
      fallbackWorker?.terminate();
    }
  }

  private resetScanState(): void {
    this.frameNumber = 0;
    this.failureCount = 0;
    this.lastFullFallbackAt = 0;
    this.enhancementIndex = 0;
    this.scanInterval = INITIAL_SCAN_INTERVAL_MS;
    this.nextScanAt = 0;
    this.lastDecodedValue = "";
    this.lastDecodedAt = 0;
    this.startedAt = 0;
    this.firstDecodeLogged = false;
    this.nativeDetectorFailed = false;
    this.lowLight = false;
    this.lastLightingReportAt = 0;
    this.torchOn = false;
  }

  private stopResources(): void {
    this.running = false;
    this.cancelScheduledFrame();
    if (this.engine && isWorker(this.engine)) this.engine.terminate();
    this.engine = null;
    if (this.fallbackWorker) this.fallbackWorker.terminate();
    this.fallbackWorker = null;
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.video.pause();
    this.video.srcObject = null;
  }

  private cancelScheduledFrame(): void {
    const video = this.video as VideoWithFrameCallback;
    if (this.frameCallbackId !== null && video.cancelVideoFrameCallback) {
      video.cancelVideoFrameCallback(this.frameCallbackId);
    }
    if (this.timeoutId !== null) window.clearTimeout(this.timeoutId);
    this.frameCallbackId = null;
    this.timeoutId = null;
  }

  private async applyContinuousCameraControls(): Promise<void> {
    const track = this.stream?.getVideoTracks()[0];
    if (!track?.getCapabilities) return;
    const capabilities = track.getCapabilities() as ExtendedTrackCapabilities;
    const advanced: ExtendedTrackConstraintSet = {};
    if (capabilities.focusMode?.includes("continuous")) advanced.focusMode = "continuous";
    if (capabilities.exposureMode?.includes("continuous")) advanced.exposureMode = "continuous";
    if (capabilities.whiteBalanceMode?.includes("continuous")) {
      advanced.whiteBalanceMode = "continuous";
    }
    if (Object.keys(advanced).length === 0) return;
    try {
      await track.applyConstraints({ advanced: [advanced] });
    } catch {
      // Optional camera controls vary widely; failure must not block scanning.
    }
  }

  private scheduleNextFrame(run: number): void {
    if (!this.running || run !== this.runId) return;
    const video = this.video as VideoWithFrameCallback;
    if (video.requestVideoFrameCallback) {
      this.frameCallbackId = video.requestVideoFrameCallback((now) => {
        this.frameCallbackId = null;
        const task = this.processFrame(run, now);
        this.scanTask = task;
        void task.finally(() => {
          if (this.scanTask === task) this.scanTask = null;
          this.scheduleNextFrame(run);
        });
      });
      return;
    }

    this.timeoutId = window.setTimeout(() => {
      this.timeoutId = null;
      const task = this.processFrame(run, performance.now());
      this.scanTask = task;
      void task.finally(() => {
        if (this.scanTask === task) this.scanTask = null;
        this.scheduleNextFrame(run);
      });
    }, this.scanInterval);
  }

  private async processFrame(run: number, now: number): Promise<void> {
    if (!this.running || run !== this.runId || this.busy || now < this.nextScanAt) return;
    if (this.video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    this.busy = true;
    const started = performance.now();
    let path = "skipped";
    let usedCandidateRoi = false;
    try {
      const metrics = this.captureMetrics();
      this.reportLighting(metrics, now);
      if (metrics.severelyBlurred) {
        path = "skipped-blur";
        return;
      }

      const fastFrame = this.captureFrame(this.fastCanvas, FAST_FRAME_WIDTH);
      if (!fastFrame || !this.engine) return;
      this.frameNumber += 1;

      path = "fast-original";
      let decoded = await this.decodeCanvas(this.fastCanvas, this.fastDecodeCanvas, false);
      if (!this.running || run !== this.runId) return;
      if (decoded && this.acceptDecoded(decoded, run, path)) return;

      const fastContext = this.fastCanvas.getContext("2d", { willReadFrequently: true });
      const fastImage = fastContext?.getImageData(0, 0, this.fastCanvas.width, this.fastCanvas.height);
      const zones = fastImage ? scoreDetectionGrid(fastImage) : [];
      const dimensions = getVideoDimensions(this.video);
      const rois = dimensions ? prioritizeDetectionRois(zones, dimensions.width, dimensions.height, this.lowLight ? 3 : 2) : [];

      for (const roi of rois) {
        usedCandidateRoi = true;
        path = "candidate-roi";
        if (!this.drawVideoRegion(roi, this.roiCanvas, ROI_SCALE)) continue;
        decoded = await this.decodeCanvas(this.roiCanvas, this.roiDecodeCanvas, true);
        if (!this.running || run !== this.runId) return;
        if (decoded && this.acceptDecoded(decoded, run, path)) return;
      }

      const difficultFrame = this.lowLight || this.failureCount >= 2;
      if (difficultFrame) {
        const mode = ENHANCEMENT_MODES[this.enhancementIndex % ENHANCEMENT_MODES.length];
        this.enhancementIndex += 1;
        path = `enhanced-${mode}`;
        if (renderEnhancedFrame(this.fastCanvas, this.enhancedCanvas, mode)) {
          decoded = await this.decodeCanvas(this.enhancedCanvas, this.fastDecodeCanvas, true);
          if (!this.running || run !== this.runId) return;
          if (decoded && this.acceptDecoded(decoded, run, path)) return;
        }

        if (rois[0] && this.drawVideoRegion(rois[0], this.roiCanvas, ROI_SCALE)) {
          path = `enhanced-roi-${mode}`;
          if (renderEnhancedFrame(this.roiCanvas, this.roiEnhancedCanvas, mode)) {
            decoded = await this.decodeCanvas(this.roiEnhancedCanvas, this.roiDecodeCanvas, true);
            if (!this.running || run !== this.runId) return;
            if (decoded && this.acceptDecoded(decoded, run, path)) return;
          }
        }
      }

      if (now - this.lastFullFallbackAt >= FULL_FRAME_FALLBACK_MS) {
        this.lastFullFallbackAt = now;
        path = "full-frame-fallback";
        if (this.drawVideoRegion({ x: 0, y: 0, width: dimensions?.width ?? 0, height: dimensions?.height ?? 0 }, this.fastCanvas, 1)) {
          decoded = await this.decodeCanvas(this.fastCanvas, this.fullDecodeCanvas, true, HIGH_RES_FRAME_WIDTH);
          if (!this.running || run !== this.runId) return;
          if (decoded && this.acceptDecoded(decoded, run, path)) return;
        }
      }

      this.failureCount += 1;
    } finally {
      const duration = performance.now() - started;
      this.scanInterval = clampScanInterval(duration);
      this.nextScanAt = performance.now() + this.scanInterval;
      this.busy = false;
      this.debugLog({ duration, path, brightness: this.lowLight ? "low-light" : "normal", usedCandidateRoi });
    }
  }

  private captureMetrics(): FrameMetrics {
    setCanvasSize(this.metricsCanvas, METRICS_WIDTH, METRICS_HEIGHT);
    const context = this.metricsCanvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      return estimateFrameMetrics(new ImageData(METRICS_WIDTH, METRICS_HEIGHT));
    }
    context.drawImage(this.video, 0, 0, METRICS_WIDTH, METRICS_HEIGHT);
    return estimateFrameMetrics(context.getImageData(0, 0, METRICS_WIDTH, METRICS_HEIGHT));
  }

  private captureFrame(canvas: HTMLCanvasElement, maxWidth: number): { width: number; height: number } | null {
    const dimensions = getVideoDimensions(this.video);
    if (!dimensions) return null;
    const width = Math.min(maxWidth, dimensions.width);
    const height = Math.max(1, Math.round((width * dimensions.height) / dimensions.width));
    setCanvasSize(canvas, width, height);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    context.imageSmoothingEnabled = false;
    context.drawImage(this.video, 0, 0, dimensions.width, dimensions.height, 0, 0, width, height);
    return { width, height };
  }

  private drawVideoRegion(rect: DetectionRect, canvas: HTMLCanvasElement, scale: number): boolean {
    const dimensions = getVideoDimensions(this.video);
    if (!dimensions || rect.width <= 0 || rect.height <= 0) return false;
    const width = Math.min(HIGH_RES_FRAME_WIDTH, Math.max(320, Math.round(rect.width * scale)));
    const height = Math.max(1, Math.round((width * rect.height) / rect.width));
    setCanvasSize(canvas, width, height);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return false;
    context.imageSmoothingEnabled = false;
    context.drawImage(
      this.video,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      0,
      0,
      width,
      height,
    );
    return true;
  }

  private async decodeCanvas(
    source: HTMLCanvasElement,
    decodeCanvas: HTMLCanvasElement,
    allowWorkerFallback: boolean,
    maxWidth?: number,
  ): Promise<string | null> {
    if (!this.engine) return null;
    if (maxWidth && source.width > maxWidth) {
      const ratio = maxWidth / source.width;
      setCanvasSize(decodeCanvas, maxWidth, Math.max(1, Math.round(source.height * ratio)));
    }

    if (hasDetector(this.engine) && !this.nativeDetectorFailed) {
      try {
        const detections = await this.engine.detect(source);
        const value = detections.find((d) => d.rawValue)?.rawValue;
        if (value) return value;
        return allowWorkerFallback ? this.decodeWithWorker(source, decodeCanvas) : null;
      } catch {
        this.nativeDetectorFailed = true;
        if (allowWorkerFallback) return this.decodeWithWorker(source, decodeCanvas);
      }
    }

    return this.decodeWithEngine(source, decodeCanvas, this.engine);
  }

  private async decodeWithEngine(
    source: HTMLCanvasElement,
    decodeCanvas: HTMLCanvasElement,
    engine: QrEngine,
  ): Promise<string | null> {
    try {
      const decoded = await QrScanner.scanImage(source, {
        qrEngine: engine,
        canvas: decodeCanvas,
        returnDetailedScanResult: true,
      });
      return decoded.data;
    } catch {
      return null;
    }
  }

  private async decodeWithWorker(
    source: HTMLCanvasElement,
    decodeCanvas: HTMLCanvasElement,
  ): Promise<string | null> {
    const worker = await this.createFallbackWorker();
    return this.decodeWithEngine(source, decodeCanvas, worker);
  }

  private async createFallbackWorker(): Promise<Worker> {
    if (this.fallbackWorker) return this.fallbackWorker;
    const workerModule = await import("qr-scanner/qr-scanner-worker.min.js");
    this.fallbackWorker = workerModule.createWorker();
    return this.fallbackWorker;
  }

  private acceptDecoded(value: string, run: number, path: string): boolean {
    if (!value.trim() || !this.running || run !== this.runId) return false;
    const now = performance.now();
    if (isDuplicateScan(value, this.lastDecodedValue, this.lastDecodedAt, now, DUPLICATE_COOLDOWN_MS)) {
      return false;
    }
    this.lastDecodedValue = value;
    this.lastDecodedAt = now;
    if (!this.firstDecodeLogged) {
      this.firstDecodeLogged = true;
      this.debugLog({
        timeToFirstDecode: now - this.startedAt,
        path,
        brightness: this.lowLight ? "low-light" : "normal",
      });
    }
    this.callbacks.onDecoded(value);
    this.stopResources();
    return true;
  }

  private reportLighting(metrics: FrameMetrics, now: number): void {
    if (
      metrics.lowLight !== this.lowLight ||
      now - this.lastLightingReportAt >= 800
    ) {
      this.lowLight = metrics.lowLight;
      this.lastLightingReportAt = now;
      this.callbacks.onLightingChange?.(metrics.lowLight, metrics);
    }
  }

  private debugLog(payload: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[JaneQ scanner]", payload);
    }
  }
}
