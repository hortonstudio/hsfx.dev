"use client";

import { useState } from "react";
import {
  House,
  FileText,
  Database,
  File,
  Settings,
  ExternalLink,
  MessageSquare,
  Layers,
  Plus,
  Copy,
  Trash2,
} from "lucide-react";
import { Tooltip } from "@/components/ui";
import type { SitemapPageData, SitemapPageType, SitemapPageStatus } from "@/lib/clients/sitemap-types";
import type { SitemapNode } from "@/lib/clients/sitemap-types";
import { PAGE_TYPE_CONFIG } from "@/lib/clients/sitemap-utils";

const STATUS_COLORS: Record<SitemapPageStatus, string> = {
  planned: "#64748b",
  in_progress: "#f59e0b",
  complete: "#10b981",
  deferred: "#6366f1",
};

const TYPE_ICONS: Record<SitemapPageType, React.ComponentType<{ className?: string }>> = {
  home: House,
  static: FileText,
  collection: Database,
  collection_item: File,
  utility: Settings,
  external: ExternalLink,
};

interface SitemapGridCardProps {
  node: SitemapNode;
  selected: boolean;
  onClick: () => void;
  readOnly?: boolean;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onAddChild?: (id: string) => void;
}

export function SitemapGridCard({
  node,
  selected,
  onClick,
  readOnly,
  onDelete,
  onDuplicate,
  onAddChild,
}: SitemapGridCardProps) {
  const data = node.data as SitemapPageData;
  const typeConfig = PAGE_TYPE_CONFIG[data.pageType] ?? PAGE_TYPE_CONFIG.static;
  const statusColor = STATUS_COLORS[data.status] ?? STATUS_COLORS.planned;
  const TypeIcon = TYPE_ICONS[data.pageType] ?? FileText;
  const nodeColor = data.color || typeConfig.color;
  const isCollection = data.pageType === "collection";
  const hasActions = !readOnly && (onDelete || onDuplicate || onAddChild);

  const [itemsExpanded, setItemsExpanded] = useState(false);

  const collectionItems = data.collectionItems ?? [];
  const visibleItems = itemsExpanded ? collectionItems : collectionItems.slice(0, 8);
  const itemOverflow = collectionItems.length - 8;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter") onClick(); }}
      className={`
        group w-full text-left rounded-xl border
        transition-all duration-200 ease-out relative
        ${selected
          ? "border-accent shadow-glow-sm ring-1 ring-accent/20 bg-surface"
          : "border-border hover:border-border-hover hover:shadow-md bg-surface"
        }
      `}
    >
      {/* Top accent bar */}
      <div className="h-[3px] rounded-t-xl" style={{ backgroundColor: nodeColor }} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-1.5">
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ color: nodeColor }}
          >
            <TypeIcon className="w-3.5 h-3.5" />
            {typeConfig.label}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
            <span className="text-[10px] text-text-muted font-medium capitalize">
              {(data.status || "planned").replace("_", " ")}
            </span>
          </div>
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
          <p className="text-[11px] text-text-muted/80 leading-relaxed mt-2 line-clamp-2">
            {data.description}
          </p>
        )}

        {/* Sections — vertical list */}
        {data.sections && data.sections.length > 0 && (
          <div className="mt-3 space-y-1">
            {data.sections.map((section, i) => (
              <div
                key={`${section}-${i}`}
                className="flex items-center gap-2"
              >
                <div
                  className="w-0.5 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: `${nodeColor}60` }}
                />
                <span className="text-[10px] text-text-muted">{section}</span>
              </div>
            ))}
          </div>
        )}

        {/* Collection: CMS items */}
        {isCollection && collectionItems.length > 0 && (
          <div className="mt-3">
            <div className="rounded-lg border border-border/40 bg-background/30 p-2.5">
              <div className="flex items-center gap-1.5 mb-2">
                <Layers className="w-3.5 h-3.5" style={{ color: nodeColor }} />
                <span className="text-[10px] font-semibold text-text-muted">
                  {collectionItems.length} {collectionItems.length === 1 ? "Item" : "Items"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {visibleItems.map((item) => (
                  <span
                    key={item.path}
                    className="inline-flex items-center px-2 py-0.5 rounded text-[9px] text-text-muted font-medium border border-border/30"
                    style={{ backgroundColor: `${nodeColor}08` }}
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

        {/* Collection: template-only */}
        {isCollection && collectionItems.length === 0 && !data.collectionItems && (
          <div className="mt-3">
            <div
              className="rounded-lg border border-dashed p-2.5"
              style={{ borderColor: `${nodeColor}30` }}
            >
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" style={{ color: nodeColor }} />
                <span className="text-[10px] font-semibold text-text-muted">
                  CMS Template
                </span>
                {data.estimatedItems != null && (
                  <span className="text-[10px] text-text-dim ml-auto">
                    ~{data.estimatedItems} items
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comment indicator */}
      {data.commentCount != null && data.commentCount > 0 && (
        <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-accent text-white text-[9px] font-bold shadow-glow-sm">
          <MessageSquare className="w-2.5 h-2.5" />
          {data.commentCount}
        </div>
      )}

      {/* Hover action buttons (editor only) */}
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
                <Plus className="w-3.5 h-3.5" />
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
                <Copy className="w-3.5 h-3.5" />
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
                <Trash2 className="w-3.5 h-3.5" />
              </span>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
}
