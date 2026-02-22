import { create } from "zustand";
import type { LoadedImage } from "@/types";

interface ImageStore {
  image: LoadedImage | null;
  isLoading: boolean;
  error: string | null;
  setImage: (img: LoadedImage) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const useImageStore = create<ImageStore>()((set) => ({
  image: null,
  isLoading: false,
  error: null,

  setImage: (img) => set({ image: img, isLoading: false, error: null }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
  clear: () => set({ image: null, isLoading: false, error: null }),
}));
