# Architecture Reference

## Stack
- **Framework:** Next.js 14.2 (App Router), React 18, TypeScript 5
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **Styling:** Tailwind CSS 3.4, CSS custom properties for design tokens
- **Animation:** Framer Motion (UI), GSAP (tools), Lenis (smooth scroll)
- **AI:** Anthropic Claude (claude-haiku-4-5-20251001) via @anthropic-ai/sdk
- **CMS:** Webflow CMS API v2
- **UI Primitives:** Radix UI (@radix-ui/react-dialog, tabs, checkbox, radio, select, dropdown-menu, tooltip, switch)

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Supabase anon key (public)
SUPABASE_SECRET_KEY               # Supabase service role key (server only)
WEBFLOW_API_TOKEN                 # Webflow API bearer token
WEBFLOW_COLLECTION_ID             # Webflow CMS collection ID for mockups
WEBFLOW_SITE_DOMAIN               # e.g. "example.webflow.io" for mockup URLs
```

## Route Structure

### Public
- `/` - Landing page
- `/auth/callback` - OAuth callback
- `/onboard/[slug]` - Public onboarding form (email-gated)

### Protected (auth required via middleware.ts)
- `/dashboard` - Main dashboard
- `/clients` - Client list
- `/clients/[id]` - Client detail (4 tabs: overview, knowledge, onboarding, mockup)
- `/tools/*` - Developer tools (9 tools)
- `/docs/*` - Component documentation
- `/styleguide` - Design system reference

### API Routes
```
# Client CRUD
GET/POST          /api/clients
GET/PATCH/DELETE   /api/clients/[id]

# Knowledge Base
GET/POST          /api/clients/[id]/knowledge
DELETE            /api/clients/[id]/knowledge/[entryId]
POST              /api/clients/[id]/knowledge/upload     # signed upload URL
POST              /api/clients/[id]/knowledge/scrape     # website scraper
POST              /api/clients/[id]/knowledge/compile    # AI compilation

# Mockups
GET/POST/PATCH    /api/clients/[id]/mockup
POST              /api/clients/[id]/mockup/generate      # AI config generation
POST              /api/clients/[id]/mockup/demo           # hardcoded demo config
POST              /api/clients/[id]/mockup/push           # push to Webflow CMS
POST              /api/clients/[id]/mockup/logo           # logo upload
GET               /api/clients/[id]/mockup/prompt         # get AI prompt + KB for clipboard

# Webflow
GET               /api/webflow/collection                 # collection schema inspector
GET               /api/webflow/script                     # minified population script

# Onboarding
GET/POST          /api/onboard/[slug]
POST              /api/onboard/[slug]/submit
POST              /api/onboard/config
POST              /api/onboard/analyze
POST              /api/onboard/scrape
POST              /api/onboard/upload
GET/POST          /api/onboard/submissions
POST              /api/onboard/submissions/[id]
```

## Database Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `clients` | Client records | id, first_name, last_name, business_name, email, phone, status |
| `client_knowledge_entries` | KB entries (notes, files, screenshots) | id, client_id, type, title, content, file_url, file_type |
| `client_knowledge_documents` | Compiled KB markdown | id, client_id, content, entry_ids_included[], last_compiled_at |
| `client_mockups` | Mockup configs + WF state | id, client_id, config (JSON), webflow_item_id, webflow_url, logo_url, status |
| `prompts` | System prompts for AI | id ("mockup-generator"), content |
| `icons` | Icon library | name, group_name, svg_content |
| `onboard_configs` | Onboarding form templates | id, client_slug, config (JSON), status, access_token |
| `onboard_submissions` | Form submissions | id, config_id, answers (JSON), file_urls (JSON), status, review_status |
| `page_css` | CSS storage | Used by CSS Manager tool |
| `gsap_presets` | GSAP animation presets | Used by GSAP Creator tool |

### Storage Buckets
- `client-uploads` - KB files (path: `{clientId}/{timestamp}-{filename}`)
- `mockup-assets` - Logos (path: `logos/{clientId}/{timestamp}-{filename}`)

## Auth System

**Supabase clients:**
- `src/lib/supabase/client.ts` - Browser client (`createBrowserClient`)
- `src/lib/supabase/server.ts` - Server client (`createServerClient` with cookie handling)
- `src/lib/supabase/admin.ts` - Admin client (service role key, bypasses RLS)

**Auth context** (`src/contexts/AuthContext.tsx`):
- `useAuth()` hook: user, session, isLoading, isAuthenticated
- Methods: signInWithGoogle, signInWithEmail, signUp, signOut, resetPassword

**Middleware** (`middleware.ts`): Guards protected routes, refreshes sessions.

## Provider Stack (layout.tsx)
```
ThemeProvider (next-themes, default: dark)
  AuthProvider (Supabase auth)
    ToastProvider (custom, duration: 5000ms)
      LenisProvider (smooth scroll)
        {children}
```

## Key Directories
```
src/
  app/           # Next.js App Router pages + API routes
  components/
    ui/          # Reusable UI components (Button, Modal, Tabs, Toast, etc.)
    clients/     # Client suite components
    onboard/     # Onboarding form components
    layout/      # Navbar
    sections/    # Hero, Footer
  lib/
    supabase/    # Supabase client configs
    clients/     # Client types, mockup utils, CSS builder, token estimator
    webflow/     # Webflow API functions (create/update/publish CMS items)
    onboard/     # Onboarding types and utilities
  config/        # Brand config, UI messages
  contexts/      # React contexts (Auth, DocSection)
scripts/         # mockup-populate.js (Webflow page script)
```
