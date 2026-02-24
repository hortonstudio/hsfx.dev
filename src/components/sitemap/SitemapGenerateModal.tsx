"use client";

import { useState } from "react";
import { Sparkles, X, ChevronRight } from "lucide-react";
import { Button, Badge, Spinner, useToast } from "@/components/ui";
import { PACKAGE_INFO } from "@/lib/clients/sitemap-templates";
import { NICHE_OPTIONS, type BusinessNiche } from "@/lib/onboard/niche-prompts";
import type { ClientSitemap } from "@/lib/clients/sitemap-types";

interface SitemapGenerateModalProps {
  clientId: string;
  onClose: () => void;
  onGenerated: (sitemap: ClientSitemap) => void;
}

export function SitemapGenerateModal({
  clientId,
  onClose,
  onGenerated,
}: SitemapGenerateModalProps) {
  const { addToast } = useToast();
  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3>(2);
  const [niche, setNiche] = useState<BusinessNiche>("other");
  const [customPrompt, setCustomPrompt] = useState("");
  const [importJson, setImportJson] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/sitemap/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageTier: selectedTier,
          niche: niche !== "other" ? niche : undefined,
          customPrompt: customPrompt.trim() || undefined,
          importJson: importJson.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      const tokens = data.usage
        ? `${data.usage.input_tokens + data.usage.output_tokens} tokens`
        : "";
      addToast({
        variant: "success",
        title: `Sitemap generated (${data.sitemap_data?.nodes?.length ?? 0} pages)`,
        description: tokens ? `Used ${tokens}` : undefined,
      });
      onGenerated(data);
    } catch (err) {
      addToast({
        variant: "error",
        title: "Generation failed",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" data-lenis-prevent>
      <div className="w-full max-w-lg mx-4 rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <h2 className="font-serif text-lg text-text-primary">Generate Sitemap with AI</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={generating}
            className="p-1 text-text-dim hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto" data-lenis-prevent>
          {/* Package tier selection */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Package Tier
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([1, 2, 3] as const).map((tier) => {
                const info = PACKAGE_INFO[tier];
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setSelectedTier(tier)}
                    disabled={generating}
                    className={`
                      p-3 rounded-lg border text-left transition-all
                      ${selectedTier === tier
                        ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                        : "border-border hover:border-accent/40"
                      }
                    `}
                  >
                    <Badge variant={selectedTier === tier ? "info" : "default"} size="sm">
                      {info.price}
                    </Badge>
                    <p className="text-xs text-text-muted mt-1.5">{info.pageRange}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Industry / Niche */}
          <div>
            <label htmlFor="niche-select" className="block text-sm font-medium text-text-primary mb-1.5">
              Industry
            </label>
            <select
              id="niche-select"
              value={niche}
              onChange={(e) => setNiche(e.target.value as BusinessNiche)}
              disabled={generating}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent/50"
            >
              {NICHE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-[10px] text-text-dim mt-1">
              Tailors the sitemap structure for your industry.
            </p>
          </div>

          {/* Custom prompt */}
          <div>
            <label htmlFor="custom-prompt" className="block text-sm font-medium text-text-primary mb-1.5">
              Custom Instructions <span className="text-text-dim font-normal">(optional)</span>
            </label>
            <textarea
              id="custom-prompt"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              disabled={generating}
              placeholder="e.g. Include a gallery page, add service areas for Dallas and Fort Worth..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm placeholder:text-text-dim resize-none focus:outline-none focus:ring-1 focus:ring-accent/50"
              rows={3}
            />
          </div>

          {/* JSON Import toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowImport(!showImport)}
              disabled={generating}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform ${showImport ? "rotate-90" : ""}`}
              />
              Import existing JSON structure
            </button>

            {showImport && (
              <div className="mt-2">
                <textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  disabled={generating}
                  placeholder='Paste a JSON array of pages, e.g. [{"label": "Home", "path": "/", ...}]'
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm font-mono placeholder:text-text-dim resize-none focus:outline-none focus:ring-1 focus:ring-accent/50"
                  rows={5}
                />
                <p className="text-[10px] text-text-dim mt-1">
                  AI will enhance this structure with sections, SEO fields, and descriptions from the knowledge base.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <p className="text-xs text-text-dim">
            Uses compiled Knowledge Base + Claude Sonnet
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} disabled={generating}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <>
                  <Spinner size="sm" className="mr-1.5" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
