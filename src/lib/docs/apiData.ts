import { brand } from "@/config";

export interface ApiParam {
  name: string;
  type: "string" | "boolean";
  required: boolean;
  default?: string;
  description: string;
}

export interface ApiResponseFormat {
  label: string;
  contentType: string;
  example: string;
}

export interface ApiDocData {
  name: string;
  slug: string;
  method: string;
  endpoint: string;
  description: string;
  parameters: ApiParam[];
  responseFormats: ApiResponseFormat[];
  curlExamples: { label: string; command: string }[];
}

export const cssApiData: ApiDocData = {
  name: "CSS API",
  slug: "css",
  method: "GET",
  endpoint: `/api/css`,
  description: `Serves CSS entries from the ${brand.name} design system stored in Supabase. Fetch individual entries, combine all entries in a group, and control minification. Responses are cached for performance.`,
  parameters: [
    {
      name: "group",
      type: "string",
      required: true,
      description:
        "CSS group name to fetch entries from (e.g. 'global', 'landing').",
    },
    {
      name: "entry",
      type: "string",
      required: false,
      description:
        "Specific entry name within the group. If omitted, returns all entries.",
    },
    {
      name: "combined",
      type: "boolean",
      required: false,
      default: "false",
      description:
        "Combine all entries into a single CSS output. Uses pre-computed cache from the css_groups table for fast responses.",
    },
    {
      name: "minified",
      type: "boolean",
      required: false,
      default: "false",
      description:
        "Return minified CSS. Removes whitespace, comments, and shortens values for smaller payloads.",
    },
    {
      name: "tags",
      type: "boolean",
      required: false,
      default: "false",
      description:
        "Wrap the CSS output in <style> tags. Useful for injecting directly into HTML.",
    },
  ],
  responseFormats: [
    {
      label: "Single Entry / Combined (text/css)",
      contentType: "text/css",
      example: `/* When requesting a single entry or combined=true */
.button_wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: all 0.2s ease;
}`,
    },
    {
      label: "Multiple Entries (JSON)",
      contentType: "application/json",
      example: `[
  {
    "name": "buttons",
    "css": ".button_wrap { display: inline-flex; ... }"
  },
  {
    "name": "typography",
    "css": ".heading_style { font-family: var(--font-heading); ... }"
  }
]`,
    },
    {
      label: "Error Response (JSON)",
      contentType: "application/json",
      example: `{
  "error": "group parameter required"
}`,
    },
  ],
  curlExamples: [
    {
      label: "Fetch all entries in a group",
      command: `curl -H "x-api-key: YOUR_API_KEY" \\
  "https://${brand.domain}/api/css?group=global"`,
    },
    {
      label: "Fetch a single entry",
      command: `curl -H "x-api-key: YOUR_API_KEY" \\
  "https://${brand.domain}/api/css?group=global&entry=buttons"`,
    },
    {
      label: "Get combined minified CSS",
      command: `curl -H "x-api-key: YOUR_API_KEY" \\
  "https://${brand.domain}/api/css?group=global&combined=true&minified=true"`,
    },
    {
      label: "Get CSS wrapped in style tags",
      command: `curl -H "x-api-key: YOUR_API_KEY" \\
  "https://${brand.domain}/api/css?group=landing&combined=true&tags=true"`,
    },
  ],
};

export const iconsApiData: ApiDocData = {
  name: "Icons API",
  slug: "icons",
  method: "GET",
  endpoint: `/api/icons`,
  description: `Provides access to the ${brand.name} SVG icon library. Returns structured JSON with icon groups and inline SVG content. Icons are sorted by group, sort order, and name.`,
  parameters: [
    {
      name: "group",
      type: "string",
      required: false,
      description:
        "Filter icons by group name (e.g. 'contact', 'general'). If omitted, returns all icons across all groups.",
    },
  ],
  responseFormats: [
    {
      label: "Success Response (JSON)",
      contentType: "application/json",
      example: `{
  "groups": ["contact", "general", "social"],
  "icons": [
    {
      "name": "inquiry",
      "group": "contact",
      "svg": "<svg viewBox=\\"0 0 24 24\\" fill=\\"none\\">...</svg>"
    },
    {
      "name": "arrow-right",
      "group": "general",
      "svg": "<svg viewBox=\\"0 0 24 24\\" fill=\\"none\\">...</svg>"
    }
  ]
}`,
    },
    {
      label: "Empty Response (JSON)",
      contentType: "application/json",
      example: `{
  "groups": [],
  "icons": []
}`,
    },
    {
      label: "Error Response (JSON)",
      contentType: "application/json",
      example: `{
  "error": "Unauthorized"
}`,
    },
  ],
  curlExamples: [
    {
      label: "Fetch all icons",
      command: `curl -H "x-api-key: YOUR_API_KEY" \\
  "https://${brand.domain}/api/icons"`,
    },
    {
      label: "Fetch icons by group",
      command: `curl -H "x-api-key: YOUR_API_KEY" \\
  "https://${brand.domain}/api/icons?group=contact"`,
    },
  ],
};

