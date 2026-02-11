/**
 * Doc Generator - Core Processing Pipeline
 *
 * Transforms Webflow extractor JSON into structured ComponentDoc objects.
 * Pure functions with no UI dependencies for reuse with Supabase.
 */

import type {
  ExtractorOutput,
  ExtractorComponent,
  ExtractorProperty,
  RenderNode,
  ComponentDoc,
  LookupTables,
  VariantInfo,
  CssVariableDefinition,
  BreakpointDef,
} from "./types";

import type { TreeNode, NodeType } from "@/components/ui/WebflowNavigator";
import type {
  PropertySection,
  PropertyField,
  PropertyType,
  LinkValue,
} from "@/components/ui/WebflowProperties";
import type { DesignToken } from "@/components/ui/DesignTokensTable";

// ════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ════════════════════════════════════════════════════════════

export function generateDocs(input: ExtractorOutput): ComponentDoc[] {
  // Validate input
  if (!input.components || !Array.isArray(input.components)) {
    throw new Error("Invalid input: missing components array");
  }
  if (!input.breakpoints) {
    throw new Error("Invalid input: missing breakpoints");
  }

  // Pass 1: Build lookup tables
  const lookups = buildLookupTables(input);

  // Pass 2: Generate per component
  const docs: ComponentDoc[] = [];
  for (const component of input.components) {
    try {
      const doc = generateComponentDoc(component, lookups, input.breakpoints);
      docs.push(doc);
    } catch (e) {
      console.warn(`Failed to process component ${component.name}:`, e);
    }
  }

  // Pass 3: Populate usedBy from reverse dependencies
  for (const doc of docs) {
    doc.usedBy = lookups.reverseDeps.get(doc.name) || [];
  }

  return docs;
}

// ════════════════════════════════════════════════════════════
// PASS 1: BUILD LOOKUP TABLES
// ════════════════════════════════════════════════════════════

function buildLookupTables(input: ExtractorOutput): LookupTables {
  const componentNames = new Map<string, string>();
  const propertyNames = new Map<string, Map<string, string>>();
  const variantValues = new Map<string, Map<string, string>>();
  const dependencies = new Map<string, string[]>();
  const reverseDeps = new Map<string, string[]>();
  const cssVarNames = new Map<string, Map<string, string>>();
  const slugs = new Map<string, string>();

  // Track slug collisions
  const usedSlugs = new Set<string>();

  for (const comp of input.components) {
    // Component name map
    componentNames.set(comp.id, comp.name);

    // Property name map
    const propMap = new Map<string, string>();
    for (const prop of comp.properties) {
      propMap.set(prop.id, prop.label);
    }
    propertyNames.set(comp.id, propMap);

    // Variant value map
    const varMap = new Map<string, string>();
    for (const opts of Object.values(comp.variants || {})) {
      for (const opt of opts) {
        varMap.set(opt.id, opt.displayName);
      }
    }
    variantValues.set(comp.id, varMap);

    // CSS variable name map
    if (comp.cssVariables) {
      const varNames = new Map<string, string>();
      for (const [varId, varDef] of Object.entries(comp.cssVariables)) {
        varNames.set(varId, varDef.name);
      }
      cssVarNames.set(comp.id, varNames);
    }

    // Dependencies from render tree
    const deps = collectDependencies(comp.render);
    dependencies.set(comp.name, deps);

    // Build reverse deps
    for (const childName of deps) {
      const existing = reverseDeps.get(childName) || [];
      if (!existing.includes(comp.name)) {
        existing.push(comp.name);
        reverseDeps.set(childName, existing);
      }
    }

    // Generate slug
    let slug = toKebabCase(comp.name);
    if (usedSlugs.has(slug) && comp.group) {
      slug = toKebabCase(`${comp.group}-${comp.name}`);
    }
    // Handle remaining collisions with suffix
    let finalSlug = slug;
    let counter = 2;
    while (usedSlugs.has(finalSlug)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }
    usedSlugs.add(finalSlug);
    slugs.set(comp.name, finalSlug);
  }

  return {
    componentNames,
    propertyNames,
    variantValues,
    dependencies,
    reverseDeps,
    cssVarNames,
    slugs,
  };
}

