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
    address: string | null;
  };
  content: {
    headings: string[];
    services: string[];
    bodyText: string[];
  };
  socialLinks: string[];
  logoUrl: string | null;
  pagesScraped?: string[];
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

// ── Extraction helpers (reusable across pages) ───────────

function extractContact(html: string): { phones: string[]; emails: string[] } {
  const phones: string[] = [];
  const emails: string[] = [];

  try {
    const textContent = html.replace(/<[^>]+>/g, " ");

    const phoneMatches = textContent.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g);
    if (phoneMatches) phones.push(...Array.from(new Set(phoneMatches)));

    const emailMatches = textContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (emailMatches) emails.push(...Array.from(new Set(emailMatches)));

    const mailtoMatches = html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi);
    if (mailtoMatches) {
      for (const m of mailtoMatches) {
        const email = m.replace(/^mailto:/i, "");
        if (!emails.includes(email)) emails.push(email);
      }
    }
  } catch {
    // Partial failure OK
  }

  return { phones: phones.slice(0, 5), emails: emails.slice(0, 5) };
}

function extractHeadings(html: string): string[] {
  const headings: string[] = [];

  try {
    const headingRe = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
    let hMatch;
    while ((hMatch = headingRe.exec(html)) !== null) {
      const text = hMatch[2].replace(/<[^>]+>/g, "").trim();
      if (text && text.length < 200) headings.push(text);
    }
  } catch {
    // Partial failure OK
  }

  return headings;
}

function extractServices(html: string): string[] {
  const services: string[] = [];

  try {
    const serviceSection = html.match(
      /(?:services?|offerings?|solutions?|what we (?:do|offer)|our work)[^]*?<\/(?:section|div|ul|ol)>/gi
    );
    if (serviceSection) {
      for (const section of serviceSection.slice(0, 3)) {
        const listItems = section.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
        if (listItems) {
          for (const li of listItems) {
            const text = li.replace(/<[^>]+>/g, "").trim();
            if (text && text.length < 100 && !services.includes(text)) {
              services.push(text);
            }
          }
        }
        const subHeadings = section.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi);
        if (subHeadings) {
          for (const sh of subHeadings) {
            const text = sh.replace(/<[^>]+>/g, "").trim();
            if (text && text.length < 100 && !services.includes(text)) {
              services.push(text);
            }
          }
        }
      }
    }
  } catch {
    // Partial failure OK
  }

  return services;
}

function extractBodyText(html: string): string[] {
  const texts: string[] = [];
  const seen = new Set<string>();

  try {
    // Strip nav, header, footer, script, style, noscript to focus on main content
    const cleaned = html
      .replace(/<(?:nav|header|footer|script|style|noscript|iframe|svg)[^>]*>[\s\S]*?<\/(?:nav|header|footer|script|style|noscript|iframe|svg)>/gi, "")
      // Remove HTML comments
      .replace(/<!--[\s\S]*?-->/g, "");

    // Extract paragraph text
    const pRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let m;
    while ((m = pRe.exec(cleaned)) !== null) {
      const text = m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      // Keep meaningful paragraphs (skip tiny fragments and duplicates)
      if (text.length >= 40 && text.length < 2000 && !seen.has(text)) {
        seen.add(text);
        texts.push(text);
      }
    }

    // Extract list items from main content (service descriptions, features, etc.)
    const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    while ((m = liRe.exec(cleaned)) !== null) {
      const text = m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (text.length >= 20 && text.length < 500 && !seen.has(text)) {
        seen.add(text);
        texts.push(text);
      }
    }
  } catch {
    // Partial failure OK
  }

  return texts.slice(0, 50);
}

