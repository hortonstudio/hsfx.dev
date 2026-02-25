"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { Button } from "@/components/ui";
import type { SitemapComment } from "@/lib/clients/sitemap-types";

interface SectionCommentPopoverProps {
  sectionName: string;
  nodeId: string;
  comments: SitemapComment[];
  /** API base — e.g. `/api/clients/123/sitemap/comments` or `/api/sitemap/slug/comments` */
  apiEndpoint: string;
  /** For public viewer (unauthenticated) — requires author name */
  isPublic?: boolean;
  onCommentAdded: () => void;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function SectionCommentPopover({
  sectionName,
  nodeId,
  comments,
  apiEndpoint,
  isPublic,
  onCommentAdded,
}: SectionCommentPopoverProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("sitemap-comment-name") ?? "" : ""
  );
  const [submitting, setSubmitting] = useState(false);

  const sectionComments = comments.filter(
    (c) => c.node_id === nodeId && c.section_name === sectionName && !c.parent_id
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    if (isPublic && !authorName.trim()) return;

    setSubmitting(true);

    if (isPublic) {
      localStorage.setItem("sitemap-comment-name", authorName.trim());
    }

    try {
      const body: Record<string, unknown> = {
        node_id: nodeId,
        section_name: sectionName,
        content: content.trim(),
      };
      if (isPublic) {
        body.author_name = authorName.trim();
        body.author_type = "client";
      }

      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setContent("");
        onCommentAdded();
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={`absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded transition-all ${
            sectionComments.length > 0
              ? "opacity-100 text-accent"
              : "opacity-0 group-hover/section:opacity-70 text-text-dim hover:text-accent"
          }`}
        >
          <MessageSquare className="w-3 h-3" />
          {sectionComments.length > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 flex items-center justify-center text-[7px] font-bold rounded-full bg-accent text-white">
              {sectionComments.length}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="right"
          align="start"
          sideOffset={8}
          className="z-50 w-72 rounded-xl border border-border bg-surface shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-border">
            <h4 className="text-xs font-semibold text-text-primary">{sectionName}</h4>
            <p className="text-[10px] text-text-dim mt-0.5">
              {sectionComments.length} {sectionComments.length === 1 ? "comment" : "comments"}
            </p>
          </div>

          {/* Comments */}
          <div className="max-h-48 overflow-y-auto px-4 py-2.5 space-y-2" data-lenis-prevent>
            {sectionComments.length === 0 && (
              <p className="text-[11px] text-text-dim text-center py-3">No comments yet</p>
            )}
            {sectionComments.map((c) => (
              <div key={c.id} className="p-2 rounded-lg bg-background">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-text-secondary">{c.author_name}</span>
                  <span className="text-[9px] text-text-dim">{formatTime(c.created_at)}</span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">{c.content}</p>
              </div>
            ))}
          </div>

          {/* Quick-add form */}
          <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-border space-y-2">
            {isPublic && (
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Your name"
                className="w-full px-2.5 py-1.5 text-[11px] rounded-md border border-border bg-background text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/50 transition-colors"
              />
            )}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Comment on ${sectionName}...`}
              rows={2}
              className="w-full px-2.5 py-1.5 text-[11px] rounded-md border border-border bg-background text-text-primary placeholder:text-text-dim resize-none focus:outline-none focus:border-accent/50 transition-colors"
            />
            <Button
              variant="primary"
              size="sm"
              className="w-full justify-center text-[11px]"
              disabled={submitting || !content.trim() || (isPublic && !authorName.trim())}
            >
              {submitting ? "Posting..." : "Post"}
            </Button>
          </form>

          <Popover.Arrow className="fill-border" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
