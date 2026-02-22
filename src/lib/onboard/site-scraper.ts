// ════════════════════════════════════════════════════════════
// Site Scraper — extracts colors, meta, contact, content from a URL
// Pure functions, no external deps. Regex-based parsing.
// ════════════════════════════════════════════════════════════

export interface ScrapedData {
  url: string;
  colors: { hex: string; count: number; sources: string[] }[];
  meta: {
    title: string | null;
    description: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
  };
  contact: {
    phones: string[];
    emails: string[];
  };
  content: {
    headings: string[];
    services: string[];
  };
  logoUrl: string | null;
}

// ── Named color map (common subset) ──────────────────────

const NAMED_COLORS: Record<string, string> = {
  red: "#ff0000", blue: "#0000ff", green: "#008000", yellow: "#ffff00",
  orange: "#ffa500", purple: "#800080", pink: "#ffc0cb", white: "#ffffff",
  black: "#000000", gray: "#808080", grey: "#808080", navy: "#000080",
  teal: "#008080", maroon: "#800000", lime: "#00ff00", aqua: "#00ffff",
  silver: "#c0c0c0", olive: "#808000", coral: "#ff7f50", salmon: "#fa8072",
  tomato: "#ff6347", gold: "#ffd700", indigo: "#4b0082", violet: "#ee82ee",
  crimson: "#dc143c", chocolate: "#d2691e", darkcyan: "#008b8b",
  darkblue: "#00008b", darkgreen: "#006400", darkred: "#8b0000",
  darkslategray: "#2f4f4f", dodgerblue: "#1e90ff", firebrick: "#b22222",
  forestgreen: "#228b22", steelblue: "#4682b4", royalblue: "#4169e1",
  slateblue: "#6a5acd", midnightblue: "#191970", darkviolet: "#9400d3",
  deeppink: "#ff1493", orangered: "#ff4500", darkgoldenrod: "#b8860b",
};

// Colors to filter out (common defaults, not brand-specific)
const IGNORE_COLORS = new Set([
  "#ffffff", "#000000", "#fff", "#000", "#f5f5f5", "#e5e5e5",
  "#d4d4d4", "#a3a3a3", "#737373", "#525252", "#404040", "#262626",
  "#171717", "#fafafa", "#f4f4f5", "#e4e4e7", "#d4d4d8",
  "transparent", "inherit", "currentcolor", "initial", "unset",
]);

// ── Color extraction ─────────────────────────────────────

