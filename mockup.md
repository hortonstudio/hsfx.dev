# Mockup System: Sections Schema

---

## Hero

### CMS Fields

| Field | Type | Purpose |
|-------|------|---------|
| Hero Image | Image | Background image, uploaded to Webflow or pulled from Supabase |
| Hero Tag | Plain text | Small label above the heading |
| Hero Heading | Plain text | Main headline |
| Hero Paragraph | Plain text | Supporting subtext |
| Hero Button 1 Text | Plain text | Primary CTA button label |
| Hero Button 2 Text | Plain text | Secondary CTA button label |
| Hero Variant | Option | Controls which hero layout renders |

### Variants

| Option | Use Case |
|--------|---------|
| Full Height, Left Align | High impact, dramatic feel. Best for roofing, fencing, HVAC, any niche where a strong wide landscape job site photo sells itself. Use when the client has a great photo and you want the hero to dominate the first viewport. |
| Auto Height, Center Align | Same background image treatment but shorter and centered. More refined and balanced. Good for plumbing, electrical, or any niche where trust matters more than impact. Safer pick when image quality is uncertain since less of it is exposed. |
| Text and Image 2 Grid | Image and text side by side, not a background. Best for owner operated businesses where showing a face or crew photo matters. Works well with portrait style photos or before/after shots that would get cropped badly as a full bleed background. |

### Quirks and Rules

- Hero image comes from a Webflow image field or a Supabase URL set via JS
- All hrefs on hero buttons go to `#contact` since the goal is always to drive to the form
- Button 2 can be left empty, JS hides it if the field is blank
- Hero variant is handled by Webflow via the option field, no JS needed for layout switching

### Image Selection Logic (for AI)

When an AI is generating the mockup config, it should choose the hero image and variant based on client context signals:

- Niche + dramatic landscape job photo available → Full Height Left Align
- No strong photo or trust-focused niche → Auto Height Center Align  
- Owner operated or face/crew photo available → Text and Image 2 Grid

Images in Supabase are tagged with niche, visual type (crew, job site, aerial, residential, commercial, portrait), mood (bold, clean, warm), and which hero variants they work well in based on composition. AI matches client context signals against those tags to pick the best fit.

---

## Services

### CMS Fields

