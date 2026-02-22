import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  id?: string;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ value, min, max, step = 1, onChange, className, id }, ref) => {
    // Calculate the fill percentage for the track
    const pct = ((value - min) / (max - min)) * 100;
    // Center point for bipolar sliders (min < 0 < max)
    const hasCenter = min < 0 && max > 0;
    const centerPct = hasCenter ? ((0 - min) / (max - min)) * 100 : 0;

    return (
      <div className={cn("relative flex items-center w-full h-5 group", className)}>
        <input
          ref={ref}
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        {/* Track background */}
        <div className="relative w-full h-1.5 bg-muted rounded-full overflow-hidden">
          {/* Fill — for bipolar sliders, fill from center */}
          {hasCenter ? (
            <div
              className="absolute top-0 h-full bg-primary rounded-full transition-all duration-75"
              style={{
                left: `${Math.min(centerPct, pct)}%`,
                width: `${Math.abs(pct - centerPct)}%`,
              }}
            />
          ) : (
            <div
              className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-75"
              style={{ width: `${pct}%` }}
            />
          )}
          {/* Center tick for bipolar */}
          {hasCenter && (
            <div
              className="absolute top-0 w-px h-full bg-muted-foreground/30"
              style={{ left: `${centerPct}%` }}
            />
          )}
        </div>
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background shadow-md transition-transform duration-75 group-hover:scale-110 pointer-events-none"
          style={{ left: `${pct}%` }}
        />
      </div>
    );
  }
);

Slider.displayName = "Slider";
