import { transform } from "lightningcss";

export function minifyCSS(css: string): string {
  if (!css.trim()) return "";
  try {
    const { code } = transform({
      filename: "input.css",
      code: Buffer.from(css),
      minify: true,
    });
    return code.toString();
  } catch {
    // Fallback: basic whitespace collapse if lightningcss fails on malformed CSS
    return css
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
      .replace(/;}/g, "}")
      .trim();
  }
}

export { wrapInStyleTags } from "./utils";
