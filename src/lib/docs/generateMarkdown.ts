/**
 * Generate Markdown from Component Documentation
 *
 * Converts component doc data (from Supabase or ComponentDoc) to markdown format.
 * Used on doc pages for download/copy functionality.
 */

import type { TreeNode } from "@/components/ui/WebflowNavigator";
import type { PropertySection } from "@/components/ui/WebflowProperties";
import type { DesignToken } from "@/components/ui/DesignTokensTable";
import { brand } from "@/config";

export interface ComponentDocData {
  name: string;
  slug: string;
  group: string | null;
  description: string | null;
  tree: TreeNode[] | null;
  properties: PropertySection[] | null;
  css: string | null;
  tokens: DesignToken[] | null;
  contains: string[] | null;
  used_by: string[] | null;
  variants: {
    style?: Array<{ label: string; value: string }>;
    size?: Array<{ label: string; value: string }>;
    [key: string]: Array<{ label: string; value: string }> | undefined;
  } | null;
}

export function generateComponentMarkdown(doc: ComponentDocData): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${doc.name}`);
  lines.push("");
  if (doc.group) {
    lines.push(`**Group:** ${doc.group}`);
  }
  if (doc.description) {
    lines.push(`**Description:** ${doc.description}`);
  }
  lines.push("");

  // Variants
  const variants = doc.variants ? Object.entries(doc.variants).filter(([, opts]) => opts && opts.length > 0) : [];
  if (variants.length > 0) {
    lines.push("## Variants");
    lines.push("");
    lines.push("| Variant | Options |");
    lines.push("|---------|---------|");
    for (const [key, options] of variants) {
      if (options) {
        const optLabels = options.map((o) => o.label).join(", ");
        const label = key.charAt(0).toUpperCase() + key.slice(1);
        lines.push(`| ${label} | ${optLabels} |`);
      }
    }
    lines.push("");
  }

  // Properties
  if (doc.properties && doc.properties.length > 0) {
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
          `| ${escapeMarkdown(field.label)} | ${field.type} | ${defaultVal} | ${helpText} |`
        );
      }
      lines.push("");
    }
  }

  // Render Tree
  if (doc.tree && doc.tree.length > 0) {
    lines.push("## Render Tree");
    lines.push("");
    lines.push("```");
    lines.push(renderTreeToText(doc.tree));
    lines.push("```");
    lines.push("");
  }

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
  if (doc.tokens && doc.tokens.length > 0) {
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
  const contains = doc.contains || [];
  const usedBy = doc.used_by || [];
  if (contains.length > 0 || usedBy.length > 0) {
    lines.push("## Dependencies");
    lines.push("");
    if (contains.length > 0) {
      lines.push(`**Contains:** ${contains.join(", ")}`);
    } else {
      lines.push("**Contains:** None");
    }
    if (usedBy.length > 0) {
      lines.push(`**Used by:** ${usedBy.join(", ")}`);
    } else {
      lines.push("**Used by:** None");
    }
    lines.push("");
  }

  return lines.join("\n");
}

export interface ComponentSummary {
  name: string;
  slug: string;
  group: string | null;
  description: string | null;
}

export function generateIndexMarkdown(components: ComponentSummary[]): string {
  const lines: string[] = [];

  lines.push("# Component Library");
  lines.push("");

  // Group components
  const groups = new Map<string, ComponentSummary[]>();
  for (const comp of components) {
    const group = comp.group || "Ungrouped";
    const existing = groups.get(group) || [];
    existing.push(comp);
    groups.set(group, existing);
  }

  // Sort groups alphabetically
  const sortedGroups = Array.from(groups.keys()).sort();

  lines.push("## Components by Group");
  lines.push("");

  for (const groupName of sortedGroups) {
    const groupComps = groups.get(groupName)!;
    lines.push(`### ${groupName}`);
    lines.push("");

    for (const comp of groupComps.sort((a, b) => a.name.localeCompare(b.name))) {
      const desc = comp.description ? ` — ${comp.description}` : "";
      lines.push(`- [${comp.name}](${comp.slug}.md)${desc}`);
    }
    lines.push("");
  }

  // Stats
  lines.push("## Statistics");
  lines.push("");
  lines.push(`- **Total components:** ${components.length}`);
  lines.push(`- **Total groups:** ${sortedGroups.length}`);
  lines.push("");

  return lines.join("\n");
}

