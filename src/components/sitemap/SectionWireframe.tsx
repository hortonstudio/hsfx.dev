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
  | "people"
  | "split"
  | "centered-cta";

interface SectionConfig {
  pattern: WireframePattern;
  height: number;
  description: string;
}

const SECTION_MAP: Record<string, SectionConfig> = {
  "hero":                { pattern: "hero",         height: 52, description: "Full-width hero with headline and CTA" },

  // Text-block group — staggered heights for variety
  "content":             { pattern: "text-block",   height: 32, description: "Rich text content block" },
  "blog content":        { pattern: "text-block",   height: 32, description: "Article body content" },
  "case study":          { pattern: "text-block",   height: 32, description: "Case study details and results" },
  "story/history":       { pattern: "split",        height: 38, description: "Brand origin story and history" },
  "service details":     { pattern: "split",        height: 38, description: "In-depth service information" },
  "area services":       { pattern: "text-block",   height: 38, description: "Location-specific service details" },
  "values":              { pattern: "text-block",   height: 28, description: "Core values and principles" },
  "overview":            { pattern: "text-block",   height: 28, description: "Section overview and introduction" },
  "philosophy":          { pattern: "text-block",   height: 28, description: "Company philosophy and approach" },
  "challenges":          { pattern: "text-block",   height: 26, description: "Problem statement and challenges" },
  "solutions":           { pattern: "text-block",   height: 26, description: "Solution approach and methodology" },
  "problem":             { pattern: "text-block",   height: 26, description: "Pain points and problem framing" },
  "solution":            { pattern: "text-block",   height: 26, description: "How the solution addresses the problem" },
  "platform overview":   { pattern: "text-block",   height: 34, description: "Product platform overview" },
  "features deep dive":  { pattern: "text-block",   height: 34, description: "Detailed feature breakdown" },
  "integration":         { pattern: "text-block",   height: 34, description: "System integration details" },

  // Grid-3 group — staggered heights
  "services grid":       { pattern: "grid-3",       height: 40, description: "3-column grid of service cards" },
  "feature grid":        { pattern: "grid-3",       height: 40, description: "Feature highlights in grid layout" },
  "portfolio grid":      { pattern: "grid-3",       height: 40, description: "Portfolio items in grid layout" },
  "team grid":           { pattern: "grid-3",       height: 44, description: "Team member cards in grid" },
  "testimonial grid":    { pattern: "grid-3",       height: 44, description: "Client testimonials in grid layout" },
  "pricing cards":       { pattern: "grid-3",       height: 36, description: "Pricing tiers comparison cards" },
  "case studies grid":   { pattern: "grid-3",       height: 36, description: "Case study cards in grid" },
  "open positions":      { pattern: "grid-3",       height: 36, description: "Job listings grid with filters" },

  "before/after gallery": { pattern: "grid-2",      height: 36, description: "Before and after comparison view" },
  "comparison table":    { pattern: "grid-2",       height: 36, description: "Side-by-side comparison layout" },
  "card links":          { pattern: "grid-2",       height: 36, description: "Linked navigation cards" },
  "engagement models":   { pattern: "grid-2",       height: 36, description: "Partnership structure options" },

  "gallery grid":        { pattern: "gallery",      height: 44, description: "Image gallery in masonry grid" },

  "feature list":        { pattern: "list",         height: 36, description: "Vertical feature list with icons" },
  "process steps":       { pattern: "list",         height: 36, description: "Step-by-step process breakdown" },
  "services overview":   { pattern: "list",         height: 36, description: "Service offerings overview list" },
  "timeline":            { pattern: "list",         height: 36, description: "Chronological timeline of events" },
  "objectives":          { pattern: "list",         height: 36, description: "Project goals and objectives" },
  "what to expect":      { pattern: "list",         height: 36, description: "Timeline and deliverables overview" },
  "why work with us":    { pattern: "list",         height: 36, description: "Key benefits of working together" },
  "resources":           { pattern: "list",         height: 36, description: "Helpful resources and downloads" },

  "faq accordion":       { pattern: "accordion",    height: 32, description: "Expandable FAQ questions" },
  "faq":                 { pattern: "accordion",    height: 32, description: "Frequently asked questions" },
  "category tabs":       { pattern: "accordion",    height: 32, description: "Tabbed content categories" },
  "filter/tabs":         { pattern: "accordion",    height: 32, description: "Content filter and tab controls" },

  "contact form":        { pattern: "form",         height: 42, description: "Contact form with input fields" },
  "newsletter signup":   { pattern: "centered-cta", height: 34, description: "Email newsletter subscription" },

  "stats/numbers":       { pattern: "stats",        height: 24, description: "Key metrics and statistics" },
  "social proof":        { pattern: "stats",        height: 24, description: "Trust badges and social proof" },
  "credentials":         { pattern: "stats",        height: 24, description: "Certifications and credentials" },
  "results":             { pattern: "stats",        height: 24, description: "Key outcomes and achievements" },

  // Cards group — staggered heights
  "blog grid":           { pattern: "cards",        height: 32, description: "Blog post cards in grid" },
  "related posts":       { pattern: "cards",        height: 32, description: "Related content cards" },
  "categories":          { pattern: "cards",        height: 28, description: "Category navigation cards" },
  "pricing table":       { pattern: "cards",        height: 28, description: "Pricing comparison table" },
  "download/resources":  { pattern: "cards",        height: 36, description: "Downloadable resources grid" },
  "related case studies": { pattern: "cards",       height: 36, description: "Related case study cards" },
  "core values":         { pattern: "cards",        height: 36, description: "Core values display cards" },

  "cta":                 { pattern: "centered-cta", height: 28, description: "Call-to-action banner" },
  "image banner":        { pattern: "banner",       height: 24, description: "Full-width image banner" },

  "logo bar":            { pattern: "logo-row",     height: 18, description: "Partner and client logos" },
  "partners":            { pattern: "logo-row",     height: 18, description: "Partner company logos" },

  "video":               { pattern: "media",        height: 36, description: "Embedded video player" },
  "map":                 { pattern: "media",        height: 36, description: "Interactive location map" },
  "area map":            { pattern: "media",        height: 36, description: "Service area coverage map" },

  "breadcrumbs":         { pattern: "nav",          height: 14, description: "Page breadcrumb navigation" },
  "sidebar":             { pattern: "nav",          height: 14, description: "Sidebar navigation menu" },
  "search":              { pattern: "nav",          height: 14, description: "Search bar and filters" },
  "filters":             { pattern: "nav",          height: 14, description: "Content filter controls" },

  "team member":         { pattern: "people",       height: 32, description: "Team member profile cards" },
  "testimonials":        { pattern: "people",       height: 32, description: "Client testimonial quotes" },
  "quote":               { pattern: "people",       height: 32, description: "Featured quote or testimonial" },
};

