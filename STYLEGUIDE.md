# HSFX Design System & Style Guide

> AI-friendly reference for consistent design across all HSFX development.
> Aesthetic: Linear.app meets Stripe.com - quiet, confident, minimal.

---

## 1. Colors

### Core Palette
| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Background | `#0A0A0A` | `bg-background` | Page background, primary surfaces |
| Surface | `#111111` | `bg-surface` | Elevated cards, hover states |
| Border | `#1A1A1A` | `border-border` | Default borders, dividers |
| Border Hover | `#2A2A2A` | `border-border-hover` | Hover state borders |

### Text Colors
| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Primary | `#FAFAFA` | `text-text-primary` | Headlines, important text |
| Secondary | `#BFBFBF` | `text-text-secondary` | Subheadings, body text |
| Muted | `#888888` | `text-text-muted` | Descriptions, labels |
| Dim | `#555555` | `text-text-dim` | Captions, disabled states |

### Accent
| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Accent | `#4A9EFF` | `bg-accent` / `text-accent` | CTAs, links, highlights |
| Accent Hover | `#6BB3FF` | `hover:bg-accent-hover` | Hover states |

### Status Colors (for future use)
| Name | Tailwind | Usage |
|------|----------|-------|
| Success | `bg-green-500` (#22C55E) | Active, complete |
| Warning | `bg-yellow-500` (#EAB308) | In progress, caution |
| Error | `bg-red-500` (#EF4444) | Errors, destructive |

### Opacity Patterns
```css
/* Background overlays */
rgba(74, 158, 255, 0.03)  /* Very subtle accent glow */
rgba(74, 158, 255, 0.08)  /* Mouse-following glow */
rgba(255, 255, 255, 0.03) /* Dot grid pattern */

/* Selection */
rgba(74, 158, 255, 0.3)   /* Text selection background */
```

---

## 2. Typography

### Font Stack
```css
--font-geist-sans    /* Body, UI - variable weight 100-900 */
--font-geist-mono    /* Code, technical */
--font-instrument-serif  /* Headlines, display */
```

### Scale
| Element | Classes | When to Use |
|---------|---------|-------------|
| Hero Headline | `font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.1] tracking-tight` | Main page hero only |
| Section Heading | `font-serif text-3xl md:text-4xl` | Section titles |
| Card Title | `font-medium text-xl md:text-2xl` | Card headings |
| Body Large | `text-lg md:text-xl text-text-muted leading-relaxed` | Hero subtitles, intros |
| Body | `text-text-secondary` | Standard body text |
| Small/Label | `text-sm text-text-muted` | Labels, metadata |
| Caption | `text-xs uppercase tracking-widest text-text-muted` | Status badges, tags |
| Code | `font-mono text-sm` | Code blocks, technical |

### Rules
- **Serif** (`font-serif`): Headlines and hero text only
- **Sans** (default): Everything else
- **Mono** (`font-mono`): Code, data, technical content
- Never use font weights above `medium` (500) except for emphasis

---

## 3. Spacing

### Section Padding
```css
py-section-sm  /* 5rem (80px) - mobile */
py-section     /* 10rem (160px) - desktop */

/* Usage: py-section-sm md:py-section */
```

### Container
```css
max-w-6xl mx-auto px-6  /* 1280px max, 24px horizontal padding */
```

### Component Spacing
| Context | Value | Class |
|---------|-------|-------|
| Card padding | 24px | `p-6` |
| Button padding | 12px × 24px | `px-6 py-3` |
| Grid gap | 24px | `gap-6` |
| Stack gap (tight) | 8px | `gap-2` |
| Stack gap (normal) | 16px | `gap-4` |
| Section margin | 64px | `mb-16` |

---

## 4. Animation

### GSAP Defaults
```typescript
// Fade up entrance
{ duration: 0.8, ease: "power3.out", y: 40, opacity: 0 }

// Stagger children
{ stagger: 0.1, duration: 0.6, ease: "power3.out" }

// Count up numbers
{ duration: 2, ease: "power2.out" }

// Scroll trigger
{ trigger: element, start: "top 85%" }
```

### Framer Motion Springs
```typescript
// Buttons/interactions
{ type: "spring", stiffness: 400, damping: 17 }

// Cursor/mouse following
{ damping: 30, stiffness: 150 }

// Background effects
{ damping: 50, stiffness: 100 }
```

### Hover States
```typescript
// Buttons
whileHover={{ scale: 1.02 }}
whileTap={{ scale: 0.98 }}

// Cards
hover: { borderColor: "#2A2A2A", backgroundColor: "#111111" }
transition: { duration: 0.2, ease: "easeOut" }
```

### Timing Guidelines
| Type | Duration |
|------|----------|
| Micro-interactions | 0.15-0.2s |
| Button/card hover | 0.2s |
| Entrance animations | 0.6-0.8s |
| Page transitions | 0.5s |
| Background loops | 10-30s |

### Easing
- **Entrances**: `power3.out` or `easeOut`
- **Exits**: `power2.in` or `easeIn`
- **Hover**: `easeOut`
- **Loops**: `easeInOut` or `linear`
- **Never use**: Bounce, elastic, or springy overshoots

---

## 5. Components

### Button Variants
```tsx
// Primary - accent background
<Button variant="primary">Action</Button>
// → bg-accent text-white rounded-lg px-6 py-3

// Ghost - transparent
<Button variant="ghost">Secondary</Button>
// → transparent text-text-secondary hover:text-text-primary
```

### Card Pattern
```tsx
<Card className="p-6">
  {/* 1px border, rounded-xl, hover border/bg shift */}
</Card>
```

### Input Fields (for future auth)
```css
/* Base input */
bg-background
border border-border rounded-lg
px-4 py-3
text-text-primary placeholder:text-text-dim
focus:border-accent focus:ring-1 focus:ring-accent
transition-colors

/* Error state */
border-red-500 focus:border-red-500 focus:ring-red-500
```

### Loading States
```tsx
// Spinner
<div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />

// Skeleton
<div className="bg-surface animate-pulse rounded-lg h-4" />
```

### Status Indicators
```tsx
// Live/pulsing dot
<span className="relative flex h-2 w-2">
  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
</span>

// Static status dot
<div className="w-1.5 h-1.5 rounded-full bg-green-500" />
```

---

## 6. Background Effects

### CodeRain
```typescript
{
  columns: 30,
  chars: ['0', '1', '<', '>', '{', '}', '/', '=', ':', ';', '[', ']', '(', ')'],
  opacity: 0.03-0.09,
  speed: 15-25s,
  delay: 0-8s,
  respawnInterval: 2000ms,
  color: "text-accent"
}
```

### GridBackground
```typescript
{
  gridSize: "80px 80px",
  lineOpacity: 0.015,
  mouseGlowSize: 600,
  mouseGlowOpacity: 0.04,
  ambientGlowDuration: [10s, 12s]
}
```

### FloatingNodes
```typescript
{
  count: 15,
  size: "1-3px",
  opacity: [0.1, 0.25, 0.1],
  duration: 20-45s,
  drift: { y: 20px, x: 10px }
}
```

### CursorGlow (desktop only)
```typescript
{
  dotSize: 6,
  dotOpacity: 0.6,
  glowSize: 80,
  glowOpacity: 0.03,
  spring: { damping: 30, stiffness: 150 }
}
```

---

## 7. Layout

### Z-Index Scale
| Layer | Value | Usage |
|-------|-------|-------|
| Background effects | `z-0` | Grid, nodes, rain |
| Content | `z-10` | Default content |
| Navbar | `z-50` | Fixed navigation |
| Cursor effects | `z-50` | Mouse glow |
| Modals/Overlays | `z-[100]` | Page transitions, modals |

### Responsive Breakpoints
```css
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### Common Responsive Patterns
```tsx
// Typography
text-5xl sm:text-6xl md:text-7xl lg:text-8xl

// Layout
grid-cols-1 md:grid-cols-2 lg:grid-cols-4

// Spacing
py-section-sm md:py-section
px-4 md:px-6

// Visibility
hidden md:block  /* Show on desktop only */
md:hidden        /* Hide on desktop */
```

---

## 8. Future Patterns

### Auth UI (Supabase)
```tsx
// Login/Signup container
<div className="max-w-md mx-auto p-8 bg-surface border border-border rounded-xl">
  <h1 className="font-serif text-2xl text-center mb-8">Sign In</h1>

  {/* Form fields use input styles from Section 5 */}

  <Button variant="primary" className="w-full">Continue</Button>

  <p className="text-sm text-text-muted text-center mt-4">
    Don't have an account? <a className="text-accent hover:text-accent-hover">Sign up</a>
  </p>
</div>
```

### Dashboard Layout
```tsx
// Sidebar + main content
<div className="flex min-h-screen">
  <aside className="w-64 border-r border-border p-6">
    {/* Navigation */}
  </aside>
  <main className="flex-1 p-8">
    {/* Content */}
  </main>
</div>
```

### API States
```tsx
// Loading
<Skeleton className="h-8 w-full" />

// Error
<div className="p-4 border border-red-500/50 bg-red-500/10 rounded-lg text-red-400">
  {error.message}
</div>

// Empty
<div className="text-center py-12 text-text-muted">
  No data available
</div>
```

### Toast Notifications
```tsx
// Success
<div className="bg-surface border border-green-500/50 rounded-lg p-4 flex items-center gap-3">
  <div className="w-2 h-2 rounded-full bg-green-500" />
  <span>Changes saved</span>
</div>

// Error
<div className="bg-surface border border-red-500/50 rounded-lg p-4">
  Something went wrong
</div>
```

---

## 9. Code Editor

Monaco-based VS Code-style editor for editing CSS, SVG, and other code.

### Usage
```tsx
import { CodeEditor } from "@/components/ui";

<CodeEditor
  value={cssCode}
  onChange={(value) => setCssCode(value)}
  language="css"
  height={300}
  filename="styles.css"
  onSave={(value) => saveToSupabase(value)}
/>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | required | Code content |
| `onChange` | `(value: string) => void` | - | Change handler |
| `language` | `"css" \| "svg" \| "html" \| "javascript" \| "typescript" \| "json"` | `"css"` | Syntax highlighting |
| `readOnly` | `boolean` | `false` | Disable editing |
| `height` | `string \| number` | `300` | Editor height |
| `minimap` | `boolean` | `false` | Show minimap |
| `lineNumbers` | `boolean` | `true` | Show line numbers |
| `filename` | `string` | - | Display filename in header |
| `onSave` | `(value: string) => void` | - | Ctrl+S callback |

### Features
- Auto-syncs with site dark/light theme
- Copy button, fullscreen toggle, save button
- Ctrl+S keyboard shortcut for saving
- Custom syntax themes matching site colors

---

## 10. Webflow-style Navigator

Tree navigator for component hierarchies with element/component/slot types.

### Usage
```tsx
import { WebflowNavigator, type TreeNode } from "@/components/ui";

const nodes: TreeNode[] = [
  {
    id: "body",
    label: "Body",
    type: "element",
    children: [
      { id: "header", label: "Header", type: "component" },
      { id: "content", label: "Content Slot", type: "slot" },
    ],
  },
];

<WebflowNavigator
  nodes={nodes}
  onSelect={(id, node) => console.log("Selected:", id, node)}
/>
```

### Node Types
| Type | Icon | Color | Description |
|------|------|-------|-------------|
| `element` | □ | white | Basic HTML elements |
| `component` | ⬡ | green-400 | Reusable components |
| `slot` | ⬚ (dashed) | green-400 | Component slots |

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `nodes` | `TreeNode[]` | required | Tree structure |
| `selectedId` | `string` | - | Initially selected node |
| `onSelect` | `(id: string, node: TreeNode) => void` | - | Selection handler |
| `title` | `string` | `"Navigator"` | Panel title |
| `onClose` | `() => void` | - | Show close button |
| `onPin` | `() => void` | - | Show pin button |

### Features
- Click to select nodes (selection state managed internally)
- Expand/collapse children with chevron icons
- Tree lines showing hierarchy
- Green accent for components and slots

---

## 11. Webflow-style Properties Panel

Property editor with multiple field types for visual editing interfaces.

### Usage
```tsx
import { WebflowProperties, type PropertySection } from "@/components/ui";

const sections: PropertySection[] = [
  {
    id: "settings",
    label: "Settings",
    defaultExpanded: true,
    fields: [
      { id: "text", label: "Button Text", type: "text", value: "Click me" },
      {
        id: "link",
        label: "Button Link",
        type: "link",
        value: { type: "url", url: "#", openIn: "this", preload: "default" },
      },
      {
        id: "animated",
        label: "Enable Animation",
        type: "toggle",
        value: true,
        helpText: "Shows tooltip on hover",
      },
    ],
  },
];

<WebflowProperties
  sections={sections}
  onChange={(fieldId, value) => console.log("Changed:", fieldId, value)}
/>
```

### Field Types
| Type | Description | Value Type |
|------|-------------|------------|
| `text` | Text input | `string` |
| `link` | Link config (type, URL, openIn, preload) | `LinkValue` |
| `select` | Dropdown select | `string` |
| `toggle` | Boolean true/false buttons | `boolean` |
| `segmented` | Two-option toggle (Visible/Hidden) | `string` |
| `slot` | Slot reference (shows Empty or content) | `string \| null` |
| `style` | Style selector dropdown | `string` |

### Features
- Collapsible sections (click header to toggle)
- Interactive state managed internally
- Tooltips on fields with `helpText`
- Link type selector with 6 icon options (url, page, section, email, phone, custom)

---

## Design Principles

1. **Less is more** - When in doubt, remove it
2. **Whitespace is design** - Generous padding everywhere
3. **Subtle animations** - Glide, don't bounce
4. **Accent sparingly** - Blue only for interactive elements
5. **Typography carries the design** - Let text breathe
6. **Dark by default** - Never use pure black (#000) or white (#FFF)

---

## 12. AI Agent Implementation Guide

> This section provides structured guidance for AI assistants to implement this design system on any platform.

### Quick Start Prompt

When redesigning a platform with this system, use this context:

```
You are implementing the HSFX design system - a minimal, dark-first aesthetic inspired by Linear.app and Stripe.com. The design is quiet, confident, and professional.

Core visual identity:
- Dark backgrounds (#0A0A0A primary, #111111 elevated surfaces)
- Subtle borders (#1A1A1A, 1px)
- Sky blue accent (#0EA5E9) for interactive elements only
- Serif headlines (Instrument Serif), sans-serif body (Geist)
- Generous whitespace and smooth, subtle animations
```

### CSS Variables (Copy-Paste Ready)

```css
:root {
  /* Backgrounds */
  --background: #0A0A0A;
  --surface: #111111;
  --surface-hover: #161616;

  /* Borders */
  --border: #1A1A1A;
  --border-hover: #2A2A2A;

  /* Text */
  --text-primary: #FAFAFA;
  --text-secondary: #BFBFBF;
  --text-muted: #888888;
  --text-dim: #555555;

  /* Accent */
  --accent: #0EA5E9;
  --accent-hover: #38BDF8;
  --accent-glow: rgba(14, 165, 233, 0.15);

  /* Status */
  --success: #22C55E;
  --warning: #EAB308;
  --error: #EF4444;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-glow: 0 0 20px var(--accent-glow);
}

/* Light theme override (optional) */
[data-theme="light"] {
  --background: #FAFAFA;
  --surface: #FFFFFF;
  --surface-hover: #F5F5F5;
  --border: #E5E5E5;
  --border-hover: #D4D4D4;
  --text-primary: #0A0A0A;
  --text-secondary: #404040;
  --text-muted: #737373;
  --text-dim: #A3A3A3;
}
```

### Component Recipes

#### Button (Primary)
```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--accent), #38BDF8);
  color: white;
  font-weight: 500;
  font-size: 14px;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px var(--accent-glow);
}

.btn-primary:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 16px var(--accent-glow);
}

.btn-primary:active {
  transform: scale(0.98);
}
```

#### Button (Ghost/Secondary)
```css
.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: transparent;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  background: var(--surface);
  border-color: var(--border-hover);
  color: var(--text-primary);
}
```

#### Card
```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  transition: all 0.2s ease;
}

.card:hover {
  border-color: var(--border-hover);
  background: var(--surface-hover);
}

.card-title {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.card-description {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.6;
}
```

#### Input Field
```css
.input {
  width: 100%;
  padding: 12px 16px;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.2s ease;
}

.input::placeholder {
  color: var(--text-dim);
}

.input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.input-error {
  border-color: var(--error);
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}
```

#### Modal/Dialog
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  z-index: 100;
}

.modal-content {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  max-width: 480px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
}

.modal-title {
  font-family: 'Instrument Serif', serif;
  font-size: 24px;
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}
```

#### Navigation Bar
```css
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: rgba(10, 10, 10, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-lg);
  z-index: 50;
}

.nav-link {
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: var(--text-primary);
}

.nav-link.active {
  color: var(--accent);
}
```

### Typography Classes

```css
/* Headlines - use serif font */
.heading-hero {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: clamp(3rem, 8vw, 5rem);
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

.heading-section {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: clamp(1.875rem, 4vw, 2.5rem);
  line-height: 1.2;
  color: var(--text-primary);
}

.heading-card {
  font-weight: 500;
  font-size: 1.25rem;
  color: var(--text-primary);
}

/* Body text - use sans-serif */
.body-large {
  font-size: 1.125rem;
  line-height: 1.7;
  color: var(--text-muted);
}

.body {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.body-small {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--text-muted);
}

/* Labels and captions */
.label {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-dim);
}
```

### Animation Patterns

```css
/* Fade up entrance */
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-up {
  animation: fadeUp 0.6s ease-out forwards;
}

/* Stagger children */
.stagger-children > * {
  opacity: 0;
  animation: fadeUp 0.5s ease-out forwards;
}

.stagger-children > *:nth-child(1) { animation-delay: 0s; }
.stagger-children > *:nth-child(2) { animation-delay: 0.1s; }
.stagger-children > *:nth-child(3) { animation-delay: 0.2s; }
.stagger-children > *:nth-child(4) { animation-delay: 0.3s; }
.stagger-children > *:nth-child(5) { animation-delay: 0.4s; }

/* Subtle pulse for status indicators */
@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse-subtle {
  animation: pulse-subtle 2s ease-in-out infinite;
}

/* Spin for loaders */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
```

### Implementation Checklist

When applying this design system, verify:

- [ ] **Colors**: Background is #0A0A0A, not pure black
- [ ] **Borders**: Using 1px borders with #1A1A1A, not box-shadows for separation
- [ ] **Typography**: Headlines use serif font, body uses sans-serif
- [ ] **Spacing**: Generous padding (24px+ for cards, 12px+ for buttons)
- [ ] **Accent Usage**: Blue (#0EA5E9) only on interactive elements (buttons, links, focus states)
- [ ] **Hover States**: Subtle scale (1.02) or border/background color shift, never dramatic
- [ ] **Animations**: 0.2s for hovers, 0.5-0.8s for entrances, ease-out timing
- [ ] **No pure black/white**: Darkest is #0A0A0A, lightest is #FAFAFA
- [ ] **Focus States**: Visible focus rings using accent glow
- [ ] **Loading States**: Use skeleton placeholders or subtle spinners

### Platform-Specific Notes

#### React/Next.js
- Use Tailwind CSS with custom theme in `tailwind.config.ts`
- Framer Motion for animations with spring physics
- CSS variables defined in `globals.css`

#### Vue
- Define CSS variables in root stylesheet
- Use Vue Transition for enter/leave animations
- Consider Headless UI for accessible components

#### Vanilla HTML/CSS
- Use CSS custom properties for theming
- Add `data-theme` attribute to `<html>` for theme switching
- Use CSS animations over JavaScript when possible

#### Figma/Design Tools
- Create color styles matching the palette
- Use Auto Layout with 24px gaps
- Set corner radius to 8-12px for most elements

### Common Mistakes to Avoid

1. **Too much accent color** - Blue should be rare and meaningful
2. **Harsh shadows** - Use subtle, diffused shadows or none
3. **Bouncy animations** - Keep animations smooth and professional
4. **Thin fonts** - Use 400+ weight, never ultra-light
5. **Cramped spacing** - When in doubt, add more whitespace
6. **Pure colors** - Always use slightly off-black/white values
7. **Inconsistent radii** - Stick to 8px for most, 12-16px for large containers
8. **Overusing effects** - One subtle background effect is enough

---

## File Reference

```
src/
├── app/
│   ├── globals.css         # CSS variables, dot grid
│   ├── layout.tsx          # Fonts, providers
│   └── styleguide/         # Component showcase
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── CodeBlock.tsx
│   │   ├── CodeEditor.tsx      # Monaco editor
│   │   ├── CodeRain.tsx
│   │   ├── CursorGlow.tsx
│   │   ├── FloatingNodes.tsx
│   │   ├── GridBackground.tsx
│   │   ├── Icons.tsx           # Icon library
│   │   ├── PageTransition.tsx
│   │   ├── Tooltip.tsx
│   │   ├── WebflowNavigator.tsx  # Tree navigator
│   │   ├── WebflowProperties.tsx # Property panel
│   │   └── index.ts            # Barrel exports
│   └── sections/
│       ├── Hero.tsx
│       └── Footer.tsx
├── lib/
│   ├── animations.ts       # GSAP hooks
│   └── lenis-provider.tsx  # Smooth scroll
└── tailwind.config.ts      # Theme colors
```
