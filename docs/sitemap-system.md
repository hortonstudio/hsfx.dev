# Sitemap System Reference

> AI-powered sitemap planning tool with 3-tier visual grid editor, structural tree view, public sharing, and client commenting.

## Architecture Overview

The sitemap system is a custom grid-based visual editor integrated into the client dashboard (Sitemap tab). It provides:
- **AI-powered generation** via Claude Sonnet with niche-specific prompts and package tier templates
- **3-tier visual grid layout** — Home → Core Pages → Resources → Legal
- **Dual-view editing** (grid canvas + structural tree)
- **Public sharing** at `/sitemap/[slug]` with commenting
- **Custom colors, section wireframes, SEO fields, collection item nesting, export**
- **Auto-save** with 3-second debounce + manual Cmd+S

---

## File Inventory

### Components (`src/components/sitemap/`)

| File | Purpose |
|------|---------|
| `SitemapTab.tsx` | Entry point — shows sitemap status, templates, triggers editor/generate |
| `SitemapEditor.tsx` | Main editor orchestrator — auto-save, keyboard shortcuts, state management |
| `SitemapGridView.tsx` | Grid canvas — 3-tier layout, zoom/pan, dot grid background, dynamic width |
| `SitemapGridCard.tsx` | Individual page card — type badge, sections wireframe, collection items, comments |
| `SitemapNode.tsx` | React Flow node renderer (card with type, status, sections, color) |
| `SitemapSidebarTabs.tsx` | Tabbed right panel (Details + Comments) with backdrop blur |
| `SitemapSidebarDetails.tsx` | Detail form — edit label, path, type, status, color, sections, SEO |
| `SitemapSidebar.tsx` | Sidebar wrapper (WIP — untracked) |
| `SitemapNodeComments.tsx` | Node-scoped comment thread for sidebar Comments tab |
| `SitemapTemplateCard.tsx` | Template card with stacked-card visual for collection pages |
| `SectionWireframe.tsx` | Visual section wireframe stack rendered inside cards |
| `SectionCommentPopover.tsx` | Inline popover for section-level comments on wireframe rows |
| `SitemapToolbar.tsx` | Top bar — save, add page, export, share, close |
| `SitemapStructuralView.tsx` | Tree view — search/filter, expand/collapse, stats, inline actions |
| `SitemapLegend.tsx` | Collapsible legend showing page type and status colors |
| `SitemapShareModal.tsx` | Share settings — public toggle, comments toggle, slug |
| `SitemapCommentPanel.tsx` | Comment list + form for public viewer feedback |
| `SitemapGenerateModal.tsx` | AI generation — tier, niche, custom prompt, JSON import |

### API Routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/clients/[id]/sitemap` | GET, POST, PATCH | CRUD for client sitemap |
| `/api/clients/[id]/sitemap/generate` | POST | AI generation via Claude |
| `/api/sitemap/[slug]` | GET | Public sitemap fetch (requires `is_public=true`) |
| `/api/sitemap/[slug]/comments` | GET, POST | Public comment CRUD |
| `/api/sitemap/[slug]/comments/[commentId]` | PATCH | Resolve/edit comment (auth required) |

### Libraries (`src/lib/clients/`)

| File | Purpose |
|------|---------|
| `sitemap-types.ts` | All TypeScript types and interfaces |
| `sitemap-utils.ts` | Node/edge factories, validation, transforms, `PAGE_TYPE_CONFIG` |
| `sitemap-layout.ts` | `autoLayout()` — hierarchical tree positioning algorithm |
| `sitemap-templates.ts` | Package tier 1/2/3 pre-built sitemap templates |
| `sitemap-niche-prompts.ts` | Niche-specific AI prompt addenda (contractor, medical, etc.) |

### Pages

| Route | File | Purpose |
|-------|------|---------|
| `/sitemap/[slug]` | `src/app/sitemap/[slug]/page.tsx` | Public viewer (read-only canvas/structure + comments) |
| `/clients/[id]` | Sitemap tab in client detail | Entry point for agency editing |

---

## Data Model

### Database Tables

**`client_sitemaps`**
- `id`, `client_id` (FK), `slug` (unique), `title`, `package_tier` (1/2/3)
- `sitemap_data` (JSONB — nodes, edges, viewport)
- `is_public`, `allow_comments`, `access_token`, `status` (draft/active/archived)
- `created_at`, `updated_at`

