"use client";

import { useState } from "react";
import { Badge, Spinner } from "@/components/ui";
import type { KnowledgeEntry } from "@/lib/clients/types";

interface KnowledgeEntryCardProps {
  entry: KnowledgeEntry;
  onDelete: (id: string) => void;
}

const TYPE_CONFIG: Record<
  KnowledgeEntry["type"],
  { label: string; variant: "default" | "success" | "warning" }
> = {
  meeting_notes: { label: "Notes", variant: "default" },
  screenshot: { label: "Screenshot", variant: "warning" },
  website_scrape: { label: "Scrape", variant: "success" },
  submission_summary: { label: "Submission", variant: "success" },
  file: { label: "File", variant: "default" },
  other: { label: "Other", variant: "default" },
};

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?|$)/i.test(url);
}

export function KnowledgeEntryCard({ entry, onDelete }: KnowledgeEntryCardProps) {
  const [deleting, setDeleting] = useState(false);

  const config = TYPE_CONFIG[entry.type] ?? TYPE_CONFIG.other;

  const displayTitle =
    entry.title || (entry.content ? entry.content.slice(0, 80) + (entry.content.length > 80 ? "..." : "") : "Untitled");

  const formattedDate = new Date(entry.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  async function handleDelete() {
    setDeleting(true);
    onDelete(entry.id);
  }

  return (
    <div className="group bg-surface border border-border rounded-lg p-4 hover:border-border/80 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={config.variant} size="sm">
              {config.label}
            </Badge>
            <span className="text-xs text-text-dim">{formattedDate}</span>
          </div>

          <h4 className="text-sm font-medium text-text-primary truncate">
            {displayTitle}
          </h4>

          {entry.content && (
            <p className="text-xs text-text-muted mt-1 line-clamp-2">
              {entry.content.slice(0, 150)}
              {entry.content.length > 150 ? "..." : ""}
            </p>
          )}
        </div>

        {/* Thumbnail for images */}
        {entry.file_url && isImageUrl(entry.file_url) && (
          <div className="shrink-0 w-16 h-16 rounded-md overflow-hidden border border-border bg-background">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entry.file_url}
              alt={entry.title || "Uploaded image"}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Delete button */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="shrink-0 p-1.5 rounded-md text-text-dim hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
          title="Delete entry"
        >
          {deleting ? (
            <Spinner size="sm" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