const DEFAULT_CONFIG: SectionConfig = { pattern: "text-block", height: 28, description: "Content section" };

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
      className="w-full rounded-[3px] flex flex-col items-center justify-center gap-[6px]"
      style={{ height, backgroundColor: `${color}10` }}
    >
      <div className="w-[40%] h-[5px] rounded-full" style={{ backgroundColor: `${color}30` }} />
      <div className="w-[55%] h-[3px] rounded-full" style={{ backgroundColor: `${color}18` }} />
      <div className="w-[25%] h-[4px] rounded-[2px] mt-[2px]" style={{ backgroundColor: `${color}22` }} />
    </div>
  );
}

function TextBlock({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[3px] flex flex-col justify-center gap-[4px] px-[10px]"
      style={{ height, backgroundColor: `${color}08` }}
    >
      <div className="w-full h-[2.5px] rounded-full" style={{ backgroundColor: `${color}18` }} />
      <div className="w-[75%] h-[2.5px] rounded-full" style={{ backgroundColor: `${color}12` }} />
      <div className="w-[90%] h-[2.5px] rounded-full" style={{ backgroundColor: `${color}18` }} />
      <div className="w-[60%] h-[2.5px] rounded-full" style={{ backgroundColor: `${color}10` }} />
    </div>
  );
}