function collectDependencies(node: RenderNode | null): string[] {
  const deps: string[] = [];
  const seen = new Set<string>();

  function walk(n: RenderNode | null | undefined): void {
    if (!n || typeof n !== "object") return;
    if (Array.isArray(n)) {
      n.forEach(walk);
      return;
    }

    if (n.componentName && !seen.has(n.componentName)) {
      seen.add(n.componentName);
      deps.push(n.componentName);
    }

    if (n.children) {
      for (const child of n.children) {
        walk(child as RenderNode);
      }
    }
  }

  walk(node);
  return deps;
}

// ════════════════════════════════════════════════════════════
// PASS 2: GENERATE PER COMPONENT
// ════════════════════════════════════════════════════════════

function generateComponentDoc(
  comp: ExtractorComponent,
  lookups: LookupTables,
  breakpoints: Record<string, BreakpointDef>
): ComponentDoc {
  const slug = lookups.slugs.get(comp.name) || toKebabCase(comp.name);

  // Generate tree
  const tree = generateTree(comp.render);

  // Generate properties
  const properties = generateProperties(comp.properties, comp.variants);

  // Generate CSS
  const css = generateCss(comp.css, comp.cssVariables);

  // Generate tokens
  const tokens = generateTokens(comp.cssVariables, comp.variants);

  // Generate variant info
  const variants = generateVariantInfo(comp.variants, comp.properties);

  // Get dependencies
  const contains = lookups.dependencies.get(comp.name) || [];

  // Count stats
  const stats = {
    propertyCount: comp.properties.length,
    variantCount: Object.values(comp.variants || {}).reduce(
      (sum, opts) => sum + opts.length,
      0
    ),
    styleCount: Object.keys(comp.css || {}).length,
    tokenCount: Object.keys(comp.cssVariables || {}).length,
  };

  return {
    slug,
    name: comp.name,
    group: comp.group || "Ungrouped",
    description: comp.description || "No description",
    tree,
    properties,
    css,
    tokens,
    variants,
    contains,
    usedBy: [], // Filled in Pass 3
    renderRaw: comp.render,
    cssRaw: comp.css,
    breakpoints,
    embeds: comp.embeds,
    stats,
  };
}

// ════════════════════════════════════════════════════════════
// TREE GENERATION
// ════════════════════════════════════════════════════════════

function generateTree(render: RenderNode): TreeNode[] {
  let nodeCounter = 0;

  function walk(node: RenderNode | null | undefined): TreeNode | null {
    if (!node || typeof node !== "object") return null;

    // Handle binding refs
    if ("_binding" in node && node._binding) {
      const bindingNode = node as {
        _binding: true;
        propName?: string;
        prop?: string;
        slotDisplayName?: string;
      };
      const label = bindingNode.slotDisplayName
        ? `SLOT: ${bindingNode.slotDisplayName}`
        : `BINDS: ${bindingNode.propName || bindingNode.prop || "?"}`;
      return {
        id: `node-${nodeCounter++}`,
        label,
        type: "element" as NodeType,
      };
    }

    // Determine node type
    let nodeType: NodeType = "element";
    if (node.componentId || node.componentName) {
      nodeType = "component";
    } else if (node.slot) {
      nodeType = "slot";
    }

    // Build label
    let label = "";

    // Tag or component name
    if (node.componentName) {
      label = `[${node.componentName}]`;
      nodeType = "component";
    } else if (node.tag) {
      label = `<${node.tag}>`;

      // Add class name
      if (node.styles && node.styles.length > 0) {
        const className = node.styles[0].className;
        if (className && className !== "(unresolved)") {
          label += ` .${className}`;
        }
      }
    } else if (node.type) {
      label = `[${node.type}]`;
    } else {
      label = "[node]";
    }

    // Add display name if present and not a slot
    if (node.displayName && !node.slot) {
      label = `"${node.displayName}" ${label}`;
    }

    // Add attributes
    if (node.xattr && node.xattr.length > 0) {
      const attrNames = node.xattr
        .map((a) => {
          if (typeof a.name === "string") return a.name;
          if (a.name && typeof a.name === "object" && "_binding" in a.name) {
            return `{${(a.name as { prop?: string }).prop || "?"}}`;
          }
          return "?";
        })
        .filter((n) => n !== "?");
      if (attrNames.length > 0) {
        label += ` [${attrNames.join(", ")}]`;
      }
    }

    // Add text indicator
    if (node.text) {
      label += " [TEXT]";
    }

    // Check if this is a slot container
    if (node.children) {
      for (const child of node.children) {
        if (
          child &&
          typeof child === "object" &&
          "_binding" in child &&
          (child as { slotDisplayName?: string }).slotDisplayName
        ) {
          nodeType = "slot";
          break;
        }
      }
    }

    const result: TreeNode = {
      id: `node-${nodeCounter++}`,
      label,
      type: nodeType,
    };

    // Process children
    if (node.children && node.children.length > 0) {
      const childNodes: TreeNode[] = [];
      for (const child of node.children) {
        const childNode = walk(child as RenderNode);
        if (childNode) {
          childNodes.push(childNode);
        }
      }
      if (childNodes.length > 0) {
        result.children = childNodes;
      }
    }

    return result;
  }

  const root = walk(render);
  return root ? [root] : [];
}

