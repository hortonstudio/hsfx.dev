export function wrapInStyleTags(css: string): string {
  return `<style>${css}</style>`;
}
