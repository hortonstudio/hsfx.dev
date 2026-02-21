// === Database Row ===
export interface GsapPresetEntry {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  config: GsapPresetConfig;
  code_raw: string;
  code_minified: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// === JSONB config shape ===
export interface GsapPresetConfig {
  tweens: Tween[];
  trigger: TriggerConfig;
  reducedMotion: ReducedMotionConfig;
  timelineSettings: TimelineSettings;
}

// === Tween ===
export interface Tween {
  id: string;
  target: string; // CSS selector e.g. ".heading", ".card"
  type: "from" | "to" | "fromTo" | "set";
  properties: Record<string, AnimatedProperty>;
  duration: number;
  ease: string;
  position: string; // GSAP position param: "<", ">=", "+=0.2", absolute number as string
  stagger: StaggerConfig | null;
  splitText: SplitTextConfig | null;
  label: string;
  color: string; // for timeline bar display
}

export interface AnimatedProperty {
  from?: number | string;
  to: number | string;
  unit?: string; // px, %, vw, vh, em, rem, deg
}

// Known animatable properties
export type AnimatablePropertyName =
  | "x" | "y" | "xPercent" | "yPercent"
  | "rotation" | "rotationX" | "rotationY"
  | "scale" | "scaleX" | "scaleY"
  | "skewX" | "skewY"
  | "opacity"
  | "backgroundColor" | "color"
  | "clipPath" | "filter"
  | "width" | "height"
  | "borderRadius";

// === Stagger ===
export interface StaggerConfig {
  each: number;
  from: "start" | "end" | "center" | "edges" | "random";
  ease: string;
  grid: [number, number] | null; // [cols, rows] or null for linear
  count: number; // estimated element count for visual timeline display
}

// === Split Text ===
export interface SplitTextConfig {
  enabled: boolean;
  type: "chars" | "words" | "lines";
  mask: boolean; // overflow hidden on parent spans
  staggerEach: number;
}

// === Trigger ===
export interface TriggerConfig {
  type: "load" | "scrollTrigger" | "click" | "hover";
  scrollTrigger?: ScrollTriggerConfig;
}

export interface ScrollTriggerConfig {
  trigger: string; // CSS selector
  start: string; // e.g. "top 80%"
  end: string; // e.g. "bottom 20%"
  scrub: boolean | number;
  pin: boolean;
  toggleActions: string; // e.g. "play none none reverse"
  markers: boolean;
}

// === Reduced Motion ===
export interface ReducedMotionConfig {
  mode: "skip" | "instant" | "simplified";
}

// === Timeline Settings ===
export interface TimelineSettings {
  defaults: {
    ease: string;
    duration: number;
  };
  repeat: number; // -1 for infinite
  yoyo: boolean;
  delay: number;
}

// === UI State (not stored in DB) ===
export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  loop: boolean;
}

export interface TimelineViewState {
  zoom: number; // pixels per second
  scrollX: number;
  snapToGrid: boolean;
  gridSize: number; // in seconds
}

// === Code Generation ===
export interface GeneratedCode {
  full: string; // window.hsfx.ready() wrapped
  timelineOnly: string; // just tl creation + tweens
  importsOnly: string; // gsap.registerPlugin(...)
  minified: string;
  configJson: string;
}

// === Defaults ===
export const DEFAULT_TWEEN: Omit<Tween, "id"> = {
  target: '[data-hs-anim="element"]',
  type: "from",
  properties: {
    opacity: { to: 1, from: 0 },
    y: { to: 0, from: 30, unit: "px" },
  },
  duration: 0.6,
  ease: "power2.out",
  position: ">-=0.2",
  stagger: null,
  splitText: null,
  label: "",
  color: "#0ea5e9",
};

export const DEFAULT_CONFIG: GsapPresetConfig = {
  tweens: [],
  trigger: {
    type: "load",
  },
  reducedMotion: {
    mode: "instant",
  },
  timelineSettings: {
    defaults: {
      ease: "power2.out",
      duration: 0.6,
    },
    repeat: 0,
    yoyo: false,
    delay: 0,
  },
};

export const TWEEN_COLORS = [
  "#0ea5e9", // sky
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

// Property metadata for the property panel
export interface PropertyMeta {
  label: string;
  defaultUnit?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultFrom?: number | string;
  defaultTo?: number | string;
}

export const PROPERTY_META: Record<string, PropertyMeta> = {
  x: { label: "Move X", defaultUnit: "px", step: 1, defaultFrom: 0, defaultTo: 0 },
  y: { label: "Move Y", defaultUnit: "px", step: 1, defaultFrom: 0, defaultTo: 0 },
  xPercent: { label: "Move X %", step: 1, defaultFrom: 0, defaultTo: 0 },
  yPercent: { label: "Move Y %", step: 1, defaultFrom: 0, defaultTo: 0 },
  rotation: { label: "Rotate", defaultUnit: "deg", step: 1, defaultFrom: 0, defaultTo: 0 },
  rotationX: { label: "Rotate X", defaultUnit: "deg", step: 1, defaultFrom: 0, defaultTo: 0 },
  rotationY: { label: "Rotate Y", defaultUnit: "deg", step: 1, defaultFrom: 0, defaultTo: 0 },
  scale: { label: "Scale", step: 0.01, min: 0, max: 10, defaultFrom: 1, defaultTo: 1 },
  scaleX: { label: "Scale X", step: 0.01, min: 0, max: 10, defaultFrom: 1, defaultTo: 1 },
  scaleY: { label: "Scale Y", step: 0.01, min: 0, max: 10, defaultFrom: 1, defaultTo: 1 },
  skewX: { label: "Skew X", defaultUnit: "deg", step: 1, defaultFrom: 0, defaultTo: 0 },
  skewY: { label: "Skew Y", defaultUnit: "deg", step: 1, defaultFrom: 0, defaultTo: 0 },
  opacity: { label: "Opacity", step: 0.01, min: 0, max: 1, defaultFrom: 1, defaultTo: 1 },
  backgroundColor: { label: "BG Color", defaultFrom: "", defaultTo: "" },
  color: { label: "Text Color", defaultFrom: "", defaultTo: "" },
  clipPath: { label: "Clip Path", defaultFrom: "", defaultTo: "" },
  filter: { label: "Filter", defaultFrom: "", defaultTo: "" },
  width: { label: "Width", defaultUnit: "px", step: 1, defaultFrom: "auto", defaultTo: "auto" },
  height: { label: "Height", defaultUnit: "px", step: 1, defaultFrom: "auto", defaultTo: "auto" },
  borderRadius: { label: "Border Radius", defaultUnit: "px", step: 1, defaultFrom: 0, defaultTo: 0 },
};
