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

const VALID_PAGE_TYPES = new Set<string>([
  "home", "static", "collection", "collection_item", "utility", "external",
]);

/** Sections the AI is allowed to emit (case-insensitive match) */
const VALID_SECTIONS = new Set([
  "hero", "content", "services overview", "services grid", "service details",
  "process steps", "stats/numbers", "testimonials", "testimonial grid",
  "faq accordion", "cta", "contact form", "map", "team grid", "team member",
  "story/history", "values", "credentials", "gallery grid", "before/after gallery",
  "blog grid", "blog content", "related posts", "categories", "pricing table",
  "pricing cards", "feature list", "feature grid", "comparison table", "video",
  "image banner", "logo bar", "partners", "portfolio grid", "case study",
  "download/resources", "newsletter signup", "social proof", "breadcrumbs",
  "sidebar", "search", "filters", "area map", "area services",
]);

/** Normalize a URL path: lowercase, leading slash, no trailing slash, no double slashes */
function normalizePath(path: string): string {
  let p = path.toLowerCase().trim();
  if (!p.startsWith("/")) p = `/${p}`;
  p = p.replace(/\/+/g, "/");
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

/** Validate and clean AI-generated nodes before transforming to react-flow format */
export function validateAndCleanAINodes(
  nodes: AISitemapNode[],
  businessName?: string
): AISitemapNode[] {
  // 1. Deduplicate by id
  const seen = new Set<string>();
  const deduped: AISitemapNode[] = [];
  for (const node of nodes) {
    if (!seen.has(node.id)) {
      seen.add(node.id);
      deduped.push(node);
    }
  }

  // 2. Ensure exactly one home page
  const homePages = deduped.filter((n) => n.pageType === "home");
  if (homePages.length === 0 && deduped.length > 0) {
    deduped[0].pageType = "home";
    deduped[0].parentId = null;
  } else if (homePages.length > 1) {
    for (let i = 1; i < homePages.length; i++) {
      homePages[i].pageType = "static";
    }
  }

  const brand = businessName || "Our Company";

  // Build lookup for collection hierarchy validation
  const nodeTypeMap = new Map<string, string>();
  for (const node of deduped) {
    nodeTypeMap.set(node.id, VALID_PAGE_TYPES.has(node.pageType) ? node.pageType : "static");
  }

  // 3. Clean each node
  const cleaned = deduped.map((node) => {
    const pageType = VALID_PAGE_TYPES.has(node.pageType) ? node.pageType : "static";

    // Validate parentId references
    let parentId = node.parentId;
    if (parentId && !seen.has(parentId)) {
      parentId = pageType === "home" ? null : "home";
    }
    if (pageType === "home") {
      parentId = null;
    }

    // Collection hierarchy: collection_item must have a collection parent
    if (pageType === "collection_item" && parentId) {
      const parentType = nodeTypeMap.get(parentId);
      if (parentType && parentType !== "collection") {
        // Find a collection parent with matching collectionName, or fall back to home
        const matchingCollection = deduped.find(
          (n) => n.pageType === "collection" && n.collectionName === node.collectionName
        );
        parentId = matchingCollection?.id ?? "home";
      }
    }

    // Validate sections against the catalog
    const rawSections = Array.from(new Set(node.sections ?? []));
    const sections = rawSections.filter((s) => VALID_SECTIONS.has(s.toLowerCase()));
    // If all sections were invalid, keep the raw ones to avoid empty arrays
    const finalSections = sections.length > 0 ? sections : rawSections;

    // Clamp estimatedItems to reasonable bounds
    let estimatedItems = node.estimatedItems;
    if (estimatedItems != null) {
      estimatedItems = Math.max(1, Math.min(200, Math.round(estimatedItems)));
    }

    return {
      ...node,
      pageType: pageType as SitemapPageType,
      parentId,
      path: normalizePath(node.path),
      sections: finalSections,
      estimatedItems,
      seoTitle: node.seoTitle || `${node.label} | ${brand}`,
      seoDescription:
        node.seoDescription ||
        node.description?.slice(0, 160) ||
        `Learn more about ${node.label}. Contact ${brand} today.`,
      description:
        node.description || `${node.label} page for ${brand}.`,
    };
  });

  // 4. Deduplicate paths — suffix collisions with -2, -3, etc.
  const pathCount = new Map<string, number>();
  for (const node of cleaned) {
    const count = pathCount.get(node.path) ?? 0;
    pathCount.set(node.path, count + 1);
    if (count > 0) {
      node.path = `${node.path}-${count + 1}`;
    }
  }

  return cleaned;
}

/** Collapse collection_item nodes into their parent collection nodes for canvas display.
 *  Items are embedded as `collectionItems` in the parent data, then removed from the node/edge arrays. */
export function collapseCollectionItems(
  nodes: SitemapNode[],
  edges: SitemapEdge[]
): { nodes: SitemapNode[]; edges: SitemapEdge[] } {
  const collectionIds = new Set(
    nodes.filter((n) => n.data.pageType === "collection").map((n) => n.id)
  );

  // Map parent → child items
  const itemsByParent = new Map<string, Array<{ label: string; path: string }>>();
  const itemNodeIds = new Set<string>();

  for (const edge of edges) {
    if (!collectionIds.has(edge.source)) continue;
    const child = nodes.find((n) => n.id === edge.target);
    if (child && child.data.pageType === "collection_item") {
      const items = itemsByParent.get(edge.source) ?? [];
      items.push({ label: child.data.label, path: child.data.path });
      itemsByParent.set(edge.source, items);
      itemNodeIds.add(child.id);
    }
  }

  // Embed items into parent collection data, remove item nodes
  const newNodes = nodes
    .filter((n) => !itemNodeIds.has(n.id))
    .map((n) => {
      if (collectionIds.has(n.id) && itemsByParent.has(n.id)) {
        return {
          ...n,
          data: { ...n.data, collectionItems: itemsByParent.get(n.id)! },
        };
      }
      return n;
    });

  const newEdges = edges.filter(
    (e) => !itemNodeIds.has(e.source) && !itemNodeIds.has(e.target)
  );

  return { nodes: newNodes, edges: newEdges };
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