// Helper functions
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
  value: string | boolean | { type: string; url: string } | null | undefined
): string {
  if (value === null || value === undefined) return "-";
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

// ════════════════════════════════════════════════════════════
// AI-OPTIMIZED SUMMARY
// ════════════════════════════════════════════════════════════

/**
 * Generates a compact, AI-optimized summary of all components.
 * Focuses on essential information needed for AI to understand and use components:
 * - Component names, groups, and relationships
 * - Available variants and their options
 * - Key properties with types
 * - Design token names and values
 * - Dependencies between components
 */
export function generateAISummary(docs: ComponentDocData[]): string {
  const lines: string[] = [];

  // Header with stats
  const totalProps = docs.reduce(
    (sum, d) => sum + (d.properties?.reduce((s, sec) => s + sec.fields.length, 0) || 0),
    0
  );
  const totalTokens = docs.reduce((sum, d) => sum + (d.tokens?.length || 0), 0);

  lines.push(`# ${brand.name} Component Library - AI Reference`);
  lines.push("");
  lines.push(`> ${docs.length} components | ${totalProps} properties | ${totalTokens} design tokens`);
  lines.push("");
  lines.push("This is a compact reference for AI assistants. Each component section contains:");
  lines.push("- Variants: Style/size options that change appearance");
  lines.push("- Props: Configurable properties with types");
  lines.push("- Tokens: CSS custom properties for theming");
  lines.push("- Deps: Child components (contains) and parent components (used by)");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Group components
  const groups = new Map<string, ComponentDocData[]>();
  for (const doc of docs) {
    const group = doc.group || "Ungrouped";
    const existing = groups.get(group) || [];
    existing.push(doc);
    groups.set(group, existing);
  }

  const sortedGroups = Array.from(groups.keys()).sort();

  for (const groupName of sortedGroups) {
    const groupDocs = groups.get(groupName)!;
    lines.push(`## ${groupName}`);
    lines.push("");

    for (const doc of groupDocs.sort((a, b) => a.name.localeCompare(b.name))) {
      lines.push(`### ${doc.name}`);
      if (doc.description) {
        lines.push(`${doc.description}`);
      }
      lines.push("");

      // Variants (compact) - use label (display name), not value (UUID)
      const variants = doc.variants
        ? Object.entries(doc.variants).filter(([, opts]) => opts && opts.length > 0)
        : [];
      if (variants.length > 0) {
        const variantStr = variants
          .map(([key, opts]) => `${key}: ${opts!.map((o) => o.label).join("|")}`)
          .join("; ");
        lines.push(`**Variants:** ${variantStr}`);
      }

      // Properties (compact - just names and types)
      if (doc.properties && doc.properties.length > 0) {
        const allProps: string[] = [];
        for (const section of doc.properties) {
          for (const field of section.fields) {
            allProps.push(`${field.label}(${field.type})`);
          }
        }
        if (allProps.length > 0) {
          lines.push(`**Props:** ${allProps.join(", ")}`);
        }
      }

      // Tokens (compact - just names)
      if (doc.tokens && doc.tokens.length > 0) {
        const tokenNames = doc.tokens.map((t) => t.name).join(", ");
        lines.push(`**Tokens:** ${tokenNames}`);
      }

      // Dependencies
      const contains = doc.contains || [];
      const usedBy = doc.used_by || [];
      if (contains.length > 0 || usedBy.length > 0) {
        const deps: string[] = [];
        if (contains.length > 0) deps.push(`contains: ${contains.join(", ")}`);
        if (usedBy.length > 0) deps.push(`used by: ${usedBy.join(", ")}`);
        lines.push(`**Deps:** ${deps.join(" | ")}`);
      }

      lines.push("");
    }
  }

  // Quick reference section
  lines.push("---");
  lines.push("");
  lines.push("## Quick Reference");
  lines.push("");

  // Components with slots
  const withSlots = docs.filter((d) =>
    d.properties?.some((s) => s.fields.some((f) => f.type === "slot"))
  );
  if (withSlots.length > 0) {
    lines.push(`**Slotted:** ${withSlots.map((d) => d.name).join(", ")}`);
  }

  // Root components (not used by anything)
  const roots = docs.filter((d) => !d.used_by || d.used_by.length === 0);
  if (roots.length > 0) {
    lines.push(`**Root components:** ${roots.map((d) => d.name).join(", ")}`);
  }

  // Leaf components (don't contain anything)
  const leaves = docs.filter((d) => !d.contains || d.contains.length === 0);
  if (leaves.length > 0) {
    lines.push(`**Leaf components:** ${leaves.map((d) => d.name).join(", ")}`);
  }

  lines.push("");

  return lines.join("\n");
}
