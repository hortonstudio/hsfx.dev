/** Build an indented line */
export function indent(level: number, line: string): string {
  return "  ".repeat(level) + line;
}

/** Join lines array into formatted code */
export function formatCode(lines: string[]): string {
  return lines.join("\n");
}

/** Minify JS by collapsing whitespace (safe for our controlled generated code) */
export function minifyJS(code: string): string {
  return code
    // Remove single-line comments
    .replace(/\/\/.*$/gm, "")
    // Remove multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Collapse whitespace around operators and punctuation
    .replace(/\s*([{}();,:<>=+\-*/!?&|])\s*/g, "$1")
    // Collapse remaining whitespace
    .replace(/\s+/g, " ")
    // Fix cases where space is needed (keywords)
    .replace(/\b(const|let|var|function|return|if|else|new|await|async|import|from|export|typeof|instanceof)\b/g, " $1 ")
    // Clean up double spaces
    .replace(/\s+/g, " ")
    // Remove leading/trailing space
    .trim();
}

/** Format a GSAP property value for code output */
export function formatValue(value: number | string, unit?: string): string {
  if (typeof value === "string") {
    // String values like clipPath, filter, colors get quoted
    return `"${value}"`;
  }
  if (unit && unit !== "px") {
    // Non-px units: "30vw", "50%", "45deg"
    return `"${value}${unit}"`;
  }
  // Plain numbers (px is default for GSAP transforms)
  return String(value);
}

/** Convert a slug to a valid JS variable name */
export function slugToVarName(slug: string): string {
  return slug
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .replace(/^(\d)/, "_$1");
}

/** Escape string for use in generated code */
export function escapeString(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}
