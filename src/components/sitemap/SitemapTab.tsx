"use client";

import { useState } from "react";
import { Button, Badge, Spinner, useToast } from "@/components/ui";
import type { ClientSitemap } from "@/lib/clients/sitemap-types";
import type { KnowledgeDocument } from "@/lib/clients/types";
import { getTemplate, PACKAGE_INFO } from "@/lib/clients/sitemap-templates";
import { SitemapEditor } from "./SitemapEditor";
import { SitemapGenerateModal } from "./SitemapGenerateModal";

interface SitemapTabProps {
  clientId: string;
  sitemap: ClientSitemap | null;
  compiledDoc: KnowledgeDocument | null;
  onDataChanged: () => void;
}

export function SitemapTab({
  clientId,
  sitemap,
  compiledDoc,
  onDataChanged,
}: SitemapTabProps) {
  const { addToast } = useToast();
  const [localSitemap, setLocalSitemap] = useState<ClientSitemap | null>(sitemap);
  const [creating, setCreating] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);

  const displaySitemap = localSitemap ?? sitemap;

  // ── Create from template ────────────────────────────────
  async function handleCreateFromTemplate(tier: 1 | 2 | 3) {
    setCreating(true);

    try {
      const templateData = getTemplate(tier);
      const res = await fetch(`/api/clients/${clientId}/sitemap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Site Map",
          package_tier: tier,
          sitemap_data: templateData,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create sitemap");
      }

      const data = await res.json();
      setLocalSitemap(data);
      addToast({ variant: "success", title: `Sitemap created (Package ${tier})` });
      onDataChanged();
    } catch (err) {
      addToast({
        variant: "error",
        title: "Failed to create sitemap",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setCreating(false);
    }
  }

  // ── No sitemap yet ────────────────────────────────────────
  if (!displaySitemap) {
    return (
      <div className="space-y-8 mt-6">
        {/* KB status */}
        {!compiledDoc?.content && (
          <div className="flex items-start gap-3 p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-400">Knowledge Base not compiled</p>
              <p className="text-xs text-text-muted mt-1">
                Compile the Knowledge Base first for AI-powered generation. You can still create from a template.
              </p>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="text-center py-8">
          <svg className="w-16 h-16 text-text-dim mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          <h3 className="font-serif text-xl text-text-primary mb-2">No Sitemap Yet</h3>
          <p className="text-text-muted text-sm max-w-md mx-auto mb-8">
            Create a visual sitemap to plan the website structure. Choose a package template or generate with AI.
          </p>

          {creating && (
            <div className="flex items-center justify-center gap-2 mb-6">
              <Spinner size="sm" />
              <span className="text-sm text-text-muted">Creating sitemap...</span>
            </div>
          )}

          {/* Package templates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {([1, 2, 3] as const).map((tier) => {
              const info = PACKAGE_INFO[tier];
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => handleCreateFromTemplate(tier)}
                  disabled={creating}
                  className="text-left p-4 rounded-lg border border-border hover:border-accent/50 hover:bg-surface/50 transition-all disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={tier === 3 ? "info" : "default"}>
                      {info.price}
                    </Badge>
                    <span className="text-xs text-text-dim">{info.pageRange}</span>
                  </div>
                  <h4 className="text-sm font-medium text-text-primary mb-1">{info.name}</h4>
                  <p className="text-xs text-text-muted leading-relaxed">{info.description}</p>
                </button>
              );
            })}
          </div>

          {/* AI Generate button */}
          {compiledDoc?.content && (
            <div className="mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={creating}
                onClick={() => setGenerateOpen(true)}
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Generate with AI
              </Button>
            </div>
          )}
        </div>

        {/* AI Generate modal */}
        {generateOpen && (
          <SitemapGenerateModal
            clientId={clientId}
            onClose={() => setGenerateOpen(false)}
            onGenerated={(generated) => {
              setLocalSitemap(generated);
              setGenerateOpen(false);
              onDataChanged();
            }}
          />
        )}
      </div>
    );
  }

  // ── Sitemap exists — show summary ──────────────────────────
  const nodeCount = displaySitemap.sitemap_data.nodes.length;
  const pageTypes = displaySitemap.sitemap_data.nodes.reduce(
    (acc, n) => {
      acc[n.data.pageType] = (acc[n.data.pageType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6 mt-6">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-serif text-lg text-text-primary">{displaySitemap.title}</h3>
          <Badge variant={displaySitemap.status === "active" ? "success" : "default"}>
            {displaySitemap.status}
          </Badge>
          {displaySitemap.package_tier && (
            <Badge variant="default">Package {displaySitemap.package_tier}</Badge>
          )}
          {displaySitemap.is_public && (
            <Badge variant="default">
              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Public
            </Badge>
          )}
        </div>
        <Button onClick={() => setEditorOpen(true)}>
          Open Editor
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-border bg-surface/30">
          <p className="text-2xl font-serif text-text-primary">{nodeCount}</p>
          <p className="text-xs text-text-muted">Total Pages</p>
        </div>
        {Object.entries(pageTypes).map(([type, count]) => (
          <div key={type} className="p-3 rounded-lg border border-border bg-surface/30">
            <p className="text-2xl font-serif text-text-primary">{count}</p>
            <p className="text-xs text-text-muted capitalize">{type.replace("_", " ")}</p>
          </div>
        ))}
      </div>

      {/* Public link */}
      {displaySitemap.is_public && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-surface/30">
          <svg className="w-4 h-4 text-text-dim flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <code className="text-sm text-text-muted flex-1 truncate">
            {typeof window !== "undefined" ? window.location.origin : ""}/sitemap/{displaySitemap.slug}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/sitemap/${displaySitemap.slug}`);
              addToast({ variant: "success", title: "Link copied" });
            }}
          >
            Copy
          </Button>
        </div>
      )}

      {/* Visual editor overlay */}
      {editorOpen && displaySitemap && (
        <SitemapEditor
          sitemap={displaySitemap}
          clientId={clientId}
          onClose={() => setEditorOpen(false)}
          onSaved={(updated) => {
            setLocalSitemap(updated);
            onDataChanged();
          }}
        />
      )}
    </div>
  );
}
