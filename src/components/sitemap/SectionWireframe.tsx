"use client";

// ================================================================
// Types & Config
// ================================================================

type WireframePattern =
  | "hero"
  | "text-block"
  | "grid-3"
  | "grid-2"
  | "gallery"
  | "list"
  | "accordion"
  | "form"
  | "stats"
  | "cards"
  | "banner"
  | "logo-row"
  | "media"
  | "nav"
  | "people";

interface WireframeConfig {
  pattern: WireframePattern;
  height: number;
}

const SECTION_MAP: Record<string, WireframeConfig> = {
  "hero":                { pattern: "hero",       height: 20 },

  "content":             { pattern: "text-block", height: 14 },
  "blog content":        { pattern: "text-block", height: 14 },
  "story/history":       { pattern: "text-block", height: 14 },
  "values":              { pattern: "text-block", height: 14 },
  "case study":          { pattern: "text-block", height: 14 },
  "service details":     { pattern: "text-block", height: 14 },
  "area services":       { pattern: "text-block", height: 14 },

  "services grid":       { pattern: "grid-3",     height: 18 },
  "feature grid":        { pattern: "grid-3",     height: 18 },
  "team grid":           { pattern: "grid-3",     height: 18 },
  "testimonial grid":    { pattern: "grid-3",     height: 18 },
  "portfolio grid":      { pattern: "grid-3",     height: 18 },
  "pricing cards":       { pattern: "grid-3",     height: 18 },

  "before/after gallery": { pattern: "grid-2",    height: 16 },
  "comparison table":    { pattern: "grid-2",     height: 16 },

  "gallery grid":        { pattern: "gallery",    height: 20 },

  "feature list":        { pattern: "list",       height: 16 },
  "process steps":       { pattern: "list",       height: 16 },
  "services overview":   { pattern: "list",       height: 16 },

  "faq accordion":       { pattern: "accordion",  height: 16 },

  "contact form":        { pattern: "form",       height: 18 },
  "newsletter signup":   { pattern: "form",       height: 18 },

  "stats/numbers":       { pattern: "stats",      height: 10 },
  "social proof":        { pattern: "stats",      height: 10 },
  "credentials":         { pattern: "stats",      height: 10 },

  "blog grid":           { pattern: "cards",      height: 14 },
  "related posts":       { pattern: "cards",      height: 14 },
  "categories":          { pattern: "cards",      height: 14 },
  "pricing table":       { pattern: "cards",      height: 14 },
  "download/resources":  { pattern: "cards",      height: 14 },

  "cta":                 { pattern: "banner",     height: 10 },
  "image banner":        { pattern: "banner",     height: 10 },

  "logo bar":            { pattern: "logo-row",   height: 8 },
  "partners":            { pattern: "logo-row",   height: 8 },

  "video":               { pattern: "media",      height: 16 },
  "map":                 { pattern: "media",      height: 16 },
  "area map":            { pattern: "media",      height: 16 },

  "breadcrumbs":         { pattern: "nav",        height: 6 },
  "sidebar":             { pattern: "nav",        height: 6 },
  "search":              { pattern: "nav",        height: 6 },
  "filters":             { pattern: "nav",        height: 6 },

  "team member":         { pattern: "people",     height: 14 },
  "testimonials":        { pattern: "people",     height: 14 },
};

function getConfig(section: string): WireframeConfig {
  return SECTION_MAP[section.toLowerCase()] ?? { pattern: "text-block", height: 12 };
}

function getStackHeight(sections: string[]): number {
  if (sections.length === 0) return 0;
  let total = 0;
  for (const s of sections) total += getConfig(s).height + 2;
  return total - 2;
}

// ================================================================
// Pattern Components
// ================================================================

interface P { color: string; height: number }

function Hero({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[2px] flex flex-col items-center justify-center gap-[3px]"
      style={{ height, backgroundColor: `${color}10` }}
    >
      <div className="w-[40%] h-[3px] rounded-full" style={{ backgroundColor: `${color}30` }} />
      <div className="w-[55%] h-[2px] rounded-full" style={{ backgroundColor: `${color}18` }} />
    </div>
  );
}

