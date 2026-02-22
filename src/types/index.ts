/* ═══════════════════════════════════════════════════
   Gamut — Type Definitions
   ═══════════════════════════════════════════════════ */

/** All adjustable image parameters with their current values */
export interface AdjustmentState {
  // Global Exposure
  brightness: number; // -100 to +100, default 0
  contrast: number; // -100 to +100, default 0

  // Tonal Segments
  highlights: number; // -100 to +100, default 0
  midtones: number; // -100 to +100, default 0
  shadows: number; // -100 to +100, default 0

  // Color Math
  saturation: number; // -100 to +100, default 0
  vibrance: number; // -100 to +100, default 0
  temperature: number; // -100 to +100, default 0
  tint: number; // -100 to +100, default 0
}

/** Names of all adjustment parameters */
export type AdjustmentKey = keyof AdjustmentState;

/** Slider group definitions */
export interface SliderGroupDef {
  label: string;
  icon: string;
  sliders: {
    key: AdjustmentKey;
    label: string;
    min: number;
    max: number;
    step: number;
    tooltip: string;
  }[];
}

/** Data computed by the scope worker */
export interface ScopeData {
  histogram: {
    r: Uint32Array;
    g: Uint32Array;
    b: Uint32Array;
    luma: Uint32Array;
  };
  parade: {
    r: Float32Array; // width × 256 density map
    g: Float32Array;
    b: Float32Array;
    width: number;
  };
  waveform: {
    luma: Float32Array; // width × 256 density map
    width: number;
  };
}

/** Messages sent TO the scope worker */
export interface ScopeWorkerMessage {
  type: "compute";
  imageData: ArrayBuffer;
  width: number;
  height: number;
}

/** Messages received FROM the scope worker */
export interface ScopeWorkerResult {
  type: "result";
  histogram: {
    r: Uint32Array;
    g: Uint32Array;
    b: Uint32Array;
    luma: Uint32Array;
  };
  parade: {
    r: Float32Array;
    g: Float32Array;
    b: Float32Array;
    width: number;
  };
  waveform: {
    luma: Float32Array;
    width: number;
  };
}

/** Preset scenario definition */
export interface Preset {
  id: string;
  name: string;
  description: string;
  scopeHint: string; // What to watch for in the scopes
  values: Partial<AdjustmentState>;
}

/** UI state for panels, theme, etc. */
export interface UIState {
  theme: "light" | "dark";
  showClipping: boolean;
  showComparison: boolean;
  activeScope: "histogram" | "parade" | "waveform" | "all";
  leftPanelOpen: boolean;
  bottomPanelOpen: boolean;
  comparisonPosition: number; // 0-1 position of the split curtain
}

/** Image metadata after loading */
export interface LoadedImage {
  element: HTMLImageElement;
  width: number;
  height: number;
  name: string;
  size: number;
  type: string;
}
