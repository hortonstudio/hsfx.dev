# HSFX.dev - AI Reference

## Quick Start
```bash
npm run dev     # Dev server on :3777
npm run build   # Production build
npm run lint    # ESLint
```

## Required Reading
Before making changes, read the relevant docs:
- `docs/architecture.md` - App structure, routes, DB tables, env vars
- `docs/ui-system.md` - Design tokens, component API, UI gotchas
- `docs/client-suite.md` - Client flow, KB, mockup generation, onboarding
- `docs/webflow-integration.md` - CMS fields, variant values, push flow
- `docs/patterns-and-gotchas.md` - Lenis scroll, z-index, Radix patterns, common pitfalls

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

## Stack
Next.js 14 (App Router), React 18, TypeScript, Supabase, Tailwind CSS, Radix UI, Framer Motion, Lenis, Claude AI (Haiku 4.5), Webflow CMS API v2
