import { create } from "zustand";
import type { AdjustmentKey, AdjustmentState } from "@/types";

const DEFAULT_ADJUSTMENTS: AdjustmentState = {
  brightness: 0,
  contrast: 0,
  highlights: 0,
  midtones: 0,
  shadows: 0,
  saturation: 0,
  vibrance: 0,
  temperature: 0,
  tint: 0,
};

interface AdjustmentStore extends AdjustmentState {
  /** Update a single adjustment parameter */
  set: (key: AdjustmentKey, value: number) => void;
  /** Apply a partial set of values (for presets) */
  applyPreset: (values: Partial<AdjustmentState>) => void;
  /** Reset all adjustments to defaults */
  reset: () => void;
  /** Get all values as a plain object */
  getValues: () => AdjustmentState;
}

export const useAdjustmentStore = create<AdjustmentStore>()((set, get) => ({
  ...DEFAULT_ADJUSTMENTS,

  set: (key, value) => set({ [key]: value }),

  applyPreset: (values) => set({ ...DEFAULT_ADJUSTMENTS, ...values }),

  reset: () => set(DEFAULT_ADJUSTMENTS),

  getValues: () => {
    const state = get();
    return {
      brightness: state.brightness,
      contrast: state.contrast,
      highlights: state.highlights,
      midtones: state.midtones,
      shadows: state.shadows,
      saturation: state.saturation,
      vibrance: state.vibrance,
      temperature: state.temperature,
      tint: state.tint,
    };
  },
}));
