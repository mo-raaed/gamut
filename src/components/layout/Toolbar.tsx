import {
  Moon,
  Sun,
  Eye,
  EyeOff,
  Columns2,
  Square,
  Upload,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  PanelBottomClose,
  PanelBottomOpen,
} from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useAdjustmentStore } from "@/stores/adjustmentStore";
import { useImageStore } from "@/stores/imageStore";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  onUploadClick: () => void;
}

export function Toolbar({ onUploadClick }: ToolbarProps) {
  const {
    theme,
    toggleTheme,
    showClipping,
    toggleClipping,
    showComparison,
    toggleComparison,
    leftPanelOpen,
    setLeftPanelOpen,
    bottomPanelOpen,
    setBottomPanelOpen,
  } = useUIStore();
  const reset = useAdjustmentStore((s) => s.reset);
  const hasImage = useImageStore((s) => !!s.image);

  return (
    <header className="flex items-center justify-between h-12 px-4 border-b border-border bg-card/80 backdrop-blur-sm">
      {/* Left: Logo + Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-gamut-400 to-gamut-600 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">G</span>
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Gamut
          </span>
        </div>
        <span className="hidden sm:block text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-muted border border-border">
          Interactive Photo Lab
        </span>
      </div>

      {/* Center: Main controls */}
      <div className="flex items-center gap-1">
        {hasImage && (
          <>
            <ToolbarButton
              icon={showComparison ? <Columns2 className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              label={showComparison ? "Split view" : "Single view"}
              onClick={toggleComparison}
              active={showComparison}
            />
            <ToolbarButton
              icon={showClipping ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              label={showClipping ? "Clipping on" : "Clipping off"}
              onClick={toggleClipping}
              active={showClipping}
              className={showClipping ? "text-red-400" : ""}
            />
            <div className="w-px h-5 bg-border mx-1" />
            <ToolbarButton
              icon={<RotateCcw className="w-4 h-4" />}
              label="Reset all"
              onClick={reset}
            />
            <ToolbarButton
              icon={<Upload className="w-4 h-4" />}
              label="New image"
              onClick={onUploadClick}
            />
          </>
        )}
      </div>

      {/* Right: Panel toggles + Theme */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={
            leftPanelOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )
          }
          label="Controls panel"
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          active={leftPanelOpen}
        />
        <ToolbarButton
          icon={
            bottomPanelOpen ? (
              <PanelBottomClose className="w-4 h-4" />
            ) : (
              <PanelBottomOpen className="w-4 h-4" />
            )
          }
          label="Scopes panel"
          onClick={() => setBottomPanelOpen(!bottomPanelOpen)}
          active={bottomPanelOpen}
        />
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton
          icon={
            theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )
          }
          label={theme === "dark" ? "Light mode" : "Dark mode"}
          onClick={toggleTheme}
        />
      </div>
    </header>
  );
}

function ToolbarButton({
  icon,
  label,
  onClick,
  active,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
        className
      )}
    >
      {icon}
      <span className="hidden lg:block">{label}</span>
    </button>
  );
}
