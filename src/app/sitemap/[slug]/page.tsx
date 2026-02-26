"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map,
  MessageSquare,
  Send,
  X,
  House,
  FileText,
  Database,
  File,
  Settings,
  ExternalLink,
  Pencil,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import type { ClientSitemap, SitemapPageType, SitemapComment } from "@/lib/clients/sitemap-types";
import { PAGE_TYPE_CONFIG } from "@/lib/clients/sitemap-utils";
import { SitemapGridView } from "@/components/sitemap/SitemapGridView";
import { SitemapCommentPanel } from "@/components/sitemap/SitemapCommentPanel";
import { SectionCommentPopover } from "@/components/sitemap/SectionCommentPopover";
import { Badge, Button } from "@/components/ui";

const TYPE_ICONS: Record<SitemapPageType, React.ComponentType<{ className?: string }>> = {
  home: House,
  static: FileText,
  collection: Database,
  collection_item: File,
  utility: Settings,
  external: ExternalLink,
};

/** Inline comment form + thread for a selected node in the public viewer */
function NodeCommentSection({
  nodeId,
  slug,
  comments,
  onCommentAdded,
}: {
  nodeId: string;
  slug: string;
  comments: SitemapComment[];
  onCommentAdded: () => void;
}) {
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("sitemap-comment-name") || "" : ""
  );
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const nodeComments = comments.filter((c) => c.node_id === nodeId && !c.parent_id);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    const name = authorName.trim();
    if (!trimmed || !name) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/sitemap/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          node_id: nodeId,
          content: trimmed,
          author_name: name,
          author_type: "client",
        }),
      });
      if (res.ok) {
        setContent("");
        localStorage.setItem("sitemap-comment-name", name);
        onCommentAdded();
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-5 pt-5 border-t border-border/50">
      <div className="flex items-center gap-1.5 mb-3">
        <MessageSquare className="w-3.5 h-3.5 text-accent" />
        <span className="text-xs font-semibold text-text-primary">
          Comments
          {nodeComments.length > 0 && (
            <span className="ml-1 text-text-dim">({nodeComments.length})</span>
          )}
        </span>
      </div>

      {/* Existing comments */}
      {nodeComments.length > 0 && (
        <div className="space-y-2.5 mb-3">
          {nodeComments.map((c) => (
            <div key={c.id} className="rounded-lg bg-background/60 p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-semibold text-text-muted">
                  {c.author_name}
                </span>
                <span className="text-[9px] text-text-dim">
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">{c.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Comment form */}
      <div className="space-y-2">
        {!localStorage.getItem("sitemap-comment-name") && (
          <input
            type="text"
            placeholder="Your name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background/60 text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
        )}
        <div className="relative">
          <textarea
            ref={textareaRef}
            placeholder="Leave a comment on this page..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
            rows={2}
            className="w-full px-2.5 py-2 pr-9 text-xs rounded-lg border border-border bg-background/60 text-text-primary placeholder:text-text-dim resize-none focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !content.trim() || !authorName.trim()}
            className="absolute bottom-2 right-2 p-1 rounded-md text-accent hover:bg-accent/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PublicSitemapViewer() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const [sitemap, setSitemap] = useState<(ClientSitemap & { client_id?: string }) | null>(null);
  const [comments, setComments] = useState<SitemapComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);

  // Fetch sitemap
  useEffect(() => {
    async function fetchSitemap() {
      try {
        const res = await fetch(`/api/sitemap/${slug}?_t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) {
          setError(res.status === 404 ? "Sitemap not found" : "Failed to load sitemap");
          return;
        }
        const data = await res.json();
        // Normalize node data defaults
        if (data.sitemap_data?.nodes) {
          data.sitemap_data.nodes = data.sitemap_data.nodes.map((n: Record<string, unknown>) => ({
            ...n,
            type: "sitemap-page",
            data: {
              ...(n.data as Record<string, unknown>),
              status: (n.data as Record<string, unknown>)?.status || "planned",
              pageType: (n.data as Record<string, unknown>)?.pageType || "static",
            },
          }));
        }
        setSitemap(data);
      } catch {
        setError("Failed to load sitemap");
      } finally {
        setLoading(false);
      }
    }
    fetchSitemap();
  }, [slug]);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!sitemap?.allow_comments) return;
    try {
      const res = await fetch(`/api/sitemap/${slug}/comments?_t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch {
      // silently fail for comments
    }
  }, [slug, sitemap?.allow_comments]);

  useEffect(() => {
    if (sitemap) fetchComments();
  }, [sitemap, fetchComments]);

  // Poll for new comments every 30s
  useEffect(() => {
    if (!sitemap?.allow_comments) return;
    const interval = setInterval(fetchComments, 30000);
    return () => clearInterval(interval);
  }, [sitemap?.allow_comments, fetchComments]);

  // Escape key to close panels
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (commentsOpen) {
        setCommentsOpen(false);
      } else if (selectedNodeId) {
        setSelectedNodeId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commentsOpen, selectedNodeId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-border border-t-accent rounded-full" />
      </div>
    );
  }

  if (error || !sitemap) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-text-primary mb-2">{error || "Not Found"}</h1>
          <p className="text-text-muted text-sm">This sitemap may be private or does not exist.</p>
        </div>
      </div>
    );
  }

  const selectedNode = selectedNodeId
    ? sitemap.sitemap_data.nodes.find((n) => n.id === selectedNodeId)
    : null;

  // Type breakdown for header
  const typeCounts: Partial<Record<SitemapPageType, number>> = {};
  for (const node of sitemap.sitemap_data.nodes) {
    const pt = node.data.pageType;
    typeCounts[pt] = (typeCounts[pt] || 0) + 1;
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Owner bar — visible only to authenticated agency users */}
      {isAuthenticated && (
        <div className="flex items-center justify-between px-5 h-9 border-b border-border bg-surface/95 backdrop-blur-sm">
          <nav className="flex items-center gap-1.5 text-[11px]">
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-text-dim hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Dashboard
            </Link>
            <ChevronRight className="w-3 h-3 text-border" />
            <Link
              href="/clients"
              className="text-text-dim hover:text-text-primary transition-colors"
            >
              Clients
            </Link>
            {sitemap.client_id && (
              <>
                <ChevronRight className="w-3 h-3 text-border" />
                <Link
                  href={`/clients/${sitemap.client_id}?tab=sitemap`}
                  className="text-text-dim hover:text-text-primary transition-colors"
                >
                  Sitemap
                </Link>
              </>
            )}
            <ChevronRight className="w-3 h-3 text-border" />
            <span className="text-text-muted font-medium">Live View</span>
          </nav>
          <div className="flex items-center gap-1.5">
            {sitemap.client_id && (
              <Link
                href={`/clients/${sitemap.client_id}?tab=sitemap`}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-text-muted hover:text-text-primary rounded-md hover:bg-background/60 transition-colors"
              >
                <Pencil className="w-3 h-3" />
                Open Editor
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
              <Map className="w-4 h-4 text-accent" />
            </div>
            <h1 className="font-serif text-base font-medium text-text-primary">
              {sitemap.title}
            </h1>
          </div>
          <Badge variant="default" size="sm">
            {sitemap.sitemap_data.nodes.length} pages
          </Badge>

          {/* Type breakdown */}
          <div className="hidden sm:flex items-center gap-2">
            {(Object.entries(typeCounts) as [SitemapPageType, number][]).map(([type, count]) => (
              <span key={type} className="flex items-center gap-1 text-[10px] text-text-dim">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: PAGE_TYPE_CONFIG[type]?.color }}
                />
                {count} {PAGE_TYPE_CONFIG[type]?.label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sitemap.allow_comments && (
            <Button
              variant={commentsOpen ? "outline" : "ghost"}
              size="sm"
              onClick={() => setCommentsOpen(!commentsOpen)}
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              Comments
              {comments.length > 0 && (
                <Badge variant="info" size="sm" className="ml-1.5">
                  {comments.length}
                </Badge>
              )}
            </Button>
          )}
          <span className="text-[11px] text-text-dim font-semibold tracking-wider uppercase">
            HSFX
          </span>
        </div>
      </div>

      {/* Grid + Panels */}
      <div className="flex-1 flex overflow-hidden">
        <SitemapGridView
          nodes={sitemap.sitemap_data.nodes}
          edges={sitemap.sitemap_data.edges}
          selectedNodeId={selectedNodeId}
          onNodeSelect={setSelectedNodeId}
          readOnly
          comments={sitemap.allow_comments ? comments : undefined}
          commentSlot={sitemap.allow_comments ? (nodeId, sectionName) => (
            <SectionCommentPopover
              sectionName={sectionName}
              nodeId={nodeId}
              comments={comments}
              apiEndpoint={`/api/sitemap/${slug}/comments`}
              isPublic
              onCommentAdded={fetchComments}
            />
          ) : undefined}
        />

        {/* Selected node detail panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="w-80 border-l border-border bg-surface/80 backdrop-blur-sm overflow-y-auto"
              data-lenis-prevent
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 min-w-0">
                    {(() => {
                      const typeConfig = PAGE_TYPE_CONFIG[selectedNode.data.pageType];
                      const nodeColor = selectedNode.data.color || typeConfig?.color || "#64748b";
                      const TypeIcon = TYPE_ICONS[selectedNode.data.pageType] || FileText;
                      return (
                        <>
                          <span style={{ color: nodeColor }}>
                            <TypeIcon className="w-4 h-4 flex-shrink-0" />
                          </span>
                          <h3 className="text-sm font-medium text-text-primary truncate">{selectedNode.data.label}</h3>
                        </>
                      );
                    })()}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedNodeId(null)}
                    className="p-1 rounded-md text-text-dim hover:text-text-primary hover:bg-background/60 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Status badge */}
                <div className="mb-4">
                  <Badge
                    variant={
                      selectedNode.data.status === "complete" ? "success" :
                      selectedNode.data.status === "in_progress" ? "warning" :
                      selectedNode.data.status === "deferred" ? "info" : "default"
                    }
                    size="sm"
                    dot
                  >
                    {(selectedNode.data.status || "planned").replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Badge>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-text-dim">Path</span>
                    <p className="font-mono text-text-muted mt-0.5">{selectedNode.data.path || "/"}</p>
                  </div>
                  <div>
                    <span className="text-text-dim">Type</span>
                    <p className="text-text-muted capitalize mt-0.5">{(selectedNode.data.pageType || "static").replace("_", " ")}</p>
                  </div>
                  {selectedNode.data.description && (
                    <div>
                      <span className="text-text-dim">Description</span>
                      <p className="text-text-muted mt-0.5 leading-relaxed">{selectedNode.data.description}</p>
                    </div>
                  )}
                  {selectedNode.data.sections && selectedNode.data.sections.length > 0 && (
                    <div>
                      <span className="text-text-dim">Sections</span>
                      <div className="space-y-1 mt-1.5">
                        {selectedNode.data.sections.map((s) => (
                          <div
                            key={s}
                            className="flex items-center gap-2 px-2 py-1 rounded-md bg-background/60"
                          >
                            <div className="w-0.5 h-3 rounded-full bg-border-hover flex-shrink-0" />
                            <span className="text-[11px] text-text-muted leading-none">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedNode.data.seoTitle && (
                    <div>
                      <span className="text-text-dim">SEO Title</span>
                      <p className="text-text-muted mt-0.5">{selectedNode.data.seoTitle}</p>
                    </div>
                  )}
                  {selectedNode.data.seoDescription && (
                    <div>
                      <span className="text-text-dim">Meta Description</span>
                      <p className="text-text-muted mt-0.5 leading-relaxed">{selectedNode.data.seoDescription}</p>
                    </div>
                  )}
                  {selectedNode.data.collectionName && (
                    <div>
                      <span className="text-text-dim">Collection</span>
                      <p className="text-text-muted mt-0.5">
                        {selectedNode.data.collectionName}
                        {selectedNode.data.estimatedItems && (
                          <span className="text-text-dim"> ({selectedNode.data.estimatedItems} items)</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Inline comment form for this page */}
                {sitemap.allow_comments && (
                  <NodeCommentSection
                    nodeId={selectedNode.id}
                    slug={slug}
                    comments={comments}
                    onCommentAdded={fetchComments}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comment panel */}
        {commentsOpen && sitemap.allow_comments && (
          <SitemapCommentPanel
            slug={slug}
            comments={comments}
            selectedNodeId={selectedNodeId}
            onCommentAdded={fetchComments}
            onClose={() => setCommentsOpen(false)}
            nodes={sitemap.sitemap_data.nodes}
          />
        )}
      </div>
    </div>
  );
}

export default function PublicSitemapPage() {
  return <PublicSitemapViewer />;
}
