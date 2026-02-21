import { minify } from "csso";

export function minifyCSS(css: string): string {
  if (!css.trim()) return "";
  try {
    return minify(css).css;
  } catch {
    // Fallback: basic whitespace collapse if csso fails on malformed CSS
    return css
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
      .replace(/;}/g, "}")
      .trim();
  }
}

export { wrapInStyleTags } from "./utils";
