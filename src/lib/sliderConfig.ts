import type { SliderGroupDef } from "@/types";

export const SLIDER_GROUPS: SliderGroupDef[] = [
  {
    label: "Global Exposure",
    icon: "sun",
    sliders: [
      {
        key: "brightness",
        label: "Brightness",
        min: -100,
        max: 100,
        step: 1,
        tooltip:
          "Shifts all pixel values up or down uniformly. Watch the entire Histogram slide left (darker) or right (brighter)!",
      },
      {
        key: "contrast",
        label: "Contrast",
        min: -100,
        max: 100,
        step: 1,
        tooltip:
          "Pushes the darks darker and the lights lighter. Watch the Histogram stretch apart! Lowering it makes the image look flat and \"washed out.\"",
      },
    ],
  },
  {
    label: "Tonal Segments",
    icon: "layers",
    sliders: [
      {
        key: "highlights",
        label: "Highlights",
        min: -100,
        max: 100,
        step: 1,
        tooltip:
          "Controls the brightest areas of the image. Pull down to recover blown-out skies, push up to make bright areas glow. Watch the right side of the Histogram!",
      },
      {
        key: "midtones",
        label: "Midtones",
        min: -100,
        max: 100,
        step: 1,
        tooltip:
          "Adjusts the middle range of brightness — where most detail lives. This is the \"body\" of the image. Watch the center of the Histogram shift.",
      },
      {
        key: "shadows",
        label: "Shadows",
        min: -100,
        max: 100,
        step: 1,
        tooltip:
          "Controls the darkest areas. Push up to reveal hidden detail in shadows. Pull down to crush blacks for a dramatic look. Watch the left side of the Histogram and the Waveform floor!",
      },
    ],
  },
  {
    label: "Color Math",
    icon: "palette",
    sliders: [
      {
        key: "saturation",
        label: "Saturation",
        min: -100,
        max: 100,
        step: 1,
        tooltip:
          "Boosts or cuts all colors equally. At -100, the image becomes grayscale. Compare with Vibrance, which protects already-vivid colors. Watch the RGB Parade channels spread apart!",
      },
      {
        key: "vibrance",
        label: "Vibrance",
        min: -100,
        max: 100,
        step: 1,
        tooltip:
          "An intelligent saturation boost — it pushes muted colors more while protecting already-vivid ones (like skin tones). Subtler than Saturation. Watch the RGB Parade for selective shifts!",
      },
      {
        key: "temperature",
        label: "Temperature",
        min: -100,
        max: 100,
        step: 1,
        tooltip:
          "Shifts the image between warm (orange) and cool (blue). This simulates how your camera interprets the color of light. Watch the Red and Blue channels swap positions on the RGB Parade!",
      },
      {
        key: "tint",
        label: "Tint",
        min: -100,
        max: 100,
        step: 1,
        tooltip:
          "Shifts between green and magenta — the secondary axis of white balance. Usually a small adjustment. Watch the Green channel on the RGB Parade!",
      },
    ],
  },
  {
    label: "Detail",
    icon: "sparkles",
    sliders: [
      {
        key: "denoise",
        label: "Denoise",
        min: 0,
        max: 100,
        step: 1,
        tooltip:
          "Bilateral filter that smooths noise while preserving edges. Watch the Noise Floor scope — the spiky peaks flatten as you increase this. Higher values = smoother but softer image.",
      },
    ],
  },
];