function Grid3({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[3px] grid grid-cols-3 gap-[5px] p-[5px]"
      style={{ height, backgroundColor: `${color}08` }}
    >
      <div className="rounded-[2px]" style={{ backgroundColor: `${color}18` }} />
      <div className="rounded-[2px]" style={{ backgroundColor: `${color}12` }} />
      <div className="rounded-[2px]" style={{ backgroundColor: `${color}18` }} />
    </div>
  );
}

function Grid2({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[3px] grid grid-cols-2 gap-[5px] p-[5px]"
      style={{ height, backgroundColor: `${color}08` }}
    >
      <div className="rounded-[2px]" style={{ backgroundColor: `${color}18` }} />
      <div className="rounded-[2px]" style={{ backgroundColor: `${color}12` }} />
    </div>
  );
}

function Gallery({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[3px] grid grid-cols-2 grid-rows-2 gap-[4px] p-[5px]"
      style={{ height, backgroundColor: `${color}08` }}
    >
      <div className="rounded-[2px]" style={{ backgroundColor: `${color}20` }} />
      <div className="rounded-[2px]" style={{ backgroundColor: `${color}12` }} />
      <div className="rounded-[2px]" style={{ backgroundColor: `${color}12` }} />
      <div className="rounded-[2px]" style={{ backgroundColor: `${color}20` }} />
    </div>
  );
}

function List({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[3px] flex flex-col justify-center gap-[5px] px-[10px]"
      style={{ height, backgroundColor: `${color}08` }}
    >
      {[100, 80, 90, 70].map((w, i) => (
        <div key={i} className="flex items-center gap-[5px]">
          <div
            className="w-[4px] h-[4px] rounded-full flex-shrink-0"
            style={{ backgroundColor: `${color}28` }}
          />
          <div
            className="h-[2.5px] rounded-full"
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
      className="w-full rounded-[3px] flex flex-col justify-center gap-[6px] px-[8px]"
      style={{ height, backgroundColor: `${color}08` }}
    >
      <div className="w-full h-[2px]" style={{ backgroundColor: `${color}20` }} />
      <div className="w-full h-[2px]" style={{ backgroundColor: `${color}12` }} />
      <div className="w-full h-[2px]" style={{ backgroundColor: `${color}20` }} />
      <div className="w-full h-[2px]" style={{ backgroundColor: `${color}12` }} />
    </div>
  );
}

function Form({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[3px] flex flex-col items-center justify-center gap-[5px] px-[12px]"
      style={{ height, backgroundColor: `${color}08` }}
    >
      <div className="w-[80%] h-[6px] rounded-[2px] border" style={{ borderColor: `${color}18` }} />
      <div className="w-[80%] h-[6px] rounded-[2px] border" style={{ borderColor: `${color}12` }} />
      <div className="w-[35%] h-[6px] rounded-[2px] mt-[2px]" style={{ backgroundColor: `${color}25` }} />
    </div>
  );
}

function Stats({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[3px] flex items-center justify-center gap-[14px]"
      style={{ height, backgroundColor: `${color}08` }}
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col items-center gap-[2px]">
          <div className="w-[16px] h-[5px] rounded-[2px]" style={{ backgroundColor: `${color}22` }} />
          <div className="w-[22px] h-[2px] rounded-full" style={{ backgroundColor: `${color}10` }} />
        </div>
      ))}
    </div>
  );
}

function Cards({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[3px] flex items-center justify-center gap-[5px] px-[8px]"
      style={{ height, backgroundColor: `${color}08` }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex-1 h-[18px] rounded-[2px] border"
          style={{ borderColor: `${color}15` }}
        />
      ))}
    </div>
  );
}

function Banner({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[3px] flex items-center justify-center gap-[10px]"
      style={{ height, backgroundColor: `${color}0a` }}
    >
      <div className="w-[30%] h-[3px] rounded-full" style={{ backgroundColor: `${color}1a` }} />
      <div className="w-[28px] h-[7px] rounded-[2px]" style={{ backgroundColor: `${color}25` }} />
    </div>
  );
}

