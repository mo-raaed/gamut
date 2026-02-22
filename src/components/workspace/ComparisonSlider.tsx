import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";

interface ComparisonSliderProps {
  originalCanvas: HTMLCanvasElement | null;
  processedCanvas: HTMLCanvasElement | null;
  className?: string;
}

export function ComparisonSlider({
  originalCanvas,
  processedCanvas,
  className,
}: ComparisonSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const origCanvasRef = useRef<HTMLCanvasElement>(null);
  const [dragging, setDragging] = useState(false);
  const { comparisonPosition, setComparisonPosition, showComparison } = useUIStore();

  // Draw the original image onto the comparison canvas
  useEffect(() => {
    if (!originalCanvas || !origCanvasRef.current) return;
    const ctx = origCanvasRef.current.getContext("2d");
    if (!ctx) return;
    origCanvasRef.current.width = originalCanvas.width;
    origCanvasRef.current.height = originalCanvas.height;
    ctx.drawImage(originalCanvas, 0, 0);
  }, [originalCanvas]);

  const updatePosition = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width;
      setComparisonPosition(Math.max(0, Math.min(1, x)));
    },
    [setComparisonPosition]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setDragging(true);
      updatePosition(e.clientX);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [updatePosition]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      updatePosition(e.clientX);
    },
    [dragging, updatePosition]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  if (!showComparison) {
    // Full processed view
    return (
      <div className={cn("relative w-full h-full overflow-hidden", className)}>
        {processedCanvas && (
          <div className="w-full h-full flex items-center justify-center bg-card">
            <canvas
              ref={(el) => {
                if (el && processedCanvas) {
                  el.width = processedCanvas.width;
                  el.height = processedCanvas.height;
                  const ctx = el.getContext("2d");
                  ctx?.drawImage(processedCanvas, 0, 0);
                }
              }}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full overflow-hidden select-none bg-card", className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Original image (full width, underneath) */}
      <canvas
        ref={origCanvasRef}
        className="absolute inset-0 w-full h-full object-contain"
        style={{ imageRendering: "auto" }}
      />

      {/* Processed image (clipped from the right) */}
      {processedCanvas && (
        <canvas
          ref={(el) => {
            if (el && processedCanvas) {
              el.width = processedCanvas.width;
              el.height = processedCanvas.height;
              const ctx = el.getContext("2d");
              ctx?.drawImage(processedCanvas, 0, 0);
            }
          }}
          className="absolute inset-0 w-full h-full object-contain"
          style={{
            clipPath: `inset(0 ${(1 - comparisonPosition) * 100}% 0 0)`,
          }}
        />
      )}

      {/* Divider handle */}
      <div
        className="absolute top-0 bottom-0 z-10"
        style={{ left: `${comparisonPosition * 100}%` }}
      >
        {/* Line */}
        <div className="absolute inset-y-0 -translate-x-1/2 w-0.5 bg-white shadow-lg" />
        {/* Handle circle */}
        <div
          className={cn(
            "absolute top-1/2 -translate-x-1/2 -translate-y-1/2",
            "w-8 h-8 rounded-full bg-white/90 backdrop-blur border-2 border-white shadow-xl",
            "flex items-center justify-center cursor-ew-resize",
            "transition-transform duration-100",
            dragging && "scale-110"
          )}
        >
          <div className="flex gap-0.5">
            <div className="w-0.5 h-3 bg-gray-400 rounded-full" />
            <div className="w-0.5 h-3 bg-gray-400 rounded-full" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 px-2 py-1 text-[10px] font-medium uppercase tracking-wider bg-black/50 text-white rounded-md backdrop-blur-sm">
        Original
      </div>
      <div className="absolute top-3 right-3 px-2 py-1 text-[10px] font-medium uppercase tracking-wider bg-black/50 text-white rounded-md backdrop-blur-sm">
        Edited
      </div>
    </div>
  );
}
