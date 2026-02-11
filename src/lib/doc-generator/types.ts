/**
 * Doc Generator Types
 *
 * Input types for extractor JSON and output types for generated docs.
 * Reuses existing UI component types where possible.
 */

// Re-export types from UI components for consistency
export type { TreeNode, NodeType } from "@/components/ui/WebflowNavigator";
export type {
  PropertySection,
  PropertyField,
  PropertyType,
  LinkValue,
} from "@/components/ui/WebflowProperties";
export type { DesignToken } from "@/components/ui/DesignTokensTable";

// ════════════════════════════════════════════════════════════
// INPUT TYPES (from extractor JSON)
// ════════════════════════════════════════════════════════════

export interface ExtractorOutput {
  breakpoints: Record<string, BreakpointDef>;
  components: ExtractorComponent[];
  _meta: {
    totalComponents: number;
    styleMapSize: number;
  };
}

export interface BreakpointDef {
  id: string;
  minWidth?: number;
  maxWidth?: number;
  [key: string]: unknown;
}

export interface ExtractorComponent {
  id: string;
  name: string;
  group: string | null;
  description: string | null;
  properties: ExtractorProperty[];
  render: RenderNode;
  css: Record<string, CssClassDefinition>;
  cssVariables: Record<string, CssVariableDefinition> | null;
  variants: Record<string, VariantOption[]>;
  embeds: EmbedDefinition[] | null;
  _meta: {
    slotDisplayNames: Record<string, string>;
    usedStyleCount: number;
    embedCount: number;
    variablesResolved: number;
  };
}

export interface ExtractorProperty {
  id: string;
  label: string;
  group: string | null;
  name: string;
  type: string;
  typeDetail: unknown | null;
  defaultValue: unknown;
  isBindable: boolean;
  isPrivate: boolean;
  isDefault: boolean | null;
  isUnlinked: boolean | null;
  toolTip: string | null;
  min: number | null;
  max: number | null;
  meta: unknown | null;
  displayName?: string; // Added for slots
}

export interface RenderNode {
  id?: string;
  type?: string;
  tag?: string;
  displayName?: string;
  componentId?: string;
  componentName?: string;
  styles?: StyleReference[];
  xattr?: AttributeRef[];
  text?: boolean;
  slot?: string;
  children?: (RenderNode | BindingRef)[];
  extra?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  visibility?: unknown;
  attributes?: unknown[];
  name?: string;
  data?: unknown;
  // For bindings that appear as children
  _binding?: boolean;
  prop?: string;
  propName?: string;
  slotDisplayName?: string;
  from?: string;
  transform?: unknown;
}

export interface BindingRef {
  _binding: true;
  from?: string;
  prop: string;
  propName?: string;
  slotDisplayName?: string;
  transform?: unknown;
}

export interface StyleReference {
  id: string;
  className: string;
  type?: string | null;
  comb?: string | null;
  baseCSS?: string | null;
  variantCSS?: Record<
    string,
    {
      breakpoint: string;
      variant: string | null;
      css: string | null;
    }
  >;
}

export interface AttributeRef {
  name: string | { _binding?: boolean; prop?: string };
  value: string | { _binding?: boolean; prop?: string } | unknown;
}

export interface CssClassDefinition {
  className: string;
  type: string | null;
  comb: string | null;
  base: string | null;
  variants: Record<
    string,
    {
      breakpoint: string;
      variantName: string | null;
      css: string | null;
    }
  >;
}

export interface CssVariableDefinition {
  name: string;
  type: string;
  value: string | null;
  resolved?: string;
  modes?: Record<string, string>;
  modesResolved?: Record<string, string>;
}

export interface VariantOption {
  id: string;
  displayName: string;
}

export interface EmbedDefinition {
  id: string;
  type: string;
  displayName?: string | null;
  content: unknown;
  styles?: StyleReference[] | null;
}

// ════════════════════════════════════════════════════════════
// OUTPUT TYPES (generated docs)
// ════════════════════════════════════════════════════════════

export interface ComponentDoc {
  slug: string;
  name: string;
  group: string;
  description: string;

  // For UI components
  tree: import("@/components/ui/WebflowNavigator").TreeNode[];
  properties: import("@/components/ui/WebflowProperties").PropertySection[];
  css: string;
  tokens: import("@/components/ui/DesignTokensTable").DesignToken[];

  // Variant info
  variants: VariantInfo[];

  // Dependencies
  contains: string[];
  usedBy: string[];

  // Raw data for advanced use / Supabase storage
  renderRaw: RenderNode;
  cssRaw: Record<string, CssClassDefinition>;
  breakpoints: Record<string, BreakpointDef>;
  embeds?: EmbedDefinition[] | null;

  // Stats for summary
  stats: {
    propertyCount: number;
    variantCount: number;
    styleCount: number;
    tokenCount: number;
  };
}

export interface VariantInfo {
  propertyId: string;
  propertyLabel: string;
  options: Array<{
    label: string;
    value: string;
  }>;
}

// ════════════════════════════════════════════════════════════
// LOOKUP TABLES (internal use during generation)
// ════════════════════════════════════════════════════════════

export interface LookupTables {
  componentNames: Map<string, string>; // id → displayName
  propertyNames: Map<string, Map<string, string>>; // componentId → (propId → label)
  variantValues: Map<string, Map<string, string>>; // componentId → (valueId → displayName)
  dependencies: Map<string, string[]>; // componentName → [child names]
  reverseDeps: Map<string, string[]>; // componentName → [parent names]
  cssVarNames: Map<string, Map<string, string>>; // componentId → (varId → name)
  slugs: Map<string, string>; // componentName → slug
}

// ════════════════════════════════════════════════════════════
// GENERATION RESULT
// ════════════════════════════════════════════════════════════

export interface GenerationResult {
  docs: ComponentDoc[];
  markdown: Map<string, string>; // slug → markdown content
  indexMarkdown: string;
  stats: {
    totalComponents: number;
    totalProperties: number;
    totalTokens: number;
    totalStyles: number;
  };
}
