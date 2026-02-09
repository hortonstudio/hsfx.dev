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

## Design Principles

1. **Less is more** - When in doubt, remove it
2. **Whitespace is design** - Generous padding everywhere
3. **Subtle animations** - Glide, don't bounce
4. **Accent sparingly** - Blue only for interactive elements
5. **Typography carries the design** - Let text breathe
6. **Dark by default** - Never use pure black (#000) or white (#FFF)

---

## File Reference

```
src/
├── app/
│   ├── globals.css         # CSS variables, dot grid
│   └── layout.tsx          # Fonts, providers
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── CodeRain.tsx
│   │   ├── CursorGlow.tsx
│   │   ├── FloatingNodes.tsx
│   │   ├── GridBackground.tsx
│   │   └── PageTransition.tsx
│   └── sections/
│       ├── Hero.tsx
│       └── Footer.tsx
├── lib/
│   ├── animations.ts       # GSAP hooks
│   └── lenis-provider.tsx  # Smooth scroll
└── tailwind.config.ts      # Theme colors
```
