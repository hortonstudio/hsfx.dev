# HSFX.dev - AI Reference

## Quick Start
```bash
npm run dev     # Dev server on :3777
npm run build   # Production build
npm run lint    # ESLint
```

## Required Reading
Before making changes, read the relevant docs:
- `docs/architecture.md` - App structure, routes, DB tables, env vars, tools inventory
- `docs/ui-system.md` - Design tokens, component API, UI gotchas
- `docs/client-suite.md` - Client flow (5 tabs), KB, mockup, onboarding, sitemap overview
- `docs/sitemap-system.md` - Sitemap editor architecture, grid view, AI generation, comments, roadmap
- `docs/webflow-integration.md` - CMS fields, variant values, push flow
- `docs/patterns-and-gotchas.md` - Lenis scroll, z-index, Radix patterns, sitemap gotchas, common pitfalls

## Critical Rules

### Lenis Smooth Scroll
Any scrollable overlay MUST have `data-lenis-prevent` on its scrollable container. Without it, scroll doesn't work inside modals/sidebars.

### Webflow Option Values
Option fields are strict enums. Wrong values = Validation Error. Current allowed values:
```
navbar-variant:    "Full" | "Full, no top" | "Island" | "Island, no top"
hero-variant:      "Full Height, Left Align" | "Auto Height, Center Align" | "Text and Image 2 Grid"
footer-variant:    "Full" | "Minimal"
services-variant:  "Three Grid" | "Sticky List"
process-variant:   "Sticky List" | "Card Grid"
faq-variant:       "Center" | "Two Grid"
contact-variant:   "Two Grid" | "Center"
```
If these change in Webflow, update: `types.ts`, `generate/route.ts` (prompt + defaults), `demo/route.ts`.

### Z-Index Layers
```
z-50    → Modals, Dialogs
z-[60]  → Toasts (above modals)
z-[100] → PageTransition
```

### Design Token Classes
Use token classes, never raw colors:
```
text-text-primary, text-text-muted, text-text-dim
bg-background, bg-surface
border-border
```

### Controlled Tabs
Radix Tabs reset on unmount. Use `value`/`onValueChange` (controlled mode) when parent state can cause re-renders. Use `initialLoadDone` ref to prevent loading spinner on data refetch.

### Separate Generate from Push
AI generation saves config as "draft". Webflow push is a separate action. Never couple them — if push fails, the config must still be saved.

### API Route Params
Next.js 14 params are async: `const { id } = await params;`

### Supabase Clients
- Browser: `createClient()` from `@/lib/supabase/client`
- Server/API: `createClient()` from `@/lib/supabase/server`
- Admin (bypass RLS): `createAdminClient()` from `@/lib/supabase/admin`

### Sitemap Editor
The sitemap uses a custom 3-tier grid layout (not React Flow canvas). Key rules:
- Auto-save debounces at 3s — always save on close if `dirtyRef.current` is true
- Collection items embed into parent cards via `collapseCollectionItems()` (display-only)
- AI output goes through `validateAndCleanAINodes()` — never skip validation
- Default zoom is `0.65` — preserve this for full sitemap visibility on load
- Grid view and public viewer share `SitemapGridView` — gate editor features with `readOnly` prop
- Page type colors are Tailwind 400-level for dark background contrast

## Stack
Next.js 14 (App Router), React 18, TypeScript, Supabase, Tailwind CSS, Radix UI, Framer Motion, GSAP + ScrollTrigger, Lenis, Claude AI (Sonnet 4.5 for generation, Haiku 4.5 for KB), Webflow CMS API v2
