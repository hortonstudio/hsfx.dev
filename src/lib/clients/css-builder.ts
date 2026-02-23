import type { CSSConfig } from "./types";

const RADIUS_MAP: Record<string, { main: string; round: string }> = {
  sharp: { main: "0rem", round: "0rem" },
  soft: { main: "0.5rem", round: "0.5rem" },
  rounded: { main: "1.25rem", round: "9999px" },
};

export function buildCssStyleBlock(css: CSSConfig): string {
  const radius = RADIUS_MAP[css.radius] ?? RADIUS_MAP.rounded;

  let vars = `
    --swatch--brand-1-500: ${css.brand_1};
    --swatch--brand-1-400: color-mix(in srgb, ${css.brand_1} 80%, white);
    --swatch--brand-1-600: color-mix(in srgb, ${css.brand_1} 80%, black);
    --swatch--brand-1-text: ${css.brand_1_text};
    --swatch--brand-1-o20: color-mix(in srgb, ${css.brand_1} 20%, transparent);
    --swatch--brand-2-500: ${css.brand_2};
    --swatch--brand-2-400: color-mix(in srgb, ${css.brand_2} 80%, white);
    --swatch--brand-2-600: color-mix(in srgb, ${css.brand_2} 80%, black);
    --swatch--brand-2-text: ${css.brand_2_text};
    --swatch--brand-2-o20: color-mix(in srgb, ${css.brand_2} 20%, transparent);
    --swatch--dark-900: ${css.dark_900};
    --swatch--dark-800: ${css.dark_800};
    --swatch--light-100: ${css.light_100};
    --swatch--light-200: ${css.light_200};
    --radius--main: ${radius.main};
    --radius--round: ${radius.round};`;

  if (css.theme === "dark") {
    vars += `
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
    --_theme---button-primary--text-hover: var(--swatch--dark-900);`;
  }

  return `<style>:root {${vars}\n  }</style>`;
}
