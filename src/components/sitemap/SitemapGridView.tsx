"use client";

import { useMemo, useCallback } from "react";
import { Badge } from "@/components/ui";
import type { SitemapNode, SitemapEdge } from "@/lib/clients/sitemap-types";
import { groupNodesIntoSections } from "@/lib/clients/sitemap-utils";
import { SitemapGridCard } from "./SitemapGridCard";

interface SitemapGridViewProps {
  nodes: SitemapNode[];
  edges: SitemapEdge[];
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  readOnly?: boolean;
  onDeleteNode?: (id: string) => void;
  onDuplicateNode?: (id: string) => void;
  onAddChild?: (id: string) => void;
}

export function SitemapGridView({
  nodes,
  edges,
  selectedNodeId,
  onNodeSelect,
  readOnly,
  onDeleteNode,
  onDuplicateNode,
  onAddChild,
}: SitemapGridViewProps) {
  const sections = useMemo(
    () => groupNodesIntoSections(nodes, edges),
    [nodes, edges]
  );

  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onNodeSelect(null);
      }
    },
    [onNodeSelect]
  );

  return (
    <div
      className="flex-1 overflow-y-auto bg-background"
      data-lenis-prevent
      onClick={handleBackgroundClick}
    >
      <div className="max-w-6xl mx-auto px-8 py-8 space-y-10">
        {sections.map((section) => (
          <section key={section.id}>
            {/* Section header */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className="h-[3px] w-8 rounded-full"
                style={{ backgroundColor: section.color }}
              />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                {section.label}
              </h3>
              <Badge variant="default" size="sm">
                {section.nodes.length}
              </Badge>
            </div>

            {/* CSS Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {section.nodes.map((node) => (
                <SitemapGridCard
                  key={node.id}
                  node={node}
                  selected={selectedNodeId === node.id}
                  onClick={() =>
                    onNodeSelect(selectedNodeId === node.id ? null : node.id)
                  }
                  readOnly={readOnly}
                  onDelete={onDeleteNode}
                  onDuplicate={onDuplicateNode}
                  onAddChild={onAddChild}
                />
              ))}
            </div>
          </section>
        ))}

        {sections.length === 0 && (
          <div className="text-center py-20 text-text-dim text-sm">
            No pages yet
          </div>
        )}
      </div>
    </div>
  );
}
