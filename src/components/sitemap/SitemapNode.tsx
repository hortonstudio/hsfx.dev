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
  Layers,
} from "lucide-react";
import type { SitemapPageData, SitemapPageType, SitemapPageStatus } from "@/lib/clients/sitemap-types";
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

/** Mini wireframe visual block for a page section */
function SectionBlock({ section, color, isFirst }: { section: string; color: string; isFirst: boolean }) {
  const key = section.toLowerCase().split(/[\s,/]+/)[0];
  const border = isFirst ? "" : "border-t border-border/20";

  switch (key) {
    case "hero":
      return (
        <div className={`${border} px-2.5 py-2.5`}>
          <div className="flex flex-col items-center gap-1">
            <div className="w-3/4 h-1 rounded-full" style={{ backgroundColor: `${color}35` }} />
            <div className="w-1/2 h-0.5 rounded-full" style={{ backgroundColor: `${color}20` }} />
            <div className="w-10 h-[7px] rounded mt-0.5" style={{ backgroundColor: `${color}28` }} />
          </div>
          <p className="text-[7px] text-center mt-1 leading-none opacity-40">{section}</p>
        </div>
      );

    case "services":
    case "features":
    case "team":
    case "pricing":
      return (
        <div className={`${border} px-2.5 py-1.5`}>
          <div className="flex items-center justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-[18%] h-[10px] rounded-sm" style={{ backgroundColor: `${color}14` }} />
            ))}
          </div>
          <p className="text-[7px] text-center mt-0.5 leading-none opacity-40">{section}</p>
        </div>
      );

    case "testimonials":
      return (
        <div className={`${border} px-2.5 py-1.5`}>
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-[7px] h-[7px] rounded-full" style={{ backgroundColor: `${color}18` }} />
                <div className="w-3 h-px rounded-full mt-0.5" style={{ backgroundColor: `${color}12` }} />
              </div>
            ))}
          </div>
          <p className="text-[7px] text-center mt-0.5 leading-none opacity-40">{section}</p>
        </div>
      );

    case "cta":
    case "call":
      return (
        <div className={`${border} px-2.5 py-1.5`}>
          <div className="flex items-center justify-center gap-2">
            <div className="w-12 h-px rounded-full" style={{ backgroundColor: `${color}20` }} />
            <div className="w-8 h-[7px] rounded" style={{ backgroundColor: `${color}30` }} />
          </div>
          <p className="text-[7px] text-center mt-0.5 leading-none opacity-40">{section}</p>
        </div>
      );

    case "gallery":
    case "portfolio":
    case "before":
      return (
        <div className={`${border} px-2.5 py-1.5`}>
          <div className="grid grid-cols-3 gap-px mx-auto w-3/4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-[6px] rounded-sm" style={{ backgroundColor: `${color}${12 + i * 2}` }} />
            ))}
          </div>
          <p className="text-[7px] text-center mt-0.5 leading-none opacity-40">{section}</p>
        </div>
      );

    case "faq":
    case "accordion":
      return (
        <div className={`${border} px-2.5 py-1.5`}>
          <div className="flex flex-col gap-[3px] mx-auto w-3/4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-[3px] h-[3px] rounded-sm flex-shrink-0" style={{ backgroundColor: `${color}25` }} />
                <div className="flex-1 h-px rounded-full" style={{ backgroundColor: `${color}15` }} />
              </div>
            ))}
          </div>
          <p className="text-[7px] text-center mt-0.5 leading-none opacity-40">{section}</p>
        </div>
      );

    case "form":
    case "contact":
      return (
        <div className={`${border} px-2.5 py-1.5`}>
          <div className="flex flex-col gap-[3px] mx-auto w-2/3">
            <div className="h-[5px] rounded-sm border" style={{ borderColor: `${color}20` }} />
            <div className="h-[5px] rounded-sm border" style={{ borderColor: `${color}20` }} />
            <div className="w-8 h-[6px] rounded mx-auto mt-px" style={{ backgroundColor: `${color}25` }} />
          </div>
          <p className="text-[7px] text-center mt-0.5 leading-none opacity-40">{section}</p>
        </div>
      );

    case "map":
    case "location":
      return (
        <div className={`${border} px-2.5 py-1.5`}>
          <div className="h-[14px] rounded mx-auto w-3/4 flex items-center justify-center" style={{ backgroundColor: `${color}08` }}>
            <div className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: `${color}30` }} />
          </div>
          <p className="text-[7px] text-center mt-0.5 leading-none opacity-40">{section}</p>
        </div>
      );

    case "stats":
    case "numbers":
      return (
        <div className={`${border} px-2.5 py-1.5`}>
          <div className="flex items-end justify-center gap-1.5">
            {[5, 8, 6].map((h, i) => (
              <div key={i} className="w-[10px] rounded-sm" style={{ height: `${h}px`, backgroundColor: `${color}20` }} />
            ))}
          </div>
          <p className="text-[7px] text-center mt-0.5 leading-none opacity-40">{section}</p>
        </div>
      );

    case "process":
    case "steps":
    case "how":
      return (
        <div className={`${border} px-2.5 py-1.5`}>
          <div className="flex items-center justify-center gap-[3px]">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center gap-[2px]">
                <div
                  className="w-[10px] h-[10px] rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <span className="text-[5px] font-bold" style={{ color: `${color}60` }}>{n}</span>
                </div>
                {n < 3 && <div className="w-[6px] h-px" style={{ backgroundColor: `${color}20` }} />}
              </div>
            ))}
          </div>
          <p className="text-[7px] text-center mt-0.5 leading-none opacity-40">{section}</p>
        </div>
      );

    default:
      return (
        <div className={`${border} px-2.5 py-1`}>
          <div className="flex items-center gap-1 mx-auto w-3/4">
            <div className="w-[3px] h-[6px] rounded-full flex-shrink-0" style={{ backgroundColor: `${color}20` }} />
            <div className="flex-1 h-px rounded-full" style={{ backgroundColor: `${color}12` }} />
          </div>
          <p className="text-[7px] text-center mt-0.5 leading-none opacity-40">{section}</p>
        </div>
      );
  }
}

