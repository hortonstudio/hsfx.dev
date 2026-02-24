"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  House,
  FileText,
  Database,
  File,
  Settings,
  ExternalLink,
  Search,
  Plus,
  Copy,
  Trash2,
  Layers,
} from "lucide-react";
import type { SitemapNode, SitemapEdge, SitemapPageData, SitemapPageType, SitemapPageStatus } from "@/lib/clients/sitemap-types";
import { PAGE_TYPE_CONFIG } from "@/lib/clients/sitemap-utils";
import { Badge, Tooltip } from "@/components/ui";

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

/** Section icon hint for structural view */
function SectionIcon({ section, color }: { section: string; color: string }) {
  const key = section.toLowerCase().split(/[\s,/]+/)[0];
  const style = { backgroundColor: `${color}20`, borderColor: `${color}15` };

  switch (key) {
    case "hero":
      return (
        <div className="w-4 h-3 rounded-sm flex items-center justify-center" style={style}>
          <div className="w-2 h-0.5 rounded-full" style={{ backgroundColor: `${color}50` }} />
        </div>
      );
    case "services":
    case "features":
    case "team":
    case "pricing":
      return (
        <div className="w-4 h-3 rounded-sm flex items-center justify-center gap-px" style={style}>
          <div className="w-1 h-1.5 rounded-sm" style={{ backgroundColor: `${color}30` }} />
          <div className="w-1 h-1.5 rounded-sm" style={{ backgroundColor: `${color}30` }} />
          <div className="w-1 h-1.5 rounded-sm" style={{ backgroundColor: `${color}30` }} />
        </div>
      );
    case "cta":
    case "call":
      return (
        <div className="w-4 h-3 rounded-sm flex items-center justify-center" style={style}>
          <div className="w-2.5 h-1 rounded-sm" style={{ backgroundColor: `${color}35` }} />
        </div>
      );
    case "gallery":
    case "portfolio":
      return (
        <div className="w-4 h-3 rounded-sm grid grid-cols-2 gap-px p-px" style={style}>
          <div className="rounded-sm" style={{ backgroundColor: `${color}25` }} />
          <div className="rounded-sm" style={{ backgroundColor: `${color}20` }} />
          <div className="rounded-sm" style={{ backgroundColor: `${color}20` }} />
          <div className="rounded-sm" style={{ backgroundColor: `${color}25` }} />
        </div>
      );
    case "faq":
    case "accordion":
      return (
        <div className="w-4 h-3 rounded-sm flex flex-col items-start justify-center gap-px px-0.5" style={style}>
          <div className="w-full h-px" style={{ backgroundColor: `${color}30` }} />
          <div className="w-3/4 h-px" style={{ backgroundColor: `${color}25` }} />
          <div className="w-full h-px" style={{ backgroundColor: `${color}30` }} />
        </div>
      );
    case "form":
    case "contact":
      return (
        <div className="w-4 h-3 rounded-sm flex flex-col items-center justify-center gap-px" style={style}>
          <div className="w-2.5 h-0.5 rounded-sm border" style={{ borderColor: `${color}25` }} />
          <div className="w-1.5 h-0.5 rounded-sm" style={{ backgroundColor: `${color}30` }} />
        </div>
      );
    case "testimonials":
      return (
        <div className="w-4 h-3 rounded-sm flex items-center justify-center gap-0.5" style={style}>
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: `${color}30` }} />
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: `${color}25` }} />
        </div>
      );
    default:
      return (
        <div className="w-4 h-3 rounded-sm flex items-center justify-center" style={style}>
          <div className="w-2 h-px" style={{ backgroundColor: `${color}30` }} />
        </div>
      );
  }
}

interface TreeNode {
  node: SitemapNode;
  children: TreeNode[];
}

