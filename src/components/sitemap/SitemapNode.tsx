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

type SitemapPageNode = Node<SitemapPageData, "sitemap-page">;

function SitemapNodeComponent({ data, selected }: NodeProps<SitemapPageNode>) {
  const typeConfig = PAGE_TYPE_CONFIG[data.pageType] ?? PAGE_TYPE_CONFIG.static;
  const statusInfo = STATUS_MAP[data.status] ?? STATUS_MAP.planned;
  const TypeIcon = TYPE_ICONS[data.pageType] ?? FileText;

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-surface !border-2 !border-border !rounded-full !-top-[5px]"
      />

      <div
        className={`
          w-[320px] rounded-xl border bg-surface/80 backdrop-blur-sm
          transition-all duration-200 ease-out relative
          ${selected
            ? "border-accent shadow-glow-sm ring-1 ring-accent/20"
            : "border-border hover:border-border-hover hover:shadow-md hover:-translate-y-0.5"
          }
        `}
      >
        {/* Top accent bar */}
        <div
          className="h-[2px] rounded-t-xl"
          style={{ backgroundColor: `${typeConfig.color}99` }}
        />

        {/* Header */}
        <div className="px-4 pt-3 pb-2">
          {/* Type + Status row */}
          <div className="flex items-center justify-between mb-2">
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: typeConfig.color }}
            >
              <TypeIcon className="w-3 h-3" />
              {typeConfig.label}
            </span>
            <Badge variant={statusInfo.variant} size="sm" dot>
              {statusInfo.label}
            </Badge>
          </div>

          {/* Page name */}
          <h3 className="text-sm font-medium text-text-primary leading-tight mb-0.5 truncate">
            {data.label}
          </h3>

          {/* Path */}
          <p className="text-[11px] text-text-dim font-mono truncate">
            {data.path}
          </p>
        </div>

        {/* Sections — wireframe-style blocks */}
        {data.sections && data.sections.length > 0 && (
          <div className="px-4 pb-3">
            <div className="h-px bg-border mb-2" />
            <div className="space-y-1">
              {data.sections.slice(0, 5).map((section) => (
                <div
                  key={section}
                  className="flex items-center gap-2 px-2 py-1 rounded-md bg-background/60"
                >
                  <div className="w-0.5 h-3 rounded-full bg-border-hover flex-shrink-0" />
                  <span className="text-[11px] text-text-muted leading-none truncate">
                    {section}
                  </span>
                </div>
              ))}
              {data.sections.length > 5 && (
                <span className="text-[10px] text-text-dim pl-4">
                  +{data.sections.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Collection info */}
        {data.collectionName && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-1.5 text-[11px] text-accent">
              <Database className="w-3 h-3" />
              <span>{data.collectionName}</span>
              {data.estimatedItems && (
                <span className="text-text-dim">({data.estimatedItems})</span>
              )}
            </div>
          </div>
        )}

        {/* Comment count */}
        {data.commentCount && data.commentCount > 0 && (
          <div className="absolute -top-2.5 -right-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-accent text-white text-[10px] font-semibold shadow-glow-sm">
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
