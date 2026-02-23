"use client";

import { useState } from "react";
import { Button, Spinner, useToast } from "@/components/ui";
import type { KnowledgeDocument } from "@/lib/clients/types";

interface CompiledDocViewerProps {
  document: KnowledgeDocument;
  clientId: string;
  onSaved?: () => void;
}

export function CompiledDocViewer({ document, clientId, onSaved }: CompiledDocViewerProps) {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(document.content);
  const [saving, setSaving] = useState(false);

  const isManuallyEdited = (document.metadata as Record<string, unknown>)?.source === "manual";

  const compiledDate = document.last_compiled_at
    ? new Date(document.last_compiled_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  async function handleCopy() {
    await navigator.clipboard.writeText(document.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([document.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = "knowledge-base.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleStartEdit() {
    setEditContent(document.content);
    setEditing(true);
  }

  function handleCancelEdit() {
    setEditing(false);
    setEditContent(document.content);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/knowledge/compile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save");
      }

      addToast({ variant: "success", title: "Knowledge base updated" });
      setEditing(false);
      onSaved?.();
    } catch (err) {
      addToast({
        variant: "error",
        title: "Save failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {compiledDate && (
            <p className="text-xs text-text-dim">Last compiled: {compiledDate}</p>
          )}
          {isManuallyEdited && (
            <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
              Manually edited
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleCancelEdit} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Spinner size="sm" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={handleStartEdit}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownload}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {editing ? (
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="w-full bg-surface border border-border rounded-xl p-6 text-sm text-text-secondary leading-relaxed font-mono resize-y min-h-[400px] max-h-[700px] focus:outline-none focus:border-accent/50"
          data-lenis-prevent
        />
      ) : (
        <div className="bg-surface border border-border rounded-xl p-6 max-h-[600px] overflow-y-auto" data-lenis-prevent>
          <div className="whitespace-pre-wrap text-sm text-text-secondary leading-relaxed font-mono [&>*]:mb-2 break-words">
            {document.content}
          </div>
        </div>
      )}
    </div>
  );
}