**`sitemap_comments`**
- `id`, `sitemap_id` (FK), `node_id` (nullable), `parent_id` (nullable for replies)
- `author_name`, `author_email`, `author_type` (agency/client/guest)
- `content`, `is_resolved`, `created_at`, `updated_at`

### Core Types

```typescript
type SitemapPageType = "home" | "static" | "collection" | "collection_item" | "utility" | "external"
type SitemapPageStatus = "planned" | "in_progress" | "complete" | "deferred"

interface SitemapPageData {
  label: string; path: string;
  pageType: SitemapPageType; status: SitemapPageStatus;
  description?: string; sections?: string[];
  seoTitle?: string; seoDescription?: string;
  collectionName?: string; estimatedItems?: number;
  color?: string; notes?: string; commentCount?: number;
}

// React Flow format (what we store)
interface SitemapNode { id: string; type: "sitemap-page"; position: {x,y}; data: SitemapPageData }
interface SitemapEdge { id: string; source: string; target: string; type?: string }
interface SitemapData { nodes: SitemapNode[]; edges: SitemapEdge[]; viewport: {x,y,zoom} }

// AI output format (flat with parentId)
interface AISitemapNode { id: string; label: string; path: string; pageType: SitemapPageType;
  parentId: string | null; description?: string; sections?: string[];
  seoTitle?: string; seoDescription?: string; collectionName?: string; estimatedItems?: number }
```

**Key:** AI outputs flat `AISitemapNode[]` with `parentId` references. These are transformed to React Flow `SitemapNode[]` + `SitemapEdge[]` via `aiNodesToSitemapNodes()` + `buildEdgesFromParentIds()`, then positioned via `autoLayout()`.

---

## Data Flows

### AI Generation
```
SitemapGenerateModal → POST /api/clients/[id]/sitemap/generate
  → Fetch client + compiled KB
  → Load system prompt (DB or fallback) + niche addendum
  → Claude Sonnet (8192 tokens)
  → Parse JSON → validateAndCleanAINodes() → aiNodesToSitemapNodes()
  → buildEdgesFromParentIds() → autoLayout()
  → Upsert to DB (status: "draft") → Return with usage stats
```

### Editor Auto-Save
```
User edits → onChange handlers → scheduleSave() (3s debounce)
  → PATCH /api/clients/[id]/sitemap → DB updates → lastSaved timestamp
  → Cmd+S or Close: immediate save (cancels debounce)
```

### Public Viewing + Comments
```
/sitemap/[slug] → GET /api/sitemap/[slug] (requires is_public)
  → Canvas or Structure view (read-only)
  → Comments: GET + poll every 30s → POST to add
```

---

## Grid View Architecture

The primary editor view is a custom 3-tier grid layout (`SitemapGridView.tsx`), not a free-form React Flow canvas.

### Component Hierarchy
```
SitemapEditor (root — fullscreen overlay)
├── SitemapToolbar (top bar: title, save status, export, share, close)
├── SitemapGridView (main canvas: zoom/pan, grid cards, tier headers)
│   ├── Tier Sections (Home → Core → Resources → Legal)
│   │   └── SitemapGridCard (per-page card)
│   │       ├── Type badge + status indicator
│   │       ├── SectionWireframe stack (visual section rows)
│   │       ├── SectionCommentPopover (inline comments)
│   │       └── Collection items list (collapsed, up to 8 visible)
│   └── Zoom/Pan controls (mouse wheel, keyboard, touch)
└── SitemapSidebarTabs (right panel when node selected)
    ├── Details tab (edit label, path, type, status, sections, SEO, color)
    └── Comments tab (node-scoped comment thread)
```

### 3-Tier Layout (`buildGridLayout`)
Pages are sorted into tiers based on type and parent relationships:
1. **Home** — The single home page
2. **Core Pages** — Direct children of home: About, Services, Contact, etc.
3. **Resources** — Deeper pages: Blog, Gallery, FAQ, Testimonials, etc.
4. **Legal** — Utility pages: Privacy Policy, Terms of Service, etc.

Each tier displays cards in a single horizontal row. Canvas width is computed dynamically from the widest tier (maxCols × 300px + gaps + padding).

### Collection Collapse
Collection items (e.g., individual service pages) are **embedded into their parent collection card** rather than rendered as separate nodes:
- `collapseCollectionItems()` moves `collection_item` nodes into parent's `data.collectionItems[]`
- Cards show up to 8 items inline with an expandable list
- Reduces visual clutter while preserving the full hierarchy

