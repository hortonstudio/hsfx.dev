# Client Suite Reference

## Overview
The client suite manages client relationships through five tabs: Overview, Knowledge Base, Onboarding, Mockup, and Sitemap. The core flow is: gather knowledge → compile with AI → generate mockup config → push to Webflow. A parallel flow handles sitemap planning: generate sitemap with AI → edit in visual editor → share with client for feedback.

## Data Flow
```
Client Created
  → Add KB entries (notes, files, screenshots, website scrapes)
  → Compile KB with AI (Claude Haiku) → markdown document
  → Generate Mockup Config with AI (uses KB + system prompt + icon list)
  → Config saved as "draft"
  → Push to Webflow CMS → status becomes "active"
  → Live at https://{domain}/mockup/{slug}

  (Parallel) → Generate Sitemap with AI (uses KB + package tier + niche)
  → Edit in visual grid editor (auto-saves every 3s)
  → Share publicly → client comments → iterate
```

## Knowledge Base

### Entry Types
| Type | Description | Source |
|------|-------------|--------|
| `meeting_notes` | Text notes from meetings | Manual input (AddNotesModal) |
| `screenshot` | Image screenshots | Drag-drop file upload |
| `website_scrape` | Scraped website data | URL input → server scrape |
| `submission_summary` | Onboarding form summary | Generated from submissions |
| `file` | General file uploads | Drag-drop file upload |
| `other` | Miscellaneous | Manual |

### Compilation (POST /api/clients/[id]/knowledge/compile)
- Sends all entries to Claude Haiku 4.5 as multimodal content
- Priority ordering: `meeting_notes` first (marked `[PRIORITY NOTE]`), then text, then images
- Images sent as base64 or URL references (~5,000 tokens each)
- Output: compiled markdown stored in `client_knowledge_documents`
- Tracks `entry_ids_included[]` for incremental compilation
- Token usage stored in metadata for cost display

### Token Estimation (src/lib/clients/token-estimator.ts)
```
Text: ~4 chars per token
Images: 5,000 tokens each (Claude vision)
System prompt: ~450 tokens
Output estimate: 60% of input, capped at 4,096
Pricing: Input $0.80/MTok, Output $4.00/MTok
```

### File Upload
- Files uploaded to Supabase `client-uploads` bucket
- Path: `{clientId}/{timestamp}-{filename}`
- Images auto-compressed via `browser-image-compression` before upload
- Drag-drop supported with drag counter pattern for nested elements

## Mockup System

### MockupConfig Structure
```typescript
interface MockupConfig {
  master_json: MasterJSON;       // Dynamic content (navbar, footer, services, etc.)

  // Layout variants (Option fields in Webflow)
  navbar_variant: "Full" | "Full, no top" | "Island" | "Island, no top";
  footer_variant: "Minimal" | "Full";
  hero_variant: "Full Height, Left Align" | "Auto Height, Center Align" | "Text and Image 2 Grid";
  services_variant: "Three Grid" | "Sticky List";
  process_variant: "Sticky List" | "Card Grid";
  faq_variant: "Center" | "Two Grid";
  contact_variant: "Two Grid" | "Center";
  stats_benefits_visibility: "Statistics" | "Benefits";

  // Section content (text fields)
  hero_tag, hero_heading, hero_paragraph: string;
  hero_button_1_text, hero_button_2_text, hero_image: string;
  services_tag, services_heading, services_paragraph, services_button: string;
  process_tag, process_heading, process_paragraph, process_button: string;
  about_tag, about_heading, about_subheading: string;
  about_button_1, about_button_2, about_image: string;
  testimonials_tag, testimonials_heading, testimonials_paragraph: string;
  faq_tag, faq_heading, faq_paragraph: string;
  cta_tag, cta_heading, cta_paragraph, cta_button_1, cta_button_2: string;
  contact_tag, contact_heading, contact_paragraph: string;

  // Styling
  css: CSSConfig;
}
```