interface SitemapStructuralViewProps {
  nodes: SitemapNode[];
  edges: SitemapEdge[];
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  onAddChild?: (parentId: string) => void;
  onDuplicate?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
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

/** Filter tree to only include nodes matching the query, keeping ancestor paths */
function filterTree(
  tree: TreeNode[],
  searchQuery: string,
  typeFilter: SitemapPageType | "all",
  statusFilter: SitemapPageStatus | "all"
): TreeNode[] {
  const query = searchQuery.toLowerCase();

  function nodeMatches(data: SitemapPageData): boolean {
    const matchesSearch = !query ||
      data.label.toLowerCase().includes(query) ||
      data.path.toLowerCase().includes(query) ||
      (data.description?.toLowerCase().includes(query) ?? false);
    const matchesType = typeFilter === "all" || data.pageType === typeFilter;
    const matchesStatus = statusFilter === "all" || data.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  }

  function filterSubtree(treeNode: TreeNode): TreeNode | null {
    const data = treeNode.node.data as SitemapPageData;
    const filteredChildren = treeNode.children
      .map((child) => filterSubtree(child))
      .filter((t): t is TreeNode => t !== null);

    if (nodeMatches(data) || filteredChildren.length > 0) {
      return { node: treeNode.node, children: filteredChildren };
    }
    return null;
  }

  return tree
    .map((root) => filterSubtree(root))
    .filter((t): t is TreeNode => t !== null);
}

function TreeNodeCard({
  treeNode,
  depth,
  selectedNodeId,
  onNodeSelect,
  expandedIds,
  toggleExpanded,
  onAddChild,
  onDuplicate,
  onDelete,
}: {
  treeNode: TreeNode;
  depth: number;
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  expandedIds: Set<string>;
  toggleExpanded: (id: string) => void;
  onAddChild?: (parentId: string) => void;
  onDuplicate?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
}) {
  const { node, children } = treeNode;
  const data = node.data as SitemapPageData;
  const typeConfig = PAGE_TYPE_CONFIG[data.pageType] ?? PAGE_TYPE_CONFIG.static;
  const nodeColor = data.color || typeConfig.color;
  const statusInfo = STATUS_MAP[data.status] ?? STATUS_MAP.planned;
  const TypeIcon = TYPE_ICONS[data.pageType] ?? FileText;
  const isSelected = selectedNodeId === node.id;
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = children.length > 0;
  const hasActions = onAddChild || onDuplicate || onDelete;

  // Check if this is a collection with collection_item children
  const isCollection = data.pageType === "collection";
  const collectionItemChildren = isCollection
    ? children.filter((c) => (c.node.data as SitemapPageData).pageType === "collection_item")
    : [];
  const nonItemChildren = isCollection
    ? children.filter((c) => (c.node.data as SitemapPageData).pageType !== "collection_item")
    : children;
  const hasCollectionItems = collectionItemChildren.length > 0;

  return (
    <div>
      {/* Card */}
      <div
        className="relative group"
        style={{ paddingLeft: depth * 40 }}
      >
        {/* Connector lines */}
        {depth > 0 && (
          <>
            <div
              className="absolute top-0 bottom-1/2 w-px bg-border"
              style={{ left: (depth - 1) * 40 + 20 }}
            />
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
            w-full text-left rounded-xl border transition-all duration-150 relative overflow-hidden
            ${isSelected
              ? "border-accent shadow-glow-sm ring-1 ring-accent/20 bg-surface"
              : "border-border hover:border-border-hover hover:shadow-sm bg-surface/80"
            }
          `}
        >
          {/* Top accent */}
          <div
            className="h-[2px]"
            style={{ backgroundColor: `${nodeColor}99` }}
          />

          <div className="px-4 py-3">
            {/* Top row: expand toggle + type + status */}
            <div className="flex items-center gap-2 mb-1.5">
              {(hasChildren) ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(node.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.stopPropagation(); toggleExpanded(node.id); }
                  }}
                  className="p-0.5 rounded hover:bg-background/60 transition-colors"
                >
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-text-dim transition-transform duration-200 ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </span>
              ) : (
                <div className="w-4.5" />
              )}

              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: nodeColor }}
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

              {data.description && (
                <p className="text-[11px] text-text-muted mt-1.5 leading-relaxed line-clamp-2">
                  {data.description}
                </p>
              )}

              {/* Sections — compact visual pills */}
              {data.sections && data.sections.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {data.sections.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 pl-0.5 pr-2 py-0.5 rounded-md text-[9px] text-text-muted border border-border/30"
                      style={{ backgroundColor: `${nodeColor}06` }}
                    >
                      <SectionIcon section={s} color={nodeColor} />
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Collection items inline preview */}
              {hasCollectionItems && (
                <div className="mt-2.5 rounded-lg border border-border/30 bg-background/20 p-2.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Layers className="w-3 h-3" style={{ color: nodeColor }} />
                    <span className="text-[10px] font-semibold text-text-muted">
                      {collectionItemChildren.length} CMS {collectionItemChildren.length === 1 ? "Item" : "Items"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {collectionItemChildren.slice(0, 8).map((child) => (
                      <span
                        key={child.node.id}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] text-text-muted border border-border/20"
                        style={{ backgroundColor: `${nodeColor}08` }}
                      >
                        {(child.node.data as SitemapPageData).label}
                      </span>
                    ))}
                    {collectionItemChildren.length > 8 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] text-text-dim bg-background/40">
                        +{collectionItemChildren.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Inline action buttons (hover) */}
          {hasActions && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
              {onAddChild && (
                <Tooltip content="Add Child" side="top">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onAddChild(node.id); } }}
                    className="p-1 rounded-md text-text-dim hover:text-text-primary hover:bg-background/60 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </span>
                </Tooltip>
              )}
              {onDuplicate && (
                <Tooltip content="Duplicate" side="top">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); onDuplicate(node.id); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onDuplicate(node.id); } }}
                    className="p-1 rounded-md text-text-dim hover:text-text-primary hover:bg-background/60 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                  </span>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip content="Delete" side="top">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onDelete(node.id); } }}
                    className="p-1 rounded-md text-text-dim hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </span>
                </Tooltip>
              )}
            </div>
          )}
        </button>
      </div>

      {/* Children (non-collection-item children only for collections) */}
      <AnimatePresence>
        {(isCollection ? nonItemChildren.length > 0 : hasChildren) && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="relative space-y-2 mt-2">
              <div
                className="absolute top-0 bottom-4 w-px bg-border"
                style={{ left: depth * 40 + 20 }}
              />
              {(isCollection ? nonItemChildren : children).map((child) => (
                <TreeNodeCard
                  key={child.node.id}
                  treeNode={child}
                  depth={depth + 1}
                  selectedNodeId={selectedNodeId}
                  onNodeSelect={onNodeSelect}
                  expandedIds={expandedIds}
                  toggleExpanded={toggleExpanded}
                  onAddChild={onAddChild}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
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
  onAddChild,
  onDuplicate,
  onDelete,
}: SitemapStructuralViewProps) {
  const tree = useMemo(() => buildTree(nodes, edges), [nodes, edges]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<SitemapPageType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<SitemapPageStatus | "all">("all");

  const hasFilters = searchQuery || typeFilter !== "all" || statusFilter !== "all";
  const filteredTree = useMemo(
    () => hasFilters ? filterTree(tree, searchQuery, typeFilter, statusFilter) : tree,
    [tree, searchQuery, typeFilter, statusFilter, hasFilters]
  );

  // Expand/collapse
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

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(nodes.map((n) => n.id)));
  }, [nodes]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  // Stats
  const stats = useMemo(() => {
    const byType: Partial<Record<SitemapPageType, number>> = {};
    nodes.forEach((n) => {
      const t = (n.data as SitemapPageData).pageType;
      byType[t] = (byType[t] || 0) + 1;
    });
    return { total: nodes.length, byType };
  }, [nodes]);

  return (
    <div
      className="flex-1 overflow-y-auto p-8 bg-background"
      data-lenis-prevent
    >
      <div className="max-w-2xl mx-auto">
        {/* Search / Filter Bar */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4 space-y-3">
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-dim" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pages..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as SitemapPageType | "all")}
              className="px-3 py-2 text-xs bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
            >
              <option value="all">All Types</option>
              {(Object.keys(PAGE_TYPE_CONFIG) as SitemapPageType[]).map((t) => (
                <option key={t} value={t}>{PAGE_TYPE_CONFIG[t].label}</option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SitemapPageStatus | "all")}
              className="px-3 py-2 text-xs bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
            >
              <option value="all">All Statuses</option>
              {(Object.keys(STATUS_MAP) as SitemapPageStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_MAP[s].label}</option>
              ))}
            </select>

            {/* Expand/Collapse */}
            <div className="flex items-center gap-0.5">
              <Tooltip content="Expand All" side="bottom">
                <button
                  type="button"
                  onClick={expandAll}
                  className="p-2 rounded-lg text-text-dim hover:text-text-primary hover:bg-surface transition-colors"
                >
                  <ChevronsDown className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <Tooltip content="Collapse All" side="bottom">
                <button
                  type="button"
                  onClick={collapseAll}
                  className="p-2 rounded-lg text-text-dim hover:text-text-primary hover:bg-surface transition-colors"
                >
                  <ChevronsUp className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-3 text-[11px] text-text-dim">
            <span className="font-medium text-text-muted">{stats.total} pages</span>
            <span className="text-border">|</span>
            {(Object.entries(stats.byType) as [SitemapPageType, number][]).map(([type, count]) => (
              <span key={type} className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: PAGE_TYPE_CONFIG[type]?.color }}
                />
                {count} {PAGE_TYPE_CONFIG[type]?.label}
              </span>
            ))}
          </div>
        </div>

        {/* Tree */}
        <div className="space-y-2">
          {filteredTree.map((rootNode) => (
            <TreeNodeCard
              key={rootNode.node.id}
              treeNode={rootNode}
              depth={0}
              selectedNodeId={selectedNodeId}
              onNodeSelect={onNodeSelect}
              expandedIds={expandedIds}
              toggleExpanded={toggleExpanded}
              onAddChild={onAddChild}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
          ))}

          {nodes.length === 0 && (
            <div className="text-center py-16">
              <p className="text-text-dim text-sm">No pages in this sitemap yet.</p>
            </div>
          )}

          {nodes.length > 0 && filteredTree.length === 0 && (
            <div className="text-center py-16">
              <p className="text-text-dim text-sm">No pages match your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
