import { useEffect, useState } from "react";
import { useAdjustmentStore } from "@/stores/adjustmentStore";
import { PRESETS } from "@/lib/presets";
import { Lightbulb, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shows a contextual hint when a preset is applied,
 * explaining what to look for in the scopes.
 */
export function PresetHint() {
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  // Subscribe to individual values to avoid infinite re-render from getValues()
  const brightness = useAdjustmentStore((s) => s.brightness);
  const contrast = useAdjustmentStore((s) => s.contrast);
  const highlights = useAdjustmentStore((s) => s.highlights);
  const midtones = useAdjustmentStore((s) => s.midtones);
  const shadows = useAdjustmentStore((s) => s.shadows);
  const saturation = useAdjustmentStore((s) => s.saturation);
  const vibrance = useAdjustmentStore((s) => s.vibrance);
  const temperature = useAdjustmentStore((s) => s.temperature);
  const tint = useAdjustmentStore((s) => s.tint);
  const denoise = useAdjustmentStore((s) => s.denoise);
  const denoiseGaussian = useAdjustmentStore((s) => s.denoiseGaussian);
  const denoiseSP = useAdjustmentStore((s) => s.denoiseSP);
  const denoiseImpulse = useAdjustmentStore((s) => s.denoiseImpulse);

  // Detect when a preset is applied by matching current values
  useEffect(() => {
    const adjustments = {
      brightness, contrast, highlights, midtones, shadows,
      saturation, vibrance, temperature, tint,
      denoise, denoiseGaussian, denoiseSP, denoiseImpulse,
    };

    for (const preset of PRESETS) {
      const matches = Object.entries(preset.values).every(
        ([key, value]) =>
          adjustments[key as keyof typeof adjustments] === value
      );

      // Check that non-preset values are at default (0)
      const nonPresetKeys = Object.keys(adjustments).filter(
        (k) => !(k in preset.values)
      );
      const othersDefault = nonPresetKeys.every(
        (k) => adjustments[k as keyof typeof adjustments] === 0
      );

      if (matches && othersDefault) {
        setActiveHint(preset.id);
        setVisible(true);
        return;
      }
    }
    // No preset found — hide (but don't reset activeHint to allow fade-out)
    setVisible(false);
  }, [brightness, contrast, highlights, midtones, shadows, saturation, vibrance, temperature, tint, denoise, denoiseGaussian, denoiseSP, denoiseImpulse]);

  const preset = PRESETS.find((p) => p.id === activeHint);
  if (!preset) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 max-w-sm transition-all duration-300",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <div className="bg-card border border-border rounded-xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gamut-500/10 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-gamut-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-foreground">
                {preset.name}
              </h4>
              <button
                onClick={() => setVisible(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {preset.scopeHint}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
