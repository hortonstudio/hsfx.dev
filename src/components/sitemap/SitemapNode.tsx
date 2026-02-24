"use client";

import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import {
  House,
  FileText,
  Database,
  File,
  Settings,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import type { SitemapPageData, SitemapPageType, SitemapPageStatus } from "@/lib/clients/sitemap-types";
import { PAGE_TYPE_CONFIG } from "@/lib/clients/sitemap-utils";
import { Badge } from "@/components/ui";

const STATUS_MAP: Record<SitemapPageStatus, { variant: "default" | "success" | "warning" | "info"; label: string }> = {
  planned: { variant: "default", label: "Planned" },
  in_progress: { variant: "warning", label: "In Progress" },
  complete: { variant: "success", label: "Complete" },
  deferred: { variant: "info", label: "Deferred" },
};

const TYPE_ICONS: Record<SitemapPageType, React.ComponentType<{ className?: string }>> = {
  home: House,
  static: FileText,
  collection: Database,
  collection_item: File,
  utility: Settings,
  external: ExternalLink,
};

/** Visual height mapping for wireframe section blocks */
const SECTION_HEIGHTS: Record<string, string> = {
  hero: "h-8",
  cta: "h-5",
  form: "h-7",
  map: "h-6",
  gallery: "h-7",
  pricing: "h-7",
  testimonials: "h-6",
  faq: "h-6",
  stats: "h-5",
  process: "h-6",
  team: "h-6",
};

function getSectionHeight(section: string): string {
  const key = section.toLowerCase().split(/[\s,/]+/)[0];
  return SECTION_HEIGHTS[key] || "h-4";
}

type SitemapPageNode = Node<SitemapPageData, "sitemap-page">;

function SitemapNodeComponent({ data, selected }: NodeProps<SitemapPageNode>) {
  const typeConfig = PAGE_TYPE_CONFIG[data.pageType] ?? PAGE_TYPE_CONFIG.static;
  const statusInfo = STATUS_MAP[data.status] ?? STATUS_MAP.planned;
  const TypeIcon = TYPE_ICONS[data.pageType] ?? FileText;
  const nodeColor = data.color || typeConfig.color;

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-surface !border-2 !border-border !rounded-full !-top-[5px]"
      />

      <div
        className={`
          w-[280px] rounded-xl border bg-surface backdrop-blur-sm
          transition-all duration-200 ease-out relative overflow-hidden
          ${selected
            ? "border-accent shadow-glow-sm ring-1 ring-accent/20"
            : "border-border hover:border-border-hover hover:shadow-md hover:-translate-y-0.5"
          }
        `}
      >
        {/* Top accent bar */}
        <div
          className="h-[3px]"
          style={{ backgroundColor: nodeColor }}
        />

        {/* Header */}
        <div className="px-3.5 pt-2.5 pb-2">
          {/* Type + Status row */}
          <div className="flex items-center justify-between mb-1.5">
            <span
              className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider"
              style={{ color: nodeColor }}
            >
              <TypeIcon className="w-3 h-3" />
              {typeConfig.label}
            </span>
            <Badge variant={statusInfo.variant} size="sm" dot>
              {statusInfo.label}
            </Badge>
          </div>

          {/* Page name */}
          <h3 className="text-[13px] font-semibold text-text-primary leading-tight mb-0.5 truncate">
            {data.label}
          </h3>

          {/* Path */}
          <p className="text-[10px] text-text-dim font-mono truncate">
            {data.path}
          </p>
        </div>

        {/* Sections — wireframe block preview */}
        {data.sections && data.sections.length > 0 && (
          <div className="px-3.5 pb-2.5">
            <div className="rounded-lg border border-border/60 overflow-hidden">
              {data.sections.slice(0, 6).map((section, i) => (
                <div
                  key={section}
                  className={`
                    ${getSectionHeight(section)} flex items-center px-2.5
                    ${i > 0 ? "border-t border-dashed border-border/40" : ""}
                    ${i === 0 ? "bg-background/80" : "bg-background/40"}
                  `}
                >
                  <span className="text-[9px] text-text-dim leading-none truncate">
                    {section}
                  </span>
                </div>
              ))}
              {data.sections.length > 6 && (
                <div className="h-4 flex items-center justify-center border-t border-dashed border-border/40 bg-background/30">
                  <span className="text-[8px] text-text-dim">
                    +{data.sections.length - 6} more sections
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Collection info */}
        {data.collectionName && (
          <div className="px-3.5 pb-2.5">
            <div className="flex items-center gap-1.5 text-[10px] text-accent">
              <Database className="w-3 h-3" />
              <span>{data.collectionName}</span>
              {data.estimatedItems && (
                <span className="text-text-dim">({data.estimatedItems})</span>
              )}
            </div>
          </div>
        )}

        {/* Comment indicator */}
        {data.commentCount && data.commentCount > 0 && (
          <div className="absolute -top-2 -right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-accent text-white text-[9px] font-bold shadow-glow-sm">
            <MessageSquare className="w-2.5 h-2.5" />
            {data.commentCount}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-surface !border-2 !border-border !rounded-full !-bottom-[5px]"
      />
    </>
  );
}

export default memo(SitemapNodeComponent);
