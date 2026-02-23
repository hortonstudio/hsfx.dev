"use client";

import { useState, useEffect } from "react";
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
    if (c.parent_id) return false; // Only show top-level
    if (filter === "unresolved") return !c.is_resolved;
    if (filter === "node") return c.node_id === selectedNodeId;
    return true;
  });

  // Get replies for a comment
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
    <div className="w-80 border-l border-white/10 bg-[#111] flex flex-col" data-lenis-prevent>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-medium text-white">Comments</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-white/40 hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-1 px-4 py-2 border-b border-white/10">
        {(["all", "unresolved", ...(selectedNodeId ? ["node" as const] : [])] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-2 py-1 text-[10px] rounded transition-colors ${
              filter === f
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {f === "all" ? "All" : f === "unresolved" ? "Unresolved" : "This Page"}
          </button>
        ))}
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" data-lenis-prevent>
        {filtered.length === 0 && (
          <p className="text-xs text-white/30 text-center py-4">No comments yet</p>
        )}
        {filtered.map((comment) => (
          <div key={comment.id} className="space-y-2">
            {/* Main comment */}
            <div className={`p-2.5 rounded-lg ${comment.is_resolved ? "bg-white/5 opacity-60" : "bg-white/10"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-white/80">{comment.author_name}</span>
                <span className="text-[10px] text-white/30">{formatTime(comment.created_at)}</span>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">{comment.content}</p>
              {comment.node_id && (
                <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] rounded bg-blue-500/20 text-blue-400">
                  Page: {comment.node_id}
                </span>
              )}
              {comment.is_resolved && (
                <span className="inline-block mt-1 ml-1 px-1.5 py-0.5 text-[9px] rounded bg-green-500/20 text-green-400">
                  Resolved
                </span>
              )}
            </div>

            {/* Replies */}
            {getReplies(comment.id).map((reply) => (
              <div key={reply.id} className="ml-4 p-2 rounded-lg bg-white/5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-white/70">{reply.author_name}</span>
                  <span className="text-[9px] text-white/25">{formatTime(reply.created_at)}</span>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed">{reply.content}</p>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 space-y-2">
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Your name"
          className="w-full px-2.5 py-1.5 text-xs rounded border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={selectedNodeId && filter === "node" ? "Comment on this page..." : "Add a comment..."}
          rows={2}
          className="w-full px-2.5 py-1.5 text-xs rounded border border-white/10 bg-white/5 text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-white/30"
        />
        <button
          type="submit"
          disabled={submitting || !authorName.trim() || !content.trim()}
          className="w-full px-3 py-1.5 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Posting..." : "Post Comment"}
        </button>
      </form>
    </div>
  );
}
