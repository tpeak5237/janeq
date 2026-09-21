export type EnhancementMode = "grayscale" | "contrast" | "adaptive";

export interface FrameMetrics {
  brightness: number;
  contrast: number;
  sharpness: number;
  lowLight: boolean;
  severelyBlurred: boolean;
}

export const LOW_LIGHT_BRIGHTNESS = 82;
export const SEVERE_BLUR_SHARPNESS = 4.5;

function luma(red: number, green: number, blue: number): number {
  return red * 0.299 + green * 0.587 + blue * 0.114;
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/**
 * Runs against the tiny metrics canvas, never against the camera's native
 * resolution. The Laplacian-like estimate is intentionally cheap and is only
 * used to drop obviously stale/blurred frames before QR decoding.
 */
export function estimateFrameMetrics(imageData: ImageData): FrameMetrics {
  const { data, width, height } = imageData;
  if (!width || !height) {
    return {
      brightness: 0,
      contrast: 0,
      sharpness: 0,
      lowLight: true,
      severelyBlurred: true,
    };
  }

  const values = new Float32Array(width * height);
  let total = 0;
  let totalSquared = 0;
  for (let index = 0, pixel = 0; index < data.length; index += 4, pixel += 1) {
    const value = luma(data[index], data[index + 1], data[index + 2]);
    values[pixel] = value;
    total += value;
    totalSquared += value * value;
  }

  let laplacianTotal = 0;
  let laplacianSamples = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const laplacian = Math.abs(
        values[index] * 4 -
          values[index - 1] -
          values[index + 1] -
          values[index - width] -
          values[index + width],
      );
      laplacianTotal += laplacian;
      laplacianSamples += 1;
    }
  }

  const pixelCount = width * height;
  const brightness = total / pixelCount;
  const contrast = Math.sqrt(Math.max(0, totalSquared / pixelCount - brightness ** 2));
  const sharpness = laplacianSamples ? laplacianTotal / laplacianSamples : 0;

  return {
    brightness,
    contrast,
    sharpness,
    lowLight: brightness < LOW_LIGHT_BRIGHTNESS,
    severelyBlurred: sharpness < SEVERE_BLUR_SHARPNESS,
  };
}

function drawBaseFrame(source: HTMLCanvasElement, destination: HTMLCanvasElement): ImageData | null {
  const sourceContext = source.getContext("2d", { willReadFrequently: true });
  const destinationContext = destination.getContext("2d", { willReadFrequently: true });
  if (!sourceContext || !destinationContext) return null;

  destination.width = source.width;
  destination.height = source.height;
  destinationContext.drawImage(source, 0, 0);
  return destinationContext.getImageData(0, 0, destination.width, destination.height);
}

/**
 * Creates one enhanced frame at a time. The pipeline rotates these modes
 * across difficult frames instead of paying for all transformations on every
 * camera tick.
 */
export function renderEnhancedFrame(
  source: HTMLCanvasElement,
  destination: HTMLCanvasElement,
  mode: EnhancementMode,
): boolean {
  const imageData = drawBaseFrame(source, destination);
  const context = destination.getContext("2d", { willReadFrequently: true });
  if (!imageData || !context) return false;

  const { data, width, height } = imageData;
  const output = context.createImageData(width, height);
  const contrastFactor = 1.65;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const center = luma(data[index], data[index + 1], data[index + 2]);
      let value = center;

      if (mode === "contrast") {
        value = (center - 128) * contrastFactor + 128;
      } else if (mode === "adaptive") {
        const left = x > 0 ? luma(data[index - 4], data[index - 3], data[index - 2]) : center;
        const right =
          x + 1 < width
            ? luma(data[index + 4], data[index + 5], data[index + 6])
            : center;
        const above =
          y > 0
            ? luma(data[index - width * 4], data[index - width * 4 + 1], data[index - width * 4 + 2])
            : center;
        const below =
          y + 1 < height
            ? luma(data[index + width * 4], data[index + width * 4 + 1], data[index + width * 4 + 2])
            : center;
        const localMean = (left + right + above + below + center) / 5;
        value = center >= localMean - 8 ? 255 : 0;
      }

      const outputValue = clampByte(value);
      output.data[index] = outputValue;
      output.data[index + 1] = outputValue;
      output.data[index + 2] = outputValue;
      output.data[index + 3] = 255;
    }
  }

  context.putImageData(output, 0, 0);
  return true;
}
