"use client";

import { useState, useRef } from "react";
import { Button, Input, Spinner, useToast } from "@/components/ui";
import { KnowledgeEntryCard } from "./KnowledgeEntryCard";
import { AddNotesModal } from "./AddNotesModal";
import { CompiledDocViewer } from "./CompiledDocViewer";
import type { KnowledgeEntry, KnowledgeDocument } from "@/lib/clients/types";

interface KnowledgeBaseProps {
  clientId: string;
  entries: KnowledgeEntry[];
  compiledDoc: KnowledgeDocument | null;
  onDataChanged: () => void;
}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/avif"];

export function KnowledgeBase({
  clientId,
  entries,
  compiledDoc,
  onDataChanged,
}: KnowledgeBaseProps) {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal state
  const [notesOpen, setNotesOpen] = useState(false);

  // Scrape state
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);

  // Compile state
  const [compiling, setCompiling] = useState(false);
  const [localCompiledDoc, setLocalCompiledDoc] = useState<KnowledgeDocument | null>(compiledDoc);

  // ──────────────────────────────────────────────────
  // FILE UPLOAD
  // ──────────────────────────────────────────────────

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // Step 1: Get signed upload URL
      const uploadRes = await fetch(`/api/clients/${clientId}/knowledge/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
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
        headers: { "Content-Type": file.type },
        body: file,
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

      addToast({ variant: "success", title: "File uploaded successfully" });
      onDataChanged();
    } catch (err) {
      addToast({
        variant: "error",
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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

    try {
      const res = await fetch(`/api/clients/${clientId}/knowledge/compile`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to compile knowledge base");
      }

      const data = await res.json();

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

  // Use local doc if we just compiled, otherwise use prop
  const displayDoc = localCompiledDoc ?? compiledDoc;

  return (
    <div className="space-y-6">
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
              <Spinner size="sm" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            )}
            Upload File
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
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

        {compiling && (
          <div className="bg-surface border border-border rounded-xl p-8 flex items-center justify-center gap-3">
            <Spinner size="md" />
            <p className="text-sm text-text-muted">
              Compiling knowledge base with AI... This may take 10-20 seconds.
            </p>
          </div>
        )}

        {!compiling && displayDoc && (
          <CompiledDocViewer document={displayDoc} />
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
    </div>
  );
}
