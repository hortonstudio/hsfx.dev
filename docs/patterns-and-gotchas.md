# Patterns & Gotchas

Hard-won lessons from this codebase. Read this before making changes.

## Scroll & Overlay Issues

### Lenis Smooth Scroll
The app uses Lenis (`src/lib/lenis-provider.tsx`) for smooth scrolling. Lenis hijacks native scroll events on the entire page.

**Rule:** Any scrollable overlay (modal, sidebar, popover) MUST have `data-lenis-prevent` on its scrollable container. Without it, scroll wheel events are captured by Lenis and the overlay won't scroll.

```tsx
// CORRECT - modal content scrolls
<motion.div data-lenis-prevent className="overflow-y-auto max-h-[85vh]">

// WRONG - scroll wheel does nothing inside this overlay
<motion.div className="overflow-y-auto max-h-[85vh]">
```

Components that already handle this:
- `Modal.tsx` - has `data-lenis-prevent` on content div
- `DocSidebar.tsx` - has `data-lenis-prevent` on mobile panel

### Z-Index Layers
```
z-50    → Modals, Dialogs, Select dropdowns, Tooltips
z-[60]  → Toasts (must be above modals)
z-[100] → PageTransition overlay
```
Never set a modal/dialog above `z-50` or toasts won't show over it.

### Body Overflow
Radix Dialog automatically prevents body scroll when open. Don't manually set `document.body.style.overflow = "hidden"` in Radix-based modals — it conflicts. ImageModal and DocSidebar do this because they're custom implementations, not Radix Dialog.

## Radix UI Patterns

### Controlled Tabs (Tab Persistence)
Radix Tabs with `defaultValue` resets when unmounted. If parent state changes cause a re-render that unmounts the Tabs component, the active tab resets.

**Solution:** Use controlled mode + skip loading on refetch:
```tsx
const [activeTab, setActiveTab] = useState("overview");
const initialLoadDone = useRef(false);

async function fetchData() {
  if (!initialLoadDone.current) setLoading(true);
  // ... fetch data ...
  initialLoadDone.current = true;
  setLoading(false);
}

<Tabs value={activeTab} onValueChange={setActiveTab}>
```

### Framer Motion + Radix Dialog
For exit animations to work with Radix Dialog, you need:
1. `<AnimatePresence>` wrapping the conditional render
2. `forceMount` on `<DialogPrimitive.Portal>`
3. `asChild` on Overlay and Content to use motion.div

## Webflow CMS Push

### Option Field Validation
Webflow Option fields are strict enums. Sending any value not in the allowed list causes a `Validation Error` and the entire push fails.

**Known option values (as of current Webflow collection):**
```
navbar-variant:    "Full" | "Full, no top" | "Island" | "Island, no top"
footer-variant:    "Full" | "Minimal"
hero-variant:      "Full Height, Left Align" | "Auto Height, Center Align" | "Text and Image 2 Grid"
services-variant:  "Three Grid" | "Sticky List"
process-variant:   "Sticky List" | "Card Grid"
faq-variant:       "Center" | "Two Grid"
contact-variant:   "Two Grid" | "Center"
statistics-benefits-visibility: "Statistics" | "Benefits"
```

Note: Some values contain commas (e.g., `"Full, no top"`). These are valid Webflow option names.

**If you add or rename options in Webflow**, you MUST update:
1. `src/lib/clients/types.ts` - TypeScript type definitions
2. `src/app/api/clients/[id]/mockup/generate/route.ts` - AI prompt instructions AND default fallback values
3. `src/app/api/clients/[id]/mockup/demo/route.ts` - Demo config values

### Non-Existent Fields
Sending fields that don't exist in the Webflow collection also causes validation errors. Fields in our MockupConfig that are NOT in Webflow:
- `testimonials_tag` - internal only
- `testimonials_paragraph` - internal only
- `css` object - transformed to `css-override` field via `buildCssStyleBlock()`

### Image Fields
Image fields (`hero-image`, `about-image`, `cta-image`) should only be included in the push when they have a value. Empty strings cause validation errors for Image-type fields.

## AI Generation

### Token Estimation
Images cost ~5,000 tokens each in Claude's vision system. Don't estimate them as text (4 chars/token). The token estimator at `src/lib/clients/token-estimator.ts` handles this.

### Config Persistence
Generate and Push are separate operations. AI-generated configs are saved to DB as "draft" immediately. If a Webflow push fails, the config is NOT lost — the user can fix the issue and retry without re-running the AI (which wastes tokens and money).

### Icon Resolution
The AI generates `icon_name` references (e.g., `"star"`, `"shield"`). The generate route resolves these to actual SVG content from the `icons` table. If a name doesn't match, the field is left empty.

## File Uploads

### Image Compression
Files are compressed client-side via `browser-image-compression` before upload. The compression utility is at `src/lib/image-compression.ts`.

### Drag-Drop Pattern
The KnowledgeBase uses a drag counter pattern for nested elements:
```tsx
const dragCounter = useRef(0);
onDragEnter: dragCounter.current++; setDragging(true);
onDragLeave: dragCounter.current--; if (dragCounter.current === 0) setDragging(false);
onDrop: dragCounter.current = 0; setDragging(false);
```
This prevents flickering when dragging over child elements.

### SSRF Protection
The website scrape endpoint (`/api/clients/[id]/knowledge/scrape`) blocks private/internal IP addresses to prevent SSRF attacks.

## State Management Patterns

### Silent Refetch
After mutations (create, update, delete), call `fetchData()` to refresh state without showing a loading spinner. The `initialLoadDone` ref pattern prevents the loading state from triggering on subsequent fetches.

### Optimistic UI
Toast notifications fire immediately on success. Data is refetched in background. No optimistic state updates — the refetch is fast enough.

### Error Handling
All API calls follow this pattern:
```tsx
try {
  const res = await fetch(url, options);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Fallback message");
  }
  const data = await res.json();
  addToast({ variant: "success", title: "Done" });
} catch (err) {
  addToast({
    variant: "error",
    title: "Failed",
    description: err instanceof Error ? err.message : "Unknown error",
  });
}
```

## Code Style

### CSS Classes
Always use design token classes, never raw colors:
```tsx
// CORRECT
className="text-text-primary bg-surface border-border"

// WRONG
className="text-white bg-gray-900 border-gray-700"
```

### API Route Params (Next.js 14 App Router)
Route params are async in Next.js 14:
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
}
```

### Supabase Client Selection
- Browser components: `createClient()` from `@/lib/supabase/client`
- Server components / API routes: `createClient()` from `@/lib/supabase/server`
- Bypassing RLS (admin operations): `createAdminClient()` from `@/lib/supabase/admin`
