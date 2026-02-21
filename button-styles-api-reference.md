# HSFX Button Styles API — Webflow App Reference

## Overview

The Button Styles API at `https://hsfx.dev/api/button-styles` serves all button animation CSS and configuration from Supabase. The Webflow app should fetch this data on load, let the user select animation styles per button type, inject the appropriate CSS, and provide copy functionality.

**Auth:** Include `x-api-key: YOUR_KEY` in the request header.
**CORS:** Enabled for all origins (`*`).

---

## API Response Shape

```
GET /api/button-styles
Headers: x-api-key: <key>
```

Returns this JSON structure:

```json
{
  "buttonMain": {
    "config": {
      "sourceAttribute": "data-animation-type",
      "targetAttribute": "data-wf--button-main--style",
      "buttonTypes": ["primary", "secondary", "text", "navbar", "dropdown"],
      "defaultAnimations": {
        "primary": "bgbasic",
        "secondary": "bgbasic",
        "text": "double-line",
        "navbar": "",
        "dropdown": "bgbasic"
      }
    },
    "defaultsCSS": "/* base styles that always apply to all button animations */...",
    "animations": {
      "bgfill": { "name": "bgfill", "css": ".button_wrap[data-animation-type=\"bgfill\"] { ... }" },
      "bgbasic": { "name": "bgbasic", "css": "..." },
      "double-line": { "name": "double-line", "css": "..." },
      "line": { "name": "line", "css": "..." },
      "slide": { "name": "slide", "css": "..." }
    }
  },
  "accessories": {
    "config": {
      "type": "accessory",
      "hasMapping": true,
      "sourceAttribute": "data-animation-type",
      "components": {
        "arrow": {
          "targetAttribute": "data-wf--button-arrow--variant",
          "wrapperClass": ".button_arrow_wrap",
          "variants": ["primary", "secondary"],
          "defaultAnimation": "bgbasic"
        },
        "close": {
          "targetAttribute": "data-wf--button-close--variant",
          "wrapperClass": ".button_close_wrap",
          "variants": ["primary", "secondary"],
          "defaultAnimation": "bgbasic"
        },
        "play": {
          "targetAttribute": "data-wf--button-play--variant",
          "wrapperClass": ".button_play_wrap",
          "variants": ["primary", "secondary"],
          "defaultAnimation": "bgbasic"
        }
      }
    },
    "defaultsCSS": "/* shared base styles for arrow/close/play accessories */...",
    "animations": {
      "arrow": {
        "slide": { "name": "slide", "css": ".button_arrow_wrap[data-animation-type=\"slide\"] { ... }" },
        "bgfill": { "name": "bgfill", "css": "..." },
        "bgbasic": { "name": "bgbasic", "css": "..." }
      },
      "close": {
        "slide": { "name": "slide", "css": "..." },
        "bgfill": { "name": "bgfill", "css": "..." },
        "bgbasic": { "name": "bgbasic", "css": "..." }
      },
      "play": {
        "slide": { "name": "slide", "css": "..." },
        "bgfill": { "name": "bgfill", "css": "..." },
        "bgbasic": { "name": "bgbasic", "css": "..." }
      }
    }
  },
  "footerLink": {
    "config": {
      "type": "footer-link",
      "hasMapping": false,
      "description": "Footer link hover animations"
    },
    "css": "/* footer link hover animation CSS */..."
  }
}
```

---

## How the Animation System Works

### Trigger Mechanism

All button animations use CSS custom properties as triggers — **not** JavaScript hover listeners. Webflow handles `:hover` states via interactions that toggle these CSS variables:

- `--_trigger---on`: `1` at rest, `0` on hover
- `--_trigger---off`: `0` at rest, `1` on hover

The CSS uses `calc()` with these variables to animate properties (transforms, color-mix, widths, etc.). This means the animations are entirely CSS-driven.

### Button Main

1. Each button has a `data-animation-type` attribute (e.g., `"bgbasic"`, `"slide"`)
2. The CSS selects via `.button_wrap[data-animation-type="bgbasic"]`
3. **Always inject `defaultsCSS` first** — it contains base transitions, hidden element positioning, and inactive link styles that all animations depend on
4. Then inject the specific animation CSS

**Available animations:** `bgfill`, `bgbasic`, `double-line`, `line`, `slide`

**Button types** (from config): `primary`, `secondary`, `text`, `navbar`, `dropdown` — each has a default animation mapping.

### Accessories (Arrow, Close, Play)

Each accessory component has its own wrapper class and animations:

| Component | Wrapper Selector | Animations |
|-----------|-----------------|------------|
| arrow | `.button_arrow_wrap` | slide, bgfill, bgbasic |
| close | `.button_close_wrap` | slide, bgfill, bgbasic |
| play | `.button_play_wrap` | slide, bgfill, bgbasic |

**Always inject `accessories.defaultsCSS` first**, then the specific component animation.

### Footer Link

Simple component — just inject `footerLink.css`. No animation selection needed.

---

## Building the Webflow App

### Recommended App Flow

