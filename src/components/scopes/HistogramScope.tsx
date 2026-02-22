import { useEffect, useRef } from "react";
import type { ScopeData } from "@/types";
import { cn } from "@/lib/utils";

interface HistogramScopeProps {
  data: ScopeData["histogram"] | null;
  className?: string;
}

export function HistogramScope({ data, className }: HistogramScopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Find max value for normalization (exclude extremes 0 and 255 which can spike)
    let maxVal = 1;
    for (let i = 2; i < 254; i++) {
      maxVal = Math.max(maxVal, data.r[i], data.g[i], data.b[i]);
    }

    const barW = w / 256;

    // Draw helper function
    const drawChannel = (
      bins: Uint32Array,
      color: string,
      fillColor: string
    ) => {
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i < 256; i++) {
        const x = i * barW;
        const val = Math.min(bins[i] / maxVal, 1);
        const barH = val * h * 0.95;
        ctx.lineTo(x + barW / 2, h - barH);
      }
      ctx.lineTo(w, h);
      ctx.closePath();

      ctx.fillStyle = fillColor;
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    // Draw in order: B, G, R (so red is on top)
    ctx.globalCompositeOperation = "screen";
    drawChannel(data.b, "rgba(66, 133, 244, 0.8)", "rgba(66, 133, 244, 0.15)");
    drawChannel(data.g, "rgba(52, 211, 153, 0.8)", "rgba(52, 211, 153, 0.15)");
    drawChannel(data.r, "rgba(248, 113, 113, 0.8)", "rgba(248, 113, 113, 0.15)");

    // Draw luminance as a subtle white overlay
    ctx.globalCompositeOperation = "source-over";
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let i = 0; i < 256; i++) {
      const x = i * barW;
      const val = Math.min(data.luma[i] / maxVal, 1);
      const barH = val * h * 0.95;
      ctx.lineTo(x + barW / 2, h - barH);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Grid lines
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 4; i++) {
      const y = (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // Vertical quarter markers
    for (let i = 1; i < 4; i++) {
      const x = (w / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  }, [data]);

  return (
    <div className={cn("relative", className)}>
      <div className="absolute top-1 left-2 text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider z-10">
        Histogram
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg bg-scope-bg"
      />
      {!data && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          Upload an image to see histogram
        </div>
      )}
    </div>
  );
}
