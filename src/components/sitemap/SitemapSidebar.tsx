"use client";

import { Button } from "@/components/ui";
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
    <div className="w-72 border-l border-border bg-background overflow-y-auto" data-lenis-prevent>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: typeConfig.color }} />
          <span className="text-sm font-medium text-text-primary truncate">{data.label}</span>
        </div>
        <button type="button" onClick={onClose} className="text-text-dim hover:text-text-primary transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-3 space-y-4">
        {/* Page Info */}
        <section className="space-y-2">
          <h4 className="text-[10px] font-medium text-text-dim uppercase tracking-wider">Page Info</h4>

          <div>
            <label className="block text-xs text-text-muted mb-1">Label</label>
            <input
              type="text"
              value={data.label}
              onChange={(e) => onUpdate(nodeId, { label: e.target.value })}
              className="w-full px-2 py-1.5 text-sm bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-accent/50"
            />
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1">Path</label>
            <input
              type="text"
              value={data.path}
              onChange={(e) => onUpdate(nodeId, { path: e.target.value })}
              className="w-full px-2 py-1.5 text-sm bg-surface border border-border rounded text-text-primary font-mono focus:outline-none focus:border-accent/50"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-text-muted mb-1">Type</label>
              <select
                value={data.pageType}
                onChange={(e) => onUpdate(nodeId, { pageType: e.target.value as SitemapPageType })}
                className="w-full px-2 py-1.5 text-sm bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-accent/50"
              >
                {PAGE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-text-muted mb-1">Status</label>
              <select
                value={data.status}
                onChange={(e) => onUpdate(nodeId, { status: e.target.value as SitemapPageStatus })}
                className="w-full px-2 py-1.5 text-sm bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-accent/50"
              >
                {PAGE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="space-y-2">
          <h4 className="text-[10px] font-medium text-text-dim uppercase tracking-wider">Content</h4>

          <div>
            <label className="block text-xs text-text-muted mb-1">Description</label>
            <textarea
              value={data.description ?? ""}
              onChange={(e) => onUpdate(nodeId, { description: e.target.value || undefined })}
              rows={2}
              className="w-full px-2 py-1.5 text-sm bg-surface border border-border rounded text-text-primary resize-none focus:outline-none focus:border-accent/50"
              placeholder="Brief page description..."
            />
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1">
              Sections <span className="text-text-dim">(comma-separated)</span>
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
              className="w-full px-2 py-1.5 text-sm bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-accent/50"
              placeholder="Hero, Content, CTA"
            />
          </div>
        </section>

        {/* SEO */}
        <section className="space-y-2">
          <h4 className="text-[10px] font-medium text-text-dim uppercase tracking-wider">SEO</h4>

          <div>
            <label className="block text-xs text-text-muted mb-1">Title Tag</label>
            <input
              type="text"
              value={data.seoTitle ?? ""}
              onChange={(e) => onUpdate(nodeId, { seoTitle: e.target.value || undefined })}
              className="w-full px-2 py-1.5 text-sm bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-accent/50"
              placeholder="SEO title..."
            />
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1">Meta Description</label>
            <textarea
              value={data.seoDescription ?? ""}
              onChange={(e) => onUpdate(nodeId, { seoDescription: e.target.value || undefined })}
              rows={2}
              className="w-full px-2 py-1.5 text-sm bg-surface border border-border rounded text-text-primary resize-none focus:outline-none focus:border-accent/50"
              placeholder="150-160 chars..."
            />
          </div>
        </section>

        {/* Collection (shown only for collection types) */}
        {(data.pageType === "collection" || data.pageType === "collection_item") && (
          <section className="space-y-2">
            <h4 className="text-[10px] font-medium text-text-dim uppercase tracking-wider">Collection</h4>

            <div>
              <label className="block text-xs text-text-muted mb-1">Collection Name</label>
              <input
                type="text"
                value={data.collectionName ?? ""}
                onChange={(e) => onUpdate(nodeId, { collectionName: e.target.value || undefined })}
                className="w-full px-2 py-1.5 text-sm bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-accent/50"
                placeholder="e.g. Blog Posts"
              />
            </div>

            {data.pageType === "collection" && (
              <div>
                <label className="block text-xs text-text-muted mb-1">Estimated Items</label>
                <input
                  type="number"
                  value={data.estimatedItems ?? ""}
                  onChange={(e) => onUpdate(nodeId, { estimatedItems: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-2 py-1.5 text-sm bg-surface border border-border rounded text-text-primary focus:outline-none focus:border-accent/50"
                  placeholder="e.g. 10"
                  min={0}
                />
              </div>
            )}
          </section>
        )}

        {/* Notes */}
        <section className="space-y-2">
          <h4 className="text-[10px] font-medium text-text-dim uppercase tracking-wider">Notes</h4>
          <textarea
            value={data.notes ?? ""}
            onChange={(e) => onUpdate(nodeId, { notes: e.target.value || undefined })}
            rows={3}
            className="w-full px-2 py-1.5 text-sm bg-surface border border-border rounded text-text-primary resize-none focus:outline-none focus:border-accent/50"
            placeholder="Internal notes..."
          />
        </section>

        {/* Actions */}
        <section className="space-y-2 pt-2 border-t border-border">
          <Button variant="outline" size="sm" className="w-full justify-center" onClick={() => onAddChild(nodeId)}>
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Child Page
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-center" onClick={() => onDuplicate(nodeId)}>
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Duplicate
          </Button>
          <button
            type="button"
            onClick={() => onDelete(nodeId)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Page
          </button>
        </section>
      </div>
    </div>
  );
}