### MasterJSON (stored in config-json CMS field)
Contains all dynamic/repeatable content:
- `config` - logo, company name, email, phone, address, social links
- `navbar` - top bar visibility, nav links with dropdowns, CTA button
- `footer` - footer nav links, grouped footer sections
- `services.cards[]` - image_url, heading, paragraph (typically 3)
- `process.steps[]` - heading, paragraph, features[] (typically 3)
- `stats_benefits.cards[]` - icon_svg, heading, paragraph (always 4)
- `testimonials` - top_row[] and bottom_row[] (4 each) with review + name
- `faq.items[]` - question, answer pairs
- `contact.form` - input labels/placeholders, textarea, checkbox_text, submit_button

### Status Flow
```
(no config) → Generate/Demo → "draft" → Push to WF → "active"
                                  ↑                      |
                                  └── Regenerate ─────────┘
```

### Four UI States (MockupTab)
1. **No KB compiled** → Warning message, compile KB first
2. **KB exists, no config** → "Generate Config" (AI) or "Load Demo" buttons
3. **Config draft** → Config preview + "Push to Webflow" primary CTA
4. **Config active** → Config preview + Webflow URL + Re-push option

### Generation (POST /api/clients/[id]/mockup/generate)
1. Fetches system prompt from `prompts` table (id: "mockup-generator")
2. Fetches compiled KB from `client_knowledge_documents`
3. Fetches available icons from `icons` table
4. Sends to Claude Haiku 4.5 (max_tokens: 8192)
5. Parses JSON response, resolves `icon_name` → `icon_svg` from icons table
6. Saves config as "draft" (preserves existing webflow_item_id)

### Push (POST /api/clients/[id]/mockup/push)
Accepts optional body: `{ config?: MockupConfig, name?: string, slug?: string }`
- No config → reads from DB
- Custom name/slug → used for demo with collision avoidance
- Builds CSS style block, maps to WF fields, creates/updates CMS item, publishes
- Updates DB: webflow_item_id, webflow_url, status: "active"

### Logo Upload
- Uploaded to `mockup-assets` bucket at `logos/{clientId}/{timestamp}-{filename}`
- URL stored in `client_mockups.logo_url` AND `master_json.config.logo.src`
- Preserved across regeneration

## Onboarding System

### Question Types
`text`, `textarea`, `select`, `multi_select`, `file_upload`, `yes_no`, `yes_no_na`, `color_picker`, `color_confirm`, `brand_colors`, `tag_input`, `address`, `team_members`, `project_gallery`

### Flow
1. Admin creates config with questions, branding, welcome/completion messages
2. Client accesses `/onboard/{slug}` (email-gated)
3. Client fills form progressively, files uploaded to Supabase
4. Submission saved with answers + file_urls
5. Admin reviews in client detail page (Onboarding tab)

## Sitemap System

The sitemap tab provides AI-powered site structure planning with a visual grid editor. Full documentation in `docs/sitemap-system.md`.

### Quick Reference
- **Generation**: Claude Sonnet generates sitemap from KB + package tier + niche
- **Editor**: 3-tier grid layout (Home → Core → Resources → Legal) with zoom/pan
- **Auto-save**: 3-second debounce, Cmd+S for immediate save
- **Sharing**: Public URL at `/sitemap/[slug]` with optional commenting
- **Templates**: 3 package tiers with pre-built node structures
- **Data**: Stored in `client_sitemaps` table as JSONB (nodes, edges, viewport)

### Page Types
| Type | Color | Use |
|------|-------|-----|
| `home` | Blue (#60a5fa) | Homepage (always root, exactly one) |
| `static` | Violet (#a78bfa) | Standard pages (About, Contact, etc.) |
| `collection` | Emerald (#34d399) | CMS collection hubs (Services, Blog) |
| `collection_item` | Light emerald (#6ee7b7) | Individual CMS entries |
| `utility` | Amber (#fbbf24) | Legal pages (Privacy, Terms) |
| `external` | Purple (#c084fc) | External links |

## Client Page (src/app/clients/[id]/page.tsx)
- Fetches all data in parallel on mount (client, KB entries, KB doc, onboard configs, submissions, mockup, sitemap)
- Uses controlled Tabs (value/onValueChange) to prevent tab reset on data refresh
- Tab state synced with URL search params for browser navigation
- `initialLoadDone` ref prevents loading spinner on background refetches
- `fetchData()` called after mutations to refresh state silently
