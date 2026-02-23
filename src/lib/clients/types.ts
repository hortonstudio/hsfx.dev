export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  business_name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "archived";
  created_at: string;
  updated_at: string;
}

export interface KnowledgeEntry {
  id: string;
  client_id: string;
  type:
    | "meeting_notes"
    | "screenshot"
    | "website_scrape"
    | "submission_summary"
    | "file"
    | "other";
  title: string;
  content: string;
  file_url: string;
  file_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeDocument {
  id: string;
  client_id: string;
  content: string;
  last_compiled_at: string | null;
  entry_ids_included: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ════════════════════════════════════════════════════════════
// MOCKUP TYPES
// ════════════════════════════════════════════════════════════

// ── Variant Types ──

export type NavbarVariant =
  | "Full"
  | "Full, no top"
  | "Island"
  | "Island, no top";

export type FooterVariant = "Minimal" | "Full";

export type HeroVariant =
  | "Full Height, Left Align"
  | "Auto Height, Center Align"
  | "Text and Image 2 Grid";

export type ServicesVariant = "Three Grid" | "Sticky List";

export type ProcessVariant = "Sticky List" | "Card Grid";

export type FAQVariant = "Center" | "Two Grid";

export type ContactVariant = "Two Grid" | "Center";

export type StatsBenefitsVisibility = "Statistics" | "Benefits";

export type RadiusPreset = "sharp" | "soft" | "rounded";

// ── Master JSON (lives in config-json CMS field) ──

export interface MasterJSONConfig {
  logo: { src: string; alt: string };
  company: string;
  email: string;
  phone: string;
  address: string;
  socials: {
    facebook: string;
    instagram: string;
    youtube: string;
    tiktok: string;
    x: string;
    linkedin: string;
    pinterest: string;
  };
}

export interface MasterJSONNavbar {
  top_bar: {
    show: boolean;
    map: { show: boolean; text: string; href: string };
  };
  nav_links: Array<
    | { text: string; href: string }
    | { text: string; dropdown: Array<{ text: string; href: string }> }
  >;
  cta: { text: string };
}

export interface MasterJSONFooter {
  footer_nav: Array<{ text: string; href: string }>;
  footer_groups: Array<{
    heading: string;
    links: Array<{ text: string; href: string }>;
  }>;
}

export interface ServiceCard {
  image_url?: string;
  heading: string;
  paragraph: string;
}

export interface ProcessStep {
  heading: string;
  paragraph: string;
  features?: string[];
}

export interface StatBenefitCard {
  icon_svg: string;
  heading: string;
  paragraph: string;
}

export interface TestimonialCard {
  review: string;
  name: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ContactForm {
  inputs: {
    name: { label: string; placeholder: string };
    phone: { label: string; placeholder: string };
    email: { label: string; placeholder: string };
    address: { label: string; placeholder: string };
  };
  textarea: {
    notes: { label: string; placeholder: string };
  };
  checkbox_text: string;
  submit_button: string;
}

export interface MasterJSON {
  config: MasterJSONConfig;
  navbar: MasterJSONNavbar;
  footer: MasterJSONFooter;
  services: { cards: ServiceCard[] };
  process: { steps: ProcessStep[] };
  stats_benefits: { cards: StatBenefitCard[] };
  testimonials: { top_row: TestimonialCard[]; bottom_row: TestimonialCard[] };
  faq: { items: FAQItem[] };
  contact: { form: ContactForm };
}

// ── CSS Config (used to build the style block) ──

export interface CSSConfig {
  brand_1: string;
  brand_1_text: string;
  brand_2: string;
  brand_2_text: string;
  dark_900: string;
  dark_800: string;
  light_100: string;
  light_200: string;
  radius: RadiusPreset;
  theme: "light" | "dark";
}

// ── Full Mockup Config (stored in client_mockups.config) ──

export interface MockupConfig {
  // Master JSON (goes into config-json CMS field)
  master_json: MasterJSON;

  // WF-bound fields (separate CMS fields)
  navbar_variant: NavbarVariant;
  footer_variant: FooterVariant;
  hero_tag: string;
  hero_heading: string;
  hero_paragraph: string;
  hero_button_1_text: string;
  hero_button_2_text: string;
  hero_variant: HeroVariant;
  hero_image: string;
  services_variant: ServicesVariant;
  services_tag: string;
  services_heading: string;
  services_paragraph: string;
  services_button: string;
  process_variant: ProcessVariant;
  process_tag: string;
  process_heading: string;
  process_paragraph: string;
  process_button: string;
  about_tag: string;
  about_heading: string;
  about_subheading: string;
  about_button_1: string;
  about_button_2: string;
  about_image: string;
  stats_benefits_visibility: StatsBenefitsVisibility;
  testimonials_tag: string;
  testimonials_heading: string;
  testimonials_paragraph: string;
  faq_variant: FAQVariant;
  faq_tag: string;
  faq_heading: string;
  faq_paragraph: string;
  cta_tag: string;
  cta_heading: string;
  cta_paragraph: string;
  cta_button_1: string;
  cta_button_2: string;
  contact_variant: ContactVariant;
  contact_tag: string;
  contact_heading: string;
  contact_paragraph: string;
  css: CSSConfig;
}

export interface ClientMockup {
  id: string;
  client_id: string;
  webflow_item_id: string;
  webflow_url: string;
  config: MockupConfig;
  logo_url: string;
  status: "draft" | "active" | "archived";
  created_at: string;
  updated_at: string;
}
