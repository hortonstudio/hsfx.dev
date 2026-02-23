# Webflow CMS Integration Reference

## Overview
The mockup system pushes homepage configs to a Webflow CMS collection. Each client gets one CMS item containing all their homepage content and styling.

## API Functions (src/lib/webflow/index.ts)
```typescript
createCmsItem(fields)      // POST /v2/collections/{collectionId}/items
updateCmsItem(itemId, fields)  // PATCH /v2/collections/{collectionId}/items/{itemId}
publishCmsItem(itemId)     // POST /v2/collections/{collectionId}/items/{itemId}/publish
```
All use `WEBFLOW_API_TOKEN` bearer auth and `WEBFLOW_COLLECTION_ID`.

## CMS Collection Fields

### Option Fields (MUST match exact values)

| WF Field Slug | Type | Allowed Values |
|---------------|------|----------------|
| `navbar-variant` | Option | `Full` \| `Full, no top` \| `Island` \| `Island, no top` |
| `footer-variant` | Option | `Full` \| `Minimal` |
| `hero-variant` | Option | `Full Height, Left Align` \| `Auto Height, Center Align` \| `Text and Image 2 Grid` |
| `services-variant` | Option | `Three Grid` \| `Sticky List` |
| `process-variant` | Option | `Sticky List` \| `Card Grid` |
| `faq-variant` | Option | `Center` \| `Two Grid` |
| `contact-variant` | Option | `Two Grid` \| `Center` |
| `statistics-benefits-visibility` | Option | `Statistics` \| `Benefits` |

**CRITICAL:** Sending a value not in the allowed list causes a Webflow Validation Error and the push fails. These values are case-sensitive and some contain commas (e.g., `"Full, no top"`).

### Text Fields (PlainText)
| WF Field Slug | Config Property |
|---------------|----------------|
| `hero-tag` | `hero_tag` |
| `hero-button-1-text` | `hero_button_1_text` |
| `hero-button-2-text` | `hero_button_2_text` |
| `services-tag` | `services_tag` |
| `services-button` | `services_button` |
| `process-tag` | `process_tag` |
| `process-button` | `process_button` |
| `about-tag` | `about_tag` |
| `about-button-1` | `about_button_1` |
| `about-button-2` | `about_button_2` |
| `faq-tag` | `faq_tag` |
| `cta-tag` | `cta_tag` |
| `cta-button-1` | `cta_button_1` |
| `cta-button-2` | `cta_button_2` |
| `contact-tag` | `contact_tag` |

### RichText Fields
| WF Field Slug | Config Property |
|---------------|----------------|
| `css-override` | Built by `buildCssStyleBlock()` |
| `hero-heading` | `hero_heading` |
| `hero-paragraph` | `hero_paragraph` |
| `services-heading` | `services_heading` |
| `services-paragraph` | `services_paragraph` |
| `process-heading` | `process_heading` |
| `process-paragraph` | `process_paragraph` |
| `about-heading` | `about_heading` |
| `about-subheading` | `about_subheading` |
| `testimonials-heading` | `testimonials_heading` |
| `faq-heading` | `faq_heading` |
| `faq-paragraph` | `faq_paragraph` |
| `cta-heading` | `cta_heading` |
| `cta-paragraph` | `cta_paragraph` |
| `contact-heading` | `contact_heading` |
| `contact-paragraph` | `contact_paragraph` |

### Image Fields (conditional - only sent when value exists)
| WF Field Slug | Config Property |
|---------------|----------------|
| `hero-image` | `hero_image` |
| `about-image` | `about_image` |
| `cta-image` | Not in MockupConfig type yet |

### Special Fields
| WF Field Slug | Source |
|---------------|--------|
| `config-json` | `JSON.stringify(config.master_json)` |
| `css-override` | `buildCssStyleBlock(config.css)` |
| `name` | Business name or custom name |
| `slug` | Auto-generated or custom slug |

## Fields NOT in Webflow (internal only)
These exist in MockupConfig but are NOT sent to Webflow:
- `testimonials_tag` - No WF field exists
- `testimonials_paragraph` - No WF field exists
- `css` - Transformed to `css-override` via buildCssStyleBlock

## Field Mapping Function
`buildWebflowFields(config, name, slug, cssStyleBlock)` in `src/lib/clients/mockup-utils.ts` maps MockupConfig properties to WF field slugs. The mapping is kebab-case slugs to snake_case properties.

## CSS Builder (src/lib/clients/css-builder.ts)
`buildCssStyleBlock(css: CSSConfig)` generates a `<style>` block with CSS custom properties:
```css
:root {
  --swatch--brand-1-500: {brand_1};
  --swatch--brand-1-400: color-mix(in srgb, {brand_1} 80%, white);
  --swatch--brand-1-600: color-mix(in srgb, {brand_1} 80%, black);
  --swatch--brand-1-text: {brand_1_text};
  /* ... brand_2, dark, light variants ... */
  --radius--main: {0rem | 0.5rem | 1.25rem};  /* sharp | soft | rounded */
  --radius--round: {0rem | 0.5rem | 9999px};
}
```
Dark theme adds additional variable overrides.

## Population Script (scripts/mockup-populate.js)
~684 lines of vanilla JS that runs on the Webflow mockup page. It:
1. Reads master JSON from `[data-hs-mockup="master-json"]` hidden div
2. Populates all dynamic sections (navbar, footer, services, process, stats, testimonials, FAQ, contact)
3. Uses a duplication engine: clone template element, populate each clone, remove template
4. Depends on `window.hsfx.ready()` and `@hsfx/attr` library

The `/api/webflow/script` endpoint serves this minified and wrapped in `<script>` tags.

## Push Flow
```
MockupConfig (DB)
  → buildCssStyleBlock(config.css) → CSS style block
  → buildWebflowFields(config, name, slug, cssBlock) → WF field object
  → createCmsItem(fields) OR updateCmsItem(itemId, fields)
  → publishCmsItem(itemId)
  → Update DB: webflow_item_id, webflow_url, status: "active"
```
URL format: `https://{WEBFLOW_SITE_DOMAIN}/mockup/{slug}`

## Debug Tools
- **Collection Inspector** (`GET /api/webflow/collection`): Shows all fields with types and option values
- **WebflowDebugModal**: Collection inspector, demo push with custom name/slug, manual JSON paste+push, copy population script
- **Re-push**: Push existing config without regenerating
