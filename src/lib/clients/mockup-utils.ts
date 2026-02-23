import type { MockupConfig } from "./types";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
    "hero-heading": config.hero_heading,
    "hero-paragraph": config.hero_paragraph,
    "hero-button-1-text": config.hero_button_1_text,
    "hero-button-2-text": config.hero_button_2_text,
    "hero-variant": config.hero_variant,
    ...(config.hero_image ? { "hero-image": config.hero_image } : {}),
    "services-variant": config.services_variant,
    "services-tag": config.services_tag,
    "services-heading": config.services_heading,
    "services-paragraph": config.services_paragraph,
    "services-button": config.services_button,
    "process-variant": config.process_variant,
    "process-tag": config.process_tag,
    "process-heading": config.process_heading,
    "process-paragraph": config.process_paragraph,
    "process-button": config.process_button,
    "about-tag": config.about_tag,
    "about-heading": config.about_heading,
    "about-subheading": config.about_subheading,
    "about-button-1": config.about_button_1,
    "about-button-2": config.about_button_2,
    ...(config.about_image ? { "about-image": config.about_image } : {}),
    "statistics-benefits-visibility": config.stats_benefits_visibility,
    "testimonials-heading": config.testimonials_heading,
    "faq-variant": config.faq_variant,
    "faq-tag": config.faq_tag,
    "faq-heading": config.faq_heading,
    "faq-paragraph": config.faq_paragraph,
    "cta-tag": config.cta_tag,
    "cta-heading": config.cta_heading,
    "cta-paragraph": config.cta_paragraph,
    "cta-button-1": config.cta_button_1,
    "cta-button-2": config.cta_button_2,
    "contact-variant": config.contact_variant,
    "contact-tag": config.contact_tag,
    "contact-heading": config.contact_heading,
    "contact-paragraph": config.contact_paragraph,
  };
}