function LogoRow({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[3px] flex items-center justify-center gap-[8px]"
      style={{ height, backgroundColor: `${color}06` }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-[12px] h-[8px] rounded-[2px]"
          style={{ backgroundColor: `${color}18` }}
        />
      ))}
    </div>
  );
}

function Media({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[3px] flex items-center justify-center"
      style={{ height, backgroundColor: `${color}0a` }}
    >
      <div
        className="w-0 h-0"
        style={{
          borderLeft: `8px solid ${color}28`,
          borderTop: "5px solid transparent",
          borderBottom: "5px solid transparent",
        }}
      />
    </div>
  );
}

function Nav({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[3px] flex items-center gap-[6px] px-[8px]"
      style={{ height, backgroundColor: `${color}06` }}
    >
      <div className="w-[20px] h-[3px] rounded-full" style={{ backgroundColor: `${color}15` }} />
      <div className="w-[14px] h-[3px] rounded-full" style={{ backgroundColor: `${color}10` }} />
      <div className="w-[18px] h-[3px] rounded-full" style={{ backgroundColor: `${color}15` }} />
    </div>
  );
}

function People({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[3px] flex items-center gap-[8px] px-[10px]"
      style={{ height, backgroundColor: `${color}08` }}
    >
      <div
        className="w-[14px] h-[14px] rounded-full flex-shrink-0"
        style={{ backgroundColor: `${color}20` }}
      />
      <div className="flex-1 flex flex-col gap-[3px]">
        <div className="w-[70%] h-[3px] rounded-full" style={{ backgroundColor: `${color}20` }} />
        <div className="w-[50%] h-[2.5px] rounded-full" style={{ backgroundColor: `${color}10` }} />
      </div>
    </div>
  );
}

function Split({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[3px] flex gap-[5px] p-[5px]"
      style={{ height, backgroundColor: `${color}08` }}
    >
      <div className="w-[60%] rounded-[2px]" style={{ backgroundColor: `${color}15` }} />
      <div className="w-[40%] rounded-[2px] flex flex-col gap-[4px] justify-center px-[5px]">
        <div className="w-full h-[3px] rounded-full" style={{ backgroundColor: `${color}18` }} />
        <div className="w-[70%] h-[2.5px] rounded-full" style={{ backgroundColor: `${color}12` }} />
        <div className="w-[85%] h-[2.5px] rounded-full" style={{ backgroundColor: `${color}15` }} />
      </div>
    </div>
  );
}

function CenteredCTA({ color, height }: P) {
  return (
    <div
      className="w-full rounded-[3px] flex flex-col items-center justify-center gap-[5px]"
      style={{ height, backgroundColor: `${color}0c` }}
    >
      <div className="w-[45%] h-[4px] rounded-full" style={{ backgroundColor: `${color}22` }} />
      <div className="w-[30%] h-[2.5px] rounded-full" style={{ backgroundColor: `${color}12` }} />
      <div className="w-[20%] h-[6px] rounded-[3px] mt-[2px]" style={{ backgroundColor: `${color}28` }} />
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
  "split": Split,
  "centered-cta": CenteredCTA,
};

// ================================================================
// Public Component
// ================================================================

interface SectionWireframeStackProps {
  sections: string[];
  color: string;
  /** Optional: render comment triggers on each section row */
  commentSlot?: (sectionName: string) => React.ReactNode;
}

export function SectionWireframeStack({ sections, color, commentSlot }: SectionWireframeStackProps) {
  if (sections.length === 0) return null;

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

        {/* Page sections — auto-height, no cap */}
        <div className="py-0.5">
          {sections.map((section, i) => {
            const config = getConfig(section);
            const Pattern = PATTERNS[config.pattern];
            return (
              <div
                key={`${section}-${i}`}
                className="relative px-3 py-1.5 border-b border-border/10 last:border-b-0 group/section"
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
                {/* Comment trigger slot */}
                {commentSlot && commentSlot(section)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
