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

export interface NavbarConfig {
  logo: { src: string; alt: string };
  top_bar: {
    show: boolean;
    map: { show: boolean; text: string; href: string };
    phone: { show: boolean; text: string; href: string };
  };
  nav_links: Array<
    | { text: string; href: string }
    | { text: string; dropdown: Array<{ text: string; href: string }> }
  >;
  cta: { text: string; href: string };
}

export interface FooterConfig {
  logo: { src: string; alt: string };
  company: string;
  contact: {
    phone: string;
    phone_href: string;
    email: string;
    email_href: string;
  };
  socials: {
    facebook: string;
    instagram: string;
    youtube: string;
    tiktok: string;
    x: string;
    linkedin: string;
    pinterest: string;
  };
  footer_nav: Array<{ text: string; href: string }>;
  footer_groups: Array<{
    heading: string;
    links: Array<{ text: string; href: string }>;
  }>;
}

export interface StatBenefitCard {
  icon_svg: string;
  heading: string;
  paragraph: string;
}

export type NavbarVariant =
  | "Full With Top"
  | "Full Without Top"
  | "Island With Top"
  | "Island Without Top";

export type FooterVariant = "Minimal" | "Full";

export type HeroVariant =
  | "Full Height Left Align"
  | "Auto Height Center Align"
  | "Text and Image 2 Grid";

export type StatsBenefitsVisibility = "Statistics" | "Benefits";

export interface MockupConfig {
  navbar: NavbarConfig;
  navbar_variant: NavbarVariant;
  footer: FooterConfig;
  footer_variant: FooterVariant;
  hero_tag: string;
  hero_heading: string;
  hero_paragraph: string;
  hero_button_1_text: string;
  hero_button_2_text: string;
  hero_variant: HeroVariant;
  hero_image: string;
  stats_benefits_visibility: StatsBenefitsVisibility;
  stats_benefits_cards: StatBenefitCard[];
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