// ════════════════════════════════════════════════════════════
// PROPERTY GENERATION
// ════════════════════════════════════════════════════════════

function generateProperties(
  properties: ExtractorProperty[],
  variants: Record<string, { id: string; displayName: string }[]>
): PropertySection[] {
  const sections: PropertySection[] = [];

  // Categorize properties
  const variantProps: PropertyField[] = [];
  const slotProps: PropertyField[] = [];
  const visibilityProps: PropertyField[] = [];
  const settingsProps: PropertyField[] = [];
  const advancedProps: PropertyField[] = [];
  const groupedProps = new Map<string, PropertyField[]>();

  for (const prop of properties) {
    const field = convertPropertyToField(prop, variants);

    // Determine section
    if (
      prop.type === "TypeApplication" ||
      prop.type === "Basic/StyleVariant" ||
      prop.type.includes("StyleVariant")
    ) {
      variantProps.push(field);
    } else if (prop.type === "Slots/SlotContent") {
      slotProps.push(field);
    } else if (prop.type === "Visibility/VisibilityConditions") {
      visibilityProps.push(field);
    } else if (prop.isPrivate) {
      advancedProps.push(field);
    } else if (prop.group) {
      const existing = groupedProps.get(prop.group) || [];
      existing.push(field);
      groupedProps.set(prop.group, existing);
    } else {
      settingsProps.push(field);
    }
  }

  // Build sections in order
  if (variantProps.length > 0) {
    sections.push({
      id: "variants",
      label: "Variants",
      fields: variantProps,
      defaultExpanded: true,
    });
  }

  // Named groups alphabetically
  const sortedGroups = Array.from(groupedProps.keys()).sort();
  for (const groupName of sortedGroups) {
    const fields = groupedProps.get(groupName)!;
    sections.push({
      id: toKebabCase(groupName),
      label: groupName,
      fields,
      defaultExpanded: true,
    });
  }

  if (slotProps.length > 0) {
    sections.push({
      id: "slots",
      label: "Slots",
      fields: slotProps,
      defaultExpanded: true,
    });
  }

  if (visibilityProps.length > 0) {
    sections.push({
      id: "visibility",
      label: "Visibility",
      fields: visibilityProps,
      defaultExpanded: true,
    });
  }

  if (settingsProps.length > 0) {
    sections.push({
      id: "settings",
      label: "Settings",
      fields: settingsProps,
      defaultExpanded: true,
    });
  }

  if (advancedProps.length > 0) {
    sections.push({
      id: "advanced",
      label: "Advanced",
      fields: advancedProps,
      defaultExpanded: false,
    });
  }

  return sections;
}

