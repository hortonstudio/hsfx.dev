# UI System Reference

## Design Tokens (CSS Custom Properties)

Defined in `src/app/globals.css`, extended in `tailwind.config.ts`.

### Colors
| Token | Tailwind Class | Light | Dark |
|-------|---------------|-------|------|
| `--background` | `bg-background` | `#FAFAFA` | `#0A0A0A` |
| `--surface` | `bg-surface` | `#FFFFFF` | `#111111` |
| `--border` | `border-border` | `#E5E5E5` | `#1A1A1A` |
| `--border-hover` | `border-border-hover` | `#D4D4D4` | `#2A2A2A` |
| `--text-primary` | `text-text-primary` | `#0A0A0A` | `#FAFAFA` |
| `--text-secondary` | `text-text-secondary` | `#525252` | `#BFBFBF` |
| `--text-muted` | `text-text-muted` | `#737373` | `#888888` |
| `--text-dim` | `text-text-dim` | `#A3A3A3` | `#555555` |
| `--accent` | `text-accent` / `bg-accent` | `#0EA5E9` | `#0EA5E9` |
| `--accent-hover` | `accent-hover` | `#0284C7` | `#38BDF8` |

### Fonts
- **Sans:** Geist Sans (variable, `font-sans`)
- **Mono:** Geist Mono (variable, `font-mono`)
- **Serif:** Instrument Serif (`font-serif`)

### CSS Class Conventions
```
Text:       text-text-primary, text-text-secondary, text-text-muted, text-text-dim
Background: bg-background, bg-surface
Border:     border-border, border-border-hover
Accent:     accent, accent-hover, accent-light
Buttons:    btn-gradient (primary), btn-outline-glow (outline), btn-ghost-glow (ghost)
```

## Component Library (src/components/ui/)

### Critical Gotchas

**1. Lenis Smooth Scroll Conflicts**
Lenis (`src/lib/lenis-provider.tsx`) hijacks native scroll. Any scrollable overlay (modal, sidebar, dropdown) MUST use `data-lenis-prevent` on the scrollable container:
```tsx
<div data-lenis-prevent className="overflow-y-auto max-h-[85vh]">
  {/* content */}
</div>
```
Without this, scroll wheel events inside modals/overlays won't work.

**2. Z-Index Layering**
| Layer | Z-Index | Components |
|-------|---------|------------|
| Modals/Dialogs | `z-50` | Modal, Select content, Dropdown, Tooltip |
| Toasts | `z-[60]` | ToastContainer |
| Page transition | `z-[100]` | PageTransition overlay |

Toast is intentionally higher than modals so notifications show above dialogs.

**3. Radix UI + Framer Motion**
Modal uses AnimatePresence with Radix Dialog. The pattern:
```tsx
<DialogPrimitive.Root open={open}>
  <AnimatePresence>
    {open && (
      <DialogPrimitive.Portal forceMount>
        <DialogPrimitive.Overlay asChild>
          <motion.div>{/* overlay + content */}</motion.div>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    )}
  </AnimatePresence>
</DialogPrimitive.Root>
```
`forceMount` is required for AnimatePresence exit animations to work.

**4. Controlled vs Uncontrolled Tabs**
Radix Tabs reset to `defaultValue` when unmounted. If parent re-renders cause unmount (e.g., `setLoading(true)` removes content), use controlled mode:
```tsx
const [activeTab, setActiveTab] = useState("overview");
<Tabs value={activeTab} onValueChange={setActiveTab}>
```
For data refresh without tab reset, use a ref to skip `setLoading(true)` after initial load:
```tsx
const initialLoadDone = useRef(false);
// In fetchData:
if (!initialLoadDone.current) setLoading(true);
// After load:
initialLoadDone.current = true;
```

**5. Body Overflow on Overlays**
ImageModal and DocSidebar manually set `document.body.style.overflow = "hidden"`. Radix Dialog does this automatically. Don't double-apply.

### Component Quick Reference

| Component | Radix Primitive | Key Props |
|-----------|----------------|-----------|
| `Button` | - | `variant: "primary" \| "ghost" \| "outline"`, `size: "sm" \| "md" \| "lg"` |
| `Input` | - | `variant: "default" \| "error" \| "success"`, `leftIcon`, `rightIcon` |
| `Modal` | `@radix-ui/react-dialog` | `open`, `onClose`, `title?`, `size: "sm" \| "md" \| "lg" \| "xl"` |
| `Tabs` | `@radix-ui/react-tabs` | Controlled: `value`, `onValueChange`. Components: `Tabs`, `TabList`, `Tab`, `TabPanel` |
| `Select` | `@radix-ui/react-select` | `options: {value, label}[]`, `onValueChange` |
| `Dropdown` | `@radix-ui/react-dropdown-menu` | `trigger`, `align: "start" \| "center" \| "end"` |
| `Tooltip` | `@radix-ui/react-tooltip` | `content`, `side: "top" \| "right" \| "bottom" \| "left"`, `delay` |
| `Checkbox` | `@radix-ui/react-checkbox` | `label?`, `description?` |
| `Radio` | `@radix-ui/react-radio-group` | `label?`, `description?` |
| `Switch` | `@radix-ui/react-switch` | `label?`, `size: "sm" \| "md" \| "lg"` |
| `Toast` | - | `useToast()` hook: `addToast({variant, title, description?})` |
| `Badge` | - | `variant: "default" \| "success" \| "warning" \| "error" \| "info"`, `dot?` |
| `Alert` | - | `variant: "info" \| "success" \| "warning" \| "error"`, `dismissible?` |
| `Spinner` | - | `size: "sm" \| "md" \| "lg"` |
| `Skeleton` | - | `variant: "text" \| "circular" \| "rectangular"` |
| `EmptyState` | - | `icon?`, `title`, `description?`, `action?` |
| `Progress` | - | `value`, `max?`, `variant?`, `animated?` |
| `CodeEditor` | Monaco Editor | `value`, `onChange`, `language`, `onSave?` |

### Toast Usage
```tsx
const { addToast } = useToast();
addToast({ variant: "success", title: "Done!" });
addToast({ variant: "error", title: "Failed", description: "Details here" });
```
Variants: `info`, `success`, `warning`, `error`. Auto-dismiss after 5s.

### Modal Usage
```tsx
<Modal open={isOpen} onClose={() => setIsOpen(false)} title="My Modal" size="lg">
  <div className="space-y-4">{/* content */}</div>
</Modal>
```
Max height 85vh with overflow scroll. Has `data-lenis-prevent` for Lenis compatibility.
