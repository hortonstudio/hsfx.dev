import type { SitemapNode, SitemapEdge } from "./sitemap-types";

interface LayoutConfig {
  nodeWidth: number;
  nodeHeight: number;
  horizontalGap: number;
  verticalGap: number;
  /** Max children per row before wrapping to next row */
  maxChildrenPerRow: number;
  /** Vertical gap between rows of children (smaller than verticalGap) */
  rowGap: number;
}

const DEFAULT_CONFIG: LayoutConfig = {
  nodeWidth: 280,
  nodeHeight: 240,
  horizontalGap: 80,
  verticalGap: 120,
  maxChildrenPerRow: 4,
  rowGap: 60,
};

/**
 * Auto-layout algorithm: positions nodes in a top-down tree.
 * Wraps children into multiple rows when a parent has many children.
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

  /** Split an array into chunks of maxSize */
  function chunk<T>(arr: T[], maxSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += maxSize) {
      chunks.push(arr.slice(i, i + maxSize));
    }
    return chunks;
  }

  // Compute subtree widths — accounts for multi-row wrapping
  const subtreeWidth = new Map<string, number>();
  const subtreeHeight = new Map<string, number>();

  function computeSize(nodeId: string): { width: number; height: number } {
    const children = childrenMap.get(nodeId) ?? [];
    if (children.length === 0) {
      subtreeWidth.set(nodeId, cfg.nodeWidth);
      subtreeHeight.set(nodeId, cfg.nodeHeight);
      return { width: cfg.nodeWidth, height: cfg.nodeHeight };
    }

    // Compute child sizes first
    children.forEach((cId) => computeSize(cId));

    // Split children into rows
    const rows = chunk(children, cfg.maxChildrenPerRow);
    let maxRowWidth = 0;
    let totalChildHeight = 0;

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const rowWidth = row.reduce(
        (sum, cId) => sum + (subtreeWidth.get(cId) ?? cfg.nodeWidth),
        0
      ) + (row.length - 1) * cfg.horizontalGap;
      maxRowWidth = Math.max(maxRowWidth, rowWidth);

      // Row height = tallest subtree in this row
      const rowHeight = Math.max(
        ...row.map((cId) => subtreeHeight.get(cId) ?? cfg.nodeHeight)
      );
      totalChildHeight += rowHeight;
      if (r > 0) totalChildHeight += cfg.rowGap;
    }

    const width = Math.max(cfg.nodeWidth, maxRowWidth);
    const height = cfg.nodeHeight + cfg.verticalGap + totalChildHeight;

    subtreeWidth.set(nodeId, width);
    subtreeHeight.set(nodeId, height);
    return { width, height };
  }

  for (const root of roots) {
    computeSize(root.id);
  }

  // Position nodes
  const positions = new Map<string, { x: number; y: number }>();

  function positionSubtree(nodeId: string, x: number, y: number) {
    const myWidth = subtreeWidth.get(nodeId) ?? cfg.nodeWidth;
    positions.set(nodeId, {
      x: x + myWidth / 2 - cfg.nodeWidth / 2,
      y,
    });

    const children = childrenMap.get(nodeId) ?? [];
    if (children.length === 0) return;

    const rows = chunk(children, cfg.maxChildrenPerRow);
    let rowY = y + cfg.nodeHeight + cfg.verticalGap;

    for (const row of rows) {
      const rowWidth = row.reduce(
        (sum, cId) => sum + (subtreeWidth.get(cId) ?? cfg.nodeWidth),
        0
      ) + (row.length - 1) * cfg.horizontalGap;

      // Center the row under the parent
      let childX = x + (myWidth - rowWidth) / 2;

      let rowMaxHeight = 0;
      for (const childId of row) {
        positionSubtree(childId, childX, rowY);
        childX += (subtreeWidth.get(childId) ?? cfg.nodeWidth) + cfg.horizontalGap;
        rowMaxHeight = Math.max(rowMaxHeight, subtreeHeight.get(childId) ?? cfg.nodeHeight);
      }

      rowY += rowMaxHeight + cfg.rowGap;
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
