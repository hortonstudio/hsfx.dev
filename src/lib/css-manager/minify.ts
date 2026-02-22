/**
 * Safe CSS minifier — strips comments and collapses whitespace without
 * touching selectors. Regex-based selector manipulation breaks modern CSS
 * (descendant combinators before :is()/:has(), etc.), so we only do
 * transformations that are guaranteed safe.
 */
export function minifyCSS(css: string): string {
  if (!css.trim()) return "";

  // 1. Strip block comments
  let result = css.replace(/\/\*[\s\S]*?\*\//g, "");

  // 2. Process line by line: trim leading/trailing whitespace per line
  result = result
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  // 3. Collapse multiple blank lines
  result = result.replace(/\n{2,}/g, "\n");

  return result.trim();
}

export { wrapInStyleTags } from "./utils";