export const buttonStylesApiData: ApiDocData = {
  name: "Button Styles API",
  slug: "button-styles",
  method: "GET",
  endpoint: `/api/button-styles`,
  description: `Serves button animation styles and configuration for the ${brand.name} Webflow framework. Returns pre-parsed JSON structured for direct consumption by the Webflow button animation app, or raw flat entries for management tools.`,
  parameters: [
    {
      name: "component",
      type: "string",
      required: false,
      description:
        "Filter by component name (e.g. 'button-main', 'arrow', 'close', 'play', 'footer-link'). If omitted, returns all components.",
    },
    {
      name: "raw",
      type: "boolean",
      required: false,
      default: "false",
      description:
        "Return flat array of all entries instead of the pre-parsed structured response. Useful for management tools.",
    },
  ],
  responseFormats: [
    {
      label: "Pre-parsed Response (JSON)",
      contentType: "application/json",
      example: `{
  "buttonMain": {
    "config": {
      "sourceAttribute": "data-animation-type",
      "targetAttribute": "data-wf--button-main--style",
      "buttonTypes": ["primary", "secondary", "text"],
      "defaultAnimations": { "primary": "bgbasic" }
    },
    "defaultsCSS": "/* base styles */...",
    "animations": {
      "bgbasic": { "name": "bgbasic", "css": "..." },
      "bgfill": { "name": "bgfill", "css": "..." }
    }
  },
  "accessories": { ... },
  "footerLink": { ... }
}`,
    },
    {
      label: "Raw Entries (JSON)",
      contentType: "application/json",
      example: `[
  {
    "id": "uuid",
    "component": "button-main",
    "name": "bgbasic",
    "type": "animation",
    "css": ".button_wrap[data-animation-type=\\"bgbasic\\"] { ... }",
    "config": null,
    "sort_order": 3
  }
]`,
    },
    {
      label: "Error Response (JSON)",
      contentType: "application/json",
      example: `{
  "error": "Unauthorized"
}`,
    },
  ],
  curlExamples: [
    {
      label: "Fetch all button styles (pre-parsed)",
      command: `curl -H "x-api-key: YOUR_API_KEY" \\
  "https://${brand.domain}/api/button-styles"`,
    },
    {
      label: "Fetch a specific component",
      command: `curl -H "x-api-key: YOUR_API_KEY" \\
  "https://${brand.domain}/api/button-styles?component=button-main"`,
    },
    {
      label: "Fetch raw entries for management",
      command: `curl -H "x-api-key: YOUR_API_KEY" \\
  "https://${brand.domain}/api/button-styles?raw=true"`,
    },
  ],
};

export const gsapPresetsApiData: ApiDocData = {
  name: "GSAP Presets API",
  slug: "gsap-presets",
  method: "GET",
  endpoint: `/api/gsap-presets`,
  description: `Serves GSAP animation presets from the ${brand.name} design system stored in Supabase. Fetch individual presets by slug, filter by category, and get code output in raw or minified format.`,
  parameters: [
    {
      name: "slug",
      type: "string",
      required: false,
      description:
        "Fetch a single preset by its unique slug.",
    },
    {
      name: "category",
      type: "string",
      required: false,
      description:
        "Filter presets by category name (e.g. 'hero', 'scroll', 'interaction').",
    },
    {
      name: "format",
      type: "string",
      required: false,
      description:
        "Set to 'code' to return only the generated JavaScript code instead of the full preset object.",
    },
    {
      name: "minified",
      type: "boolean",
      required: false,
      default: "false",
      description:
        "Return minified code. Only applies when format=code.",
    },
    {
      name: "raw",
      type: "boolean",
      required: false,
      default: "false",
      description:
        "Return all presets including drafts (unpublished). Used by the manager UI.",
    },
  ],
  responseFormats: [
    {
      label: "Single Preset (JSON)",
      contentType: "application/json",
      example: `{
  "id": "uuid",
  "name": "Hero Fade In",
  "slug": "hero-fade-in",
  "category": "hero",
  "description": "Fade in hero section elements",
  "config": { "tweens": [...], "trigger": {...} },
  "code_raw": "window.hsfx.ready(() => { ... });",
  "code_minified": "window.hsfx.ready(()=>{...});",
  "is_published": true
}`,
    },
    {
      label: "Code Only (JavaScript)",
      contentType: "application/javascript",
      example: `window.hsfx.ready(() => {
  const tl = gsap.timeline();
  tl.from(".heading", { opacity: 0, y: 30, duration: 0.6 });
});`,
    },
    {
      label: "Preset List (JSON)",
      contentType: "application/json",
      example: `[
  {
    "id": "uuid",
    "name": "Hero Fade In",
    "slug": "hero-fade-in",
    "category": "hero",
    ...
  }
]`,
    },
    {
      label: "Error Response (JSON)",
      contentType: "application/json",
      example: `{
  "error": "Unauthorized"
}`,
    },
  ],
  curlExamples: [
    {
      label: "Fetch all published presets",
      command: `curl -H "x-api-key: YOUR_API_KEY" \\
  "https://${brand.domain}/api/gsap-presets"`,
    },
    {
      label: "Fetch a single preset by slug",
      command: `curl -H "x-api-key: YOUR_API_KEY" \\
  "https://${brand.domain}/api/gsap-presets?slug=hero-fade-in"`,
    },
    {
      label: "Fetch preset code only (minified)",
      command: `curl -H "x-api-key: YOUR_API_KEY" \\
  "https://${brand.domain}/api/gsap-presets?slug=hero-fade-in&format=code&minified=true"`,
    },
    {
      label: "Fetch all presets including drafts",
      command: `curl -H "x-api-key: YOUR_API_KEY" \\
  "https://${brand.domain}/api/gsap-presets?raw=true"`,
    },
  ],
};

export const allApiData: ApiDocData[] = [cssApiData, iconsApiData, buttonStylesApiData, gsapPresetsApiData];