### Zoom & Pan
- Default zoom: `0.65` (zoomed out to show full sitemap)
- Range: `0.3` – `1.5`
- Zoom toward cursor position
- Pan clamped to prevent infinite scrolling
- Touch support: two-finger zoom/pan
- Dot grid background at 24px intervals

### State Management
```
nodes, edges           — React state (mutable via handlers)
selectedNodeId         — Current card selection
dirtyRef.current       — Boolean — tracks unsaved changes
saveTimeoutRef         — 3-second debounce timer
comments[]             — Fetched, polled every 30s
commentCounts Map      — Computed per-node from live comments
```

---

## Key Behaviors

### Editor Keyboard Shortcuts
- `Cmd+S` / `Ctrl+S` — Manual save
- `Delete` / `Backspace` — Delete selected node (not in input fields)

### Page Type Colors (brightened for dark background contrast)
| Type | Color | Hex | Icon |
|------|-------|-----|------|
| `home` | Blue 400 | `#60a5fa` | House |
| `static` | Violet 400 | `#a78bfa` | FileText |
| `collection` | Emerald 400 | `#34d399` | Database |
| `collection_item` | Emerald 300 | `#6ee7b7` | File |
| `utility` | Amber 400 | `#fbbf24` | Settings |
| `external` | Violet 500 | `#c084fc` | ExternalLink |

Custom `color` field overrides type color everywhere (node card, structural view, minimap).

### Tier Colors (grid section headers)
| Tier | Color | Gradient To | Label |
|------|-------|-------------|-------|
| Home | `#60a5fa` | `#a5b4fc` | "Home" |
| Core | `#a78bfa` | `#c4b5fd` | "Core Pages" |
| Resources | `#22d3ee` | `#67e8f9` | "Resources & More" |
| Legal | `#fbbf24` | `#fde68a` | "Legal & Other" |

### Validation (`validateAndCleanAINodes`)
1. Deduplicates by id
2. Ensures exactly 1 home page
3. Validates `pageType` values (invalid → "static")
4. Checks `parentId` references (orphans → "home")
5. Normalizes paths (lowercase, leading `/`, no trailing `/`)
6. Deduplicates sections
7. Generates fallback SEO title/description if missing

### Layout Algorithm (`autoLayout`)
- BFS from root nodes to assign levels
- Computes subtree widths for centering
- Positions children below parents with configurable gaps
- Handles orphaned nodes at the end

---

## Audit: Known Issues & Gaps

### Critical Bugs

| Issue | Location | Impact |
|-------|----------|--------|
| JSON export missing `parentId` field | `SitemapEditor.tsx` handleExport | Can't re-import exported JSON |
| Silent failure on comment post | `SitemapCommentPanel.tsx` catch block | User doesn't know comment failed |
| Viewport reset to 0,0 on every save | `SitemapEditor.tsx` saveToApi | Loses user zoom/pan position |
| No max page validation in AI gen | `generate/route.ts` | Could generate 1000+ pages |

### Missing Features vs. Competitors

| Feature | Relume | Octopus | Slickplan | FlowMapp | HSFX |
|---------|--------|---------|-----------|----------|------|
| Undo/Redo | Y | Y | Y | Y | **N** |
| Drag-to-Reorder (tree) | Y | Y | Y | Y | **N** |
| Bulk Select/Move/Delete | Y | Y | Y | Y | **N** |
| Export PDF/PNG | Y | Y | Y | Y | **N** |
| CSV Import/Export | Y | Y | Y | Y | **N** |
| Version History | Y | Y | Y | N | **N** |
| Client Approval | Y | Y | N | N | **N** |
| Page Templates/Presets | N | Y | Y | Y | **N** |
| SEO Completeness Score | N | Y | Y | Y | **N** |
| Mobile Responsive | Y | Y | Y | Y | **N** |
| Right-Click Context Menu | Y | Y | Y | Y | **N** |

### Security Gaps
- `access_token` field exists but is never validated
- Comments accept any author name (no verification)
- No rate limiting on comment API
- No input sanitization on comment content

---

## Feature Roadmap

### Phase 1: Core Editor Upgrades (P0)

**1. Undo/Redo** — `useUndoRedo` hook tracking node/edge history stack. Toolbar buttons + Cmd+Z/Cmd+Shift+Z. Limit 50 entries. Foundation for safe editing.
- Modify: `SitemapEditor.tsx`, `SitemapToolbar.tsx`
- New: `src/hooks/useUndoRedo.ts`
- Complexity: M

