import { Sun, Layers, Palette } from "lucide-react";
import { Slider } from "@/components/ui/Slider";
import { Tooltip } from "@/components/ui/Tooltip";
import { Collapsible } from "@/components/ui/Collapsible";
import { useAdjustmentStore } from "@/stores/adjustmentStore";
import { SLIDER_GROUPS } from "@/lib/sliderConfig";
import { PRESETS } from "@/lib/presets";
import { RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useCallback } from "react";
import type { AdjustmentKey /* , AdjustmentState */ } from "@/types";

const ICONS: Record<string, React.ReactNode> = {
  sun: <Sun className="w-3.5 h-3.5" />,
  layers: <Layers className="w-3.5 h-3.5" />,
  palette: <Palette className="w-3.5 h-3.5" />,
};

/** Individual slider row — only re-renders when its own value changes */
const SliderRow = React.memo(function SliderRow({
  sliderKey,
  label,
  tooltip,
  min,
  max,
  step,
}: {
  sliderKey: AdjustmentKey;
  label: string;
  tooltip: string;
  min: number;
  max: number;
  step: number;
}) {
  const value = useAdjustmentStore((s) => s[sliderKey]);
  const setValue = useAdjustmentStore((s) => s.set);

  const handleChange = useCallback(
    (v: number) => setValue(sliderKey, v),
    [setValue, sliderKey]
  );

  const handleReset = useCallback(
    () => setValue(sliderKey, 0),
    [setValue, sliderKey]
  );

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Tooltip content={tooltip} side="right">
          <label
            htmlFor={sliderKey}
            className="text-xs font-medium text-foreground cursor-help border-b border-dotted border-muted-foreground/30"
          >
            {label}
          </label>
        </Tooltip>
        <button
          onClick={handleReset}
          title="Reset to 0"
          className={cn(
            "text-[10px] font-mono tabular-nums w-8 text-right rounded px-0.5 transition-colors",
            value === 0
              ? "text-muted-foreground cursor-default"
              : "text-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
          )}
          disabled={value === 0}
        >
          {value > 0 ? `+${value}` : value}
        </button>
      </div>
      <Slider
        id={sliderKey}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
      />
    </div>
  );
});

export function ControlPanel() {
  const reset = useAdjustmentStore((s) => s.reset);
  const applyPreset = useAdjustmentStore((s) => s.applyPreset);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Adjustments</h2>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
          title="Reset all adjustments"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Slider Groups */}
      <div className="flex-1 overflow-y-auto">
        {SLIDER_GROUPS.map((group) => (
          <Collapsible
            key={group.label}
            title={group.label}
            icon={ICONS[group.icon]}
            defaultOpen
          >
            {group.sliders.map((slider) => (
              <SliderRow
                key={slider.key}
                sliderKey={slider.key}
                label={slider.label}
                tooltip={slider.tooltip}
                min={slider.min}
                max={slider.max}
                step={slider.step}
              />
            ))}
          </Collapsible>
        ))}

        {/* Presets Section */}
        <Collapsible
          title="Presets"
          icon={<Sparkles className="w-3.5 h-3.5" />}
          defaultOpen={false}
        >
          <div className="space-y-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.values)}
                className="w-full text-left px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted border border-transparent hover:border-border transition-all group"
              >
                <div className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                  {preset.name}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                  {preset.description}
                </div>
              </button>
            ))}
          </div>
        </Collapsible>
      </div>
    </div>
  );
}
