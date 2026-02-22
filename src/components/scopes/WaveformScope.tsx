import { useEffect, useRef } from "react";
import type { ScopeData } from "@/types";
import { cn } from "@/lib/utils";

interface WaveformScopeProps {
  data: ScopeData["waveform"] | null;
  className?: string;
}

export function WaveformScope({ data, className }: WaveformScopeProps) {
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

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 4; i++) {
      const y = (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let i = 1; i < 4; i++) {
      const x = (w / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // IRE-style labels
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.font = "8px Inter, monospace";
    ctx.fillText("100", 2, 10);
    ctx.fillText("75", 2, h * 0.25 + 3);
    ctx.fillText("50", 2, h * 0.5 + 3);
    ctx.fillText("25", 2, h * 0.75 + 3);
    ctx.fillText("0", 2, h - 3);

    // Draw waveform — green phosphor aesthetic
    const colW = w / data.width;

    for (let col = 0; col < data.width; col++) {
      const x = col * colW;

      for (let bin = 0; bin < 256; bin++) {
        const density = data.luma[col * 256 + bin];
        if (density < 0.01) continue;

        // y=0 is top (bright), y=h is bottom (dark)
        const y = h - (bin / 255) * h;
        const alpha = Math.min(density * 4, 1) * 0.7;

        // Green phosphor color (like broadcast monitors)
        const green = Math.round(180 + alpha * 75);
        ctx.fillStyle = `rgba(40, ${green}, 80, ${alpha})`;
        ctx.fillRect(x, y - 1, Math.max(colW, 1), 2);
      }
    }
  }, [data]);

  return (
    <div className={cn("relative", className)}>
      <div className="absolute top-1 left-2 text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider z-10">
        Waveform
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg bg-scope-bg"
      />
      {!data && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          Upload an image to see waveform
        </div>
      )}
    </div>
  );
}