const COLOR_PROP_RE =
  /(?:^|[{;\s])\s*(?:color|background-color|background|border-color|border|fill|stroke)\s*:\s*([^;{}]+)/gi;

const HEX_RE = /#(?:[0-9a-f]{3,4}){1,2}\b/gi;
const RGB_RE = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/gi;
const HSL_RE = /hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?/gi;

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")
  );
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function normalizeColor(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();

  // Hex
  const hexMatch = trimmed.match(/^#([0-9a-f]{3,8})$/);
  if (hexMatch) {
    const val = hexMatch[1];
    if (val.length === 3) return `#${val[0]}${val[0]}${val[1]}${val[1]}${val[2]}${val[2]}`;
    if (val.length === 6) return `#${val}`;
    if (val.length === 8) return `#${val.slice(0, 6)}`; // drop alpha
    if (val.length === 4) return `#${val[0]}${val[0]}${val[1]}${val[1]}${val[2]}${val[2]}`;
    return null;
  }

  // rgb/rgba
  const rgbMatch = trimmed.match(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/);
  if (rgbMatch) return rgbToHex(+rgbMatch[1], +rgbMatch[2], +rgbMatch[3]);

  // hsl/hsla
  const hslMatch = trimmed.match(/hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?/);
  if (hslMatch) return hslToHex(+hslMatch[1], +hslMatch[2], +hslMatch[3]);

  // Named
  if (NAMED_COLORS[trimmed]) return NAMED_COLORS[trimmed];

  return null;
}

function extractColorsFromCSS(
  css: string,
  source: string,
  colorMap: Map<string, { count: number; sources: Set<string> }>
) {
  // Extract from color property declarations
  let match;
  COLOR_PROP_RE.lastIndex = 0;
  while ((match = COLOR_PROP_RE.exec(css)) !== null) {
    const value = match[1];

    // Try hex values in the declaration
    let subMatch;
    HEX_RE.lastIndex = 0;
    while ((subMatch = HEX_RE.exec(value)) !== null) {
      const hex = normalizeColor(subMatch[0]);
      if (hex && !IGNORE_COLORS.has(hex)) {
        const entry = colorMap.get(hex) ?? { count: 0, sources: new Set<string>() };
        entry.count++;
        entry.sources.add(source);
        colorMap.set(hex, entry);
      }
    }

    // Try rgb values
    RGB_RE.lastIndex = 0;
    while ((subMatch = RGB_RE.exec(value)) !== null) {
      const hex = rgbToHex(+subMatch[1], +subMatch[2], +subMatch[3]);
      if (!IGNORE_COLORS.has(hex)) {
        const entry = colorMap.get(hex) ?? { count: 0, sources: new Set<string>() };
        entry.count++;
        entry.sources.add(source);
        colorMap.set(hex, entry);
      }
    }

    // Try hsl values
    HSL_RE.lastIndex = 0;
    while ((subMatch = HSL_RE.exec(value)) !== null) {
      const hex = hslToHex(+subMatch[1], +subMatch[2], +subMatch[3]);
      if (!IGNORE_COLORS.has(hex)) {
        const entry = colorMap.get(hex) ?? { count: 0, sources: new Set<string>() };
        entry.count++;
        entry.sources.add(source);
        colorMap.set(hex, entry);
      }
    }

    // Try named colors
    const namedMatch = value.match(/\b([a-z]{3,20})\b/gi);
    if (namedMatch) {
      for (const name of namedMatch) {
        const hex = NAMED_COLORS[name.toLowerCase()];
        if (hex && !IGNORE_COLORS.has(hex)) {
          const entry = colorMap.get(hex) ?? { count: 0, sources: new Set<string>() };
          entry.count++;
          entry.sources.add(source);
          colorMap.set(hex, entry);
        }
      }
    }
  }
}

// ── Fetch with timeout helper ────────────────────────────

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; HsfxOnboardBot/1.0)",
      Accept: "text/html,text/css,*/*",
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  // Reject oversized responses (5MB)
  const contentLength = res.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
    throw new Error("Response too large");
  }

  return res.text();
}

// ── Resolve relative URL ─────────────────────────────────

function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}

// ── Main scraper ─────────────────────────────────────────

