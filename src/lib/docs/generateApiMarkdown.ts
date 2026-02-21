/**
 * Generate Markdown from API Documentation
 *
 * Converts API doc data to markdown format for download/copy.
 * Used on API doc pages for AI-consumable documentation.
 */

import { brand } from "@/config";
import type { ApiDocData } from "./apiData";

export function generateApiMarkdown(api: ApiDocData): string {
  const lines: string[] = [];

  lines.push(`# ${api.name}`);
  lines.push("");
  lines.push(`**Method:** \`${api.method}\``);
  lines.push(`**Endpoint:** \`https://${brand.domain}${api.endpoint}\``);
  lines.push("");
  lines.push(api.description);
  lines.push("");

  // Authentication
  lines.push("## Authentication");
  lines.push("");
  lines.push(
    "All requests require an `x-api-key` header with a valid API key."
  );
  lines.push("");
  lines.push("```");
  lines.push(`x-api-key: YOUR_API_KEY`);
  lines.push("```");
  lines.push("");

  // Parameters
  if (api.parameters.length > 0) {
    lines.push("## Parameters");
    lines.push("");
    lines.push("| Parameter | Type | Required | Default | Description |");
    lines.push("|-----------|------|----------|---------|-------------|");
    for (const param of api.parameters) {
      const req = param.required ? "Yes" : "No";
      const def = param.default || "-";
      lines.push(
        `| \`${param.name}\` | ${param.type} | ${req} | ${def} | ${param.description} |`
      );
    }
    lines.push("");
  }

  // Response Formats
  if (api.responseFormats.length > 0) {
    lines.push("## Response Formats");
    lines.push("");
    for (const format of api.responseFormats) {
      lines.push(`### ${format.label}`);
      lines.push("");
      lines.push(`**Content-Type:** \`${format.contentType}\``);
      lines.push("");
      lines.push("```json");
      lines.push(format.example);
      lines.push("```");
      lines.push("");
    }
  }

  // Examples
  if (api.curlExamples.length > 0) {
    lines.push("## Examples");
    lines.push("");
    for (const example of api.curlExamples) {
      lines.push(`### ${example.label}`);
      lines.push("");
      lines.push("```bash");
      lines.push(example.command);
      lines.push("```");
      lines.push("");
    }
  }

  // Caching
  lines.push("## Caching");
  lines.push("");
  lines.push(
    "Responses include `Cache-Control: public, max-age=60, s-maxage=300` headers."
  );
  lines.push(
    "This means responses are cached for 60 seconds in the browser and 5 minutes at the CDN level."
  );
  lines.push("");

  return lines.join("\n");
}

export function generateApiIndexMarkdown(apis: ApiDocData[]): string {
  const lines: string[] = [];

  lines.push(`# ${brand.name} API Reference`);
  lines.push("");
  lines.push(
    `Complete API documentation for integrating with ${brand.name} services.`
  );
  lines.push("");

  // Authentication overview
  lines.push("## Authentication");
  lines.push("");
  lines.push(
    "All APIs require an `x-api-key` header. Contact the team to obtain your API key."
  );
  lines.push("");
  lines.push("```bash");
  lines.push(`curl -H "x-api-key: YOUR_API_KEY" https://${brand.domain}/api/...`);
  lines.push("```");
  lines.push("");

  // API listing
  lines.push("## Available APIs");
  lines.push("");
  lines.push("| API | Method | Endpoint | Description |");
  lines.push("|-----|--------|----------|-------------|");
  for (const api of apis) {
    lines.push(
      `| ${api.name} | \`${api.method}\` | \`${api.endpoint}\` | ${api.description.split(".")[0]}. |`
    );
  }
  lines.push("");

  // Quick reference for each API
  for (const api of apis) {
    lines.push(`## ${api.name}`);
    lines.push("");
    lines.push(api.description);
    lines.push("");

    if (api.parameters.length > 0) {
      lines.push("**Parameters:**");
      for (const param of api.parameters) {
        const req = param.required ? " (required)" : "";
        lines.push(`- \`${param.name}\`${req}: ${param.description}`);
      }
      lines.push("");
    }

    if (api.curlExamples.length > 0) {
      lines.push("**Quick Example:**");
      lines.push("");
      lines.push("```bash");
      lines.push(api.curlExamples[0].command);
      lines.push("```");
      lines.push("");
    }
  }

  return lines.join("\n");
}

export function generateApiAISummary(apis: ApiDocData[]): string {
  const lines: string[] = [];

  lines.push(`# ${brand.name} API Reference - AI Summary`);
  lines.push("");
  lines.push(
    `> ${apis.length} APIs | Base URL: https://${brand.domain}`
  );
  lines.push("");
  lines.push(
    "This is a compact reference for AI assistants. Each API section contains:"
  );
  lines.push("- Endpoint and method");
  lines.push("- Authentication requirements");
  lines.push("- Parameters with types and defaults");
  lines.push("- Response format examples");
  lines.push("");
  lines.push(
    "**Auth:** All APIs require `x-api-key` header with a valid key."
  );
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const api of apis) {
    lines.push(`## ${api.name}`);
    lines.push(`\`${api.method} https://${brand.domain}${api.endpoint}\``);
    lines.push("");
    lines.push(api.description);
    lines.push("");

    // Parameters compact
    if (api.parameters.length > 0) {
      const paramStr = api.parameters
        .map((p) => {
          const req = p.required ? "required" : "optional";
          const def = p.default ? `=${p.default}` : "";
          return `${p.name}(${p.type},${req}${def})`;
        })
        .join(", ");
      lines.push(`**Params:** ${paramStr}`);
    }

    // Response types compact
    const responseTypes = api.responseFormats
      .map((r) => `${r.contentType} (${r.label})`)
      .join(" | ");
    lines.push(`**Returns:** ${responseTypes}`);

    // First example
    if (api.curlExamples.length > 0) {
      lines.push("");
      lines.push("```bash");
      lines.push(api.curlExamples[0].command);
      lines.push("```");
    }

    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("## Integration Notes");
  lines.push("");
  lines.push(
    "- **Caching:** Responses cached 60s browser, 5min CDN (`Cache-Control: public, max-age=60, s-maxage=300`)"
  );
  lines.push("- **CORS:** All origins allowed (`Access-Control-Allow-Origin: *`)");
  lines.push("- **Rate Limits:** No hard limits, but respect cache headers");
  lines.push(
    `- **Base URL:** https://${brand.domain}`
  );
  lines.push("");

  return lines.join("\n");
}
