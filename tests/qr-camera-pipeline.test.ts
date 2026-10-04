import { afterEach, describe, expect, it, vi } from "vitest";

import { QrCameraPipeline } from "@/lib/qr-camera-pipeline";
import { createScanObservation, parseScanObservation } from "@/lib/scan-observation";

describe("QrCameraPipeline", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ignores a late camera decode after stop and accepts a fresh run", async () => {
    vi.stubGlobal("document", { createElement: () => ({}) });
    vi.stubGlobal("HTMLMediaElement", { HAVE_CURRENT_DATA: 2 });

    const video = {
      readyState: 2,
      pause: vi.fn(),
      srcObject: null,
    } as unknown as HTMLVideoElement;
    const onDecoded = vi.fn();
    const pipeline = new QrCameraPipeline(video, {
      onDecoded: (value) => onDecoded(parseScanObservation(
        JSON.parse(JSON.stringify(createScanObservation(value, "camera"))),
      )),
    });
    const internals = pipeline as unknown as {
      busy: boolean;
      captureFrame: () => { width: number; height: number } | null;
      captureMetrics: () => { severelyBlurred: boolean };
      debugLog: () => void;
      decodeCanvas: () => Promise<string | null>;
      engine: object | null;
      fastCanvas: HTMLCanvasElement;
      fastDecodeCanvas: HTMLCanvasElement;
      processFrame: (run: number, now: number) => Promise<void>;
      reportLighting: () => void;
      runId: number;
      running: boolean;
      nextScanAt: number;
    };
    internals.running = true;
    internals.runId = 1;
    internals.engine = {};
    internals.captureMetrics = () => ({ severelyBlurred: false });
    internals.reportLighting = () => undefined;
    internals.captureFrame = () => ({ width: 320, height: 240 });
    internals.debugLog = () => undefined;
    internals.fastCanvas = {} as HTMLCanvasElement;
    internals.fastDecodeCanvas = {} as HTMLCanvasElement;

    let resolveDecode: ((value: string | null) => void) | undefined;
    internals.decodeCanvas = () => new Promise((resolve) => {
      resolveDecode = resolve;
    });
    const processing = internals.processFrame(1, performance.now());

    expect(resolveDecode).toBeDefined();
    pipeline.stop();
    resolveDecode?.("https://synthetic.example/late-camera-result");
    await processing;

    expect(onDecoded).not.toHaveBeenCalled();

    internals.runId = 3;
    internals.running = true;
    internals.engine = {};
    internals.nextScanAt = 0;
    internals.decodeCanvas = async () => "https://synthetic.example/fresh-camera-run";
    await internals.processFrame(3, performance.now());

    expect(onDecoded).toHaveBeenCalledOnce();
    expect(onDecoded).toHaveBeenCalledWith(
      { schemaVersion: 1, source: "camera", payload: "https://synthetic.example/fresh-camera-run" },
    );
  });

  it("passes one accepted observation to a local consumer and rejects empty, stale and duplicate callbacks", () => {
    vi.stubGlobal("document", { createElement: () => ({}) });
    const video = { pause: vi.fn(), srcObject: null } as unknown as HTMLVideoElement;
    const consumer = vi.fn();
    const pipeline = new QrCameraPipeline(video, {
      onDecoded: (value) => {
        consumer(parseScanObservation(JSON.parse(JSON.stringify(createScanObservation(value, "camera")))));
        pipeline.stop();
      },
    });
    const internals = pipeline as unknown as {
      running: boolean;
      runId: number;
      debugLog: () => void;
      acceptDecoded: (value: string, run: number, path: string) => boolean;
    };
    internals.running = true;
    internals.runId = 1;
    internals.debugLog = () => undefined;
    expect(internals.acceptDecoded(" ", 1, "synthetic")).toBe(false);
    expect(internals.acceptDecoded("synthetic", 0, "synthetic")).toBe(false);
    expect(consumer).not.toHaveBeenCalled();
    expect(internals.acceptDecoded("synthetic", 1, "synthetic")).toBe(true);
    expect(internals.acceptDecoded("synthetic", 1, "synthetic")).toBe(false);
    expect(consumer).toHaveBeenCalledOnce();
    expect(consumer).toHaveBeenCalledWith({ schemaVersion: 1, source: "camera", payload: "synthetic" });
  });
});
