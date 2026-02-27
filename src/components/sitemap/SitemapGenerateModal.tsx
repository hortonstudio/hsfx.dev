"use client";

import { useState, useRef } from "react";
import { Sparkles, X, ChevronRight, Copy, ClipboardPaste, Download, FileDown } from "lucide-react";
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
  const [copyingPrompt, setCopyingPrompt] = useState(false);
  const [manualResponse, setManualResponse] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [pasteDragging, setPasteDragging] = useState(false);
  const [importDragging, setImportDragging] = useState(false);
  const [promptFiles, setPromptFiles] = useState<Array<{ title: string; url: string; type: string }>>([]);
  const [downloadingFiles, setDownloadingFiles] = useState(false);
  const pasteFileRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  function handleFileToState(file: File, setter: (v: string) => void) {
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsText(file);
  }

  async function downloadFile(url: string, filename: string) {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(blobUrl);
  }

  async function handleDownloadAllFiles() {
    setDownloadingFiles(true);
    try {
      for (const file of promptFiles) {
        await downloadFile(file.url, file.title);
      }
      addToast({ variant: "success", title: `${promptFiles.length} file(s) downloaded` });
    } catch {
      addToast({ variant: "error", title: "Some files failed to download" });
    } finally {
      setDownloadingFiles(false);
    }
  }

  async function handleCopyPrompt() {
    setCopyingPrompt(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/sitemap/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageTier: selectedTier,
          niche: niche !== "other" ? niche : undefined,
          customPrompt: customPrompt.trim() || undefined,
          importJson: importJson.trim() || undefined,
          returnPromptOnly: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to build prompt");
      }

      const data = await res.json();
      await navigator.clipboard.writeText(data.prompt);
      if (data.files?.length > 0) setPromptFiles(data.files);
      addToast({ variant: "success", title: "Prompt copied to clipboard" });
      setShowPaste(true);
    } catch (err) {
      addToast({
        variant: "error",
        title: "Failed to copy prompt",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setCopyingPrompt(false);
    }
  }

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
          manualResponse: manualResponse.trim() || undefined,
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
              <div
                className={`mt-2 transition-colors ${importDragging ? "rounded-lg ring-2 ring-accent/50" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setImportDragging(true); }}
                onDragLeave={() => setImportDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setImportDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file && file.name.endsWith(".json")) handleFileToState(file, setImportJson);
                }}
              >
                <textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  disabled={generating}
                  placeholder='Paste or drop a JSON array of pages, e.g. [{"label": "Home", "path": "/", ...}]'
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm font-mono placeholder:text-text-dim resize-none focus:outline-none focus:ring-1 focus:ring-accent/50"
                  rows={5}
                />
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileToState(file, setImportJson);
                    e.target.value = "";
                  }}
                />
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] text-text-dim flex-1">
                    AI will enhance this structure with sections, SEO fields, and descriptions.
                  </p>
                  <button
                    type="button"
                    onClick={() => importFileRef.current?.click()}
                    className="text-[10px] text-accent hover:text-accent/80 transition-colors"
                  >
                    Upload .json
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Manual AI Flow */}
          <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl space-y-3">
            <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
              <Copy className="w-4 h-4 text-accent" />
              Manual AI Flow
            </h3>
            <p className="text-[11px] text-text-muted">
              Copy the prompt, paste into Claude chat, then paste the response back here.
            </p>

            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyPrompt}
              disabled={copyingPrompt || generating}
              className="w-full justify-center"
            >
              {copyingPrompt ? (
                <>
                  <Spinner size="sm" className="mr-1.5" />
                  Building prompt...
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Step 1: Copy Prompt
                </>
              )}
            </Button>

            {/* Files to attach */}
            {promptFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-text-muted">
                    Files to Attach ({promptFiles.length})
                  </label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDownloadAllFiles}
                    disabled={downloadingFiles}
                    className="text-xs h-6 px-2"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    {downloadingFiles ? "Downloading..." : "Download All"}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {promptFiles.map((file, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => downloadFile(file.url, file.title)}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-border bg-surface/50 hover:bg-surface text-left transition-colors"
                    >
                      <FileDown className="w-3 h-3 text-accent flex-shrink-0" />
                      <span className="text-[10px] text-text-muted truncate">{file.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showPaste && (
              <div
                className={`space-y-2 transition-colors ${pasteDragging ? "rounded-lg ring-2 ring-accent/50" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setPasteDragging(true); }}
                onDragLeave={() => setPasteDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setPasteDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file && file.name.endsWith(".json")) handleFileToState(file, setManualResponse);
                }}
              >
                <label className="block text-xs font-medium text-text-muted">
                  Step 2: Paste AI Response or drop .json file
                </label>
                <textarea
                  value={manualResponse}
                  onChange={(e) => setManualResponse(e.target.value)}
                  disabled={generating}
                  placeholder="Paste the JSON array response from Claude here..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm font-mono placeholder:text-text-dim resize-none focus:outline-none focus:ring-1 focus:ring-accent/50"
                  rows={5}
                />
                <input
                  ref={pasteFileRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileToState(file, setManualResponse);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => pasteFileRef.current?.click()}
                  className="text-[10px] text-accent hover:text-accent/80 transition-colors"
                >
                  Upload .json
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <p className="text-xs text-text-dim">
            Uses compiled Knowledge Base
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} disabled={generating}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating || (showPaste && !manualResponse.trim())}
            >
              {generating ? (
                <>
                  <Spinner size="sm" className="mr-1.5" />
                  Processing...
                </>
              ) : manualResponse.trim() ? (
                <>
                  <ClipboardPaste className="w-4 h-4 mr-1.5" />
                  Process Response
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
