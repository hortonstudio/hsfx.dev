import type {
  SitemapNode,
  SitemapEdge,
  SitemapPageData,
  SitemapPageType,
  AISitemapNode,
} from "./sitemap-types";

/** Generate a unique node ID */
export function generateNodeId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Generate a URL-safe slug from a business name */
export function generateSlug(businessName: string): string {
  const base = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

/** Create a new sitemap node with defaults */
export function createNode(
  overrides: Partial<SitemapPageData> & { label: string; path: string },
  position?: { x: number; y: number }
): SitemapNode {
  return {
    id: generateNodeId(),
    type: "sitemap-page",
    position: position ?? { x: 0, y: 0 },
    data: {
      pageType: "static",
      status: "planned",
      ...overrides,
    },
  };
}

/** Create an edge between two nodes */
export function createEdge(source: string, target: string): SitemapEdge {
  return {
    id: `edge-${source}-${target}`,
    source,
    target,
    type: "bezier",
  };
}

/** Build edges from AI output (flat nodes with parentId) */
export function buildEdgesFromParentIds(
  nodes: AISitemapNode[]
): SitemapEdge[] {
  const edges: SitemapEdge[] = [];
  for (const node of nodes) {
    if (node.parentId) {
      edges.push(createEdge(node.parentId, node.id));
    }
  }
  return edges;
}

/** Convert AI flat nodes to react-flow SitemapNodes */
export function aiNodesToSitemapNodes(
  aiNodes: AISitemapNode[]
): SitemapNode[] {
  return aiNodes.map((ai) => ({
    id: ai.id,
    type: "sitemap-page" as const,
    position: { x: 0, y: 0 },
    data: {
      label: ai.label,
      path: ai.path,
      pageType: ai.pageType,
      status: "planned" as const,
      description: ai.description,
      sections: ai.sections,
      seoTitle: ai.seoTitle,
      seoDescription: ai.seoDescription,
      collectionName: ai.collectionName,
      estimatedItems: ai.estimatedItems,
    },
  }));
}

/** Page type display info */
export const PAGE_TYPE_CONFIG: Record<
  SitemapPageType,
  { label: string; color: string; icon: string }
> = {
  home: { label: "Home", color: "#3b82f6", icon: "House" },
  static: { label: "Static", color: "#64748b", icon: "FileText" },
  collection: { label: "Collection", color: "#10b981", icon: "Database" },
  collection_item: { label: "Item", color: "#34d399", icon: "File" },
  utility: { label: "Utility", color: "#f59e0b", icon: "Settings" },
  external: { label: "External", color: "#8b5cf6", icon: "ExternalLink" },
};
