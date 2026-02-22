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
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// Sync the <html> classList on initial load so CSS matches immediately
const initialTheme = getInitialTheme();
if (typeof document !== "undefined") {
  document.documentElement.classList.toggle("dark", initialTheme === "dark");
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
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("gamut-theme", next);
    set({ theme: next });
  },

  setTheme: (theme) => {
    document.documentElement.classList.toggle("dark", theme === "dark");
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
