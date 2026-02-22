import React, { useCallback, useRef, useState } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useImageStore } from "@/stores/imageStore";
import type { LoadedImage } from "@/types";

interface UploadZoneProps {
  onImageLoaded: (img: LoadedImage) => void;
}

export function UploadZone({ onImageLoaded }: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
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

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center w-full h-full",
        "border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer",
        "hover:border-primary/50 hover:bg-primary/5",
        dragActive
          ? "border-primary bg-primary/10 scale-[1.01]"
          : "border-border bg-card/50",
        isLoading && "opacity-50 pointer-events-none"
      )}
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

      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <div
          className={cn(
            "flex items-center justify-center w-16 h-16 rounded-2xl transition-colors",
            dragActive ? "bg-primary/20" : "bg-muted"
          )}
        >
          {dragActive ? (
            <ImageIcon className="w-8 h-8 text-primary" />
          ) : (
            <Upload className="w-8 h-8 text-muted-foreground" />
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {isLoading ? "Loading image..." : "Drop your image here"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            or click to browse — JPEG, PNG supported
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive font-medium">{error}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            JPEG
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            PNG
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            WebP
          </span>
        </div>
      </div>
    </div>
  );
}