function convertPropertyToField(
  prop: ExtractorProperty,
  variants: Record<string, { id: string; displayName: string }[]>
): PropertyField {
  const usedIds = new Set<string>();

  function getUniqueId(base: string): string {
    const baseId = toKebabCase(base);
    if (!usedIds.has(baseId)) {
      usedIds.add(baseId);
      return baseId;
    }
    let counter = 2;
    while (usedIds.has(`${baseId}-${counter}`)) {
      counter++;
    }
    const uniqueId = `${baseId}-${counter}`;
    usedIds.add(uniqueId);
    return uniqueId;
  }

  // Use slot display name for slot labels
  const label = prop.displayName || prop.name;
  const id = getUniqueId(label);

  // Determine type and value
  let type: PropertyType = "text";
  let value: string | boolean | LinkValue | null = null;
  let options: { label: string; value: string }[] | undefined;
  let helpText = prop.toolTip || undefined;

  switch (prop.type) {
    case "Builtin/Text":
    case "Basic/AltText":
    case "Basic/IdTextInput":
    case "Basic/RichTextChildren":
      type = "text";
      value =
        typeof prop.defaultValue === "string" ? prop.defaultValue : "";
      break;

    case "Builtin/Number":
      type = "text";
      value = String(prop.defaultValue ?? "");
      if (prop.min !== null || prop.max !== null) {
        const rangeText = `Range: ${prop.min ?? "?"} to ${prop.max ?? "?"}`;
        helpText = helpText ? `${helpText}. ${rangeText}` : rangeText;
      }
      break;

    case "Builtin/List":
      type = "text";
      // Extract plain text from rich text default
      value = extractPlainText(prop.defaultValue);
      break;

    case "TypeApplication":
    case "Basic/StyleVariant":
      type = "style";
      // Build options from variants
      const variantOpts = variants[prop.id];
      if (variantOpts) {
        options = variantOpts.map((opt) => ({
          label: opt.displayName,
          value: opt.id,
        }));
        // Default is usually "base"
        value =
          typeof prop.defaultValue === "string" ? prop.defaultValue : "base";
      }
      break;

    case "Visibility/VisibilityConditions":
      type = "segmented";
      options = [
        { label: "Visible", value: "visible" },
        { label: "Hidden", value: "hidden" },
      ];
      // Empty array means visible
      value = Array.isArray(prop.defaultValue) && prop.defaultValue.length === 0
        ? "visible"
        : "hidden";
      break;

    case "Slots/SlotContent":
      type = "slot";
      value = null;
      break;

    case "Basic/Link":
      type = "link";
      value = convertLinkValue(prop.defaultValue);
      break;

    default:
      type = "text";
      value =
        typeof prop.defaultValue === "string"
          ? prop.defaultValue
          : JSON.stringify(prop.defaultValue);
  }

  return {
    id,
    label,
    type,
    value,
    helpText,
    options,
  };
}

function extractPlainText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";

  // Handle rich text array structure
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          if ("data" in item && typeof (item as { data?: { value?: string } }).data?.value === "string") {
            return (item as { data: { value: string } }).data.value;
          }
          if ("value" in item && typeof (item as { value?: string }).value === "string") {
            return (item as { value: string }).value;
          }
        }
        return "";
      })
      .join("");
  }

  return "";
}

function convertLinkValue(value: unknown): LinkValue {
  const defaultLink: LinkValue = {
    type: "url",
    url: "#",
    openIn: "this",
    preload: "default",
  };

  if (!value || typeof value !== "object") return defaultLink;

  const v = value as Record<string, unknown>;

  // Map mode to type
  let linkType: LinkValue["type"] = "url";
  if (v.mode === "external") linkType = "url";
  else if (v.mode === "page") linkType = "page";
  else if (v.mode === "email") linkType = "email";
  else if (v.mode === "phone") linkType = "phone";
  else if (v.mode === "section") linkType = "section";

  return {
    type: linkType,
    url: typeof v.url === "string" ? v.url : "#",
    openIn: v.openIn === "new" ? "new" : "this",
    preload: (v.preload as LinkValue["preload"]) || "default",
  };
}

