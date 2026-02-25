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

interface SectionConfig {
  pattern: WireframePattern;
  height: number;
  description: string;
}

const SECTION_MAP: Record<string, SectionConfig> = {
  "hero":                { pattern: "hero",       height: 22, description: "Full-width hero with headline and CTA" },

  "content":             { pattern: "text-block", height: 14, description: "Rich text content block" },
  "blog content":        { pattern: "text-block", height: 14, description: "Article body content" },
  "story/history":       { pattern: "text-block", height: 14, description: "Brand origin story and history" },
  "values":              { pattern: "text-block", height: 14, description: "Core values and principles" },
  "case study":          { pattern: "text-block", height: 14, description: "Case study details and results" },
  "service details":     { pattern: "text-block", height: 14, description: "In-depth service information" },
  "area services":       { pattern: "text-block", height: 14, description: "Location-specific service details" },
  "overview":            { pattern: "text-block", height: 14, description: "Section overview and introduction" },
  "philosophy":          { pattern: "text-block", height: 14, description: "Company philosophy and approach" },
  "challenges":          { pattern: "text-block", height: 14, description: "Problem statement and challenges" },
  "solutions":           { pattern: "text-block", height: 14, description: "Solution approach and methodology" },
  "problem":             { pattern: "text-block", height: 14, description: "Pain points and problem framing" },
  "solution":            { pattern: "text-block", height: 14, description: "How the solution addresses the problem" },
  "platform overview":   { pattern: "text-block", height: 14, description: "Product platform overview" },
  "features deep dive":  { pattern: "text-block", height: 14, description: "Detailed feature breakdown" },
  "integration":         { pattern: "text-block", height: 14, description: "System integration details" },

  "services grid":       { pattern: "grid-3",     height: 18, description: "3-column grid of service cards" },
  "feature grid":        { pattern: "grid-3",     height: 18, description: "Feature highlights in grid layout" },
  "team grid":           { pattern: "grid-3",     height: 18, description: "Team member cards in grid" },
  "testimonial grid":    { pattern: "grid-3",     height: 18, description: "Client testimonials in grid layout" },
  "portfolio grid":      { pattern: "grid-3",     height: 18, description: "Portfolio items in grid layout" },
  "pricing cards":       { pattern: "grid-3",     height: 18, description: "Pricing tiers comparison cards" },
  "case studies grid":   { pattern: "grid-3",     height: 18, description: "Case study cards in grid" },
  "open positions":      { pattern: "grid-3",     height: 18, description: "Job listings grid with filters" },

  "before/after gallery": { pattern: "grid-2",    height: 16, description: "Before and after comparison view" },
  "comparison table":    { pattern: "grid-2",     height: 16, description: "Side-by-side comparison layout" },
  "card links":          { pattern: "grid-2",     height: 16, description: "Linked navigation cards" },
  "engagement models":   { pattern: "grid-2",     height: 16, description: "Partnership structure options" },

  "gallery grid":        { pattern: "gallery",    height: 20, description: "Image gallery in masonry grid" },

  "feature list":        { pattern: "list",       height: 16, description: "Vertical feature list with icons" },
  "process steps":       { pattern: "list",       height: 16, description: "Step-by-step process breakdown" },
  "services overview":   { pattern: "list",       height: 16, description: "Service offerings overview list" },
  "timeline":            { pattern: "list",       height: 16, description: "Chronological timeline of events" },
  "objectives":          { pattern: "list",       height: 16, description: "Project goals and objectives" },
  "what to expect":      { pattern: "list",       height: 16, description: "Timeline and deliverables overview" },
  "why work with us":    { pattern: "list",       height: 16, description: "Key benefits of working together" },
  "resources":           { pattern: "list",       height: 16, description: "Helpful resources and downloads" },

  "faq accordion":       { pattern: "accordion",  height: 16, description: "Expandable FAQ questions" },
  "faq":                 { pattern: "accordion",  height: 16, description: "Frequently asked questions" },
  "category tabs":       { pattern: "accordion",  height: 16, description: "Tabbed content categories" },
  "filter/tabs":         { pattern: "accordion",  height: 16, description: "Content filter and tab controls" },

  "contact form":        { pattern: "form",       height: 18, description: "Contact form with input fields" },
  "newsletter signup":   { pattern: "form",       height: 18, description: "Email newsletter subscription" },

  "stats/numbers":       { pattern: "stats",      height: 10, description: "Key metrics and statistics" },
  "social proof":        { pattern: "stats",      height: 10, description: "Trust badges and social proof" },
  "credentials":         { pattern: "stats",      height: 10, description: "Certifications and credentials" },
  "results":             { pattern: "stats",      height: 10, description: "Key outcomes and achievements" },

  "blog grid":           { pattern: "cards",      height: 14, description: "Blog post cards in grid" },
  "related posts":       { pattern: "cards",      height: 14, description: "Related content cards" },
  "categories":          { pattern: "cards",      height: 14, description: "Category navigation cards" },
  "pricing table":       { pattern: "cards",      height: 14, description: "Pricing comparison table" },
  "download/resources":  { pattern: "cards",      height: 14, description: "Downloadable resources grid" },
  "related case studies": { pattern: "cards",     height: 14, description: "Related case study cards" },
  "core values":         { pattern: "cards",      height: 14, description: "Core values display cards" },

  "cta":                 { pattern: "banner",     height: 10, description: "Call-to-action banner" },
  "image banner":        { pattern: "banner",     height: 10, description: "Full-width image banner" },

  "logo bar":            { pattern: "logo-row",   height: 8, description: "Partner and client logos" },
  "partners":            { pattern: "logo-row",   height: 8, description: "Partner company logos" },

  "video":               { pattern: "media",      height: 16, description: "Embedded video player" },
  "map":                 { pattern: "media",      height: 16, description: "Interactive location map" },
  "area map":            { pattern: "media",      height: 16, description: "Service area coverage map" },

  "breadcrumbs":         { pattern: "nav",        height: 6, description: "Page breadcrumb navigation" },
  "sidebar":             { pattern: "nav",        height: 6, description: "Sidebar navigation menu" },
  "search":              { pattern: "nav",        height: 6, description: "Search bar and filters" },
  "filters":             { pattern: "nav",        height: 6, description: "Content filter controls" },

  "team member":         { pattern: "people",     height: 14, description: "Team member profile cards" },
  "testimonials":        { pattern: "people",     height: 14, description: "Client testimonial quotes" },
  "quote":               { pattern: "people",     height: 14, description: "Featured quote or testimonial" },
};