| Field | Type | Purpose |
|-------|------|---------|
| Services Variant | Option | Controls which layout renders (Three Grid or Sticky List) |
| Services Tag | Plain text | Small label above the heading |
| Services Heading | Plain text | Section heading |
| Services Paragraph | Plain text | Section subtext |
| Services Button | Plain text | Button label on each card (Three Grid only, links to #contact) |
| Services JSON | Plain text | JSON array of service cards |

### Variants

| Option | Use Case |
|--------|---------|
| Three Grid | Image-forward layout, 3 columns of cards each with a photo, heading, paragraph, and button. Use when the client has services that can be paired with niche images from Supabase. Most home services businesses qualify. Cards come in sets of 3 or 6 to fill the grid. |
| Sticky List | Split layout with the section heading sticky on the left and a stacked list of text-only cards on the right. Use when the client has a large number of services where images aren't the focus and thoroughness matters more than visual impact. Max 8 cards. |

### Key Structural Differences

**Three Grid** cards have a visual image area (`data-hs-mockup="visual"`) at the top of each card, heading, paragraph, and a primary button. Cards sit in a 3-column grid.

**Sticky List** cards are horizontal, text only with heading and paragraph, no image and no button. The section heading and paragraph sit sticky on the left while the cards stack on the right.

### JSON Schema

**Three Grid:**
```json
{
  "services": [
    {
      "image_url": "https://supabase-url/roofing/service-1.jpg",
      "heading": "Roof Replacement",
      "paragraph": "Full residential and commercial roof replacement with premium materials and a 10-year workmanship warranty."
    },
    {
      "image_url": "https://supabase-url/roofing/service-2.jpg",
      "heading": "Storm Damage Repair",
      "paragraph": "Fast response to hail and wind damage. We work directly with your insurance to make the process easy."
    },
    {
      "image_url": "https://supabase-url/roofing/service-3.jpg",
      "heading": "Free Inspections",
      "paragraph": "No-obligation roof inspections for homeowners after any major weather event."
    }
  ]
}
```

**Sticky List:**
```json
{
  "services": [
    {
      "heading": "Roof Replacement",
      "paragraph": "Full residential and commercial roof replacement with premium materials and a 10-year workmanship warranty."
    },
    {
      "heading": "Storm Damage Repair",
      "paragraph": "Fast response to hail and wind damage. We work directly with your insurance."
    },
    {
      "heading": "Free Inspections",
      "paragraph": "No-obligation inspections for homeowners after any major weather event."
    },
    {
      "heading": "Gutters and Downspouts",
      "paragraph": "Full gutter installation and replacement to protect your foundation and landscaping."
    }
  ]
}
```

Three Grid always 3 or 6 cards to fill the columns evenly. Sticky List can be 3 to 8. No image field on Sticky List cards.

### Element Patterns

**Three Grid cards** (`services-card-grid`):
- `[data-hs-mockup="visual"] .visual_image` — set `src` and `alt` for the card image
- `[data-hs-mockup="heading"]` — find the `h3` inside, set text content
- `[data-hs-mockup="paragraph"]` — find the `p` inside, set text content
- Button text comes from the `Services Button` CMS field, applied to all cards. Set `.button_text` and `.clickable_text` inside each card's button. Button links to `#contact`.

**Sticky List cards** (`services-card-list`):
- `[data-hs-mockup="heading"]` — find the `h3` inside, set text content
- `[data-hs-mockup="paragraph"]` — find the `p` inside, set text content
- No image, no button

**Section level** (outside the cards, inside the section container):
- `[data-hs-mockup="heading"]` directly in the content layout — find the `h2`, set text
- `[data-hs-mockup="paragraph"]` directly in the content layout — find the `p`, set text
- Tag text sits in `.tag_text p` — set text content directly

### Quirks and Rules

- Section mockup IDs are `services-three-grid` and `services-sticky-list` on the `<section>` element. Only one is visible at a time via the variant option field.
- Both sections use the same `Services Heading`, `Services Paragraph`, and `Services Tag` CMS fields since only one is visible.
- `Services Button` field only applies to Three Grid. If Sticky List is selected, the field is ignored.
- Image URLs for Three Grid come from the Supabase image library, selected by niche and service type at generation time on hsfx.dev.

---

## Process

### CMS Fields

| Field | Type | Purpose |
|-------|------|---------|
| Process Variant | Option | Controls which layout renders (Sticky List or Card Grid) |
| Process Tag | Plain text | Small label above the heading |
| Process Heading | Plain text | Section heading |
| Process Paragraph | Plain text | Section subtext |
| Process Button | Plain text | Button label on the sticky left side (Sticky List only, links to #contact) |
| Process JSON | Plain text | JSON array of process steps |

### Variants

| Option | Use Case |
|--------|---------|
| Sticky List | Split layout with heading and button sticky on the left, stacked horizontal cards on the right. Each card has a step number, heading, paragraph, and optional bullet point features. Best when steps need more detail or you want to show what's included in each step. |
| Card Grid | Centered heading above a 3-column grid of cards. Each card has a step number, heading, and short paragraph. Best for simple 3-step processes where brevity is the point. Feels cleaner and faster to scan. |

### Step Numbers

Both variants use `data-hs-mockup="icon-text"` for the step number, not an SVG icon slot. JS sets the text content of that element to the step number sequentially (1, 2, 3, etc.) based on array index. No icon needed.

### JSON Schema

**Sticky List:**
```json
{
  "steps": [
    {
      "heading": "Schedule Your Free Inspection",
      "paragraph": "We come to you and assess your roof at no cost. No pressure, no obligation.",
      "features": [
        "Same-day availability",
        "Full damage report included"
      ]
    },
    {
      "heading": "We Handle the Insurance Claim",
      "paragraph": "Our team works directly with your insurance adjuster so you don't have to.",
      "features": [
        "Direct adjuster communication",
        "Claim documentation provided"
      ]
    },
    {
      "heading": "Fast Professional Installation",
      "paragraph": "Most jobs completed in a single day with premium materials and a 10-year workmanship warranty.",
      "features": [
        "Single day completion",
        "10-year workmanship warranty"
      ]
    }
  ]
}
```

**Card Grid:**
```json
{
  "steps": [
    {
      "heading": "Schedule Inspection",
      "paragraph": "Book a free no-obligation roof inspection at a time that works for you."
    },
    {
      "heading": "Get Your Quote",
      "paragraph": "We assess the damage and provide a clear transparent quote same day."
    },
    {
      "heading": "We Get to Work",
      "paragraph": "Most jobs done in a single day. We clean up completely when we're done."
    }
  ]
}
```

Card Grid always 3 steps. Sticky List can be 2 to 4 steps. Features array is optional on Sticky List, omit it if there's nothing specific to highlight per step.

### Pairing Rule

Process variant is always chosen based on the Services variant to avoid two similar layouts appearing back to back on the page:

- Services = Three Grid → Process = Sticky List
- Services = Sticky List → Process = Card Grid

### Element Patterns

**Sticky List cards** (`process-card-list`):
- `[data-hs-mockup="icon-text"]` — set text content to step number (1, 2, 3 based on index)
- `[data-hs-mockup="heading"]` — find the `h3` inside, set text content
- `[data-hs-mockup="paragraph"]` — find the `p` inside, set text content
- `[data-hs-mockup="feature-item"]` — template feature items inside the card. Dupe from the first one, set `.feature_item_text` text content for each feature in the array. If features array is empty or omitted, remove all feature items from that card.

**Card Grid cards** (`process-grid-card`):
- `[data-hs-mockup="icon-text"]` — set text content to step number
- `[data-hs-mockup="heading"]` — find the `h3` inside, set text content
- `[data-hs-mockup="paragraph"]` — find the `p` inside, set text content

**Section level:**
- Tag: `.tag_text` — set text content
- `[data-hs-mockup="heading"]` directly in the content layout — find the `h2`, set text
- `[data-hs-mockup="paragraph"]` directly in the content layout — find the `p`, set text
- Process Button (Sticky List only): `.button_text` and `.clickable_text` inside the button group in the sticky left column. Links to `#contact`.

---

## About

### CMS Fields

| Field | Type | Purpose |
|-------|------|---------|
| About Tag | Plain text | Small label above the heading |
| About Heading | Plain text | Main section heading |
| About Subheading | Plain text | Supporting paragraph text |
| About Button 1 | Plain text | Primary button label, links to #contact |
| About Button 2 | Plain text | Secondary button label, links to #contact |
| About Image | Image | Photo on the right side of the layout |

### Layout

No variants. Always a two column split: text content on the left (tag, heading, subheading, two buttons), image on the right. Image comes from Webflow image field or a Supabase URL set via JS at generation time.

### Use Cases

Best image to use here is a crew photo, team photo, or owner portrait if available. Shows the human side of the business. If no people photo is available, a clean job site or completed work photo works. Pulled from Supabase niche image library at generation time.

Button 2 is a secondary style button. Both buttons link to `#contact`. If Button 2 text is left empty, JS hides it.

### Element Patterns

- Tag: `.tag_text` — set text content
- `[data-hs-mockup="heading"]` — find the `h2` inside, set text
- `[data-hs-mockup="paragraph"]` or equivalent subheading element — find the `p`, set text
- Button 1: `.button_text` and `.clickable_text` on the primary button
- Button 2: `.button_text` and `.clickable_text` on the secondary button, hide if field empty
- `[data-hs-mockup="visual"] .visual_image` — set `src` for the about image

---

## Statistics / Benefits

### CMS Fields

| Field | Type | Purpose |
|-------|------|---------|
| Statistics/Benefits Visibility | Option | Controls which section renders (Statistics or Benefits) |
| Statistics/Benefits (JSON) | Plain text | JSON string for all card content |

### When to Use Each

**Statistics** — use when real numbers are available from the client's existing site, Google profile, or notes. Examples: years in business, jobs completed, review count, cities served, response time guarantee. Never fabricate stats.

**Benefits** — use when no real stats are available. Fills the same visual slot with trust signals instead of numbers. Examples: Licensed and Insured, Free Estimates, Same Day Service, Satisfaction Guaranteed.

### Key Structural Difference

Both sections use the same card structure and the same mockup IDs (`stat-card` / `benefit-card`). The visual difference is:

- **Stat cards** have a transparent background so large numbers read as bold standalone figures against the section background. Heading uses h2 size to emphasize the number.
- **Benefit cards** have a solid card background so each item feels contained and readable. Heading uses h3 size since it's a label not a number.

The option field controls which section is visible. JS populates whichever one is showing from the same JSON field.

### JSON Schema

```json
{
  "cards": [
    {
      "icon": "icon-shield",
      "heading": "250+",
      "paragraph": "5-Star Reviews"
    },
    {
      "icon": "icon-clock",
      "heading": "12+",
      "paragraph": "Years in Business"
    },
    {
      "icon": "icon-map-pin",
      "heading": "20+",
      "paragraph": "Cities Served"
    },
    {
      "icon": "icon-check",
      "heading": "1,000+",
      "paragraph": "Jobs Completed"
    }
  ]
}
```

Always 4 cards. The grid is set to 4 columns on desktop and 2 on mobile so the count should stay at 4.

### Element Patterns

Each card (`stat-card` or `benefit-card`) contains:

- `[data-hs-mockup="icon-slot"]` — the icon container, replace the inner SVG with the correct icon from Supabase
- `[data-hs-mockup="heading"]` — contains the h3 tag, set its text content
- `[data-hs-mockup="paragraph"]` — contains the p tag, set its text content

The section heading (`[data-hs-mockup="heading"]` directly inside the section container, not inside a card) should also be set. For stats use something like "By the Numbers", for benefits use something like "Why Choose Us".

### Icon Flow

Icons are stored in Supabase as raw SVG strings with a `name` and `group_name` column. The Webflow page never touches Supabase directly.

Instead, hsfx.dev fetches the SVG content from Supabase at generation time by querying the icon by `name`, then embeds the full SVG string directly into the JSON under `icon_svg`. The Webflow page JS reads that field and injects the SVG string into `[data-hs-mockup="icon-slot"]`.

```json
{
  "cards": [
    {
      "icon_svg": "<svg xmlns=\"http://www.w3.org/2000/svg\">...</svg>",
      "heading": "250+",
      "paragraph": "5-Star Reviews"
    }
  ]
}
```

AI picks icons by `name` matched against card content, using `group_name` to narrow relevant options first. For home services, the `home-service` and `general` groups are the primary source before looking at others.

---

## FAQ

### CMS Fields

| Field | Type | Purpose |
|-------|------|---------|
| FAQ Variant | Option | Controls which layout renders (Center or Two Grid) |
| FAQ Tag | Plain text | Small label above the heading |
| FAQ Heading | Plain text | Section heading |
| FAQ Paragraph | Plain text | Section subtext |
| FAQ JSON | Plain text | JSON array of accordion items |

### Variants

| Option | Use Case |
|--------|---------|
| Center | Heading centered above the accordion list, narrow container. Clean and simple. Good default for most sites. |
| Two Grid | Heading and paragraph sticky on the left, accordion list on the right. Use when there are enough questions to justify a more structured layout or when you want the section to feel more substantial. |

### JSON Schema

```json
{
  "items": [
    {
      "question": "Do you offer free inspections?",
      "answer": "Yes, we offer completely free no-obligation roof inspections for homeowners across the Dallas area. We'll assess your roof and give you an honest report."
    },
    {
      "question": "How long does a roof replacement take?",
      "answer": "Most residential replacements are completed in a single day. Larger or more complex roofs may take two days. We always clean up completely before we leave."
    },
    {
      "question": "Do you work with insurance claims?",
      "answer": "Absolutely. We work directly with your insurance adjuster and handle all the documentation to make the process as easy as possible for you."
    }
  ]
}
```

3 to 8 items. Each item has a question and an answer.

### Element Patterns

- Tag: `.tag_text p` — set text content
- `[data-hs-mockup="heading"]` — find the `h2`, set text
- `[data-hs-mockup="paragraph"]` — find the `p`, set text
- `[data-hs-mockup="accordion-item"]` — template accordion item. Dupe from the first one for each item in the array. On each dupe:
  - `.accordion_toggle_text` — set question text
  - `.accordion_text` — set answer text
  - Remove `data-hs-accordion-open` attribute on all dupes except the first so they all start closed

---

## CTA

No JSON. All fields are plain text CMS fields hooked directly. No JS population needed for this section.

### CMS Fields

| Field | Type | Purpose |
|-------|------|---------|
| CTA Tag | Plain text | Small label above the heading |
| CTA Heading | Plain text | Main CTA headline |
| CTA Paragraph | Plain text | Supporting subtext |
| CTA Button 1 | Plain text | Primary button label, links to #contact |
| CTA Button 2 | Plain text | Secondary button label, links to #contact |

---

## Contact

### CMS Fields

| Field | Type | Purpose |
|-------|------|---------|
| Contact Variant | Option | Controls which layout renders (Two Grid or Center) |
| Contact Tag | Plain text | Small label above the heading |
| Contact Heading | Plain text | Section heading |
| Contact Paragraph | Plain text | Section subtext |
| Contact JSON | Plain text | JSON for form labels, placeholders, and submit button text |

Email, phone, and address all come from Config. No separate fields needed here.

### Variants

| Option | Use Case |
|--------|---------|
| Two Grid | Contact info (email, phone, address) on the left, form on the right. Use when the client has a physical location or wants their contact details prominently visible alongside the form. |
| Center | Centered heading above the form, narrow container, no contact info column. Use for service area businesses with no physical storefront or when keeping it simple. |

### Contact Info Element Patterns

These are only present in the Two Grid variant and are all populated from Config:

- `[data-hs-mockup="email"]` — set both `.button_text` nodes to `config.email`, set `.clickable_link` href to `mailto:{email}`
- `[data-hs-mockup="phone"]` — set both `.button_text` nodes to `config.phone`, set `.clickable_link` href to `tel:` version
- `[data-hs-mockup="address"]` — set both `.button_text` nodes to `config.address`, no link

### Form Structure

Both variants share the same form. The form has 4 inputs, 1 textarea, and 1 checkbox. Field order and names are fixed. What changes via JSON is the labels, placeholders, and the checkbox consent text.

**Fixed fields (by name attribute):**
- `name` — text input
- `phone` — tel input
- `email` — email input
- `address` — text input
- `notes` — textarea
- `consent-to-communicate` — checkbox

There is also a honeypot field (`name="company-name-clip"`, `class="is-clip"`) that is visually hidden for spam prevention. Do not touch it.

### JSON Schema

```json
{
  "inputs": {
    "name": { "label": "Name *", "placeholder": "Full Name" },
    "phone": { "label": "Phone *", "placeholder": "000-000-0000" },
    "email": { "label": "Email *", "placeholder": "email@email.com" },
    "address": { "label": "Service Address *", "placeholder": "1001 Main St. Dallas, TX" }
  },
  "textarea": {
    "notes": { "label": "Notes", "placeholder": "Tell us about your project..." }
  },
  "checkbox_text": "I consent to receive SMS & Emails from DFW Roofing Pro regarding their services.",
  "submit_button": "Get a Free Estimate"
}
```

### Form Element Patterns

- `[data-hs-mockup="form-input"]` — for each named input, find the `.form_label_text` inside and set the label text, then find the `input` inside and set the `placeholder` attribute
- `[data-hs-mockup="form-text-area"]` — find `.form_label_text` inside and set label, find `textarea` inside and set `placeholder`
- `[data-hs-mockup="form-checkbox"]` — find `.form_ui_text` inside and set the consent text (insert company name here)
- Submit button: `.button_text` and `.clickable_text` inside the form's submit button

### Quirks and Rules

- `contact-two-grid` has the contact info column (email, phone, address). `contact-center` does not. Both have the same form.
- Email, phone, and address all come from Config. The contact info column in Two Grid is populated the same way as the navbar top bar and footer contact list.
- The address field on the form is for the customer's service address, not the business address. The business address in the contact info column comes from `config.address`.
- Both the visible and `aria-hidden` `.button_text` elements on email and phone buttons need to be updated.


---

## CSS Customization

The CSS customization field in the Webflow CMS collection is a **Rich Text** field. Inside that rich text field, add an HTML embed block containing the `<style>` tag below. This is the only way to inject a style block through Webflow CMS — plain text fields won't work here. No JS needed, the browser applies it directly.

In the hsfx.dev generation flow, the `css` object from the master JSON is used to build this style block and write it into the Rich Text field via the Webflow REST API as an HTML embed node.

### Full Variable Reference

```html
<style>
  :root {
    /* Brand 1 — primary accent color (buttons, icon backgrounds, tag dots, selections) */
    --swatch--brand-1-500: #2563eb;
    --swatch--brand-1-400: color-mix(in srgb, #2563eb 80%, white);
    --swatch--brand-1-600: color-mix(in srgb, #2563eb 80%, black);
    --swatch--brand-1-text: #ffffff;
    --swatch--brand-1-o20: color-mix(in srgb, #2563eb 20%, transparent);

    /* Brand 2 — secondary accent color (used sparingly, must contrast with brand 1) */
    --swatch--brand-2-500: #f97316;
    --swatch--brand-2-400: color-mix(in srgb, #f97316 80%, white);
    --swatch--brand-2-600: color-mix(in srgb, #f97316 80%, black);
    --swatch--brand-2-text: #ffffff;
    --swatch--brand-2-o20: color-mix(in srgb, #f97316 20%, transparent);

    /* Dark swatches — used as backgrounds in dark theme */
    --swatch--dark-900: #000007;
    --swatch--dark-800: #141414;

    /* Light swatches — used as backgrounds in light theme */
    --swatch--light-100: #fafbfc;
    --swatch--light-200: #ebebeb;

    /* Border radius */
    --radius--main: 1.25rem;   /* cards, buttons, form fields, images */
    --radius--round: 9999px;   /* tags, icon slots — set to match radius--main for sharp/soft presets */

    /* Theme overrides — apply these to force dark theme without a body class */
    --_theme---background: var(--swatch--dark-900);
    --_theme---background-2: var(--swatch--dark-800);
    --_theme---text: var(--swatch--light-100);
    --_theme---border: color-mix(in srgb, var(--swatch--light-100) 20%, transparent);
    --_theme---text-faded: color-mix(in srgb, var(--swatch--light-100) 60%, transparent);
    --_theme---selection--background: var(--swatch--brand-1-600);
    --_theme---selection--text: var(--swatch--brand-1-text);
    --_theme---button-primary--background: var(--swatch--brand-1-500);
    --_theme---button-primary--text: var(--swatch--brand-1-text);
    --_theme---button-primary--background-hover: var(--swatch--light-100);
    --_theme---button-primary--text-hover: var(--swatch--dark-900);
  }
</style>
```

### Radius Presets

| Preset | radius--main | radius--round |
|--------|-------------|---------------|
| Sharp | 0rem | 0rem |
| Soft | 0.5rem | 0.5rem |
| Rounded (default) | 1.25rem | 9999px |

For Sharp and Soft, set `radius--round` to match `radius--main` so tags and icon slots don't look like pill shapes while everything else is angular.

### Light vs Dark Theme

For a light theme, only override the brand and radius variables. Leave the `--_theme---` variables out and the page defaults to light mode.

For a dark theme, include the `--_theme---` overrides in the same `:root` block. No body class needed. The theme variables remap backgrounds, text, borders, and button states entirely through CSS.

### Contrast Rules

These rules must be followed when generating any color config. Bad contrast breaks the whole mockup.

**Brand 1 (primary):**
- `brand-1-500` is used as the button background, icon background, and tag dot color
- `brand-1-text` is the text color placed on top of `brand-1-500` — must pass WCAG AA contrast (4.5:1 minimum). Use `#ffffff` for dark brand colors, `#000007` for light ones.
- `brand-1-500` must also be clearly visible against the page background. On a light theme (`light-100` background) the brand color needs enough contrast to read. Avoid very light brand colors on light theme.
- On dark theme, `brand-1-500` sits against `dark-900` — avoid very dark brand colors on dark theme.

**Brand 2 (secondary):**
- Must contrast clearly against `brand-1-500` since both may appear near each other
- Same `brand-2-text` contrast rule applies — text on top of brand 2 must be readable
- If no true secondary color is available from the client, derive one by lightening or darkening `brand-1-500` enough to create visible contrast, or use a neutral like a warm gray

**General:**
- Never use a brand color so close to `light-100` or `dark-900` that it disappears into the background
- When in doubt, a saturated mid-range color (500 level) on either theme is always safe

---

## Testimonials

### CMS Fields

| Field | Type | Purpose |
|-------|------|---------|
| Testimonials Tag | Plain text | Small label above the heading |
| Testimonials Heading | Plain text | Section heading |
| Testimonials Paragraph | Plain text | Subtext below heading, typically "* Verified Reviews from Google" |
| Testimonials JSON | Plain text | JSON array of review cards |

### Layout

No variant. Single layout: centered heading above a two-row marquee. Top row scrolls left, bottom row scrolls right. 4 cards per row, 8 total. The marquee JS engine auto-duplicates the card content for the infinite scroll effect, so JS only needs to populate the first `marquee_list` in each row (the ones without `aria-hidden="true"`).

### JSON Schema

```json
{
  "top_row": [
    {
      "review": "The crew showed up on time, knocked out our entire roof in one day, and cleaned up everything. Couldn't be happier with how it turned out.",
      "name": "James R."
    },
    {
      "review": "They handled our insurance claim from start to finish. Made the whole process easy and stress free. Highly recommend.",
      "name": "Maria T."
    },
    {
      "review": "Professional, fast, and honest. Got three quotes and these guys were the most upfront about what actually needed to be done.",
      "name": "Derek W."
    },
    {
      "review": "Had storm damage and they came out the next morning. Roof was done two days later. Great communication throughout.",
      "name": "Ashley M."
    }
  ],
  "bottom_row": [
    {
      "review": "Free inspection, no pressure, fair price. They found damage I didn't even know I had and worked directly with my insurance.",
      "name": "Chris P."
    },
    {
      "review": "Been in our home 12 years and this was the smoothest contractor experience we've ever had. Would absolutely call them again.",
      "name": "Sandra L."
    },
    {
      "review": "Showed up when they said they would, did exactly what they quoted, and left the yard cleaner than they found it.",
      "name": "Tony B."
    },
    {
      "review": "Great value, great crew. Our neighbors saw the work and already asked for their number. That says everything.",
      "name": "Rachel K."
    }
  ]
}
```

Keep review text consistent in character length across all 8 cards so the marquee rows look visually even. Aim for 120 to 160 characters per review. Short names keep the bold line tight and consistent.

Stars are hardcoded in the template as 5 SVG star icons. No star count field needed.

### Element Patterns

- Tag: `.tag_text p` — set text content
- `[data-hs-mockup="heading"]` — find the `h2`, set text
- `[data-hs-mockup="paragraph"]` on the section level — find the `p`, set subtext (the "* Verified Reviews" line)

For cards, only target `marquee_list` elements that do NOT have `aria-hidden="true"`. The aria-hidden ones are auto-duped by the marquee engine and should not be touched.

**Each `testimonial-card`** inside the non-hidden marquee lists:
- First `[data-hs-mockup="paragraph"]` — find the `p` inside, set the review text
- Second `[data-hs-mockup="paragraph"]` (has `u-weight-bold` class) — find the `p` inside, set the reviewer name

Dupe cards from the single template card in each row. Top row gets `top_row` array, bottom row gets `bottom_row` array. Always 4 cards per row.

---

## Config (Global)

Config holds shared data that the navbar, footer, and contact section all pull from. Prevents duplicating email and phone across multiple places. Lives in the master JSON under `config`.

### Element Patterns

**Logo** (`data-hs-mockup="logo"`)
- Find the `img` inside the wrapper, set `src` and `alt`
- Find `.clickable_link` inside the same wrapper, set href to `#`
- If `src` is empty, skip entirely — placeholder SVG stays in place
- Both navbar and footer use the same mockup ID so one value covers both

**Company** (`data-hs-mockup="company"`)
- Set text content directly on the element (plain text span in the copyright line)
- Both footer variants share this mockup ID

**Email** (`data-hs-mockup="email"`)
- Set both `.button_text` nodes to the email value (one visible, one `aria-hidden`)
- Set `.clickable_link` href to `mailto:{email}`

**Phone** (`data-hs-mockup="phone"`)
- Set both `.button_text` nodes to the phone display value
- Set `.clickable_link` href to `tel:` version with digits only
- Used in navbar top bar, footer contact list, and contact section

**Address** (`data-hs-mockup="address"`)
- Set both `.button_text` nodes to the address value
- No link — address button has no `clickable_link`

**Socials** (`[data-site-social="platform"]`)
- Set `.clickable_link` href inside each `[data-site-social]` wrapper
- Leave value as `""` to hide — CSS handles it: `[data-site-social]:has(a[href=""]) { display: none }`

---

## Navbar

Navbar variant is bound by Webflow CMS. JS handles nav links, top bar, and CTA text from the master JSON `navbar` key.

### JSON Schema

```json
{
  "top_bar": {
    "show": true,
    "map": { "show": true, "text": "Serving all of DFW", "href": "#service-area" }
  },
  "nav_links": [
    { "text": "About", "href": "#about" },
    { "text": "Services", "dropdown": [
      { "text": "Roof Replacement", "href": "#services" },
      { "text": "Storm Damage", "href": "#services" },
      { "text": "Inspections", "href": "#services" }
    ]},
    { "text": "Areas", "dropdown": [
      { "text": "Dallas", "href": "#areas" },
      { "text": "Fort Worth", "href": "#areas" }
    ]}
  ],
  "cta": { "text": "Get a Free Quote" }
}
```

Phone in the top bar is pulled from `config.phone` automatically. No need to include it here.

### Element Patterns

**Button text** — `.button_text` (two per button, both updated) and `.clickable_text` inside `.clickable_wrap` for screen reader text

**Button link** — `.clickable_link` if present, fall back to `.clickable_button`

### Quirks and Rules

- `top_bar.show: false` hides the entire top strip
- Map button (`navbar-top-button-map`): area tagline, links to `#service-area`
- Phone button (`navbar-top-button-phone`): from Config, set `.button_text` and `.clickable_link` href
- Neither top bar button gets duped — fill or hide only
- Nav links and dropdowns can be mixed in any order
- JS dupes from template elements, populates desktop and mobile simultaneously
- Template elements keep `data-hs-mockup`, clones get it removed
- Always one Services dropdown, Areas dropdown is optional — omit entirely if not needed
- Dropdown trigger: `navbar-dropdown-button`, items: `navbar-dropdown-item`
- Mobile is a completely separate DOM tree — must mirror all links in same order
- Mobile plain link template: `navbar-menu-button`
- Mobile CTA (`navbar-menu-cta`) always at the bottom, mirrors desktop CTA text
- CTA href is always `#contact`, hardcoded in JS — only text comes from JSON

---

## Footer

Footer variant is bound by Webflow CMS. JS handles footer_nav, footer_groups, and contact info from Config.

### JSON Schema

```json
{
  "footer_nav": [
    { "text": "Home", "href": "#" },
    { "text": "Services", "href": "#services" },
    { "text": "About", "href": "#about" },
    { "text": "Contact", "href": "#contact" }
  ],
  "footer_groups": [
    {
      "heading": "Site",
      "links": [
        { "text": "Home", "href": "#" },
        { "text": "About", "href": "#about" },
        { "text": "Contact", "href": "#contact" }
      ]
    },
    {
      "heading": "Services",
      "links": [
        { "text": "Roof Replacement", "href": "#services" },
        { "text": "Storm Damage", "href": "#services" },
        { "text": "Inspections", "href": "#services" }
      ]
    },
    {
      "heading": "Service Areas",
      "links": [
        { "text": "Dallas", "href": "#areas" },
        { "text": "Fort Worth", "href": "#areas" }
      ]
    }
  ]
}
```

Logo, company, phone, email, and socials all come from Config. The contact group in the full footer and the contact list in the minimal footer are both built automatically from Config — do not include them in the footer JSON.

### Quirks and Rules

- `footer_nav` — flat array of 4 to 6 links, populates `footer-minimal-main-list` (minimal variant only)
- `footer_groups` — 2 to 4 groups, each with `heading` and `links` array (full variant only)
- JS dupes `footer-group` elements, sets `footer_group_heading` text, populates `footer-link` items inside
- Omit Service Areas object entirely to remove that column
- Do not add a Contact group — JS appends it automatically from Config
- `data-hs-mockup="footer-link"` is on every link across both variants — always target by parent container first, then find footer links inside
- Clear existing template links from each list before populating
- Footer link text: `.footer_link_text` visible, `.clickable_text` for screen reader, `.clickable_link` for href

---

## Master CMS Field Reference

Fields marked **WF** are bound directly by Webflow CMS bindings — the JS ignores them. Fields marked **JS** are populated by the population script from the master JSON.

| Field | Slug | Type | Handler |
|-------|------|------|---------|
| Name | `name` | Plain text | WF |
| Slug | `slug` | Plain text | WF |
| Master JSON | `config-json` | Plain text | JS |
| CSS Override | `css-override` | Rich text | WF |
| Navbar Variant | `navbar-variant` | Option | WF |
| Footer Variant | `footer-variant` | Option | WF |
| Hero Variant | `hero-variant` | Option | WF |
| Hero Image | `hero-image` | Image | WF |
| Hero Tag | `hero-tag` | Plain text | WF |
| Hero Heading | `hero-heading` | Rich text | WF |
| Hero Paragraph | `hero-paragraph` | Rich text | WF |
| Hero Button 1 Text | `hero-button-1-text` | Plain text | WF |
| Hero Button 2 Text | `hero-button-2-text` | Plain text | WF |
| Services Variant | `services-variant` | Option | WF |
| Services Tag | `services-tag` | Plain text | WF |
| Services Heading | `services-heading` | Rich text | WF |
| Services Paragraph | `services-paragraph` | Rich text | WF |
| Services Button | `services-button` | Plain text | WF |
| Process Variant | `process-variant` | Option | WF |
| Process Tag | `process-tag` | Plain text | WF |
| Process Heading | `process-heading` | Rich text | WF |
| Process Paragraph | `process-paragraph` | Rich text | WF |
| Process Button | `process-button` | Plain text | WF |
| About Tag | `about-tag` | Plain text | WF |
| About Heading | `about-heading` | Rich text | WF |
| About Subheading | `about-subheading` | Rich text | WF |
| About Button 1 | `about-button-1` | Plain text | WF |
| About Button 2 | `about-button-2` | Plain text | WF |
| About Image | `about-image` | Image | WF |
| Statistics/Benefits Visibility | `statistics-benefits-visibility` | Option | WF |
| Testimonials Heading | `testimonials-heading` | Rich text | WF |
| FAQ Variant | `faq-variant` | Option | WF |
| FAQ Tag | `faq-tag` | Plain text | WF |
| FAQ Heading | `faq-heading` | Rich text | WF |
| FAQ Paragraph | `faq-paragraph` | Rich text | WF |
| CTA Tag | `cta-tag` | Plain text | WF |
| CTA Heading | `cta-heading` | Rich text | WF |
| CTA Paragraph | `cta-paragraph` | Rich text | WF |
| CTA Button 1 | `cta-button-1` | Plain text | WF |
| CTA Button 2 | `cta-button-2` | Plain text | WF |
| CTA Image | `cta-image` | Image | WF |
| Contact Tag | `contact-tag` | Plain text | WF |
| Contact Heading | `contact-heading` | Rich text | WF |
| Contact Paragraph | `contact-paragraph` | Rich text | WF |
| Contact Variant | `contact-variant` | Option | WF |

---

## AI Prompt Guide

### Where the Prompt Lives

The AI system prompt for mockup generation is stored as a row in Supabase, not hardcoded in the API route. The route fetches it at generation time so it can be updated without a redeploy.

Table: `prompts`
Row: `{ id: 'mockup-generator', content: '...full prompt...' }`

### Prompt Design Principles

The prompt needs to be both high quality and token efficient. Every section of this documentation that the AI needs to reference should be pre-digested into the prompt rather than passed as raw context. The AI should not need to re-read this whole doc at generation time.

**What to include in the system prompt:**
- The master JSON structure (the template above) so the AI knows exactly what shape to output
- The variant decision rules (e.g. services grid = process list, hero variant based on niche/photo type)
- The pairing rules (services Three Grid = process Sticky List and vice versa)
- The card count constraints (3 or 6 for services grid, max 8 for sticky list, always 4 for stats, always 8 for testimonials split 4/4)
- The color contrast rules (brand color must contrast against background, brand-1-text must contrast against brand-1-500)
- The radius preset options (sharp/soft/rounded) and what they map to
- The font options available (inter, geist, poppins, plus-jakarta-sans, outfit, dm-sans)
- Content length rules (testimonial reviews 120-160 chars, consistent length across all 8)
- The niche image selection logic (what signals map to which hero variant and image type)
- The brand 2 fallback rule (if no second brand color found, derive from brand 1)
- Theme default (light unless client is clearly a dark-brand company)

**What NOT to include in the prompt:**
- Raw HTML structure (the JS handles DOM targeting, AI doesn't need to know it)
- Element pattern details (also JS territory)
- The CSS variable full reference (just give the AI the simplified css object and let the JS build the style block)

**Prompt input from the user:**
The API route passes the compiled `client_knowledge_documents.content` markdown as the user message. The AI reads that and produces the complete master JSON in one response.

**Output format:**
Instruct the AI to respond with ONLY valid JSON matching the master template exactly, no preamble, no explanation, no markdown code fences. Parse it directly.

---

## JS Population Script Guide

### Where It Lives

The population script is stored as a minified JS file in Supabase storage at `public/mockup-script.min.js`. The Webflow page template has a script tag in the page's custom code (before `</body>`) that fetches and runs it:

```html
<script>
  fetch('https://your-supabase-url/storage/v1/object/public/scripts/mockup-script.min.js')
    .then(r => r.text())
    .then(code => eval(code));
</script>
```

This way the script can be updated in Supabase without touching the Webflow page. Alternatively paste the minified script directly into the Webflow page custom code if you want zero external dependency.

### What the Script Does

1. Reads the Webflow CMS page fields from the DOM (Webflow outputs CMS field values as data attributes or hidden elements on the page, or they can be embedded as a JSON object in a script tag)
2. Parses all JSON fields
3. Calls `window.hsfx.modules.normalize.dupe.destroy()` to clear existing dupe clones
4. Runs all population functions in order: config → navbar → footer → hero → services → process → about → stats/benefits → testimonials → faq → cta → contact → css
5. Calls `await window.hsfx.refresh()` to reinitialize all hsfx attribute handlers on the new DOM

### Script Architecture

```javascript
window.hsfx.ready(async () => {
  const data = getMockupData(); // reads from embedded JSON or CMS data attributes
  
  window.hsfx.modules.normalize.dupe.destroy();
  
  populateConfig(data.config);
  populateNavbar(data.navbar, data.config);
  populateFooter(data.footer, data.config);
  populateHero(data.hero);
  populateServices(data.services);
  populateProcess(data.process);
  populateAbout(data.about);
  populateStatsBenefits(data.stats_benefits);
  populateTestimonials(data.testimonials);
  populateFAQ(data.faq);
  populateCTA(data.cta);
  populateContact(data.contact, data.config);
  populateCSS(data.css);
  
  await window.hsfx.refresh();
});
```

### How CMS Data Gets Into the Script

One hidden div on the page holds the master JSON, bound to the `config-json` CMS plain text field:

```html
<div style="display: none;" data-hs-mockup="master-json">{ ...full JSON... }</div>
```

The script reads it with:

```javascript
function getMockupData() {
  const el = document.querySelector('[data-hs-mockup="master-json"]');
  if (!el) return null;
  try { return JSON.parse(el.textContent.trim()); } catch { return null; }
}
```

### What the JS Actually Handles

All section headings, tags, paragraphs, button text, variants, and images are bound directly by Webflow CMS bindings. The CSS Override rich text field is also bound natively. The JS only needs to handle things CMS bindings can't do — arrays, dynamic lists, and global shared data:

```json
{
  "config": {
    "logo": { "src": "", "alt": "" },
    "company": "",
    "email": "",
    "phone": "",
    "address": "",
    "socials": {
      "facebook": "", "instagram": "", "youtube": "",
      "tiktok": "", "x": "", "linkedin": "", "pinterest": ""
    }
  },
  "navbar": {
    "top_bar": {
      "show": true,
      "map": { "show": true, "text": "", "href": "#service-area" }
    },
    "nav_links": [],
    "cta": { "text": "" }
  },
  "footer": {
    "footer_nav": [],
    "footer_groups": []
  },
  "services": {
    "cards": []
  },
  "process": {
    "steps": []
  },
  "stats_benefits": {
    "cards": []
  },
  "testimonials": {
    "top_row": [],
    "bottom_row": []
  },
  "faq": {
    "items": []
  },
  "contact": {
    "form": {
      "inputs": {
        "name":    { "label": "Name *",            "placeholder": "Full Name" },
        "phone":   { "label": "Phone *",           "placeholder": "000-000-0000" },
        "email":   { "label": "Email *",           "placeholder": "email@email.com" },
        "address": { "label": "Service Address *", "placeholder": "1001 Main St. Dallas, TX" }
      },
      "textarea": {
        "notes": { "label": "Notes", "placeholder": "Tell us about your project..." }
      },
      "checkbox_text": "",
      "submit_button": "Get a Free Estimate"
    }
  }
}
```

### Building and Minifying

Build the script in a separate repo or file, minify with esbuild or terser, upload the `.min.js` to Supabase storage. Update the file in place whenever the script changes. The Webflow page always fetches the latest version.