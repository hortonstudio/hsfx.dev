"use client";

import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { SitemapPageData } from "@/lib/clients/sitemap-types";
import { PAGE_TYPE_CONFIG } from "@/lib/clients/sitemap-utils";

const STATUS_COLORS: Record<string, string> = {
  planned: "#6b7280",
  in_progress: "#f59e0b",
  complete: "#10b981",
  deferred: "#8b5cf6",
};

function PageTypeIcon({ pageType }: { pageType: string }) {
  const paths: Record<string, string> = {
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4",
    static: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    collection: "M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7zm0 5h16M9 4v16",
    collection_item: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    utility: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    external: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14",
  };

  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[pageType] || paths.static} />
    </svg>
  );
}

type SitemapPageNode = Node<SitemapPageData, "sitemap-page">;

function SitemapNodeComponent({ data, selected }: NodeProps<SitemapPageNode>) {
  const typeConfig = PAGE_TYPE_CONFIG[data.pageType] ?? PAGE_TYPE_CONFIG.static;
  const statusColor = STATUS_COLORS[data.status] ?? STATUS_COLORS.planned;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-border !border-border" />

      <div
        className={`
          w-[260px] rounded-lg border bg-background shadow-sm transition-all
          ${selected ? "border-accent ring-2 ring-accent/30" : "border-border hover:border-accent/40"}
        `}
        style={{ borderLeftWidth: 3, borderLeftColor: typeConfig.color }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2">
          <div style={{ color: typeConfig.color }}>
            <PageTypeIcon pageType={data.pageType} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{data.label}</p>
            <p className="text-[10px] text-text-dim font-mono truncate">{data.path}</p>
          </div>
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: statusColor }}
            title={data.status}
          />
        </div>

        {/* Sections (compact) */}
        {data.sections && data.sections.length > 0 && (
          <div className="px-3 pb-2 flex flex-wrap gap-1">
            {data.sections.slice(0, 4).map((section) => (
              <span
                key={section}
                className="px-1.5 py-0.5 text-[9px] rounded bg-surface text-text-dim"
              >
                {section}
              </span>
            ))}
            {data.sections.length > 4 && (
              <span className="px-1.5 py-0.5 text-[9px] rounded bg-surface text-text-dim">
                +{data.sections.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Collection badge */}
        {data.collectionName && data.estimatedItems && (
          <div className="px-3 pb-2">
            <span className="text-[10px] text-accent">
              {data.collectionName} ({data.estimatedItems} items)
            </span>
          </div>
        )}

        {/* Comment count badge */}
        {data.commentCount && data.commentCount > 0 && (
          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-accent text-white text-[10px] flex items-center justify-center font-medium">
            {data.commentCount}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-border !border-border" />
    </>
  );
}

export default memo(SitemapNodeComponent);