```
1. Fetch /api/button-styles on load
2. Show UI with:
   - Button type selector (primary, secondary, text, etc.)
   - Animation picker per type (bgbasic, bgfill, slide, etc.)
   - Accessory animation pickers (arrow, close, play)
   - Preview of current selections
3. "Copy CSS" button that assembles the final output
4. "Copy Config" to export the mapping
```

### Assembling CSS Output

When the user has made their selections, combine CSS in this order:

```javascript
function assembleFinalCSS(data, selections) {
  const parts = [];

  // 1. Button main defaults (always included)
  parts.push(data.buttonMain.defaultsCSS);

  // 2. Selected button animations
  for (const [buttonType, animName] of Object.entries(selections.buttonMain)) {
    if (animName && data.buttonMain.animations[animName]) {
      parts.push(data.buttonMain.animations[animName].css);
    }
  }

  // 3. Accessory defaults (include if any accessories are used)
  if (Object.keys(selections.accessories).length > 0) {
    parts.push(data.accessories.defaultsCSS);
  }

  // 4. Selected accessory animations
  for (const [comp, animName] of Object.entries(selections.accessories)) {
    if (animName && data.accessories.animations[comp]?.[animName]) {
      parts.push(data.accessories.animations[comp][animName].css);
    }
  }

  // 5. Footer link (if included)
  if (selections.includeFooterLink) {
    parts.push(data.footerLink.css);
  }

  return parts.join("\n\n");
}
```

### Default Selections (from config)

Initialize the UI with these defaults from the API response:

```javascript
// Button main defaults
const buttonSelections = {};
for (const [type, anim] of Object.entries(data.buttonMain.config.defaultAnimations)) {
  buttonSelections[type] = anim; // e.g., { primary: "bgbasic", text: "double-line" }
}

// Accessory defaults
const accessorySelections = {};
for (const [comp, compConfig] of Object.entries(data.accessories.config.components)) {
  accessorySelections[comp] = compConfig.defaultAnimation; // e.g., { arrow: "bgbasic" }
}
```

---

## CSS Variable Dependencies

The button CSS references these design token variables (set by the Webflow site's theme):

```
--_button-style---text              (text color at rest)
--_button-style---text-hover        (text color on hover)
--_button-style---background        (bg color at rest)
--_button-style---background-hover  (bg color on hover)
--_button-style---transition-all    (transition duration in ms, e.g. 300)
--_button-style---transition-color  (color transition duration in ms)
--_trigger---on                     (1 at rest, 0 on hover)
--_trigger---off                    (0 at rest, 1 on hover)
```

These are NOT provided by the API — they come from the Webflow site's existing CSS variables.

---

## Quick Fetch Example

```javascript
const API_URL = "https://hsfx.dev/api/button-styles";
const API_KEY = "YOUR_API_KEY";

async function loadButtonStyles() {
  const res = await fetch(API_URL, {
    headers: { "x-api-key": API_KEY }
  });
  return res.json();
}

// Usage
const data = await loadButtonStyles();

// List available animations for button-main
const animationNames = Object.keys(data.buttonMain.animations);
// → ["bgfill", "bgbasic", "double-line", "line", "slide"]

// Get CSS for a specific animation
const bgbasicCSS = data.buttonMain.animations.bgbasic.css;

// Get all button types
const buttonTypes = data.buttonMain.config.buttonTypes;
// → ["primary", "secondary", "text", "navbar", "dropdown"]

// Get default animation for "primary"
const primaryDefault = data.buttonMain.config.defaultAnimations.primary;
// → "bgbasic"

// List accessory components
const accessoryNames = Object.keys(data.accessories.config.components);
// → ["arrow", "close", "play"]
```

---

## Data Inventory

| Component | Entry | Type | Description |
|-----------|-------|------|-------------|
| button-main | config | config | Button types, default animation mapping, data attributes |
| button-main | defaults | defaults | Base CSS for all button animations (transitions, hidden elements) |
| button-main | bgfill | animation | Background fills from bottom-left with circular reveal |
| button-main | bgbasic | animation | Simple background + text color crossfade |
| button-main | double-line | animation | Two underlines sliding in opposite directions |
| button-main | line | animation | Single underline scale animation |
| button-main | slide | animation | Text + icon slide (vertical, horizontal, diagonal variants) |
| accessory | config | config | Component mapping (arrow/close/play wrappers, variants) |
| accessory | defaults | defaults | Shared base CSS for all accessory animations |
| arrow | slide | animation | Arrow icon horizontal slide-through |
| arrow | bgfill | animation | Arrow container circular background reveal |
| arrow | bgbasic | animation | Arrow container color crossfade |
| close | slide | animation | Close icon vertical slide-through |
| close | bgfill | animation | Close container circular background reveal |
| close | bgbasic | animation | Close container color crossfade |
| play | slide | animation | Play icon horizontal slide-through |
| play | bgfill | animation | Play container circular background reveal |
| play | bgbasic | animation | Play container color crossfade |
| footer-link | config | config | Simple config (no mapping needed) |
| footer-link | defaults | defaults | Hover scale + color change animation |

---

## Management

Styles are managed at `https://hsfx.dev/tools/button-styles` (auth required). Any changes saved there are immediately available via the API. The API response is cached for 60s browser / 5min CDN.
