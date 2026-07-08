import { useEffect, useRef } from "react";
import type { ScopeData } from "@/types";
import { cn } from "@/lib/utils";

interface ParadeScopeProps {
  data: ScopeData["parade"] | null;
  className?: string;
}

export function ParadeScope({ data, className }: ParadeScopeProps) {
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

    // Three panels side by side
    const panelW = w / 3;
    const gap = 2;

    const drawParade = (
      channelData: Float32Array,
      startX: number,
      color: [number, number, number],
      label: string
    ) => {
      const colW = (panelW - gap) / data.width;

      for (let col = 0; col < data.width; col++) {
        const x = startX + col * colW;

        for (let bin = 0; bin < 256; bin++) {
          const density = channelData[col * 256 + bin];
          if (density < 0.01) continue;

          // y=0 is top (bright), y=h is bottom (dark)
          const y = h - (bin / 255) * h;
          const alpha = Math.min(density * 3, 1) * 0.8;

          ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
          ctx.fillRect(x, y - 1, Math.max(colW, 1), 2);
        }
      }

      // Label
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.font = '9px "Plus Jakarta Sans Variable", sans-serif';
      ctx.fillText(label, startX + 4, h - 4);
    };

    // Draw separator lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(panelW, 0);
    ctx.lineTo(panelW, h);
    ctx.moveTo(panelW * 2, 0);
    ctx.lineTo(panelW * 2, h);
    ctx.stroke();

    // Grid lines (horizontal)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    for (let i = 1; i < 4; i++) {
      const y = (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    drawParade(data.r, 0, [248, 113, 113], "R");
    drawParade(data.g, panelW, [52, 211, 153], "G");
    drawParade(data.b, panelW * 2, [66, 133, 244], "B");
  }, [data]);

  return (
    <div className={cn("relative", className)}>
      <div className="absolute top-1 left-2 text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider z-10">
        RGB Parade
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg bg-scope-bg"
      />
      {!data && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          Upload an image to see RGB parade
        </div>
      )}
    </div>
  );
}
