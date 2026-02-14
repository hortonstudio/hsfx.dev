export function minifyCSS(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove comments
    .replace(/\s+/g, " ") // Collapse whitespace
    .replace(/\s*([{}:;,>~+])\s*/g, "$1") // Remove space around special chars
    .replace(/;}/g, "}") // Remove last semicolon before }
    .trim();
}

export function wrapInStyleTags(css: string): string {
  return `<style>${css}</style>`;
}