**2. SEO Completeness Score** — Per-page score (0-100) based on filled fields. Aggregate in toolbar. Color-coded indicators on nodes.
- New: `sitemap-seo-score.ts`, `SitemapScoreSummary.tsx`, `SitemapSeoScoreCard.tsx`
- Modify: `SitemapSidebar.tsx`, `SitemapToolbar.tsx`, `SitemapNode.tsx`
- Complexity: S

**3. Page Templates/Presets** — "Add Page" becomes a dropdown: single pages (About, Contact, FAQ) and collections (Services + 3 items, Blog + 3 posts). Pre-populated sections + SEO.
- New: `sitemap-page-presets.ts`, `SitemapAddPageMenu.tsx`
- Modify: `SitemapEditor.tsx`, `SitemapToolbar.tsx`
- Complexity: M

### Phase 2: Power Editing (P0)

**4. Bulk Operations** — Multi-select via Cmd+Click, Shift+Click, box-select. Floating bulk bar for status/type change, delete. Checkbox column in structural view.
- New: `SitemapBulkBar.tsx`
- Modify: `SitemapEditor.tsx` (selectedNodeIds Set), `SitemapStructuralView.tsx`, `SitemapNode.tsx`, `SitemapSidebar.tsx`
- Complexity: L

**5. Drag-and-Drop Reparenting** — Drag nodes in structural view to reparent. Visual drop indicators, edge updates. Cycle detection to prevent invalid hierarchies.
- Modify: `SitemapStructuralView.tsx`, `SitemapEditor.tsx`
- Complexity: L

### Phase 3: Client Facing (P1)

**6. Client Approval Workflow** — "Approve" / "Request Changes" buttons in public viewer. Approval status badge in editor toolbar. DB fields: `approval_status`, `approved_by`, `approved_at`.
- New: `/api/sitemap/[slug]/approve/route.ts`
- Modify: `sitemap-types.ts`, `page.tsx` (public), `SitemapToolbar.tsx`, `SitemapTab.tsx`
- DB Migration needed
- Complexity: M

**7. Mobile-Responsive Public Viewer** — Default to structure view on mobile. Bottom sheet for detail panel. Full-screen comment panel. Larger touch targets.
- Modify: `page.tsx`, `SitemapStructuralView.tsx`, `SitemapCommentPanel.tsx`
- Complexity: S

### Phase 4: Differentiators (P2)

**8. PDF/Image Export** — Use React Flow's `toPng`/`toSvg` + `jspdf` for PDF. Export dropdown: PNG, PDF, SVG, JSON.
- New: `sitemap-export.ts`
- Modify: `SitemapToolbar.tsx`, `SitemapEditor.tsx`
- Complexity: S

**9. CSV Import/Export** — Export flat CSV with parent path references. Import with column mapping preview.
- New: `sitemap-csv.ts`, `SitemapImportModal.tsx`
- Complexity: M

**10. AI Page Suggestions** — "Suggest missing pages" analyzes current sitemap + KB via Claude. Panel with suggestions + "Add" buttons.
- New: `/api/clients/[id]/sitemap/suggest/route.ts`, `SitemapSuggestPanel.tsx`
- Complexity: M

**11. Version History** — Named snapshots, list view, preview, restore. New `sitemap_versions` DB table.
- New: `/api/clients/[id]/sitemap/versions/route.ts`, `SitemapVersionPanel.tsx`
- DB Migration needed
- Complexity: L

### Phase 5: Advanced (P3)

**12. Content Brief Generation** — Per-page AI-generated briefs (keywords, outline, word count, CTA, internal links). Stored in node data.

**13. XML Sitemap Export** — Generate proper `sitemap.xml` for SEO submission. User specifies domain.

**14. Content Inventory Tracking** — Checkboxes: copy written, reviewed, images added, page built. Dashboard overview.

**15. Wireframe Preview** — Auto-generate SVG wireframe thumbnails from sections list. Section-to-block mappings.

**16. Page Flow / User Journey** — Draw conversion flows between pages using custom edge types. "Flow Mode" toggle.

---

## Quick Wins (< 2 hours each)

1. **Fix JSON export** — Add `parentId` field by computing from edges
2. **Fix comment silent failures** — Add toast on error in catch block
3. **Add ARIA labels** — `aria-label` + `aria-expanded` on tree expand buttons
4. **Page limit warnings** — Show "X of ~Y pages" based on package tier
5. **Access token security** — Validate token in public endpoint for private sitemaps
6. **Sidebar path validation** — Auto-normalize path as user types
7. **Right-click context menu** — Delete, Duplicate, Add Child on canvas nodes
