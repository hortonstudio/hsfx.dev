"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui";
import type { SitemapComment } from "@/lib/clients/sitemap-types";

interface SitemapCommentPanelProps {
  slug: string;
  comments: SitemapComment[];
  selectedNodeId: string | null;
  onCommentAdded: () => void;
  onClose: () => void;
}

export function SitemapCommentPanel({
  slug,
  comments,
  selectedNodeId,
  onCommentAdded,
  onClose,
}: SitemapCommentPanelProps) {
  const [filter, setFilter] = useState<"all" | "unresolved" | "node">("all");
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load saved author name
  useEffect(() => {
    const saved = localStorage.getItem("sitemap-comment-name");
    if (saved) setAuthorName(saved);
  }, []);

  // Filter comments
  const filtered = comments.filter((c) => {
    if (c.parent_id) return false;
    if (filter === "unresolved") return !c.is_resolved;
    if (filter === "node") return c.node_id === selectedNodeId;
    return true;
  });

  function getReplies(commentId: string) {
    return comments.filter((c) => c.parent_id === commentId);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!authorName.trim() || !content.trim()) return;

    setSubmitting(true);
    localStorage.setItem("sitemap-comment-name", authorName.trim());

    try {
      const res = await fetch(`/api/sitemap/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_name: authorName.trim(),
          content: content.trim(),
          node_id: filter === "node" ? selectedNodeId : null,
          author_type: "client",
        }),
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

  return (
    <div className="w-80 border-l border-border bg-surface flex flex-col" data-lenis-prevent>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <h3 className="text-sm font-medium text-text-primary">Comments</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-text-dim hover:text-text-primary hover:bg-background/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-1 px-5 py-2.5 border-b border-border">
        {(["all", "unresolved", ...(selectedNodeId ? ["node" as const] : [])] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 text-[11px] rounded-md transition-colors ${
              filter === f
                ? "bg-accent/10 text-accent font-medium"
                : "text-text-dim hover:text-text-muted hover:bg-background/60"
            }`}
          >
            {f === "all" ? "All" : f === "unresolved" ? "Unresolved" : "This Page"}
          </button>
        ))}
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3" data-lenis-prevent>
        {filtered.length === 0 && (
          <p className="text-xs text-text-dim text-center py-6">No comments yet</p>
        )}
        {filtered.map((comment) => (
          <div key={comment.id} className="space-y-2">
            {/* Main comment */}
            <div className={`p-3 rounded-lg ${comment.is_resolved ? "bg-background/50 opacity-60" : "bg-background"}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-text-secondary">{comment.author_name}</span>
                <span className="text-[10px] text-text-dim">{formatTime(comment.created_at)}</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">{comment.content}</p>
              <div className="flex items-center gap-1.5 mt-2">
                {comment.node_id && (
                  <span className="inline-block px-1.5 py-0.5 text-[9px] rounded bg-accent/10 text-accent">
                    Page: {comment.node_id}
                  </span>
                )}
                {comment.is_resolved && (
                  <span className="inline-block px-1.5 py-0.5 text-[9px] rounded bg-green-500/10 text-green-400">
                    Resolved
                  </span>
                )}
              </div>
            </div>

            {/* Replies */}
            {getReplies(comment.id).map((reply) => (
              <div key={reply.id} className="ml-4 p-2.5 rounded-lg bg-background/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-text-secondary">{reply.author_name}</span>
                  <span className="text-[9px] text-text-dim">{formatTime(reply.created_at)}</span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">{reply.content}</p>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="p-5 border-t border-border space-y-2.5">
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Your name"
          className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/50 transition-colors"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={selectedNodeId && filter === "node" ? "Comment on this page..." : "Add a comment..."}
          rows={2}
          className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-text-primary placeholder:text-text-dim resize-none focus:outline-none focus:border-accent/50 transition-colors"
        />
        <Button
          variant="primary"
          size="sm"
          className="w-full justify-center"
          disabled={submitting || !authorName.trim() || !content.trim()}
        >
          {submitting ? "Posting..." : "Post Comment"}
        </Button>
      </form>
    </div>
  );
}
