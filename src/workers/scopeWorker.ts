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

  self.postMessage(
    {
      type: "result",
      histogram: { r: histR, g: histG, b: histB, luma: histLuma },
      parade: { r: paradeR, g: paradeG, b: paradeB, width: paradeWidth },
      waveform: { luma: waveformLuma, width: paradeWidth },
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
      ],
    } as unknown as WindowPostMessageOptions
  );
};
