/**
 * Sample photos for quick experimentation.
 * Uses freely-licensed images from Unsplash (via their CDN).
 * Images are loaded at a reasonable resolution for the editor.
 */

export interface SamplePhoto {
  id: string;
  name: string;
  description: string;
  /** Thumbnail URL (~300px wide) */
  thumb: string;
  /** Full-size URL (~1600px wide) */
  url: string;
  /** Credit line */
  credit: string;
}

export const SAMPLE_PHOTOS: SamplePhoto[] = [
  {
    id: "landscape",
    name: "Mountain Lake",
    description: "Rich highlights & shadows — great for tonal work",
    thumb: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&q=80&auto=format",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=85&auto=format",
    credit: "Unsplash",
  },
  {
    id: "portrait",
    name: "Portrait",
    description: "Skin tones — test white balance & vibrance",
    thumb: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80&auto=format",
    url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1600&q=85&auto=format",
    credit: "Unsplash",
  },
  {
    id: "cityscape",
    name: "City Night",
    description: "High contrast — explore shadows & highlights",
    thumb: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=300&q=80&auto=format",
    url: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1600&q=85&auto=format",
    credit: "Unsplash",
  },
  {
    id: "nature",
    name: "Forest Path",
    description: "Green-dominant — perfect for saturation experiments",
    thumb: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&q=80&auto=format",
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&q=85&auto=format",
    credit: "Unsplash",
  },
  {
    id: "sunset",
    name: "Golden Sunset",
    description: "Warm tones — experiment with temperature & tint",
    thumb: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=300&q=80&auto=format",
    url: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1600&q=85&auto=format",
    credit: "Unsplash",
  },
  {
    id: "bw-subject",
    name: "Architecture",
    description: "Geometric lines — ideal for contrast & B&W presets",
    thumb: "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?w=300&q=80&auto=format",
    url: "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?w=1600&q=85&auto=format",
    credit: "Unsplash",
  },
  {
    id: "noisy-dark",
    name: "Night Grain",
    description: "High-ISO noise — perfect for testing the denoise slider",
    thumb: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=300&q=80&auto=format",
    url: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=1600&q=85&auto=format",
    credit: "Unsplash",
  },
];