type SitemapPageNode = Node<SitemapPageData, "sitemap-page">;

function SitemapNodeComponent({ data, selected }: NodeProps<SitemapPageNode>) {
  const typeConfig = PAGE_TYPE_CONFIG[data.pageType] ?? PAGE_TYPE_CONFIG.static;
  const statusColor = STATUS_COLORS[data.status] ?? STATUS_COLORS.planned;
  const TypeIcon = TYPE_ICONS[data.pageType] ?? FileText;
  const nodeColor = data.color || typeConfig.color;
  const isCollection = data.pageType === "collection";

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-surface !border-2 !border-border !rounded-full !-top-1"
      />

      <div
        className={`
          w-[280px] rounded-xl border backdrop-blur-sm
          transition-all duration-200 ease-out relative overflow-hidden
          ${selected
            ? "border-accent shadow-glow-sm ring-1 ring-accent/20 bg-surface"
            : "border-border hover:border-border-hover hover:shadow-md hover:-translate-y-0.5 bg-surface"
          }
        `}
      >
        {/* Top accent bar */}
        <div className="h-[3px]" style={{ backgroundColor: nodeColor }} />

        {/* Header */}
        <div className="px-3.5 pt-2.5 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <span
              className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider"
              style={{ color: nodeColor }}
            >
              <TypeIcon className="w-3 h-3" />
              {typeConfig.label}
            </span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
              <span className="text-[9px] text-text-dim capitalize">
                {(data.status || "planned").replace("_", " ")}
              </span>
            </div>
          </div>

          <h3 className="text-[13px] font-semibold text-text-primary leading-tight mb-0.5 truncate">
            {data.label}
          </h3>
          <p className="text-[10px] text-text-dim font-mono truncate">
            {data.path}
          </p>
        </div>

        {/* Wireframe sections */}
        {data.sections && data.sections.length > 0 && (
          <div className="px-3 pb-2.5">
            <div className="rounded-lg border border-border/30 overflow-hidden bg-background/20">
              {data.sections.slice(0, 7).map((section, i) => (
                <SectionBlock
                  key={`${section}-${i}`}
                  section={section}
                  color={nodeColor}
                  isFirst={i === 0}
                />
              ))}
              {data.sections.length > 7 && (
                <div className="py-1 text-center border-t border-border/20">
                  <span className="text-[7px] opacity-40">
                    +{data.sections.length - 7} more
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Collection template: CMS items */}
        {isCollection && data.collectionItems && data.collectionItems.length > 0 && (
          <div className="px-3 pb-3">
            <div className="rounded-lg border border-border/30 bg-background/20 p-2.5">
              <div className="flex items-center gap-1.5 mb-2">
                <Layers className="w-3 h-3" style={{ color: nodeColor }} />
                <span className="text-[10px] font-semibold text-text-muted">
                  {data.collectionItems.length} CMS {data.collectionItems.length === 1 ? "Item" : "Items"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {data.collectionItems.slice(0, 6).map((item) => (
                  <span
                    key={item.path}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] text-text-muted border border-border/30"
                    style={{ backgroundColor: `${nodeColor}08` }}
                  >
                    {item.label}
                  </span>
                ))}
                {data.collectionItems.length > 6 && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] text-text-dim bg-background/40">
                    +{data.collectionItems.length - 6} more
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Collection info fallback (no items embedded yet) */}
        {data.collectionName && !data.collectionItems && (
          <div className="px-3.5 pb-2.5">
            <div className="flex items-center gap-1.5 text-[10px] text-accent">
              <Database className="w-3 h-3" />
              <span>{data.collectionName}</span>
              {data.estimatedItems != null && (
                <span className="text-text-dim">({data.estimatedItems})</span>
              )}
            </div>
          </div>
        )}

        {/* Comment indicator */}
        {data.commentCount != null && data.commentCount > 0 && (
          <div className="absolute -top-2 -right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-accent text-white text-[9px] font-bold shadow-glow-sm">
            <MessageSquare className="w-2.5 h-2.5" />
            {data.commentCount}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-surface !border-2 !border-border !rounded-full !-bottom-1"
      />
    </>
  );
}

export default memo(SitemapNodeComponent);
