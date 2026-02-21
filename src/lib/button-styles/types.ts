export interface ButtonStyleEntry {
  id: string;
  component: string;
  name: string;
  type: "animation" | "defaults" | "config";
  css: string | null;
  config: Record<string, unknown> | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ButtonAnimation {
  name: string;
  css: string;
}

export interface ButtonMainConfig {
  sourceAttribute: string;
  targetAttribute: string;
  buttonTypes: string[];
  defaultAnimations: Record<string, string>;
}

export interface AccessoryComponent {
  targetAttribute: string;
  wrapperClass: string;
  variants: string[];
  defaultAnimation: string;
}

export interface AccessoryConfig {
  type: string;
  hasMapping: boolean;
  sourceAttribute: string;
  components: Record<string, AccessoryComponent>;
}

export interface FooterLinkConfig {
  type: string;
  hasMapping: boolean;
  description: string;
}

export interface ButtonStylesResponse {
  buttonMain: {
    config: ButtonMainConfig;
    defaultsCSS: string;
    animations: Record<string, ButtonAnimation>;
  };
  accessories: {
    config: AccessoryConfig;
    defaultsCSS: string;
    animations: Record<string, Record<string, ButtonAnimation>>;
  };
  footerLink: {
    config: FooterLinkConfig;
    css: string;
  };
}