export async function scrapeSite(url: string): Promise<ScrapedData> {
  const html = await fetchWithTimeout(url, 10_000);

  const result: ScrapedData = {
    url,
    colors: [],
    meta: { title: null, description: null, ogTitle: null, ogDescription: null, ogImage: null },
    contact: { phones: [], emails: [] },
    content: { headings: [], services: [] },
    logoUrl: null,
  };

  // ── Meta tags ──────────────────────────────────────────
  try {
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) result.meta.title = titleMatch[1].trim();

    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (descMatch) result.meta.description = descMatch[1].trim();

    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    if (ogTitleMatch) result.meta.ogTitle = ogTitleMatch[1].trim();

    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    if (ogDescMatch) result.meta.ogDescription = ogDescMatch[1].trim();

    const ogImgMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogImgMatch) result.meta.ogImage = resolveUrl(ogImgMatch[1].trim(), url);
  } catch {
    // Partial failure OK
  }

  // ── Contact info ───────────────────────────────────────
  try {
    // Strip HTML tags for text-based extraction
    const textContent = html.replace(/<[^>]+>/g, " ");

    const phones = textContent.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g);
    if (phones) result.contact.phones = Array.from(new Set(phones)).slice(0, 5);

    const emails = textContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (emails) result.contact.emails = Array.from(new Set(emails)).slice(0, 5);

    // Also check mailto: links
    const mailtoMatches = html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi);
    if (mailtoMatches) {
      for (const m of mailtoMatches) {
        const email = m.replace(/^mailto:/i, "");
        if (!result.contact.emails.includes(email)) {
          result.contact.emails.push(email);
        }
      }
    }
  } catch {
    // Partial failure OK
  }

  // ── Headings ───────────────────────────────────────────
  try {
    const headingRe = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
    let hMatch;
    while ((hMatch = headingRe.exec(html)) !== null) {
      const text = hMatch[2].replace(/<[^>]+>/g, "").trim();
      if (text && text.length < 200) {
        result.content.headings.push(text);
      }
    }
    result.content.headings = result.content.headings.slice(0, 20);
  } catch {
    // Partial failure OK
  }

  // ── Services detection ─────────────────────────────────
  try {
    // Look for list items near "service" keywords in the HTML
    const serviceSection = html.match(
      /(?:services?|offerings?|solutions?|what we (?:do|offer)|our work)[^]*?<\/(?:section|div|ul|ol)>/gi
    );
    if (serviceSection) {
      for (const section of serviceSection.slice(0, 3)) {
        const listItems = section.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
        if (listItems) {
          for (const li of listItems) {
            const text = li.replace(/<[^>]+>/g, "").trim();
            if (text && text.length < 100 && !result.content.services.includes(text)) {
              result.content.services.push(text);
            }
          }
        }
        // Also check h2/h3/h4 inside service sections
        const subHeadings = section.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi);
        if (subHeadings) {
          for (const sh of subHeadings) {
            const text = sh.replace(/<[^>]+>/g, "").trim();
            if (text && text.length < 100 && !result.content.services.includes(text)) {
              result.content.services.push(text);
            }
          }
        }
      }
    }
    result.content.services = result.content.services.slice(0, 15);
  } catch {
    // Partial failure OK
  }

  // ── Logo detection ─────────────────────────────────────
  try {
    // OG image
    if (result.meta.ogImage) {
      result.logoUrl = result.meta.ogImage;
    }

    // apple-touch-icon or icon link
    const iconMatch = html.match(/<link[^>]*rel=["'](?:apple-touch-icon|icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i);
    if (iconMatch) {
      result.logoUrl = resolveUrl(iconMatch[1], url);
    }

    // img with "logo" in attributes
    const logoImgMatch = html.match(/<img[^>]*(?:class|alt|src)=["'][^"']*logo[^"']*["'][^>]*>/i);
    if (logoImgMatch) {
      const srcMatch = logoImgMatch[0].match(/src=["']([^"']+)["']/i);
      if (srcMatch) {
        result.logoUrl = resolveUrl(srcMatch[1], url);
      }
    }
  } catch {
    // Partial failure OK
  }

  // ── Colors ─────────────────────────────────────────────
  const colorMap = new Map<string, { count: number; sources: Set<string> }>();

  try {
    // Inline styles
    const inlineStyles = html.match(/style=["']([^"']+)["']/gi);
    if (inlineStyles) {
      for (const s of inlineStyles) {
        const val = s.replace(/^style=["']|["']$/gi, "");
        extractColorsFromCSS(val, "inline", colorMap);
      }
    }

    // <style> tags
    const styleTags = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    if (styleTags) {
      for (const tag of styleTags) {
        const css = tag.replace(/<\/?style[^>]*>/gi, "");
        extractColorsFromCSS(css, "style-tag", colorMap);
      }
    }
  } catch {
    // Partial failure OK
  }

  // Linked stylesheets (fetch up to 5)
  try {
    const linkRe = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi;
    const stylesheetUrls: string[] = [];
    let linkMatch;
    while ((linkMatch = linkRe.exec(html)) !== null && stylesheetUrls.length < 5) {
      stylesheetUrls.push(resolveUrl(linkMatch[1], url));
    }

    const cssResults = await Promise.allSettled(
      stylesheetUrls.map((cssUrl) => fetchWithTimeout(cssUrl, 3_000))
    );

    for (let i = 0; i < cssResults.length; i++) {
      const r = cssResults[i];
      if (r.status === "fulfilled") {
        extractColorsFromCSS(r.value, `stylesheet:${stylesheetUrls[i]}`, colorMap);
      }
    }
  } catch {
    // Partial failure OK
  }

  // Build sorted color array
  result.colors = Array.from(colorMap.entries())
    .map(([hex, data]) => ({
      hex,
      count: data.count,
      sources: Array.from(data.sources),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return result;
}
