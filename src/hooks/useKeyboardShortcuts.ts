import { useEffect } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useAdjustmentStore } from "@/stores/adjustmentStore";

/**
 * Global keyboard shortcuts for Gamut.
 * 
 * R — Reset all sliders
 * C — Toggle clipping overlay
 * V — Toggle comparison/split view
 * 1 — Show histogram only
 * 2 — Show parade only
 * 3 — Show waveform only
 * 0 — Show all scopes
 * [ — Toggle left panel
 * ] — Toggle bottom panel
 * T — Toggle theme
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const ui = useUIStore.getState();
      const adj = useAdjustmentStore.getState();

      switch (e.key.toLowerCase()) {
        case "r":
          adj.reset();
          break;
        case "c":
          ui.toggleClipping();
          break;
        case "v":
          ui.toggleComparison();
          break;
        case "1":
          ui.setActiveScope("histogram");
          break;
        case "2":
          ui.setActiveScope("parade");
          break;
        case "3":
          ui.setActiveScope("waveform");
          break;
        case "0":
          ui.setActiveScope("all");
          break;
        case "[":
          ui.setLeftPanelOpen(!ui.leftPanelOpen);
          break;
        case "]":
          ui.setBottomPanelOpen(!ui.bottomPanelOpen);
          break;
        case "t":
          ui.toggleTheme();
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