function TextBlock({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[2px] flex flex-col justify-center gap-[2px] px-[6px]"
      style={{ height, backgroundColor: `${color}08` }}
    >
      <div className="w-full h-[1.5px] rounded-full" style={{ backgroundColor: `${color}18` }} />
      <div className="w-[75%] h-[1.5px] rounded-full" style={{ backgroundColor: `${color}12` }} />
      <div className="w-[90%] h-[1.5px] rounded-full" style={{ backgroundColor: `${color}18` }} />
    </div>
  );
}

function Grid3({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[2px] grid grid-cols-3 gap-[3px] p-[3px]"
      style={{ height, backgroundColor: `${color}08` }}
    >
      <div className="rounded-[1px]" style={{ backgroundColor: `${color}18` }} />
      <div className="rounded-[1px]" style={{ backgroundColor: `${color}12` }} />
      <div className="rounded-[1px]" style={{ backgroundColor: `${color}18` }} />
    </div>
  );
}

function Grid2({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[2px] grid grid-cols-2 gap-[3px] p-[3px]"
      style={{ height, backgroundColor: `${color}08` }}
    >
      <div className="rounded-[1px]" style={{ backgroundColor: `${color}18` }} />
      <div className="rounded-[1px]" style={{ backgroundColor: `${color}12` }} />
    </div>
  );
}

function Gallery({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[2px] grid grid-cols-2 grid-rows-2 gap-[2px] p-[3px]"
      style={{ height, backgroundColor: `${color}08` }}
    >
      <div className="rounded-[1px]" style={{ backgroundColor: `${color}20` }} />
      <div className="rounded-[1px]" style={{ backgroundColor: `${color}12` }} />
      <div className="rounded-[1px]" style={{ backgroundColor: `${color}12` }} />
      <div className="rounded-[1px]" style={{ backgroundColor: `${color}20` }} />
    </div>
  );
}

function List({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[2px] flex flex-col justify-center gap-[2px] px-[6px]"
      style={{ height, backgroundColor: `${color}08` }}
    >
      {[100, 80, 90].map((w, i) => (
        <div key={i} className="flex items-center gap-[3px]">
          <div
            className="w-[2px] h-[2px] rounded-full flex-shrink-0"
            style={{ backgroundColor: `${color}28` }}
          />
          <div
            className="h-[1.5px] rounded-full"
            style={{ width: `${w}%`, backgroundColor: `${color}18` }}
          />
        </div>
      ))}
    </div>
  );
}

function Accordion({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[2px] flex flex-col justify-center gap-[3px] px-[5px]"
      style={{ height, backgroundColor: `${color}08` }}
    >
      <div className="w-full h-[1px]" style={{ backgroundColor: `${color}20` }} />
      <div className="w-full h-[1px]" style={{ backgroundColor: `${color}12` }} />
      <div className="w-full h-[1px]" style={{ backgroundColor: `${color}20` }} />
    </div>
  );
}

function Form({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[2px] flex flex-col items-center justify-center gap-[2px] px-[8px]"
      style={{ height, backgroundColor: `${color}08` }}
    >
      <div className="w-[80%] h-[3px] rounded-[1px] border" style={{ borderColor: `${color}18` }} />
      <div className="w-[80%] h-[3px] rounded-[1px] border" style={{ borderColor: `${color}12` }} />
      <div className="w-[35%] h-[3px] rounded-[1px] mt-[1px]" style={{ backgroundColor: `${color}25` }} />
    </div>
  );
}

function Stats({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[2px] flex items-center justify-center gap-[8px]"
      style={{ height, backgroundColor: `${color}08` }}
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col items-center gap-[1px]">
          <div className="w-[10px] h-[3px] rounded-[1px]" style={{ backgroundColor: `${color}22` }} />
          <div className="w-[14px] h-[1px] rounded-full" style={{ backgroundColor: `${color}10` }} />
        </div>
      ))}
    </div>
  );
}

