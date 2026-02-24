"use client";

import { Plus, Copy, Trash2, X } from "lucide-react";
import { Button, Tooltip } from "@/components/ui";
import type { SitemapPageData, SitemapPageType, SitemapPageStatus } from "@/lib/clients/sitemap-types";
import { PAGE_TYPE_CONFIG } from "@/lib/clients/sitemap-utils";

interface SitemapSidebarProps {
  nodeId: string;
  data: SitemapPageData;
  onUpdate: (nodeId: string, updates: Partial<SitemapPageData>) => void;
  onDelete: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => void;
  onAddChild: (parentId: string) => void;
  onClose: () => void;
}

const PAGE_TYPES: { value: SitemapPageType; label: string }[] = [
  { value: "home", label: "Home" },
  { value: "static", label: "Static Page" },
  { value: "collection", label: "Collection" },
  { value: "collection_item", label: "Collection Item" },
  { value: "utility", label: "Utility" },
  { value: "external", label: "External" },
];

const PAGE_STATUSES: { value: SitemapPageStatus; label: string }[] = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "complete", label: "Complete" },
  { value: "deferred", label: "Deferred" },
];

export function SitemapSidebar({
  nodeId,
  data,
  onUpdate,
  onDelete,
  onDuplicate,
  onAddChild,
  onClose,
}: SitemapSidebarProps) {
  const typeConfig = PAGE_TYPE_CONFIG[data.pageType] ?? PAGE_TYPE_CONFIG.static;

  return (
    <div className="w-80 border-l border-border bg-surface/50 backdrop-blur-sm overflow-y-auto" data-lenis-prevent>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: typeConfig.color }}
          />
          <span className="text-sm font-medium text-text-primary truncate">{data.label}</span>
        </div>
        <Tooltip content="Close" side="left">
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-text-dim hover:text-text-primary hover:bg-background/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      <div className="p-5 space-y-6">
        {/* Page Info */}
        <section className="space-y-3">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Page Info
          </h4>

          <div>
            <label className="block text-xs text-text-dim mb-1.5">Label</label>
            <input
              type="text"
              value={data.label}
              onChange={(e) => onUpdate(nodeId, { label: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-text-dim mb-1.5">Path</label>
            <input
              type="text"
              value={data.path}
              onChange={(e) => onUpdate(nodeId, { path: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-text-dim mb-1.5">Type</label>
              <select
                value={data.pageType}
                onChange={(e) => onUpdate(nodeId, { pageType: e.target.value as SitemapPageType })}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
              >
                {PAGE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-text-dim mb-1.5">Status</label>
              <select
                value={data.status}
                onChange={(e) => onUpdate(nodeId, { status: e.target.value as SitemapPageStatus })}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
              >
                {PAGE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="space-y-3">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Content
          </h4>

          <div>
            <label className="block text-xs text-text-dim mb-1.5">Description</label>
            <textarea
              value={data.description ?? ""}
              onChange={(e) => onUpdate(nodeId, { description: e.target.value || undefined })}
              rows={2}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary resize-none focus:outline-none focus:border-accent/50 transition-colors"
              placeholder="Brief page description..."
            />
          </div>

          <div>
            <label className="block text-xs text-text-dim mb-1.5">
              Sections <span className="text-text-dim/60">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={(data.sections ?? []).join(", ")}
              onChange={(e) => {
                const sections = e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                onUpdate(nodeId, { sections: sections.length > 0 ? sections : undefined });
              }}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
              placeholder="Hero, Content, CTA"
            />
          </div>
        </section>

        {/* SEO */}
        <section className="space-y-3">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            SEO
          </h4>

          <div>
            <label className="block text-xs text-text-dim mb-1.5">Title Tag</label>
            <input
              type="text"
              value={data.seoTitle ?? ""}
              onChange={(e) => onUpdate(nodeId, { seoTitle: e.target.value || undefined })}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
              placeholder="SEO title..."
            />
          </div>

          <div>
            <label className="block text-xs text-text-dim mb-1.5">Meta Description</label>
            <textarea
              value={data.seoDescription ?? ""}
              onChange={(e) => onUpdate(nodeId, { seoDescription: e.target.value || undefined })}
              rows={2}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary resize-none focus:outline-none focus:border-accent/50 transition-colors"
              placeholder="150-160 chars..."
            />
          </div>
        </section>

        {/* Collection */}
        {(data.pageType === "collection" || data.pageType === "collection_item") && (
          <section className="space-y-3">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Collection
            </h4>

            <div>
              <label className="block text-xs text-text-dim mb-1.5">Collection Name</label>
              <input
                type="text"
                value={data.collectionName ?? ""}
                onChange={(e) => onUpdate(nodeId, { collectionName: e.target.value || undefined })}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
                placeholder="e.g. Blog Posts"
              />
            </div>

            {data.pageType === "collection" && (
              <div>
                <label className="block text-xs text-text-dim mb-1.5">Estimated Items</label>
                <input
                  type="number"
                  value={data.estimatedItems ?? ""}
                  onChange={(e) => onUpdate(nodeId, { estimatedItems: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
                  placeholder="e.g. 10"
                  min={0}
                />
              </div>
            )}
          </section>
        )}

        {/* Notes */}
        <section className="space-y-3">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Notes
          </h4>
          <textarea
            value={data.notes ?? ""}
            onChange={(e) => onUpdate(nodeId, { notes: e.target.value || undefined })}
            rows={3}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary resize-none focus:outline-none focus:border-accent/50 transition-colors"
            placeholder="Internal notes..."
          />
        </section>

        {/* Actions */}
        <section className="space-y-2 pt-4 border-t border-border">
          <Button variant="outline" size="sm" className="w-full justify-center" onClick={() => onAddChild(nodeId)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Child Page
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-center" onClick={() => onDuplicate(nodeId)}>
            <Copy className="w-3.5 h-3.5 mr-1.5" />
            Duplicate
          </Button>
          <button
            type="button"
            onClick={() => onDelete(nodeId)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Page
          </button>
        </section>
      </div>
    </div>
  );
}
