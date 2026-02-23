import type { MockupConfig } from "./types";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Webflow RichText fields require proper HTML tags.
// If the value already contains HTML, pass it through as-is.
// Otherwise wrap in the appropriate tag.
function hasHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

function heading(text: string): string {
  if (!text) return "";
  return hasHtml(text) ? text : `<h2>${text}</h2>`;
}

function paragraph(text: string): string {
  if (!text) return "";
  return hasHtml(text) ? text : `<p>${text}</p>`;
}

export function buildWebflowFields(
  config: MockupConfig,
  name: string,
  slug: string,
  cssStyleBlock: string
): Record<string, unknown> {
  return {
    name,
    slug,
    "config-json": JSON.stringify(config.master_json),
    "css-override": cssStyleBlock,
    "navbar-variant": config.navbar_variant,
    "footer-variant": config.footer_variant,
    "hero-tag": config.hero_tag,
    "hero-heading": heading(config.hero_heading),
    "hero-paragraph": paragraph(config.hero_paragraph),
    "hero-button-1-text": config.hero_button_1_text,
    "hero-button-2-text": config.hero_button_2_text,
    "hero-variant": config.hero_variant,
    ...(config.hero_image ? { "hero-image": config.hero_image } : {}),
    "services-variant": config.services_variant,
    "services-tag": config.services_tag,
    "services-heading": heading(config.services_heading),
    "services-paragraph": paragraph(config.services_paragraph),
    "services-button": config.services_button,
    "process-variant": config.process_variant,
    "process-tag": config.process_tag,
    "process-heading": heading(config.process_heading),
    "process-paragraph": paragraph(config.process_paragraph),
    "process-button": config.process_button,
    "about-tag": config.about_tag,
    "about-heading": heading(config.about_heading),
    "about-subheading": paragraph(config.about_subheading),
    "about-button-1": config.about_button_1,
    "about-button-2": config.about_button_2,
    ...(config.about_image ? { "about-image": config.about_image } : {}),
    "statistics-benefits-visibility": config.stats_benefits_visibility,
    "testimonials-heading": heading(config.testimonials_heading),
    "faq-variant": config.faq_variant,
    "faq-tag": config.faq_tag,
    "faq-heading": heading(config.faq_heading),
    "faq-paragraph": paragraph(config.faq_paragraph),
    "cta-tag": config.cta_tag,
    "cta-heading": heading(config.cta_heading),
    "cta-paragraph": paragraph(config.cta_paragraph),
    "cta-button-1": config.cta_button_1,
    "cta-button-2": config.cta_button_2,
    "contact-variant": config.contact_variant,
    "contact-tag": config.contact_tag,
    "contact-heading": heading(config.contact_heading),
    "contact-paragraph": paragraph(config.contact_paragraph),
  };
}
