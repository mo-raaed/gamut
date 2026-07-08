import { create } from "zustand";
import type { UIState } from "@/types";

interface UIStore extends UIState {
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
  toggleClipping: () => void;
  toggleComparison: () => void;
  setActiveScope: (scope: UIState["activeScope"]) => void;
  setLeftPanelOpen: (open: boolean) => void;
  setBottomPanelOpen: (open: boolean) => void;
  setComparisonPosition: (pos: number) => void;
}

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem("gamut-theme");
  if (stored === "light" || stored === "dark") return stored;
  // Dark-first: color-analysis work reads best on the dark theme,
  // so first visit defaults to dark (matches the FOUC script).
  return "dark";
}

// Keep exactly one theme class on <html> (FOUC script set one pre-paint)
function applyThemeClass(theme: "light" | "dark") {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}

const initialTheme = getInitialTheme();
if (typeof document !== "undefined") {
  applyThemeClass(initialTheme);
}

export const useUIStore = create<UIStore>()((set, get) => ({
  theme: initialTheme,
  showClipping: false,
  showComparison: true,
  activeScope: "all",
  leftPanelOpen: true,
  bottomPanelOpen: true,
  comparisonPosition: 0.5,

  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    applyThemeClass(next);
    localStorage.setItem("gamut-theme", next);
    set({ theme: next });
  },

  setTheme: (theme) => {
    applyThemeClass(theme);
    localStorage.setItem("gamut-theme", theme);
    set({ theme });
  },

  toggleClipping: () => set((s) => ({ showClipping: !s.showClipping })),
  toggleComparison: () => set((s) => ({ showComparison: !s.showComparison })),
  setActiveScope: (activeScope) => set({ activeScope }),
  setLeftPanelOpen: (leftPanelOpen) => set({ leftPanelOpen }),
  setBottomPanelOpen: (bottomPanelOpen) => set({ bottomPanelOpen }),
  setComparisonPosition: (comparisonPosition) => set({ comparisonPosition }),
}));
