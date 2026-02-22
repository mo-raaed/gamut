import type { Preset } from "@/types";

export const PRESETS: Preset[] = [
  {
    id: "washout",
    name: "The Washout",
    description: "Lowers contrast dramatically for a flat, faded look.",
    scopeHint:
      "Watch the Histogram — it compresses into a narrow band in the middle. The image data is all bunched up, meaning there's very little difference between the darkest and lightest pixels.",
    values: {
      contrast: -80,
      brightness: 20,
      saturation: -20,
    },
  },
  {
    id: "silhouette",
    name: "The Silhouette",
    description: "Crushes shadows for a dramatic dark outline effect.",
    scopeHint:
      "Watch the Waveform — the signal slams into the floor (bottom). On the Histogram, notice a spike on the far left (black). That spike = lost shadow detail.",
    values: {
      shadows: -100,
      contrast: 60,
      highlights: -20,
    },
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    description: "Warm, sun-kissed tones like sunset light.",
    scopeHint:
      "On the RGB Parade, the Red channel lifts above Blue — the warm color shift is visible as data. Temperature literally moves the channels apart.",
    values: {
      temperature: 60,
      highlights: -30,
      saturation: 20,
      contrast: 10,
    },
  },
  {
    id: "overexposed",
    name: "Overexposed",
    description: "Simulates a blown-out, too-bright image.",
    scopeHint:
      "Enable the Clipping Alert (the eye icon) — red overlays appear where pixel data is lost. On the Histogram, watch the right side stack up against the wall.",
    values: {
      brightness: 80,
      highlights: 40,
    },
  },
  {
    id: "high-contrast-bw",
    name: "High Contrast B&W",
    description: "A punchy black-and-white look with strong tones.",
    scopeHint:
      "The Histogram stretches to both edges — a healthy spread of tones. The RGB Parade shows all three channels aligned (since there's no color).",
    values: {
      saturation: -100,
      contrast: 60,
      shadows: -20,
      highlights: 20,
    },
  },
  {
    id: "moonlight",
    name: "Moonlight",
    description: "Cool, blue-tinted low-key atmosphere.",
    scopeHint:
      "On the RGB Parade, the Blue channel rises above Red — the opposite of Golden Hour. The overall Waveform sits in the lower half (dark scene).",
    values: {
      temperature: -60,
      brightness: -30,
      contrast: 20,
      saturation: -15,
      shadows: -10,
    },
  },
];
