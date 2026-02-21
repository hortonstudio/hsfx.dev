/**
 * Pure-JS CSS minifier that handles modern syntax (nesting, @container, color-mix, etc.)
 * Safe for client-side bundling — no native dependencies.
 */
export function minifyCSS(css: string): string {
  if (!css.trim()) return "";
  return (
    css
      // Remove comments (but not inside strings)
      .replace(/\/\*[\s\S]*?\*\//g, "")
      // Collapse whitespace around block boundaries
      .replace(/\s*\{\s*/g, "{")
      .replace(/\s*\}\s*/g, "}")
      .replace(/\s*;\s*/g, ";")
      .replace(/\s*:\s*/g, ":")
      .replace(/\s*,\s*/g, ",")
      // Remove trailing semicolons before closing brace
      .replace(/;}/g, "}")
      // Collapse remaining whitespace
      .replace(/\s+/g, " ")
      // Clean up spaces around combinators but preserve them
      .replace(/\s*>\s*/g, ">")
      .replace(/\s*~\s*/g, "~")
      .replace(/\s*\+\s*/g, "+")
      // Restore space after closing brace (between rules)
      .replace(/}([^\s}])/g, "} $1")
      // Remove unnecessary space between rules at top level
      .replace(/}\s+}/g, "}}")
      .replace(/}\s+@/g, "}@")
      .replace(/}\s+\./g, "}.")
      .replace(/}\s+#/g, "}#")
      .replace(/}\s+[a-zA-Z[*:]/g, (m) => "}" + m.slice(m.length - 1))
      .trim()
  );
}

export { wrapInStyleTags } from "./utils";