// ════════════════════════════════════════════════════════════
// CSS GENERATION
// ════════════════════════════════════════════════════════════

function generateCss(
  css: Record<string, { className: string; base: string | null; variants: Record<string, { css: string | null; variantName?: string | null }> }>,
  cssVariables: Record<string, CssVariableDefinition> | null
): string {
  const blocks: string[] = [];

  for (const [className, data] of Object.entries(css)) {
    // Base styles
    if (data.base) {
      const cleanedCss = cleanCssValue(data.base, cssVariables);
      const formattedCss = formatCssProperties(cleanedCss);
      blocks.push(`.${className} {\n${formattedCss}\n}`);
    }

    // Variant overrides
    for (const [variantKey, variantData] of Object.entries(data.variants || {})) {
      if (variantData.css) {
        const cleanedCss = cleanCssValue(variantData.css, cssVariables);
        const formattedCss = formatCssProperties(cleanedCss);
        const comment = variantData.variantName
          ? `/* Variant: ${variantData.variantName} */\n`
          : `/* ${variantKey} */\n`;
        blocks.push(`${comment}.${className} {\n${formattedCss}\n}`);
      }
    }
  }

  return blocks.join("\n\n");
}

function cleanCssValue(
  css: string,
  cssVariables: Record<string, CssVariableDefinition> | null
): string {
  let result = css;

  // Replace @var_variable-uuid with var(--token-name)
  if (cssVariables) {
    result = result.replace(/@var_(variable-[a-f0-9-]+)/g, (match, varId) => {
      const varDef = cssVariables[varId];
      if (varDef) {
        const tokenName = varDef.name.replace(/\//g, "-");
        return `var(--${tokenName})`;
      }
      return match;
    });
  }

  // Strip @raw<|...|> wrappers
  // Need to handle nested content carefully
  result = stripRawWrappers(result);

  // Strip internal mode switch CSS
  result = result.replace(/---mode--[^:]+:[^;]+;?/g, (match) => {
    // Try to extract variant name from the property
    const variantMatch = match.match(/---mode--([^:]+)/);
    if (variantMatch) {
      return `/* Activates ${variantMatch[1]} token set */`;
    }
    return "";
  });

  return result;
}

function stripRawWrappers(css: string): string {
  let result = css;
  let startIdx = 0;

  while (true) {
    const rawStart = result.indexOf("@raw<|", startIdx);
    if (rawStart === -1) break;

    // Find matching |>
    let depth = 1;
    let pos = rawStart + 6;
    while (pos < result.length && depth > 0) {
      if (result.substring(pos, pos + 6) === "@raw<|") {
        depth++;
        pos += 6;
      } else if (result.substring(pos, pos + 2) === "|>") {
        depth--;
        if (depth === 0) {
          // Extract inner content
          const innerContent = result.substring(rawStart + 6, pos);
          result = result.substring(0, rawStart) + innerContent + result.substring(pos + 2);
          // Don't advance startIdx, process the same position again
          continue;
        }
        pos += 2;
      } else {
        pos++;
      }
    }

    // If we didn't find a match, move past this occurrence
    if (depth > 0) {
      startIdx = rawStart + 6;
    }
  }

  return result;
}

function formatCssProperties(css: string): string {
  // Split on semicolons, trim, filter empty, sort, rejoin
  const props = css
    .split(";")
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !p.startsWith("/*"));

  // Sort alphabetically by property name
  props.sort((a, b) => {
    const aName = a.split(":")[0]?.trim() || "";
    const bName = b.split(":")[0]?.trim() || "";
    return aName.localeCompare(bName);
  });

  return props.map((p) => `  ${p};`).join("\n");
}

// ════════════════════════════════════════════════════════════
// TOKEN GENERATION
// ════════════════════════════════════════════════════════════

