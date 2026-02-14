/**
 * Brand Configuration
 *
 * Central source of truth for all brand identifiers.
 * Change these values to rebrand the entire site.
 *
 * CSS accent colors live in globals.css (:root / .dark blocks)
 * and tailwind.config.ts (boxShadow glow values) — update those
 * separately when changing the accent color.
 */
export const brand = {
  name: "HSFX",
  tagline: "Build faster. Ship cleaner.",
  description:
    "A component-driven Webflow framework with 40+ attribute modules, CMS automation, and a complete developer toolkit.",
  domain: "hsfx.dev",
  email: "contact@hsfx.dev",
  cdnUrl: "https://cdn.hsfx.dev",
  npmScope: "hsfx",
  dataPrefix: "hsfx",
  cssPrefix: "hsfx",
  logo: { light: "/logo-w.svg", dark: "/logo-b.svg" },
  favicon: { small: "/favicon32x.png", large: "/favicon256x.png" },
  accentColor: "#0EA5E9",
} as const;