function extractSocialLinks(html: string, baseUrl: string): string[] {
  const socials: string[] = [];
  const seen = new Set<string>();

  const socialDomains = [
    "facebook.com", "fb.com",
    "instagram.com",
    "twitter.com", "x.com",
    "linkedin.com",
    "youtube.com",
    "tiktok.com",
    "pinterest.com",
    "yelp.com",
    "google.com/maps",
  ];

  try {
    const linkRe = /<a\s[^>]*href=["']([^"']+)["']/gi;
    let m;
    while ((m = linkRe.exec(html)) !== null) {
      const href = m[1].trim();
      const lower = href.toLowerCase();

      for (const domain of socialDomains) {
        if (lower.includes(domain) && !seen.has(lower)) {
          seen.add(lower);
          try {
            const resolved = new URL(href, baseUrl).href;
            socials.push(resolved);
          } catch {
            socials.push(href);
          }
          break;
        }
      }
    }
  } catch {
    // Partial failure OK
  }

  return socials;
}

function extractAddress(html: string): string | null {
  try {
    // Schema.org structured data (JSON-LD)
    const jsonLdRe = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = jsonLdRe.exec(html)) !== null) {
      try {
        const data = JSON.parse(m[1]);
        const addr = data.address || data?.location?.address;
        if (addr) {
          if (typeof addr === "string") return addr;
          const parts = [addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.postalCode].filter(Boolean);
          if (parts.length >= 2) return parts.join(", ");
        }
      } catch {
        // Invalid JSON, skip
      }
    }

    // Common address patterns: look for text near "address" labels or in footer
    const footerMatch = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
    const searchAreas = footerMatch ? [footerMatch[1], html] : [html];

    for (const area of searchAreas) {
      // US street address pattern (number + street name + city, state zip)
      const addrRe = /\b(\d{1,5}\s+[A-Z][a-zA-Z\s.]+(?:St(?:reet)?|Ave(?:nue)?|Blvd|Boulevard|Dr(?:ive)?|Rd|Road|Ln|Lane|Way|Ct|Court|Pkwy|Parkway|Pl|Place|Cir|Circle|Hwy|Highway)[.,]?\s*(?:(?:Ste|Suite|Unit|#)\s*\S+[.,]?\s*)?[A-Z][a-zA-Z\s]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)\b/;
      const addrMatch = area.replace(/<[^>]+>/g, " ").match(addrRe);
      if (addrMatch) return addrMatch[1].replace(/\s+/g, " ").trim();
    }
  } catch {
    // Partial failure OK
  }

  return null;
}

function extractColorsFromHTML(
  html: string,
  colorMap: Map<string, { count: number; sources: Set<string> }>
) {
  try {
    const inlineStyles = html.match(/style=["']([^"']+)["']/gi);
    if (inlineStyles) {
      for (const s of inlineStyles) {
        const val = s.replace(/^style=["']|["']$/gi, "");
        extractColorsFromCSS(val, "inline", colorMap);
      }
    }

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
}

// ── Link discovery for multi-page scraping ───────────────

const PAGE_KEYWORDS: Record<string, string[]> = {
  services: ["services", "what-we-do", "offerings", "solutions", "our-work", "our-services"],
  about: ["about", "about-us", "our-story", "who-we-are", "our-team", "about-us"],
  contact: ["contact", "contact-us", "get-in-touch", "reach-us"],
  "service-area": ["service-area", "areas-served", "locations", "coverage", "where-we-serve", "areas-we-serve", "service-areas"],
};

function discoverLinks(html: string, baseUrl: string): string[] {
  const origin = new URL(baseUrl).origin;
  const seen = new Set<string>();
  const scored: { url: string; score: number }[] = [];

  // Extract links from nav, header, and footer
  const navSections = html.match(/<(?:nav|header|footer)[\s>][\s\S]*?<\/(?:nav|header|footer)>/gi) ?? [];

  // Also get top-level links as fallback (some sites don't use semantic elements)
  const allSections = [...navSections, html];

  for (const section of allSections) {
    const linkRe = /<a\s[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = linkRe.exec(section)) !== null) {
      const href = m[1].trim();
      const linkText = m[2].replace(/<[^>]+>/g, "").trim().toLowerCase();

      let resolved: string;
      try {
        const u = new URL(href, baseUrl);
        if (u.origin !== origin) continue;
        u.hash = "";
        u.search = "";
        resolved = u.href;
      } catch {
        continue;
      }

      // Skip homepage, assets, and anchors
      if (resolved === baseUrl || resolved === baseUrl + "/") continue;
      if (/\.(jpg|jpeg|png|gif|svg|webp|pdf|css|js|ico)$/i.test(resolved)) continue;
      if (seen.has(resolved)) continue;
      seen.add(resolved);

      // Score against keyword heuristics
      const path = new URL(resolved).pathname.toLowerCase();
      let score = 0;

      for (const keywords of Object.values(PAGE_KEYWORDS)) {
        for (const kw of keywords) {
          if (path.includes(kw)) score += 3;
          if (linkText.includes(kw.replace(/-/g, " "))) score += 2;
        }
      }

      // Only keep links that matched at least one keyword (from nav sections)
      // or that have a high score from the full HTML scan
      if (score > 0) {
        scored.push({ url: resolved, score });
      }
    }

    // Only scan nav/header/footer links, not the full HTML
    if (section === html && scored.length >= 4) break;
  }

  // Sort by score descending, dedupe by taking the best
  scored.sort((a, b) => b.score - a.score);

  const result: string[] = [];
  const usedPaths = new Set<string>();

  for (const { url } of scored) {
    const path = new URL(url).pathname;
    if (usedPaths.has(path)) continue;
    usedPaths.add(path);
    result.push(url);
    if (result.length >= 4) break;
  }

  return result;
}

// ── Main scraper (single page) ───────────────────────────

export async function scrapeSite(url: string): Promise<ScrapedData> {
  const html = await fetchWithTimeout(url, 10_000);

  const result: ScrapedData = {
    url,
    colors: [],
    meta: { title: null, description: null, ogTitle: null, ogDescription: null, ogImage: null },
    contact: { phones: [], emails: [], address: null },
    content: { headings: [], services: [], bodyText: [] },
    socialLinks: [],
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
  const contact = extractContact(html);
  result.contact = { ...contact, address: extractAddress(html) };

  // ── Headings ───────────────────────────────────────────
  result.content.headings = extractHeadings(html).slice(0, 20);

  // ── Services detection ─────────────────────────────────
  result.content.services = extractServices(html).slice(0, 15);

  // ── Body text ──────────────────────────────────────────
  result.content.bodyText = extractBodyText(html);

  // ── Social links ───────────────────────────────────────
  result.socialLinks = extractSocialLinks(html, url);

  // ── Logo detection ─────────────────────────────────────
  try {
    if (result.meta.ogImage) {
      result.logoUrl = result.meta.ogImage;
    }

    const iconMatch = html.match(/<link[^>]*rel=["'](?:apple-touch-icon|icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i);
    if (iconMatch) {
      result.logoUrl = resolveUrl(iconMatch[1], url);
    }

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

  extractColorsFromHTML(html, colorMap);

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

// ── Multi-page scraper ───────────────────────────────────

export async function scrapeMultiPage(url: string): Promise<ScrapedData> {
  // Scrape homepage first
  const html = await fetchWithTimeout(url, 10_000);
  const homepage = await scrapeSiteFromHTML(html, url);

  // Discover internal links worth scraping
  const innerLinks = discoverLinks(html, url);
  const pagesScraped = [url];

  if (innerLinks.length === 0) {
    homepage.pagesScraped = pagesScraped;
    return homepage;
  }

  // Fetch inner pages in parallel
  const innerResults = await Promise.allSettled(
    innerLinks.map((link) => fetchWithTimeout(link, 10_000))
  );

  // Shared color map — start with homepage colors
  const colorMap = new Map<string, { count: number; sources: Set<string> }>();
  extractColorsFromHTML(html, colorMap);

  // Collect merged data
  const allPhones = new Set(homepage.contact.phones);
  const allEmails = new Set(homepage.contact.emails);
  const allHeadings = [...homepage.content.headings];
  const allServices = [...homepage.content.services];
  const allBodyText = [...homepage.content.bodyText];
  const bodyTextSeen = new Set(allBodyText);
  const allSocialLinks = [...homepage.socialLinks];
  const socialSeen = new Set(allSocialLinks);
  let address = homepage.contact.address;

  for (let i = 0; i < innerResults.length; i++) {
    const r = innerResults[i];
    if (r.status !== "fulfilled") continue;

    const innerHtml = r.value;
    const innerUrl = innerLinks[i];
    pagesScraped.push(innerUrl);

    // Extract content from inner page
    const contact = extractContact(innerHtml);
    for (const p of contact.phones) allPhones.add(p);
    for (const e of contact.emails) allEmails.add(e);

    if (!address) address = extractAddress(innerHtml);

    for (const h of extractHeadings(innerHtml)) {
      if (!allHeadings.includes(h)) allHeadings.push(h);
    }

    for (const s of extractServices(innerHtml)) {
      if (!allServices.includes(s)) allServices.push(s);
    }

    for (const t of extractBodyText(innerHtml)) {
      if (!bodyTextSeen.has(t)) {
        bodyTextSeen.add(t);
        allBodyText.push(t);
      }
    }

    for (const link of extractSocialLinks(innerHtml, innerUrl)) {
      if (!socialSeen.has(link)) {
        socialSeen.add(link);
        allSocialLinks.push(link);
      }
    }

    extractColorsFromHTML(innerHtml, colorMap);
  }

  // Also fetch stylesheets from homepage for color extraction
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

  // Build merged result
  return {
    url,
    colors: Array.from(colorMap.entries())
      .map(([hex, data]) => ({
        hex,
        count: data.count,
        sources: Array.from(data.sources),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    meta: homepage.meta,
    contact: {
      phones: Array.from(allPhones).slice(0, 5),
      emails: Array.from(allEmails).slice(0, 5),
      address,
    },
    content: {
      headings: allHeadings.slice(0, 30),
      services: allServices.slice(0, 20),
      bodyText: allBodyText.slice(0, 80),
    },
    socialLinks: allSocialLinks,
    logoUrl: homepage.logoUrl,
    pagesScraped,
  };
}

// Helper: scrape from already-fetched HTML (avoids double-fetch for homepage)
async function scrapeSiteFromHTML(html: string, url: string): Promise<ScrapedData> {
  const result: ScrapedData = {
    url,
    colors: [],
    meta: { title: null, description: null, ogTitle: null, ogDescription: null, ogImage: null },
    contact: { phones: [], emails: [], address: null },
    content: { headings: [], services: [], bodyText: [] },
    socialLinks: [],
    logoUrl: null,
  };

  // Meta tags
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

  result.contact = { ...extractContact(html), address: extractAddress(html) };
  result.content.headings = extractHeadings(html).slice(0, 20);
  result.content.services = extractServices(html).slice(0, 15);
  result.content.bodyText = extractBodyText(html);
  result.socialLinks = extractSocialLinks(html, url);

  // Logo detection
  try {
    if (result.meta.ogImage) result.logoUrl = result.meta.ogImage;

    const iconMatch = html.match(/<link[^>]*rel=["'](?:apple-touch-icon|icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i);
    if (iconMatch) result.logoUrl = resolveUrl(iconMatch[1], url);

    const logoImgMatch = html.match(/<img[^>]*(?:class|alt|src)=["'][^"']*logo[^"']*["'][^>]*>/i);
    if (logoImgMatch) {
      const srcMatch = logoImgMatch[0].match(/src=["']([^"']+)["']/i);
      if (srcMatch) result.logoUrl = resolveUrl(srcMatch[1], url);
    }
  } catch {
    // Partial failure OK
  }

  // Colors (inline + style tags only, no stylesheet fetch — that's done by caller)
  const colorMap = new Map<string, { count: number; sources: Set<string> }>();
  extractColorsFromHTML(html, colorMap);

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