function Cards({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[2px] flex items-center justify-center gap-[3px] px-[4px]"
      style={{ height, backgroundColor: `${color}08` }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex-1 h-[8px] rounded-[1px] border"
          style={{ borderColor: `${color}15` }}
        />
      ))}
    </div>
  );
}

function Banner({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[2px] flex items-center justify-center gap-[6px]"
      style={{ height, backgroundColor: `${color}0a` }}
    >
      <div className="w-[30%] h-[2px] rounded-full" style={{ backgroundColor: `${color}1a` }} />
      <div className="w-[16px] h-[4px] rounded-[1px]" style={{ backgroundColor: `${color}25` }} />
    </div>
  );
}

function LogoRow({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[2px] flex items-center justify-center gap-[4px]"
      style={{ height, backgroundColor: `${color}06` }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-[6px] h-[4px] rounded-[1px]"
          style={{ backgroundColor: `${color}18` }}
        />
      ))}
    </div>
  );
}

function Media({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[2px] flex items-center justify-center"
      style={{ height, backgroundColor: `${color}0a` }}
    >
      <div
        className="w-0 h-0"
        style={{
          borderLeft: `4px solid ${color}28`,
          borderTop: "3px solid transparent",
          borderBottom: "3px solid transparent",
        }}
      />
    </div>
  );
}

function Nav({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[2px] flex items-center gap-[3px] px-[4px]"
      style={{ height, backgroundColor: `${color}06` }}
    >
      <div className="w-[12px] h-[1.5px] rounded-full" style={{ backgroundColor: `${color}15` }} />
      <div className="w-[8px] h-[1.5px] rounded-full" style={{ backgroundColor: `${color}10` }} />
      <div className="w-[10px] h-[1.5px] rounded-full" style={{ backgroundColor: `${color}15` }} />
    </div>
  );
}

function People({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[2px] flex items-center gap-[4px] px-[6px]"
      style={{ height, backgroundColor: `${color}08` }}
    >
      <div
        className="w-[8px] h-[8px] rounded-full flex-shrink-0"
        style={{ backgroundColor: `${color}20` }}
      />
      <div className="flex-1 flex flex-col gap-[1.5px]">
        <div className="w-[70%] h-[2px] rounded-full" style={{ backgroundColor: `${color}20` }} />
        <div className="w-[50%] h-[1.5px] rounded-full" style={{ backgroundColor: `${color}10` }} />
      </div>
    </div>
  );
}

const PATTERNS: Record<WireframePattern, React.FC<P>> = {
  "hero": Hero,
  "text-block": TextBlock,
  "grid-3": Grid3,
  "grid-2": Grid2,
  "gallery": Gallery,
  "list": List,
  "accordion": Accordion,
  "form": Form,
  "stats": Stats,
  "cards": Cards,
  "banner": Banner,
  "logo-row": LogoRow,
  "media": Media,
  "nav": Nav,
  "people": People,
};

// ================================================================
// Public Components
// ================================================================

const MAX_HEIGHT = 120;

interface SectionWireframeStackProps {
  sections: string[];
  color: string;
}

export function SectionWireframeStack({ sections, color }: SectionWireframeStackProps) {
  if (sections.length === 0) return null;

  const totalHeight = getStackHeight(sections);
  const overflows = totalHeight > MAX_HEIGHT;

  return (
    <div className="mt-3 relative">
      <div
        className="flex flex-col gap-[2px] overflow-hidden"
        style={{ maxHeight: `${MAX_HEIGHT}px` }}
      >
        {sections.map((section, i) => {
          const config = getConfig(section);
          const Pattern = PATTERNS[config.pattern];
          return <Pattern key={`${section}-${i}`} color={color} height={config.height} />;
        })}
      </div>
      {overflows && (
        <div
          className="absolute bottom-0 left-0 right-0 h-[20px] pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, var(--color-surface))" }}
        />
      )}
    </div>
  );
}
