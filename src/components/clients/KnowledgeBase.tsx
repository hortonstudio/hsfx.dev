"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Button, Input, Spinner, useToast, Modal } from "@/components/ui";
import { KnowledgeEntryCard } from "./KnowledgeEntryCard";
import { AddNotesModal } from "./AddNotesModal";
import { CompiledDocViewer } from "./CompiledDocViewer";
import type { KnowledgeEntry, KnowledgeDocument } from "@/lib/clients/types";
import { compressImage } from "@/lib/image-compression";
import { estimateCompilationCost } from "@/lib/clients/token-estimator";

interface KnowledgeBaseProps {
  clientId: string;
  clientName: string;
  entries: KnowledgeEntry[];
  compiledDoc: KnowledgeDocument | null;
  onDataChanged: () => void;
}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/avif"];

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?|$)/i.test(url);
}

export function KnowledgeBase({
  clientId,
  clientName,
  entries,
  compiledDoc,
  onDataChanged,
}: KnowledgeBaseProps) {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // Modal state
  const [notesOpen, setNotesOpen] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<KnowledgeEntry | null>(null);

  // Scrape state
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState(0);

  // Compile state
  const [compiling, setCompiling] = useState(false);
  const [localCompiledDoc, setLocalCompiledDoc] = useState<KnowledgeDocument | null>(compiledDoc);
  const [actualUsage, setActualUsage] = useState<{
    input_tokens: number;
    output_tokens: number;
    total_cost: string;
  } | null>(null);

  // ──────────────────────────────────────────────────
  // FILE UPLOAD (single file)
  // ──────────────────────────────────────────────────

  const uploadFile = useCallback(async (file: File) => {
    // Step 0: Compress image if applicable
    const fileToUpload = await compressImage(file);

    // Step 1: Get signed upload URL
    const uploadRes = await fetch(`/api/clients/${clientId}/knowledge/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: fileToUpload.name,
        contentType: fileToUpload.type,
      }),
    });

    if (!uploadRes.ok) {
      const data = await uploadRes.json().catch(() => ({}));
      throw new Error(data.error || "Failed to get upload URL");
    }

    const { signedUrl, publicUrl } = await uploadRes.json();

    // Step 2: Upload file to signed URL
    const putRes = await fetch(signedUrl, {
      method: "PUT",
      headers: { "Content-Type": fileToUpload.type },
      body: fileToUpload,
    });

    if (!putRes.ok) {
      throw new Error("Failed to upload file");
    }

    // Step 3: Create knowledge entry
    const isImage = IMAGE_TYPES.includes(file.type);
    const entryRes = await fetch(`/api/clients/${clientId}/knowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: isImage ? "screenshot" : "file",
        title: file.name,
        file_url: publicUrl,
        file_type: file.type,
      }),
    });

    if (!entryRes.ok) {
      const data = await entryRes.json().catch(() => ({}));
      throw new Error(data.error || "Failed to create entry");
    }
  }, [clientId]);

  async function handleFiles(files: File[]) {
    if (files.length === 0) return;

    setUploading(true);
    setUploadQueue(files.length);

    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      try {
        await uploadFile(file);
        successCount++;
      } catch (err) {
        failCount++;
        console.error(`Failed to upload ${file.name}:`, err);
      }
      setUploadQueue((prev) => prev - 1);
    }

    if (successCount > 0) {
      addToast({
        variant: "success",
        title: `${successCount} file${successCount > 1 ? "s" : ""} uploaded`,
      });
      onDataChanged();
    }
    if (failCount > 0) {
      addToast({
        variant: "error",
        title: `${failCount} file${failCount > 1 ? "s" : ""} failed to upload`,
      });
    }

    setUploading(false);
    setUploadQueue(0);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    handleFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ──────────────────────────────────────────────────
  // DRAG & DROP
  // ──────────────────────────────────────────────────

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  }

  // ──────────────────────────────────────────────────
  // WEBSITE SCRAPE
  // ──────────────────────────────────────────────────

  async function handleScrape() {
    if (!scrapeUrl.trim()) return;

    setScraping(true);

    try {
      const res = await fetch(`/api/clients/${clientId}/knowledge/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to scrape website");
      }

      addToast({ variant: "success", title: "Website scraped successfully" });
      setScrapeUrl("");
      onDataChanged();
    } catch (err) {
      addToast({
        variant: "error",
        title: "Scrape failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setScraping(false);
    }
  }

  // ──────────────────────────────────────────────────
  // DELETE ENTRY
  // ──────────────────────────────────────────────────

  async function handleDelete(entryId: string) {
    try {
      const res = await fetch(`/api/clients/${clientId}/knowledge/${entryId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete entry");
      }

      addToast({ variant: "success", title: "Entry deleted" });
      onDataChanged();
    } catch (err) {
      addToast({
        variant: "error",
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  // ──────────────────────────────────────────────────
  // COMPILE
  // ──────────────────────────────────────────────────

  async function handleCompile() {
    setCompiling(true);
    setActualUsage(null);

    try {
      const res = await fetch(`/api/clients/${clientId}/knowledge/compile`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to compile knowledge base");
      }

      const data = await res.json();

      // Capture actual usage from response
      if (data.usage) {
        setActualUsage({
          input_tokens: data.usage.input_tokens,
          output_tokens: data.usage.output_tokens,
          total_cost: data.usage.total_cost,
        });
      }

      // Build a local doc object to display immediately
      setLocalCompiledDoc({
        id: localCompiledDoc?.id ?? "",
        client_id: clientId,
        content: data.document,
        last_compiled_at: new Date().toISOString(),
        entry_ids_included: entries.map((e) => e.id),
        metadata: {},
        created_at: localCompiledDoc?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      addToast({ variant: "success", title: "Knowledge base compiled" });
      onDataChanged();
    } catch (err) {
      addToast({
        variant: "error",
        title: "Compilation failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setCompiling(false);
    }
  }

  // ──────────────────────────────────────────────────
  // EXPORT ALL ENTRIES
  // ──────────────────────────────────────────────────

  function handleExportEntries() {
    const sections = entries.map((entry) => {
      const parts = [`## [${entry.type}] ${entry.title}`];
      if (entry.content) parts.push(entry.content);
      if (entry.file_url) parts.push(`File: ${entry.file_url}`);
      return parts.join("\n");
    });

    const markdown = `# Knowledge Base Entries — ${clientName}\n\nExported: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}\nEntries: ${entries.length}\n\n---\n\n${sections.join("\n\n---\n\n")}\n`;

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${clientName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-entries.md`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ variant: "success", title: "Entries exported" });
  }

  // ──────────────────────────────────────────────────
  // COPY AI PROMPT
  // ──────────────────────────────────────────────────

  const [copyingPrompt, setCopyingPrompt] = useState(false);

  async function handleCopyAIPrompt() {
    setCopyingPrompt(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/knowledge/prompt`);
      if (!res.ok) throw new Error("Failed to fetch prompt");

      const { systemPrompt, entriesText, businessName } = await res.json();

      const fullPrompt = `=== SYSTEM PROMPT ===\n${systemPrompt}\n\n=== CLIENT ===\n${businessName}\n\n${entriesText}\n\n=== INSTRUCTION ===\nCompile the above knowledge entries into a structured knowledge base document for "${businessName}".`;

      await navigator.clipboard.writeText(fullPrompt);
      addToast({ variant: "success", title: "AI prompt copied to clipboard" });
    } catch (err) {
      addToast({
        variant: "error",
        title: "Failed to copy prompt",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setCopyingPrompt(false);
    }
  }

  // Use local doc if we just compiled, otherwise use prop
  const displayDoc = localCompiledDoc ?? compiledDoc;

  // Token estimation for compile cost preview
  const costEstimate = useMemo(() => {
    if (entries.length === 0) return null;
    return estimateCompilationCost(entries, clientName);
  }, [entries, clientName]);

  return (
    <div
      className="space-y-6 relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* ──────────────────────────────────────────── */}
      {/* DRAG OVERLAY                                */}
      {/* ──────────────────────────────────────────── */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-accent/5 border-2 border-dashed border-accent rounded-xl flex items-center justify-center backdrop-blur-[2px]">
          <div className="text-center">
            <svg className="w-10 h-10 text-accent mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="text-sm font-medium text-accent">Drop files to upload</p>
            <p className="text-xs text-text-muted mt-1">Images, PDFs, documents</p>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────── */}
      {/* INPUT SECTION                               */}
      {/* ──────────────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-medium text-text-primary">Add Knowledge</h3>

        {/* Action buttons row */}
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" variant="outline" onClick={() => setNotesOpen(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Add Notes
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Spinner size="sm" />
                {uploadQueue > 0 ? `Uploading (${uploadQueue} left)...` : "Uploading..."}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Upload File
              </>
            )}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={handleFileInput}
            accept="image/*,.pdf,.doc,.docx,.txt,.md"
          />
        </div>

        {/* Scrape URL inline input */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={scraping}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleScrape();
                }
              }}
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleScrape}
            disabled={scraping || !scrapeUrl.trim()}
          >
            {scraping ? (
              <>
                <Spinner size="sm" />
                Scraping...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
                Scrape
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ──────────────────────────────────────────── */}
      {/* ENTRIES LIST                                 */}
      {/* ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-text-primary">
          Entries ({entries.length})
        </h3>

        {entries.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            <p className="text-sm text-text-muted">No entries yet.</p>
            <p className="text-xs text-text-dim mt-1">
              Add notes, upload files, or scrape a website to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <KnowledgeEntryCard
                key={entry.id}
                entry={entry}
                onDelete={handleDelete}
                onExpand={setExpandedEntry}
              />
            ))}
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────── */}
      {/* COMPILED DOCUMENT                            */}
      {/* ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-text-primary">
            Compiled Knowledge Base
          </h3>
          <div className="flex items-center gap-3">
            {entries.length > 0 && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleExportEntries}
                  title="Download all raw entries as markdown"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyAIPrompt}
                  disabled={copyingPrompt}
                  title="Copy system prompt + entries for external AI chat"
                >
                  {copyingPrompt ? (
                    <Spinner size="sm" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  )}
                  Copy AI Prompt
                </Button>
              </>
            )}
            {actualUsage ? (
              <div className="text-xs text-text-muted">
                Used: {formatTokens(actualUsage.input_tokens)} in + {formatTokens(actualUsage.output_tokens)} out ={" "}
                <span className="font-medium text-accent">{actualUsage.total_cost}</span>
              </div>
            ) : costEstimate ? (
              <div className="text-xs text-text-muted">
                Est: {costEstimate.formattedInput} in + {costEstimate.formattedOutput} out ~{" "}
                <span className="font-medium text-text-primary">{costEstimate.estimatedCost}</span>
              </div>
            ) : null}
            <Button
              size="sm"
              variant={displayDoc ? "outline" : "primary"}
              onClick={handleCompile}
              disabled={compiling || entries.length === 0}
            >
              {compiling ? (
                <>
                  <Spinner size="sm" />
                  Compiling...
                </>
              ) : displayDoc ? (
                "Recompile"
              ) : (
                "Compile Knowledge Base"
              )}
            </Button>
          </div>
        </div>

        {compiling && (
          <div className="bg-surface border border-border rounded-xl p-8 flex items-center justify-center gap-3">
            <Spinner size="md" />
            <p className="text-sm text-text-muted">
              Compiling knowledge base with AI... This may take 10-20 seconds.
            </p>
          </div>
        )}

        {!compiling && displayDoc && (
          <CompiledDocViewer document={displayDoc} clientId={clientId} onSaved={onDataChanged} />
        )}

        {!compiling && !displayDoc && entries.length > 0 && (
          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            <p className="text-sm text-text-muted">
              No compiled document yet. Click &ldquo;Compile Knowledge Base&rdquo; to generate one from your entries.
            </p>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────── */}
      {/* ADD NOTES MODAL                              */}
      {/* ──────────────────────────────────────────── */}
      <AddNotesModal
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        clientId={clientId}
        onSaved={() => {
          setNotesOpen(false);
          onDataChanged();
        }}
      />

      {/* ──────────────────────────────────────────── */}
      {/* ENTRY EXPAND MODAL                           */}
      {/* ──────────────────────────────────────────── */}
      <Modal
        open={!!expandedEntry}
        onClose={() => setExpandedEntry(null)}
        title={expandedEntry?.title || "Entry Details"}
        size="xl"
      >
        {expandedEntry && (
          <div className="space-y-4 mt-2">
            {/* Full-size image */}
            {expandedEntry.file_url && isImageUrl(expandedEntry.file_url) && (
              <div className="rounded-lg overflow-hidden border border-border bg-background">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={expandedEntry.file_url}
                  alt={expandedEntry.title || "Uploaded image"}
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
              </div>
            )}

            {/* Full content text */}
            {expandedEntry.content && (
              <div className="bg-background border border-border rounded-lg p-4 max-h-[50vh] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-text-secondary leading-relaxed font-mono break-words">
                  {expandedEntry.content}
                </pre>
              </div>
            )}

            {/* Non-image file link */}
            {expandedEntry.file_url && !isImageUrl(expandedEntry.file_url) && (
              <a
                href={expandedEntry.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open file
              </a>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-3 text-xs text-text-dim pt-2 border-t border-border">
              <span>Type: {expandedEntry.type}</span>
              <span>Added: {new Date(expandedEntry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              {expandedEntry.file_type && <span>File: {expandedEntry.file_type}</span>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function formatTokens(tokens: number): string {
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`;
  return tokens.toString();
}
