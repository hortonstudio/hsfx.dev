/**
 * Doc Generator - Markdown Serializer
 *
 * Converts ComponentDoc objects to markdown format.
 */

import type { ComponentDoc } from "./types";
import type { TreeNode } from "@/components/ui/WebflowNavigator";

// ════════════════════════════════════════════════════════════
// SINGLE COMPONENT MARKDOWN
// ════════════════════════════════════════════════════════════

export function generateMarkdown(doc: ComponentDoc): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${doc.name}`);
  lines.push("");
  lines.push(`**Group:** ${doc.group}`);
  lines.push(`**Description:** ${doc.description}`);
  lines.push("");

  // Variants
  if (doc.variants.length > 0) {
    lines.push("## Variants");
    lines.push("");
    lines.push("| Variant | Options |");
    lines.push("|---------|---------|");
    for (const variant of doc.variants) {
      const options = variant.options.map((o) => o.label).join(", ");
      lines.push(`| ${variant.propertyLabel} | ${options} |`);
    }
    lines.push("");
  }

  // Properties
  if (doc.properties.length > 0) {
    lines.push("## Properties");
    lines.push("");

    for (const section of doc.properties) {
      lines.push(`### ${section.label}`);
      lines.push("");
      lines.push("| Name | Type | Default | Help |");
      lines.push("|------|------|---------|------|");

      for (const field of section.fields) {
        const defaultVal = formatValue(field.value);
        const helpText = field.helpText ? escapeMarkdown(field.helpText) : "-";
        lines.push(
          `| ${field.label} | ${field.type} | ${defaultVal} | ${helpText} |`
        );
      }
      lines.push("");
    }
  }

  // Render Tree
  lines.push("## Render Tree");
  lines.push("");
  lines.push("```");
  lines.push(renderTreeToText(doc.tree));
  lines.push("```");
  lines.push("");

  // CSS
  if (doc.css) {
    lines.push("## CSS");
    lines.push("");
    lines.push("```css");
    lines.push(doc.css);
    lines.push("```");
    lines.push("");
  }

  // Design Tokens
  if (doc.tokens.length > 0) {
    lines.push("## Design Tokens");
    lines.push("");

    // Collect all variant names
    const allVariantNames = new Set<string>();
    for (const token of doc.tokens) {
      if (token.variants) {
        Object.keys(token.variants).forEach((v) => allVariantNames.add(v));
      }
    }
    const variantColumns = Array.from(allVariantNames).sort();

    // Header row
    const headerCols = ["Token", "Type", "Default", ...variantColumns];
    lines.push(`| ${headerCols.join(" | ")} |`);
    lines.push(`| ${headerCols.map(() => "---").join(" | ")} |`);

    // Data rows
    for (const token of doc.tokens) {
      const row = [
        `\`${token.name}\``,
        token.type,
        escapeMarkdown(token.defaultValue),
      ];
      for (const variant of variantColumns) {
        row.push(escapeMarkdown(token.variants?.[variant] || "-"));
      }
      lines.push(`| ${row.join(" | ")} |`);
    }
    lines.push("");
  }

  // Dependencies
  lines.push("## Dependencies");
  lines.push("");
  if (doc.contains.length > 0) {
    lines.push(`**Contains:** ${doc.contains.join(", ")}`);
  } else {
    lines.push("**Contains:** None");
  }
  if (doc.usedBy.length > 0) {
    lines.push(`**Used by:** ${doc.usedBy.join(", ")}`);
  } else {
    lines.push("**Used by:** None");
  }
  lines.push("");

  return lines.join("\n");
}

// ════════════════════════════════════════════════════════════
// INDEX MARKDOWN
// ════════════════════════════════════════════════════════════

