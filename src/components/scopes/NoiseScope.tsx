import { useEffect, useRef } from "react";
import type { ScopeData } from "@/types";
import { cn } from "@/lib/utils";

interface NoiseScopeProps {
  data: ScopeData["noise"] | null;
  className?: string;
}

/**
 * Noise Floor Scope — visualizes high-frequency energy in the image.
 *
 * Top half: noise histogram (gradient magnitude distribution).
 * Bottom half: per-column noise energy bar graph.
 * A mean noise level indicator line overlays the histogram.
 */
export function NoiseScope({ data, className }: NoiseScopeProps) {
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

    // ── Grid lines ──
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 4; i++) {
      const y = (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Vertical divider between histogram and column views
    const splitY = h * 0.55;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.moveTo(0, splitY);
    ctx.lineTo(w, splitY);
    ctx.stroke();

    // ── Top: Noise histogram (gradient magnitude distribution) ──
    const histH = splitY - 8;
    const histY = 4;

    // Find max histogram value (skip bin 0 which is smooth areas)
    let histMax = 0;
    for (let i = 1; i < 256; i++) {
      histMax = Math.max(histMax, data.histogram[i]);
    }

    if (histMax > 0) {
      const barW = w / 256;

      for (let i = 0; i < 256; i++) {
        const val = data.histogram[i] / histMax;
        if (val < 0.001) continue;

        const barH = val * histH;
        const x = i * barW;
        const y = histY + histH - barH;

        // Cyan-to-red gradient: low noise = cyan, high noise = warm
        const t = i / 255;
        const r = Math.round(40 + t * 215);
        const g = Math.round(200 - t * 160);
        const b = Math.round(220 - t * 180);
        const alpha = 0.5 + val * 0.4;

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fillRect(x, y, Math.max(barW, 1), barH);
      }

      // Mean noise level indicator
      const meanX = (data.mean / 255) * w;
      ctx.strokeStyle = "rgba(255, 200, 60, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(meanX, histY);
      ctx.lineTo(meanX, histY + histH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Mean label
      ctx.fillStyle = "rgba(255, 200, 60, 0.9)";
      ctx.font = 'bold 8px "Plus Jakarta Sans Variable", monospace';
      const meanLabel = `μ ${data.mean.toFixed(1)}`;
      const labelX = meanX + 4 > w - 40 ? meanX - 44 : meanX + 4;
      ctx.fillText(meanLabel, labelX, histY + 10);
    }

    // ── Bottom: Per-column noise energy ──
    const colH = h - splitY - 8;
    const colY = splitY + 4;
    const colW = w / data.width;

    for (let col = 0; col < data.width; col++) {
      const energy = data.columns[col];
      if (energy < 0.001) continue;

      const barH = energy * colH;
      const x = col * colW;
      const y = colY + colH - barH;

      // Intensity-based color (orange/amber for noisy areas)
      const alpha = 0.3 + energy * 0.6;
      const r = Math.round(200 + energy * 55);
      const g = Math.round(140 - energy * 60);
      ctx.fillStyle = `rgba(${r}, ${g}, 60, ${alpha})`;
      ctx.fillRect(x, y, Math.max(colW, 1), barH);
    }

    // ── Labels ──
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.font = '8px "Plus Jakarta Sans Variable", monospace';
    ctx.fillText("GRADIENT", 2, histY + histH - 2);
    ctx.fillText("COLUMN ENERGY", 2, colY + colH - 2);
  }, [data]);

  return (
    <div className={cn("relative", className)}>
      <div className="absolute top-1 left-2 text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider z-10">
        Noise Floor
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg bg-scope-bg"
      />
      {!data && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          Upload an image to see noise level
        </div>
      )}
    </div>
  );
}
