"use client";

import { useState } from "react";
import { CheckCircle, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import type { SitemapComment } from "@/lib/clients/sitemap-types";

interface SitemapNodeCommentsProps {
  nodeId: string;
  comments: SitemapComment[];
  clientId: string;
  onCommentAdded: () => void;
  onResolve?: (commentId: string, resolved: boolean) => void;
  onDelete?: (commentId: string) => void;
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

export function SitemapNodeComments({
  nodeId,
  comments,
  clientId,
  onCommentAdded,
  onResolve,
  onDelete,
}: SitemapNodeCommentsProps) {
  const [filter, setFilter] = useState<"all" | "unresolved">("all");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter to this node's comments (top-level only)
  const nodeComments = comments.filter(
    (c) => c.node_id === nodeId && !c.parent_id
  );

  const filtered = nodeComments.filter((c) => {
    if (filter === "unresolved") return !c.is_resolved;
    return true;
  });

  function getReplies(commentId: string) {
    return comments.filter((c) => c.parent_id === commentId);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/clients/${clientId}/sitemap/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          node_id: nodeId,
          content: content.trim(),
        }),
      });

      if (res.ok) {
        setContent("");
        onCommentAdded();
      } else {
        setError("Failed to post comment.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="flex gap-1 px-5 py-2.5 border-b border-border">
        {(["all", "unresolved"] as const).map((f) => (
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
            {f === "all" ? `All (${nodeComments.length})` : "Unresolved"}
          </button>
        ))}
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3" data-lenis-prevent>
        {filtered.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="w-6 h-6 text-text-dim mx-auto mb-2" />
            <p className="text-xs text-text-dim">No comments on this page yet</p>
          </div>
        )}
        {filtered.map((comment) => (
          <div key={comment.id} className="space-y-2">
            <div className={`p-3 rounded-lg ${comment.is_resolved ? "bg-background/50 opacity-60" : "bg-background"}`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-text-secondary">{comment.author_name}</span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: comment.author_type === "agency" ? "rgba(14,165,233,0.1)" : "rgba(16,185,129,0.1)",
                      color: comment.author_type === "agency" ? "#0ea5e9" : "#10b981",
                    }}
                  >
                    {comment.author_type}
                  </span>
                </div>
                <span className="text-[10px] text-text-dim">{formatTime(comment.created_at)}</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">{comment.content}</p>
              <div className="flex items-center gap-1.5 mt-2">
                {comment.section_name && (
                  <span className="inline-block px-1.5 py-0.5 text-[9px] rounded bg-accent/10 text-accent">
                    {comment.section_name}
                  </span>
                )}
                {onResolve && !comment.is_resolved && (
                  <button
                    type="button"
                    onClick={() => onResolve(comment.id, true)}
                    className="ml-auto flex items-center gap-1 text-[10px] text-text-dim hover:text-green-400 transition-colors"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Resolve
                  </button>
                )}
                {comment.is_resolved && (
                  <span className="inline-block px-1.5 py-0.5 text-[9px] rounded bg-green-500/10 text-green-400">
                    Resolved
                  </span>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(comment.id)}
                    className={`${onResolve && !comment.is_resolved ? "" : "ml-auto "}flex items-center gap-1 text-[10px] text-text-dim hover:text-red-400 transition-colors`}
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
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
        {error && (
          <p className="text-[11px] text-red-400 bg-red-500/10 px-3 py-1.5 rounded-md">{error}</p>
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-text-primary placeholder:text-text-dim resize-none focus:outline-none focus:border-accent/50 transition-colors"
        />
        <Button
          variant="primary"
          size="sm"
          className="w-full justify-center"
          disabled={submitting || !content.trim()}
        >
          {submitting ? "Posting..." : "Post Comment"}
        </Button>
      </form>
    </div>
  );
}
