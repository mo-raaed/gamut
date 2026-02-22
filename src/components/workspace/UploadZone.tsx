import React, { useCallback, useRef, useState } from "react";
import { Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useImageStore } from "@/stores/imageStore";
import { SAMPLE_PHOTOS, type SamplePhoto } from "@/lib/samplePhotos";
import type { LoadedImage } from "@/types";

interface UploadZoneProps {
  onImageLoaded: (img: LoadedImage) => void;
}

export function UploadZone({ onImageLoaded }: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isLoading, error, setLoading, setError, setImage } = useImageStore();

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please upload a JPEG or PNG image.");
        return;
      }

      setLoading(true);
      setError(null);

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
          setImage(loaded);
          onImageLoaded(loaded);
        };
        img.onerror = () => {
          setError("Failed to decode image. Try a different file.");
          setLoading(false);
        };
        img.src = reader.result as string;
      };
      reader.onerror = () => {
        setError("Failed to read file.");
        setLoading(false);
      };
      reader.readAsDataURL(file);
    },
    [onImageLoaded, setImage, setLoading, setError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const loadSamplePhoto = useCallback(
    (sample: SamplePhoto) => {
      setLoadingSample(sample.id);
      setError(null);

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const loaded: LoadedImage = {
          element: img,
          width: img.naturalWidth,
          height: img.naturalHeight,
          name: sample.name,
          size: 0, // URL-loaded, no file size
          type: "image/jpeg",
        };
        setImage(loaded);
        onImageLoaded(loaded);
        setLoadingSample(null);
      };
      img.onerror = () => {
        setError(`Failed to load "${sample.name}". Try another.`);
        setLoadingSample(null);
      };
      img.src = sample.url;
    },
    [onImageLoaded, setImage, setError]
  );

  return (
    <div className="flex flex-col w-full h-full gap-4 overflow-y-auto">
      {/* Drop zone */}
      <div
        className={cn(
          "flex flex-col items-center justify-center flex-shrink-0",
          "border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer",
          "hover:border-primary/50 hover:bg-primary/5",
          dragActive
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-border bg-card/50",
          (isLoading || loadingSample) && "opacity-50 pointer-events-none"
        )}
        style={{ minHeight: 180 }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <div
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-2xl transition-colors",
              dragActive ? "bg-primary/20" : "bg-muted"
            )}
          >
            {dragActive ? (
              <ImageIcon className="w-6 h-6 text-primary" />
            ) : (
              <Upload className="w-6 h-6 text-muted-foreground" />
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {isLoading ? "Loading image..." : "Drop your image here"}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              or click to browse — JPEG, PNG, WebP
            </p>
          </div>

          {error && (
            <p className="text-xs text-destructive font-medium">{error}</p>
          )}
        </div>
      </div>

      {/* Sample photos */}
      <div className="flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            or try a sample
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {SAMPLE_PHOTOS.map((sample) => (
            <button
              key={sample.id}
              onClick={(e) => {
                e.stopPropagation();
                loadSamplePhoto(sample);
              }}
              disabled={!!loadingSample}
              className={cn(
                "group relative rounded-lg overflow-hidden border border-border",
                "hover:border-primary/50 hover:shadow-lg transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                loadingSample === sample.id && "ring-2 ring-primary"
              )}
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={sample.thumb}
                  alt={sample.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              {/* Loading overlay */}
              {loadingSample === sample.id && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
              {/* Label */}
              <div className="p-1.5 bg-card">
                <p className="text-[10px] font-medium text-foreground truncate">
                  {sample.name}
                </p>
                <p className="text-[9px] text-muted-foreground truncate">
                  {sample.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
