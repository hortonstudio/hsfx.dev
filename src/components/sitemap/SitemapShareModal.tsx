"use client";

import { useState } from "react";
import { Button, useToast } from "@/components/ui";
import type { ClientSitemap } from "@/lib/clients/sitemap-types";

interface SitemapShareModalProps {
  sitemap: ClientSitemap;
  clientId: string;
  onClose: () => void;
  onUpdated: (updated: ClientSitemap) => void;
}

export function SitemapShareModal({
  sitemap,
  clientId,
  onClose,
  onUpdated,
}: SitemapShareModalProps) {
  const { addToast } = useToast();
  const [isPublic, setIsPublic] = useState(sitemap.is_public);
  const [allowComments, setAllowComments] = useState(sitemap.allow_comments);
  const [slug, setSlug] = useState(sitemap.slug);
  const [saving, setSaving] = useState(false);

  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/sitemap/${slug}`
    : `/sitemap/${slug}`;

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/sitemap`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_public: isPublic,
          allow_comments: allowComments,
          slug,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Save failed");
      }

      const updated = await res.json();
      onUpdated(updated);
      addToast({ variant: "success", title: "Share settings saved" });
      onClose();
    } catch (err) {
      addToast({
        variant: "error",
        title: "Failed to save",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" data-lenis-prevent>
      <div className="w-full max-w-md mx-4 rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-serif text-lg text-text-primary">Share Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-text-dim hover:text-text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Public toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Public Access</p>
              <p className="text-xs text-text-muted mt-0.5">Anyone with the link can view</p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`
                relative w-10 h-5 rounded-full transition-colors
                ${isPublic ? "bg-accent" : "bg-surface border border-border"}
              `}
            >
              <span
                className={`
                  absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform
                  ${isPublic ? "translate-x-5" : "translate-x-0.5"}
                `}
              />
            </button>
          </div>

          {/* Comments toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">Allow Comments</p>
              <p className="text-xs text-text-muted mt-0.5">Visitors can leave feedback</p>
            </div>
            <button
              type="button"
              onClick={() => setAllowComments(!allowComments)}
              className={`
                relative w-10 h-5 rounded-full transition-colors
                ${allowComments ? "bg-accent" : "bg-surface border border-border"}
              `}
            >
              <span
                className={`
                  absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform
                  ${allowComments ? "translate-x-5" : "translate-x-0.5"}
                `}
              />
            </button>
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="share-slug" className="block text-sm font-medium text-text-primary mb-1.5">
              URL Slug
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-dim">/sitemap/</span>
              <input
                id="share-slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="flex-1 px-2.5 py-1.5 rounded-md border border-border bg-surface text-text-primary text-sm font-mono focus:outline-none focus:ring-1 focus:ring-accent/50"
              />
            </div>
          </div>

          {/* Public URL preview */}
          {isPublic && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-surface/30">
              <svg className="w-4 h-4 text-text-dim flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <code className="text-xs text-text-muted flex-1 truncate">{publicUrl}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(publicUrl);
                  addToast({ variant: "success", title: "Link copied" });
                }}
              >
                Copy
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
