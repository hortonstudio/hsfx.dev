"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  House,
  FileText,
  Database,
  File,
  Settings,
  ExternalLink,
} from "lucide-react";
import type { SitemapNode, SitemapEdge, SitemapPageData, SitemapPageType, SitemapPageStatus } from "@/lib/clients/sitemap-types";
import { PAGE_TYPE_CONFIG } from "@/lib/clients/sitemap-utils";
import { Badge } from "@/components/ui";

const TYPE_ICONS: Record<SitemapPageType, React.ComponentType<{ className?: string }>> = {
  home: House,
  static: FileText,
  collection: Database,
  collection_item: File,
  utility: Settings,
  external: ExternalLink,
};

const STATUS_MAP: Record<SitemapPageStatus, { variant: "default" | "success" | "warning" | "info"; label: string }> = {
  planned: { variant: "default", label: "Planned" },
  in_progress: { variant: "warning", label: "In Progress" },
  complete: { variant: "success", label: "Complete" },
  deferred: { variant: "info", label: "Deferred" },
};

interface TreeNode {
  node: SitemapNode;
  children: TreeNode[];
}

interface SitemapStructuralViewProps {
  nodes: SitemapNode[];
  edges: SitemapEdge[];
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
}

function buildTree(nodes: SitemapNode[], edges: SitemapEdge[]): TreeNode[] {
  const childrenMap = new Map<string, string[]>();
  const hasParent = new Set<string>();

  for (const edge of edges) {
    const children = childrenMap.get(edge.source) ?? [];
    children.push(edge.target);
    childrenMap.set(edge.source, children);
    hasParent.add(edge.target);
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  function buildSubtree(nodeId: string): TreeNode | null {
    const node = nodeMap.get(nodeId);
    if (!node) return null;

    const childIds = childrenMap.get(nodeId) ?? [];
    const children = childIds
      .map((id) => buildSubtree(id))
      .filter((t): t is TreeNode => t !== null);

    return { node, children };
  }

  // Find roots (no parent)
  const roots = nodes.filter((n) => !hasParent.has(n.id));
  if (roots.length === 0 && nodes.length > 0) {
    roots.push(nodes[0]);
  }

  const tree = roots
    .map((r) => buildSubtree(r.id))
    .filter((t): t is TreeNode => t !== null);

  // Add orphaned nodes not in any tree
  const visited = new Set<string>();
  function collectIds(t: TreeNode) {
    visited.add(t.node.id);
    t.children.forEach(collectIds);
  }
  tree.forEach(collectIds);

  const orphans = nodes.filter((n) => !visited.has(n.id));
  for (const orphan of orphans) {
    tree.push({ node: orphan, children: [] });
  }

  return tree;
}

function TreeNodeCard({
  treeNode,
  depth,
  selectedNodeId,
  onNodeSelect,
  expandedIds,
  toggleExpanded,
}: {
  treeNode: TreeNode;
  depth: number;
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  expandedIds: Set<string>;
  toggleExpanded: (id: string) => void;
}) {
  const { node, children } = treeNode;
  const data = node.data as SitemapPageData;
  const typeConfig = PAGE_TYPE_CONFIG[data.pageType] ?? PAGE_TYPE_CONFIG.static;
  const statusInfo = STATUS_MAP[data.status] ?? STATUS_MAP.planned;
  const TypeIcon = TYPE_ICONS[data.pageType] ?? FileText;
  const isSelected = selectedNodeId === node.id;
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = children.length > 0;

  return (
    <div>
      {/* Card */}
      <div
        className="relative"
        style={{ paddingLeft: depth * 40 }}
      >
        {/* Connector lines */}
        {depth > 0 && (
          <>
            {/* Vertical line from parent */}
            <div
              className="absolute top-0 bottom-1/2 w-px bg-border"
              style={{ left: (depth - 1) * 40 + 20 }}
            />
            {/* Horizontal line to card */}
            <div
              className="absolute top-1/2 h-px bg-border"
              style={{ left: (depth - 1) * 40 + 20, width: 20 }}
            />
          </>
        )}

        <button
          type="button"
          onClick={() => onNodeSelect(isSelected ? null : node.id)}
          className={`
            w-full text-left rounded-xl border transition-all duration-150
            ${isSelected
              ? "border-accent shadow-glow-sm ring-1 ring-accent/20 bg-surface"
              : "border-border hover:border-border-hover hover:shadow-sm bg-surface/80"
            }
          `}
        >
          {/* Top accent */}
          <div
            className="h-[2px] rounded-t-xl"
            style={{ backgroundColor: `${typeConfig.color}99` }}
          />

          <div className="px-4 py-3">
            {/* Top row: expand toggle + type + status */}
            <div className="flex items-center gap-2 mb-1.5">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(node.id);
                  }}
                  className="p-0.5 rounded hover:bg-background/60 transition-colors"
                >
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-text-dim transition-transform duration-200 ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </button>
              ) : (
                <div className="w-4.5" />
              )}

              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: typeConfig.color }}
              >
                <TypeIcon className="w-3 h-3" />
                {typeConfig.label}
              </span>

              <div className="flex-1" />

              <Badge variant={statusInfo.variant} size="sm" dot>
                {statusInfo.label}
              </Badge>

              {hasChildren && (
                <span className="text-[10px] text-text-dim">
                  {children.length} {children.length === 1 ? "child" : "children"}
                </span>
              )}
            </div>

            {/* Page name + path */}
            <div className="pl-6">
              <h3 className="text-sm font-medium text-text-primary leading-tight mb-0.5">
                {data.label}
              </h3>
              <p className="text-[11px] text-text-dim font-mono">{data.path}</p>

              {/* Description */}
              {data.description && (
                <p className="text-[11px] text-text-muted mt-1.5 leading-relaxed line-clamp-2">
                  {data.description}
                </p>
              )}

              {/* Sections */}
              {data.sections && data.sections.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {data.sections.map((section) => (
                    <div
                      key={section}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-background/60"
                    >
                      <div className="w-0.5 h-2.5 rounded-full bg-border-hover flex-shrink-0" />
                      <span className="text-[10px] text-text-muted leading-none">{section}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* Children */}
      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="relative space-y-2 mt-2">
              {/* Vertical connector line spanning all children */}
              <div
                className="absolute top-0 bottom-4 w-px bg-border"
                style={{ left: depth * 40 + 20 }}
              />
              {children.map((child) => (
                <TreeNodeCard
                  key={child.node.id}
                  treeNode={child}
                  depth={depth + 1}
                  selectedNodeId={selectedNodeId}
                  onNodeSelect={onNodeSelect}
                  expandedIds={expandedIds}
                  toggleExpanded={toggleExpanded}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SitemapStructuralView({
  nodes,
  edges,
  selectedNodeId,
  onNodeSelect,
}: SitemapStructuralViewProps) {
  const tree = useMemo(() => buildTree(nodes, edges), [nodes, edges]);

  // Start with all nodes expanded
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    nodes.forEach((n) => ids.add(n.id));
    return ids;
  });

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <div
      className="flex-1 overflow-y-auto p-8 bg-background"
      data-lenis-prevent
    >
      <div className="max-w-2xl mx-auto space-y-2">
        {tree.map((rootNode) => (
          <TreeNodeCard
            key={rootNode.node.id}
            treeNode={rootNode}
            depth={0}
            selectedNodeId={selectedNodeId}
            onNodeSelect={onNodeSelect}
            expandedIds={expandedIds}
            toggleExpanded={toggleExpanded}
          />
        ))}

        {nodes.length === 0 && (
          <div className="text-center py-16">
            <p className="text-text-dim text-sm">No pages in this sitemap yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