function generateTokens(
  cssVariables: Record<string, CssVariableDefinition> | null,
  variants: Record<string, { id: string; displayName: string }[]>
): DesignToken[] {
  if (!cssVariables) return [];

  const tokens: DesignToken[] = [];

  // Build variant name lookup
  const variantDisplayNames = new Set<string>();
  for (const opts of Object.values(variants || {})) {
    for (const opt of opts) {
      variantDisplayNames.add(opt.displayName);
    }
  }

  for (const [, varDef] of Object.entries(cssVariables)) {
    // Determine token type
    let tokenType: DesignToken["type"] = "raw";
    if (varDef.type === "color") tokenType = "color";
    else if (varDef.type === "length") tokenType = "length";
    else if (varDef.type === "number") tokenType = "number";

    // Get default value - use final resolved value
    const defaultValue = extractFinalValue(varDef.resolved || varDef.value || "");

    // Build variants from modes
    const tokenVariants: Record<string, string> = {};
    if (varDef.modesResolved) {
      for (const [modeKey, modeValue] of Object.entries(varDef.modesResolved)) {
        // Try to match to component variant
        let variantName = modeKey;

        // Strip collection prefix: "Button Style/Secondary Mode" → "Secondary Mode"
        const slashIdx = modeKey.lastIndexOf("/");
        if (slashIdx !== -1) {
          const afterSlash = modeKey.substring(slashIdx + 1);
          // Strip " Mode" suffix
          const withoutMode = afterSlash.replace(/ Mode$/, "");
          if (variantDisplayNames.has(withoutMode)) {
            variantName = withoutMode;
          } else if (variantDisplayNames.has(afterSlash)) {
            variantName = afterSlash;
          } else {
            // Keep full name for system tokens
            variantName = modeKey;
          }
        }

        tokenVariants[variantName] = extractFinalValue(modeValue);
      }
    }

    tokens.push({
      name: varDef.name,
      type: tokenType,
      defaultValue,
      variants: Object.keys(tokenVariants).length > 0 ? tokenVariants : undefined,
    });
  }

  return tokens;
}

function extractFinalValue(resolved: string): string {
  if (!resolved) return "";

  // If it contains a ref chain like "var(token) → var(other) → #2563eb"
  // Extract the final value
  const arrowIdx = resolved.lastIndexOf("→");
  if (arrowIdx !== -1) {
    return resolved.substring(arrowIdx + 1).trim();
  }

  return resolved;
}

// ════════════════════════════════════════════════════════════
// VARIANT INFO GENERATION
// ════════════════════════════════════════════════════════════

function generateVariantInfo(
  variants: Record<string, { id: string; displayName: string }[]>,
  properties: ExtractorProperty[]
): VariantInfo[] {
  const result: VariantInfo[] = [];

  for (const [propId, opts] of Object.entries(variants)) {
    const prop = properties.find((p) => p.id === propId);
    const label = prop?.label || propId;

    result.push({
      propertyId: propId,
      propertyLabel: label,
      options: opts.map((opt) => ({
        label: opt.displayName,
        value: opt.id,
      })),
    });
  }

  return result;
}

// ════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toLowerCase();
}

// ════════════════════════════════════════════════════════════
// VALIDATION
// ════════════════════════════════════════════════════════════

export function validateExtractorOutput(data: unknown): {
  valid: boolean;
  error?: string;
} {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Input must be an object" };
  }

  const obj = data as Record<string, unknown>;

  if (!obj.breakpoints || typeof obj.breakpoints !== "object") {
    return { valid: false, error: "Missing or invalid 'breakpoints' field" };
  }

  if (!obj.components || !Array.isArray(obj.components)) {
    return { valid: false, error: "Missing or invalid 'components' array" };
  }

  if (obj.components.length === 0) {
    return { valid: false, error: "Components array is empty" };
  }

  // Check first component has required fields
  const first = obj.components[0] as Record<string, unknown>;
  if (!first.name || !first.render || !first.properties) {
    return {
      valid: false,
      error: "Components missing required fields (name, render, properties)",
    };
  }

  if (!obj._meta || typeof obj._meta !== "object") {
    return { valid: false, error: "Missing or invalid '_meta' field" };
  }

  return { valid: true };
}
