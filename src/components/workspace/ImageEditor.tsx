import { useCallback, useEffect, useRef, useState } from "react";
import { useWebGL } from "@/hooks/useWebGL";
import { useScopeWorker } from "@/hooks/useScopeWorker";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useAdjustmentStore } from "@/stores/adjustmentStore";
import { useImageStore } from "@/stores/imageStore";
import { useUIStore } from "@/stores/uiStore";
import { UploadZone } from "@/components/workspace/UploadZone";
import { ControlPanel } from "@/components/controls/ControlPanel";
import { ScopePanel } from "@/components/scopes/ScopePanel";
import { Toolbar } from "@/components/layout/Toolbar";
import { PresetHint } from "@/components/education/PresetHint";
import { cn } from "@/lib/utils";
import type { LoadedImage, AdjustmentState } from "@/types";

const SCOPE_SIZE = 512;

export function ImageEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUpload, setShowUpload] = useState(true);

  const { init, uploadImage, render, readScopeData } = useWebGL(canvasRef);
  const { scopeData, compute: computeScopes } = useScopeWorker();
  useKeyboardShortcuts();

  // Subscribe to individual values to avoid creating a new object each render
  const brightness = useAdjustmentStore((s) => s.brightness);
  const contrast = useAdjustmentStore((s) => s.contrast);
  const highlights = useAdjustmentStore((s) => s.highlights);
  const midtones = useAdjustmentStore((s) => s.midtones);
  const shadows = useAdjustmentStore((s) => s.shadows);
  const saturation = useAdjustmentStore((s) => s.saturation);
  const vibrance = useAdjustmentStore((s) => s.vibrance);
  const temperature = useAdjustmentStore((s) => s.temperature);
  const tint = useAdjustmentStore((s) => s.tint);

  const showClipping = useUIStore((s) => s.showClipping);
  const leftPanelOpen = useUIStore((s) => s.leftPanelOpen);
  const bottomPanelOpen = useUIStore((s) => s.bottomPanelOpen);
  const image = useImageStore((s) => s.image);

  // Handle image load — just store the image and switch to canvas view.
  // Actual WebGL init + upload happens in the useEffect below once canvas is in DOM.
  const handleImageLoaded = useCallback(
    (_loaded: LoadedImage) => {
      setShowUpload(false);
    },
    []
  );

  // Initialize WebGL + upload image once the canvas is actually in the DOM.
  // This runs when image changes (canvas switches from hidden → visible)
  // AND whenever the image itself changes (re-upload).
  useEffect(() => {
    if (!image) return;
    if (showUpload) return; // canvas not mounted yet

    // Ensure WebGL pipeline is ready (idempotent)
    init();

    // Draw original onto comparison canvas
    if (originalCanvasRef.current) {
      originalCanvasRef.current.width = image.width;
      originalCanvasRef.current.height = image.height;
      const ctx = originalCanvasRef.current.getContext("2d");
      ctx?.drawImage(image.element, 0, 0);
    }

    // Upload image to GPU
    uploadImage(image.element);
  }, [image, showUpload, init, uploadImage]);

  // Use rAF for render + debounced scope computation for smooth slider feel
  const rafRef = useRef<number>(0);
  const scopeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!image || showUpload) return;

    const adj: AdjustmentState = {
      brightness, contrast, highlights, midtones, shadows,
      saturation, vibrance, temperature, tint,
    };

    // Cancel any pending rAF to coalesce fast slider moves
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      // WebGL render is fast — do it every frame
      render(adj, showClipping);

      // Debounce scope computation (heavier) to 60ms after last change
      if (scopeTimerRef.current) clearTimeout(scopeTimerRef.current);
      scopeTimerRef.current = setTimeout(() => {
        const pixels = readScopeData(adj);
        if (pixels) {
          computeScopes(pixels, SCOPE_SIZE, SCOPE_SIZE);
        }
      }, 60);
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    image, showUpload,
    brightness, contrast, highlights, midtones, shadows,
    saturation, vibrance, temperature, tint,
    showClipping,
    render,
    readScopeData,
    computeScopes,
  ]);

  const handleUploadClick = useCallback(() => {
    if (image) {
      fileInputRef.current?.click();
    }
  }, [image]);

  const handleNewFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const loaded: LoadedImage = {
            element: img,
            width: img.naturalWidth,
            height: img.naturalHeight,
            name: file.name,
            size: file.size,
            type: file.type,
          };
          useImageStore.getState().setImage(loaded);
          handleImageLoaded(loaded);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    },
    [handleImageLoaded]
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Hidden file input for re-upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleNewFile}
        className="hidden"
      />

      {/* Toolbar */}
      <Toolbar onUploadClick={handleUploadClick} />

      {/* Main content area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Panel: Controls */}
        <div
          className={cn(
            "border-r border-border bg-card/50 transition-all duration-300 overflow-hidden flex-shrink-0",
            leftPanelOpen ? "w-64" : "w-0"
          )}
        >
          {leftPanelOpen && <ControlPanel />}
        </div>

        {/* Center: Canvas + Scopes */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Canvas area */}
          <div className="flex-1 min-h-0 relative">
            {showUpload && !image ? (
              <div className="w-full h-full p-6">
                <UploadZone onImageLoaded={handleImageLoaded} />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-background p-2 relative">
                {/* Original canvas (hidden, for comparison data) */}
                <canvas ref={originalCanvasRef} className="hidden" />

                {/* WebGL processed canvas */}
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />

                {/* Image info badge */}
                {image && (
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 px-2.5 py-1 rounded-md bg-black/50 backdrop-blur-sm text-[10px] text-white/70">
                    <span>{image.name}</span>
                    <span>•</span>
                    <span>
                      {image.width}×{image.height}
                    </span>
                    <span>•</span>
                    <span>{(image.size / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom panel: Scopes */}
          <div
            className={cn(
              "border-t border-border bg-card/50 transition-all duration-300 overflow-hidden",
              bottomPanelOpen ? "h-72" : "h-0"
            )}
          >
            {bottomPanelOpen && <ScopePanel scopeData={scopeData} />}
          </div>
        </div>
      </div>

      {/* Preset hint overlay */}
      <PresetHint />
    </div>
  );
}