export function generateIndexMarkdown(docs: ComponentDoc[]): string {
  const lines: string[] = [];

  lines.push("# Component Library");
  lines.push("");

  // Group components
  const groups = new Map<string, ComponentDoc[]>();
  for (const doc of docs) {
    const group = doc.group || "Ungrouped";
    const existing = groups.get(group) || [];
    existing.push(doc);
    groups.set(group, existing);
  }

  // Sort groups alphabetically
  const sortedGroups = Array.from(groups.keys()).sort();

  lines.push("## Components by Group");
  lines.push("");

  for (const groupName of sortedGroups) {
    const groupDocs = groups.get(groupName)!;
    lines.push(`### ${groupName}`);
    lines.push("");

    for (const doc of groupDocs.sort((a, b) => a.name.localeCompare(b.name))) {
      const variantCount = doc.variants.reduce(
        (sum, v) => sum + v.options.length,
        0
      );
      const propCount = doc.properties.reduce(
        (sum, s) => sum + s.fields.length,
        0
      );
      lines.push(
        `- [${doc.name}](${doc.slug}.md) — ${variantCount} variants, ${propCount} props`
      );
    }
    lines.push("");
  }

  // Dependency tree
  lines.push("## Dependency Overview");
  lines.push("");

  // Find root components (not used by anything)
  const rootDocs = docs.filter((d) => d.usedBy.length === 0);
  const nestedDocs = docs.filter(
    (d) => d.usedBy.length > 0 && d.contains.length > 0
  );
  const leafDocs = docs.filter(
    (d) => d.usedBy.length > 0 && d.contains.length === 0
  );

  if (rootDocs.length > 0) {
    lines.push(
      `**Root components:** ${rootDocs.map((d) => d.name).join(", ")}`
    );
  }
  if (nestedDocs.length > 0) {
    lines.push(
      `**Nested components:** ${nestedDocs.map((d) => d.name).join(", ")}`
    );
  }
  if (leafDocs.length > 0) {
    lines.push(`**Leaf components:** ${leafDocs.map((d) => d.name).join(", ")}`);
  }
  lines.push("");

  // Quick reference
  lines.push("## Quick Reference");
  lines.push("");

  const withSlots = docs.filter((d) =>
    d.properties.some((s) => s.fields.some((f) => f.type === "slot"))
  );
  const withVariants = docs.filter((d) => d.variants.length > 0);
  const withLinks = docs.filter((d) =>
    d.properties.some((s) => s.fields.some((f) => f.type === "link"))
  );
  const withTokens = docs.filter((d) => d.tokens.length > 0);

  if (withSlots.length > 0) {
    lines.push(`**Components with slots:** ${withSlots.map((d) => d.name).join(", ")}`);
  }
  if (withVariants.length > 0) {
    lines.push(`**Components with variants:** ${withVariants.map((d) => d.name).join(", ")}`);
  }
  if (withLinks.length > 0) {
    lines.push(`**Components with links:** ${withLinks.map((d) => d.name).join(", ")}`);
  }
  if (withTokens.length > 0) {
    lines.push(`**Components with tokens:** ${withTokens.map((d) => d.name).join(", ")}`);
  }
  lines.push("");

  // Stats
  lines.push("## Statistics");
  lines.push("");
  const totalProps = docs.reduce(
    (sum, d) => sum + d.properties.reduce((s, sec) => s + sec.fields.length, 0),
    0
  );
  const totalTokens = docs.reduce((sum, d) => sum + d.tokens.length, 0);
  const totalStyles = docs.reduce(
    (sum, d) => sum + Object.keys(d.cssRaw).length,
    0
  );

  lines.push(`- **Total components:** ${docs.length}`);
  lines.push(`- **Total properties:** ${totalProps}`);
  lines.push(`- **Total design tokens:** ${totalTokens}`);
  lines.push(`- **Total CSS classes:** ${totalStyles}`);
  lines.push("");

  return lines.join("\n");
}

// ════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════

function renderTreeToText(nodes: TreeNode[], indent = 0): string {
  const lines: string[] = [];
  const prefix = "  ".repeat(indent);

  for (const node of nodes) {
    lines.push(`${prefix}${node.label}`);
    if (node.children) {
      lines.push(renderTreeToText(node.children, indent + 1));
    }
  }

  return lines.join("\n");
}

function formatValue(
  value: string | boolean | { type: string; url: string } | null
): string {
  if (value === null) return "-";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") {
    if ("type" in value && "url" in value) {
      return `${value.type}: ${value.url}`;
    }
    return JSON.stringify(value);
  }
  return escapeMarkdown(String(value)) || "-";
}

function escapeMarkdown(str: string): string {
  if (!str) return "";
  return str
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ")
    .replace(/\r/g, "");
}
