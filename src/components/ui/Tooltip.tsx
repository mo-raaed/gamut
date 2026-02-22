import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  const show = () => {
    setOpen(true);
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const tip = tooltipRef.current;
      const tipWidth = tip?.offsetWidth ?? 200;
      const tipHeight = tip?.offsetHeight ?? 40;

      let top = 0;
      let left = 0;

      switch (side) {
        case "top":
          top = rect.top - tipHeight - 8;
          left = rect.left + rect.width / 2 - tipWidth / 2;
          break;
        case "bottom":
          top = rect.bottom + 8;
          left = rect.left + rect.width / 2 - tipWidth / 2;
          break;
        case "left":
          top = rect.top + rect.height / 2 - tipHeight / 2;
          left = rect.left - tipWidth - 8;
          break;
        case "right":
          top = rect.top + rect.height / 2 - tipHeight / 2;
          left = rect.right + 8;
          break;
      }

      // Clamp to viewport
      left = Math.max(8, Math.min(left, window.innerWidth - tipWidth - 8));
      top = Math.max(8, top);

      setCoords({ top, left });
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={() => setOpen(false)}
        onFocus={show}
        onBlur={() => setOpen(false)}
        className="inline-flex"
      >
        {children}
      </div>
      {open && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={cn(
            "fixed z-50 max-w-xs px-3 py-2 text-xs font-medium rounded-md",
            "bg-popover text-popover-foreground border shadow-lg",
            "animate-in fade-in-0 zoom-in-95 duration-150",
            className
          )}
          style={{ top: coords.top, left: coords.left }}
        >
          {content}
        </div>
      )}
    </>
  );
}
