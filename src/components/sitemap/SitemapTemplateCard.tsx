"use client";

import { useState } from "react";
import { Database, Layers } from "lucide-react";
import { SectionWireframeStack } from "./SectionWireframe";
import type { SitemapPageData } from "@/lib/clients/sitemap-types";
import type { SitemapNode } from "@/lib/clients/sitemap-types";
import { PAGE_TYPE_CONFIG } from "@/lib/clients/sitemap-utils";

interface SitemapTemplateCardProps {
  node: SitemapNode;
  selected: boolean;
  onClick: () => void;
  commentSlot?: (sectionName: string) => React.ReactNode;
}

export function SitemapTemplateCard({
  node,
  selected,
  onClick,
  commentSlot,
}: SitemapTemplateCardProps) {
  const data = node.data as SitemapPageData;
  const typeConfig = PAGE_TYPE_CONFIG[data.pageType] ?? PAGE_TYPE_CONFIG.collection;
  const nodeColor = data.color || typeConfig.color;

  const [itemsExpanded, setItemsExpanded] = useState(false);
  const collectionItems = data.collectionItems ?? [];
  const visibleItems = itemsExpanded ? collectionItems : collectionItems.slice(0, 6);
  const itemOverflow = collectionItems.length - 6;

  return (
    <div className="relative">
      {/* Stacked-card effect: offset shadows behind */}
      <div
        className="absolute inset-0 rounded-xl border border-border/20 bg-surface/30 translate-x-1 translate-y-1"
        style={{ borderColor: `${nodeColor}22` }}
      />
      <div
        className="absolute inset-0 rounded-xl border border-border/10 bg-surface/15 translate-x-2 translate-y-2"
        style={{ borderColor: `${nodeColor}18` }}
      />

      {/* Main card */}
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => { if (e.key === "Enter") onClick(); }}
        className={`
          relative w-full text-left rounded-xl border
          transition-all duration-200 ease-out
          ${selected
            ? "border-accent shadow-glow-sm ring-1 ring-accent/20 bg-surface"
            : "border-border hover:border-border-hover bg-surface"
          }
        `}
        onMouseEnter={(e) => {
          if (!selected) e.currentTarget.style.boxShadow = `0 4px 20px ${nodeColor}25, 0 2px 8px ${nodeColor}18`;
        }}
        onMouseLeave={(e) => {
          if (!selected) e.currentTarget.style.boxShadow = "";
        }}
      >
        {/* Top accent bar — dashed gradient to distinguish from page cards */}
        <div
          className="h-[3px] rounded-t-xl"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, ${nodeColor} 0px, ${nodeColor}c0 6px, transparent 6px, transparent 10px)`,
          }}
        />

        <div className="p-3.5">
          {/* Header */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <Database className="w-3.5 h-3.5" style={{ color: nodeColor }} />
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: nodeColor }}
            >
              Page Template
            </span>
          </div>

          {/* Title + path */}
          <h3 className="text-sm font-semibold text-text-primary leading-snug truncate">
            {data.label}
          </h3>
          <p className="text-[11px] text-text-muted font-mono truncate mt-0.5">
            {data.path}
          </p>

          {/* Description */}
          {data.description && (
            <p className="text-[11px] text-text-muted/80 leading-relaxed mt-1.5 line-clamp-2">
              {data.description}
            </p>
          )}

          {/* Section wireframes */}
          {data.sections && data.sections.length > 0 && (
            <SectionWireframeStack sections={data.sections} color={nodeColor} commentSlot={commentSlot} />
          )}

          {/* Planned pages from this template */}
          {collectionItems.length > 0 && (
            <div className="mt-3">
              <div className="rounded-lg border border-border/40 bg-background/30 p-2.5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Layers className="w-3.5 h-3.5" style={{ color: nodeColor }} />
                  <span className="text-[10px] font-semibold text-text-muted">
                    {collectionItems.length} Planned {collectionItems.length === 1 ? "Page" : "Pages"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {visibleItems.map((item) => (
                    <span
                      key={item.path}
                      className="inline-flex items-center px-2 py-0.5 rounded text-[9px] text-text-muted font-medium border border-border/30"
                      style={{ backgroundColor: `${nodeColor}12` }}
                    >
                      {item.label}
                    </span>
                  ))}
                  {itemOverflow > 0 && !itemsExpanded && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); setItemsExpanded(true); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); setItemsExpanded(true); } }}
                      className="inline-flex items-center px-2 py-0.5 rounded text-[9px] text-accent font-medium bg-accent/5 hover:bg-accent/10 transition-colors cursor-pointer"
                    >
                      +{itemOverflow} more
                    </span>
                  )}
                  {itemsExpanded && itemOverflow > 0 && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); setItemsExpanded(false); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); setItemsExpanded(false); } }}
                      className="inline-flex items-center px-2 py-0.5 rounded text-[9px] text-text-dim font-medium hover:text-text-muted transition-colors cursor-pointer"
                    >
                      Show less
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Estimated items (when no specific items listed) */}
          {collectionItems.length === 0 && data.estimatedItems != null && (
            <div className="mt-2 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-text-dim" />
              <span className="text-[10px] text-text-dim">
                ~{data.estimatedItems} planned pages
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