const DEFAULT_CONFIG: SectionConfig = { pattern: "text-block", height: 12, description: "Content section" };

function getConfig(section: string): SectionConfig {
  return SECTION_MAP[section.toLowerCase()] ?? DEFAULT_CONFIG;
}

const UPPER_WORDS = new Set(["faq", "cta", "cms", "hr", "seo", "b2b", "b2c"]);

function formatName(section: string): string {
  return section
    .split(/[\s/]+/)
    .map((w) => {
      const lower = w.toLowerCase();
      if (UPPER_WORDS.has(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
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
// Public Component
// ================================================================

const MAX_HEIGHT = 220;
const ROW_OVERHEAD = 22;

interface SectionWireframeStackProps {
  sections: string[];
  color: string;
}

export function SectionWireframeStack({ sections, color }: SectionWireframeStackProps) {
  if (sections.length === 0) return null;

  let totalHeight = 0;
  for (const s of sections) totalHeight += getConfig(s).height + ROW_OVERHEAD;
  const overflows = totalHeight > MAX_HEIGHT;

  return (
    <div className="mt-3">
      <div className="rounded-lg border border-border/40 bg-background/30 overflow-hidden">
        {/* Browser chrome bar */}
        <div className="flex items-center gap-1 px-2.5 py-1.5 border-b border-border/20 bg-background/20">
          <div className="w-1.5 h-1.5 rounded-full bg-text-dim/20" />
          <div className="w-1.5 h-1.5 rounded-full bg-text-dim/20" />
          <div className="w-1.5 h-1.5 rounded-full bg-text-dim/20" />
          <div className="flex-1 mx-2 h-2.5 rounded-sm bg-background/40 border border-border/20" />
        </div>

        {/* Page sections */}
        <div className="relative" style={{ maxHeight: MAX_HEIGHT, overflow: "hidden" }}>
          <div className="py-0.5">
            {sections.map((section, i) => {
              const config = getConfig(section);
              const Pattern = PATTERNS[config.pattern];
              return (
                <div
                  key={`${section}-${i}`}
                  className="px-3 py-1.5 border-b border-border/10 last:border-b-0"
                >
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span
                      className="text-[9px] font-semibold leading-none flex-shrink-0"
                      style={{ color }}
                    >
                      {formatName(section)}
                    </span>
                    <span className="text-[8px] text-text-dim leading-none truncate">
                      {config.description}
                    </span>
                  </div>
                  {/* Centered at 75% width to simulate 1440px content in 1920px viewport */}
                  <div className="flex justify-center">
                    <div style={{ width: "75%" }}>
                      <Pattern color={color} height={config.height} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {overflows && (
            <div
              className="absolute bottom-0 left-0 right-0 h-[30px] pointer-events-none"
              style={{ background: "linear-gradient(to bottom, transparent, var(--color-surface))" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
