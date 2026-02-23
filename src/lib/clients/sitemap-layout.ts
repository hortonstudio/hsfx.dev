import type { SitemapNode, SitemapEdge } from "./sitemap-types";

interface LayoutConfig {
  nodeWidth: number;
  nodeHeight: number;
  horizontalGap: number;
  verticalGap: number;
}

const DEFAULT_CONFIG: LayoutConfig = {
  nodeWidth: 280,
  nodeHeight: 100,
  horizontalGap: 40,
  verticalGap: 80,
};

/**
 * Auto-layout algorithm: positions nodes in a top-down tree.
 * Returns new nodes with updated positions (does not mutate input).
 */
export function autoLayout(
  nodes: SitemapNode[],
  edges: SitemapEdge[],
  config: Partial<LayoutConfig> = {}
): SitemapNode[] {
  if (nodes.length === 0) return [];

  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Build adjacency: parent → children
  const childrenMap = new Map<string, string[]>();
  const hasParent = new Set<string>();

  for (const edge of edges) {
    const children = childrenMap.get(edge.source) ?? [];
    children.push(edge.target);
    childrenMap.set(edge.source, children);
    hasParent.add(edge.target);
  }

  // Find root nodes (no incoming edges)
  const roots = nodes.filter((n) => !hasParent.has(n.id));
  if (roots.length === 0) {
    // Fallback: treat first node as root
    roots.push(nodes[0]);
  }

  // BFS to assign levels
  const nodeLevel = new Map<string, number>();
  const levelNodes = new Map<number, string[]>();
  const queue: { id: string; level: number }[] = roots.map((r) => ({
    id: r.id,
    level: 0,
  }));
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    nodeLevel.set(id, level);
    const nodesAtLevel = levelNodes.get(level) ?? [];
    nodesAtLevel.push(id);
    levelNodes.set(level, nodesAtLevel);

    const children = childrenMap.get(id) ?? [];
    for (const childId of children) {
      if (!visited.has(childId)) {
        queue.push({ id: childId, level: level + 1 });
      }
    }
  }

  // Handle orphaned nodes (not connected to any root)
  const maxLevel = Math.max(0, ...Array.from(levelNodes.keys()));
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      const orphanLevel = maxLevel + 1;
      nodeLevel.set(node.id, orphanLevel);
      const nodesAtLevel = levelNodes.get(orphanLevel) ?? [];
      nodesAtLevel.push(node.id);
      levelNodes.set(orphanLevel, nodesAtLevel);
    }
  }

  // Compute subtree widths for better centering
  const subtreeWidth = new Map<string, number>();

  function computeWidth(nodeId: string): number {
    const children = childrenMap.get(nodeId) ?? [];
    if (children.length === 0) {
      const w = cfg.nodeWidth;
      subtreeWidth.set(nodeId, w);
      return w;
    }

    const totalChildrenWidth = children.reduce((sum, childId) => {
      return sum + computeWidth(childId);
    }, 0);

    const gapWidth = (children.length - 1) * cfg.horizontalGap;
    const w = Math.max(cfg.nodeWidth, totalChildrenWidth + gapWidth);
    subtreeWidth.set(nodeId, w);
    return w;
  }

  for (const root of roots) {
    computeWidth(root.id);
  }

  // Position nodes
  const positions = new Map<string, { x: number; y: number }>();

  function positionSubtree(nodeId: string, x: number, y: number) {
    positions.set(nodeId, {
      x: x + (subtreeWidth.get(nodeId) ?? cfg.nodeWidth) / 2 - cfg.nodeWidth / 2,
      y,
    });

    const children = childrenMap.get(nodeId) ?? [];
    if (children.length === 0) return;

    const totalWidth =
      children.reduce((sum, cId) => sum + (subtreeWidth.get(cId) ?? cfg.nodeWidth), 0) +
      (children.length - 1) * cfg.horizontalGap;

    let childX = x + ((subtreeWidth.get(nodeId) ?? cfg.nodeWidth) - totalWidth) / 2;
    const childY = y + cfg.nodeHeight + cfg.verticalGap;

    for (const childId of children) {
      positionSubtree(childId, childX, childY);
      childX += (subtreeWidth.get(childId) ?? cfg.nodeWidth) + cfg.horizontalGap;
    }
  }

  // Position each root tree side by side
  let rootX = 0;
  for (const root of roots) {
    positionSubtree(root.id, rootX, 0);
    rootX += (subtreeWidth.get(root.id) ?? cfg.nodeWidth) + cfg.horizontalGap * 2;
  }

  // Position orphaned nodes
  const allLevels = Array.from(levelNodes.keys()).sort((a, b) => a - b);
  for (const level of allLevels) {
    const nodesAtLevel = levelNodes.get(level) ?? [];
    for (const nodeId of nodesAtLevel) {
      if (!positions.has(nodeId)) {
        positions.set(nodeId, {
          x: rootX,
          y: level * (cfg.nodeHeight + cfg.verticalGap),
        });
        rootX += cfg.nodeWidth + cfg.horizontalGap;
      }
    }
  }

  // Return new nodes with updated positions
  return nodes.map((node) => ({
    ...node,
    position: positions.get(node.id) ?? node.position,
  }));
}
