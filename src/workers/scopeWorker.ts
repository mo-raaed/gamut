// ────────────────────────────────────────────
// Gamut — Scope Computation Web Worker
// Computes Histogram, RGB Parade, and Waveform
// from RGBA pixel data off the main thread.
// ────────────────────────────────────────────

const HISTOGRAM_BINS = 256;
const PARADE_COLUMNS = 256;

interface ComputeMessage {
  type: "compute";
  imageData: ArrayBuffer;
  width: number;
  height: number;
}

self.onmessage = (e: MessageEvent<ComputeMessage>) => {
  if (e.data.type !== "compute") return;

  const { imageData, width, height } = e.data;
  const pixels = new Uint8Array(imageData);
  const totalPixels = width * height;

  // ── Histogram: 256 bins per channel ──
  const histR = new Uint32Array(HISTOGRAM_BINS);
  const histG = new Uint32Array(HISTOGRAM_BINS);
  const histB = new Uint32Array(HISTOGRAM_BINS);
  const histLuma = new Uint32Array(HISTOGRAM_BINS);

  // ── Parade: per-column intensity distribution ──
  const paradeWidth = Math.min(width, PARADE_COLUMNS);
  const paradeR = new Float32Array(paradeWidth * HISTOGRAM_BINS);
  const paradeG = new Float32Array(paradeWidth * HISTOGRAM_BINS);
  const paradeB = new Float32Array(paradeWidth * HISTOGRAM_BINS);

  // ── Waveform: per-column luminance distribution ──
  const waveformLuma = new Float32Array(paradeWidth * HISTOGRAM_BINS);

  // Column step for parade/waveform (sample every Nth column)
  const colStep = width / paradeWidth;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const r = pixels[idx];
    const g = pixels[idx + 1];
    const b = pixels[idx + 2];

    // Luminance (BT.709)
    const luma = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);

    // Histogram
    histR[r]++;
    histG[g]++;
    histB[b]++;
    histLuma[Math.min(luma, 255)]++;

    // Parade & Waveform (per-column)
    const x = i % width;
    const col = Math.floor(x / colStep);
    if (col < paradeWidth) {
      // Parade: accumulate density at [col, intensity]
      paradeR[col * HISTOGRAM_BINS + r] += 1;
      paradeG[col * HISTOGRAM_BINS + g] += 1;
      paradeB[col * HISTOGRAM_BINS + b] += 1;

      // Waveform: accumulate luma density
      waveformLuma[col * HISTOGRAM_BINS + Math.min(luma, 255)] += 1;
    }
  }

  // Normalize parade and waveform to 0..1 range
  let paradeMax = 0;
  let waveMax = 0;
  for (let i = 0; i < paradeR.length; i++) {
    paradeMax = Math.max(paradeMax, paradeR[i], paradeG[i], paradeB[i]);
  }
  for (let i = 0; i < waveformLuma.length; i++) {
    waveMax = Math.max(waveMax, waveformLuma[i]);
  }
  if (paradeMax > 0) {
    for (let i = 0; i < paradeR.length; i++) {
      paradeR[i] /= paradeMax;
      paradeG[i] /= paradeMax;
      paradeB[i] /= paradeMax;
    }
  }
  if (waveMax > 0) {
    for (let i = 0; i < waveformLuma.length; i++) {
      waveformLuma[i] /= waveMax;
    }
  }

  // ── Noise: high-frequency energy via gradient magnitude ──
  // Compute per-pixel gradient magnitude using simple 3×3 Sobel-like differences,
  // then build a histogram and per-column energy for the noise scope.
  const NOISE_BINS = 256;
  const noiseHist = new Uint32Array(NOISE_BINS);
  const noiseColumns = new Float32Array(paradeWidth);
  let noiseSum = 0;
  let noiseCount = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      // Horizontal gradient (right - left)
      const lIdx = (y * width + x - 1) * 4;
      const rIdx = (y * width + x + 1) * 4;
      const lL = 0.2126 * pixels[lIdx] + 0.7152 * pixels[lIdx + 1] + 0.0722 * pixels[lIdx + 2];
      const rL = 0.2126 * pixels[rIdx] + 0.7152 * pixels[rIdx + 1] + 0.0722 * pixels[rIdx + 2];
      const gx = (rL - lL) * 0.5;

      // Vertical gradient (below - above)
      const aIdx = ((y - 1) * width + x) * 4;
      const bIdx = ((y + 1) * width + x) * 4;
      const aL = 0.2126 * pixels[aIdx] + 0.7152 * pixels[aIdx + 1] + 0.0722 * pixels[aIdx + 2];
      const bL = 0.2126 * pixels[bIdx] + 0.7152 * pixels[bIdx + 1] + 0.0722 * pixels[bIdx + 2];
      const gy = (bL - aL) * 0.5;

      // Gradient magnitude, clamped to 0-255
      const mag = Math.min(Math.sqrt(gx * gx + gy * gy), 255);
      const bin = Math.round(mag);

      noiseHist[bin]++;
      noiseSum += mag;
      noiseCount++;

      // Per-column energy (same column mapping as parade)
      const col = Math.floor(x / colStep);
      if (col < paradeWidth) {
        noiseColumns[col] += mag;
      }
    }
  }

  // Normalize noise columns to 0..1
  let noiseColMax = 0;
  for (let i = 0; i < noiseColumns.length; i++) {
    noiseColMax = Math.max(noiseColMax, noiseColumns[i]);
  }
  if (noiseColMax > 0) {
    for (let i = 0; i < noiseColumns.length; i++) {
      noiseColumns[i] /= noiseColMax;
    }
  }

  const noiseMean = noiseCount > 0 ? noiseSum / noiseCount : 0;

  self.postMessage(
    {
      type: "result",
      histogram: { r: histR, g: histG, b: histB, luma: histLuma },
      parade: { r: paradeR, g: paradeG, b: paradeB, width: paradeWidth },
      waveform: { luma: waveformLuma, width: paradeWidth },
      noise: { histogram: noiseHist, mean: noiseMean, columns: noiseColumns, width: paradeWidth },
    },
    // Transfer buffers for zero-copy
    {
      transfer: [
        histR.buffer,
        histG.buffer,
        histB.buffer,
        histLuma.buffer,
        paradeR.buffer,
        paradeG.buffer,
        paradeB.buffer,
        waveformLuma.buffer,
        noiseHist.buffer,
        noiseColumns.buffer,
      ],
    } as unknown as WindowPostMessageOptions
  );
};
