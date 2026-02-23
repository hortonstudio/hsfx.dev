"use client";

import { PAGE_TYPE_CONFIG } from "@/lib/clients/sitemap-utils";
import type { SitemapPageType } from "@/lib/clients/sitemap-types";

const STATUS_LEGEND = [
  { label: "Planned", color: "#6b7280" },
  { label: "In Progress", color: "#f59e0b" },
  { label: "Complete", color: "#10b981" },
  { label: "Deferred", color: "#8b5cf6" },
];

export function SitemapLegend() {
  return (
    <div className="absolute bottom-4 left-4 z-10 p-3 rounded-lg border border-border bg-background/90 backdrop-blur-sm shadow-sm">
      <p className="text-[10px] font-medium text-text-dim uppercase tracking-wider mb-2">Page Types</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
        {(Object.entries(PAGE_TYPE_CONFIG) as [SitemapPageType, { label: string; color: string }][]).map(
          ([, config]) => (
            <div key={config.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: config.color }} />
              <span className="text-[10px] text-text-muted">{config.label}</span>
            </div>
          )
        )}
      </div>
      <p className="text-[10px] font-medium text-text-dim uppercase tracking-wider mb-1.5">Status</p>
      <div className="flex gap-x-3 gap-y-1">
        {STATUS_LEGEND.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-[10px] text-text-muted">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
