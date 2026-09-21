export const QR_DETECTION_GRID_SIZE = 10;

export interface DetectionZone {
  column: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
  contrast: number;
  edgeDensity: number;
  transitionDensity: number;
}

export interface DetectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function luminance(red: number, green: number, blue: number): number {
  return red * 0.299 + green * 0.587 + blue * 0.114;
}

function sampleZone(
  imageData: ImageData,
  zone: DetectionRect,
  columnCount = 8,
  rowCount = 8,
): Pick<DetectionZone, "contrast" | "edgeDensity" | "transitionDensity"> {
  const { data, width: imageWidth } = imageData;
  const values = new Float32Array(columnCount * rowCount);
  let sum = 0;
  let sumSquared = 0;

  for (let row = 0; row < rowCount; row += 1) {
    const sourceY = Math.min(
      Math.max(0, Math.floor(zone.y + ((row + 0.5) / rowCount) * zone.height)),
      imageData.height - 1,
    );
    for (let column = 0; column < columnCount; column += 1) {
      const sourceX = Math.min(
        Math.max(0, Math.floor(zone.x + ((column + 0.5) / columnCount) * zone.width)),
        imageWidth - 1,
      );
      const index = (sourceY * imageWidth + sourceX) * 4;
      const value = luminance(data[index], data[index + 1], data[index + 2]);
      const sampleIndex = row * columnCount + column;
      values[sampleIndex] = value;
      sum += value;
      sumSquared += value * value;
    }
  }

  const sampleCount = values.length;
  const mean = sum / sampleCount;
  const variance = Math.max(0, sumSquared / sampleCount - mean * mean);
  let edgeCount = 0;
  let transitionCount = 0;
  const transitionThreshold = Math.max(24, Math.min(62, Math.sqrt(variance) * 0.8));

  for (let row = 0; row < rowCount; row += 1) {
    for (let column = 0; column < columnCount; column += 1) {
      const current = values[row * columnCount + column];
      if (column + 1 < columnCount) {
        const right = values[row * columnCount + column + 1];
        const difference = Math.abs(current - right);
        if (difference > 18) edgeCount += 1;
        if (difference > transitionThreshold) transitionCount += 1;
      }
      if (row + 1 < rowCount) {
        const below = values[(row + 1) * columnCount + column];
        const difference = Math.abs(current - below);
        if (difference > 18) edgeCount += 1;
        if (difference > transitionThreshold) transitionCount += 1;
      }
    }
  }

  const comparisonCount = rowCount * (columnCount - 1) + columnCount * (rowCount - 1);
  return {
    contrast: Math.min(1, Math.sqrt(variance) / 96),
    edgeDensity: edgeCount / comparisonCount,
    transitionDensity: transitionCount / comparisonCount,
  };
}

/**
 * Scores a lightweight logical grid. This is candidate prioritization only:
 * it deliberately never attempts a QR decode for each zone.
 */
export function scoreDetectionGrid(
  imageData: ImageData,
  gridSize = QR_DETECTION_GRID_SIZE,
): DetectionZone[] {
  if (imageData.width < gridSize || imageData.height < gridSize) return [];

  const zones: DetectionZone[] = [];
  for (let row = 0; row < gridSize; row += 1) {
    for (let column = 0; column < gridSize; column += 1) {
      const zone = {
        x: Math.floor((column * imageData.width) / gridSize),
        y: Math.floor((row * imageData.height) / gridSize),
        width: Math.max(1, Math.ceil(imageData.width / gridSize)),
        height: Math.max(1, Math.ceil(imageData.height / gridSize)),
      };
      const metrics = sampleZone(imageData, zone);
      zones.push({
        column,
        row,
        ...zone,
        ...metrics,
        score:
          metrics.contrast * 0.35 +
          metrics.edgeDensity * 0.4 +
          metrics.transitionDensity * 0.25,
      });
    }
  }

  return zones.sort((left, right) => right.score - left.score);
}

function overlaps(left: DetectionRect, right: DetectionRect): boolean {
  return (
    left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y
  );
}

function clampRect(rect: DetectionRect, frameWidth: number, frameHeight: number): DetectionRect {
  const width = Math.min(frameWidth, Math.max(1, rect.width));
  const height = Math.min(frameHeight, Math.max(1, rect.height));
  return {
    x: Math.min(Math.max(0, rect.x), frameWidth - width),
    y: Math.min(Math.max(0, rect.y), frameHeight - height),
    width,
    height,
  };
}

/**
 * Converts high-scoring grid zones into a small set of expanded ROIs. The
 * expansion deliberately includes the quiet zone around a possible QR and
 * clamps at the frame edges, so corner and edge codes remain eligible.
 */
export function prioritizeDetectionRois(
  zones: DetectionZone[],
  frameWidth: number,
  frameHeight: number,
  maxRois = 4,
): DetectionRect[] {
  if (frameWidth <= 0 || frameHeight <= 0) return [];

  const tileSize = Math.min(frameWidth, frameHeight) / QR_DETECTION_GRID_SIZE;
  const side = Math.min(
    Math.min(frameWidth, frameHeight),
    Math.max(tileSize * 4.5, Math.min(frameWidth, frameHeight) * 0.52),
  );
  const rois: DetectionRect[] = [];

  for (const zone of zones) {
    const centerX = zone.x + zone.width / 2;
    const centerY = zone.y + zone.height / 2;
    const roi = clampRect(
      {
        x: centerX - side / 2,
        y: centerY - side / 2,
        width: side,
        height: side,
      },
      frameWidth,
      frameHeight,
    );
    if (!rois.some((existing) => overlaps(existing, roi))) {
      rois.push(roi);
    }
    if (rois.length >= maxRois) break;
  }

  return rois;
}

export function containsPoint(rect: DetectionRect, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}
