# Architecture Reference

## Stack
- **Framework:** Next.js 14.2 (App Router), React 18, TypeScript 5
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **Styling:** Tailwind CSS 3.4, CSS custom properties for design tokens
- **Animation:** Framer Motion (UI), GSAP + ScrollTrigger (tools/scroll), Lenis (smooth scroll)
- **AI:** Anthropic Claude — Sonnet 4.5 for generation (mockups, sitemaps), Haiku 4.5 for KB compilation
- **CMS:** Webflow CMS API v2
- **UI Primitives:** Radix UI (@radix-ui/react-dialog, tabs, checkbox, radio, select, dropdown-menu, tooltip, switch)

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Supabase anon key (public)
SUPABASE_SECRET_KEY               # Supabase service role key (server only)
ANTHROPIC_API_KEY                 # Claude API key for AI generation
WEBFLOW_API_TOKEN                 # Webflow API bearer token
WEBFLOW_COLLECTION_ID             # Webflow CMS collection ID for mockups
WEBFLOW_SITE_DOMAIN               # e.g. "example.webflow.io" for mockup URLs
CSS_API_KEY                       # API key for CSS endpoint
ICONS_API_KEY                     # API key for Icons endpoint
BUTTON_STYLES_API_KEY             # API key for Button Styles endpoint
```

## Route Structure

### Public
- `/` - Landing page (Hero, GridBackground, FloatingNodes, CodeRain, CursorGlow)
- `/auth/callback` - OAuth callback (code exchange + redirect)
- `/client` - Client portal entry (auth-aware, shows onboard configs & submissions)
- `/onboard/[slug]` - Public onboarding form (email-gated)
- `/sitemap/[slug]` - Public sitemap viewer (read-only canvas + comments)

### Protected (auth required via middleware.ts)
- `/dashboard` - Main dashboard (quick links to docs, tools, client suite)
- `/clients` - Client list (search, create)
- `/clients/[id]` - Client detail hub (5 tabs: overview, knowledge, onboarding, mockup, sitemap)
- `/clients/[id]/onboard/[slug]` - Client onboarding form (dashboard context)
- `/clients/[id]/onboard/[slug]/preview` - Onboarding submission preview
- `/dashboard/onboard` - Onboarding config management
- `/dashboard/onboard/[slug]` - Onboard config editor
- `/dashboard/onboard/[slug]/preview` - Config preview
- `/tools/*` - Developer tools (11 tools — see Tools section)
- `/docs/*` - Component documentation (sidebar layout, dynamic slugs)
- `/styleguide` - Design system reference

### Tools
| Route | Tool | Purpose |
|-------|------|---------|
| `/tools/doc-generator` | Doc Generator | Extract component docs from Webflow |
| `/tools/yap` | Yap Capture | Guided questionnaire for component docs |
| `/tools/usage-editor` | Usage Editor | Markdown editor with live preview |
| `/tools/css-manager` | CSS Manager | CSS version control with backup history |
| `/tools/button-styles` | Button Styles | GSAP button animation editor |
| `/tools/icon-manager` | Icon Manager | SVG icon upload, organize, deploy |
| `/tools/attr-docs` | Attribute Docs | @hsfx/attr documentation editor |
| `/tools/gsap-creator` | GSAP Creator | Visual timeline editor with presets |
| `/tools/privacy-generator` | Privacy Generator | Template-based policy generator |
| `/tools/prompts` | AI Prompts | Central prompt management |
| `/tools/stock-images` | Stock Images | Browse and manage stock image library |

### API Routes
```
# Client CRUD
GET/POST          /api/clients
GET/PATCH/DELETE   /api/clients/[id]

# Knowledge Base
GET/POST          /api/clients/[id]/knowledge
PUT/DELETE        /api/clients/[id]/knowledge/[entryId]
POST              /api/clients/[id]/knowledge/upload     # signed upload URL
POST              /api/clients/[id]/knowledge/scrape     # website scraper
POST              /api/clients/[id]/knowledge/compile    # AI compilation
GET               /api/clients/[id]/knowledge/prompt     # compiled KB for AI prompts

# Mockups
GET/POST/PATCH    /api/clients/[id]/mockup
POST              /api/clients/[id]/mockup/generate      # AI config generation
POST              /api/clients/[id]/mockup/demo           # hardcoded demo config
POST              /api/clients/[id]/mockup/push           # push to Webflow CMS
POST              /api/clients/[id]/mockup/logo           # logo upload
POST              /api/clients/[id]/mockup/import         # import existing WF page
GET               /api/clients/[id]/mockup/prompt         # get AI prompt + KB for clipboard

# Sitemaps
GET/POST/PATCH    /api/clients/[id]/sitemap              # CRUD for client sitemap
POST              /api/clients/[id]/sitemap/generate      # AI generation via Claude Sonnet
GET/POST          /api/clients/[id]/sitemap/comments      # Sitemap comments

# Public Sitemap
GET               /api/sitemap/[slug]                     # Public sitemap fetch
GET/POST          /api/sitemap/[slug]/comments            # Public comment CRUD
PUT/DELETE        /api/sitemap/[slug]/comments/[commentId] # Edit/delete comment

# Webflow
POST              /api/webflow/collection                 # sync collection to WF CMS
POST              /api/webflow/script                     # deploy custom scripts

# Onboarding
GET/POST          /api/onboard/[slug]
POST              /api/onboard/[slug]/submit
POST              /api/onboard/config
POST              /api/onboard/analyze
POST              /api/onboard/scrape
POST              /api/onboard/upload
GET/PUT           /api/onboard/settings
GET/POST          /api/onboard/submissions
GET/PUT/DELETE    /api/onboard/submissions/[id]

# Documentation APIs
GET               /api/css                                # CSS library entries
GET               /api/icons                              # Icon library
GET               /api/button-styles                      # Button animation styles
GET               /api/attr-docs                          # @hsfx/attr docs
GET               /api/gsap-presets                       # GSAP animation presets

# Stock Images
GET/POST          /api/stock-images
GET/DELETE        /api/stock-images/[id]
POST              /api/stock-images/upload
POST              /api/stock-images/seed

# Seed & Demo
POST              /api/seed/cole                          # Seed demo data
POST              /api/demo                               # Create demo Webflow page
```

## Database Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `clients` | Client records | id, first_name, last_name, business_name, email, phone, status |
| `client_knowledge_entries` | KB entries (notes, files, screenshots) | id, client_id, type, title, content, file_url, file_type, metadata |
| `client_knowledge_documents` | Compiled KB markdown | id, client_id, content, entry_ids_included[], last_compiled_at, metadata |
| `client_mockups` | Mockup configs + WF state | id, client_id, config (JSONB), webflow_item_id, webflow_url, logo_url, status |
| `client_sitemaps` | Sitemap data + sharing | id, client_id, slug, title, package_tier, sitemap_data (JSONB), is_public, allow_comments, access_token, status |
| `sitemap_comments` | Sitemap comment threads | id, sitemap_id, node_id, section_name, parent_id, author_name, author_email, author_type, content, is_resolved |
| `prompts` | System prompts for AI | id ("mockup-generator", "sitemap-generator", etc.), content |
| `icons` | Icon library | name, group_name, svg_content, sort_order |
| `component_docs` | Dynamic component docs | slug, name, group, description, tree, properties, css, tokens, variants |
| `onboard_configs` | Onboarding form templates | id, client_slug, client_name, business_name, client_email, client_id, config (JSONB), status, access_token |
| `onboard_submissions` | Form submissions | id, config_id, client_slug, answers (JSONB), file_urls (JSONB), status, review_status, submitted_at |
| `page_css` | CSS entries + backups | id, name, group_name, css_content, sort_order |
| `gsap_presets` | GSAP animation presets | id, name, slug, category, config (JSONB), code_raw, code_minified, is_published |
| `stock_images` | Stock image library | id, name, category, image_url, width, height, sort_order |

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
  app/              # Next.js App Router pages + API routes
  components/
    ui/             # Reusable UI (Button, Modal, Tabs, Toast, Spinner, etc.)
    clients/        # Client suite (ClientCard, KnowledgeBase, MockupTab, etc.)
    sitemap/        # Sitemap system (Editor, GridView, Sidebar, Comments, etc.)
    onboard/        # Onboarding form (QuestionRenderer, question type components)
    gsap-creator/   # GSAP timeline editor (TimelineEditor, PropertyPanel, etc.)
    layout/         # Navbar
    sections/       # Landing page (Hero, Footer, Features, HowItWorks, etc.)
    auth/           # AuthModal, AuthForms, UserMenu, ProtectedRoute
    styleguide/     # ComponentShowcase, Sidebar
  lib/
    supabase/       # Supabase client configs (client, server, admin, middleware)
    clients/        # Client domain logic:
                    #   types.ts, sitemap-types.ts — type definitions
                    #   mockup-utils.ts — Webflow field builder
                    #   css-builder.ts — CSS custom property generator
                    #   token-estimator.ts — Claude token cost estimation
                    #   sitemap-utils.ts — node/edge factories, validation, transforms
                    #   sitemap-layout.ts — autoLayout() BFS positioning
                    #   sitemap-templates.ts — package tier 1/2/3 templates
                    #   sitemap-niche-prompts.ts — AI prompt addenda by niche
    webflow/        # Webflow CMS API (create/update/publish items)
    onboard/        # Onboarding types and niche prompts
    css-manager/    # CSS minification utilities
    gsap-creator/   # GSAP codegen, easing options, formatter
    animations.ts   # GSAP scroll hooks (useFadeUp, useStagger, etc.)
    lenis-provider.tsx  # Smooth scroll provider + useLenis hook
    image-compression.ts # Client-side image compression
    api/            # CORS utilities
  config/           # Brand config (brand.ts), UI messages (messages.ts)
  contexts/         # React contexts (Auth, DocSection)
  hooks/            # useActiveSection (IntersectionObserver)
docs/               # This documentation
scripts/            # mockup-populate.js (Webflow page script)
```
