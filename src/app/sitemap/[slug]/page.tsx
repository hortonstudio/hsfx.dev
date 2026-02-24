"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ReactFlow,
  Background,
  MiniMap,
  ReactFlowProvider,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map,
  MessageSquare,
  X,
  Network,
  List,
  House,
  FileText,
  Database,
  File,
  Settings,
  ExternalLink,
} from "lucide-react";

import type { ClientSitemap, SitemapPageData, SitemapPageType, SitemapComment } from "@/lib/clients/sitemap-types";
import { PAGE_TYPE_CONFIG } from "@/lib/clients/sitemap-utils";
import SitemapNodeComponent from "@/components/sitemap/SitemapNode";
import { SitemapCommentPanel } from "@/components/sitemap/SitemapCommentPanel";
import { SitemapStructuralView } from "@/components/sitemap/SitemapStructuralView";
import { Badge, Button } from "@/components/ui";

const nodeTypes = { "sitemap-page": SitemapNodeComponent };

type PublicView = "canvas" | "structure";

const TYPE_ICONS: Record<SitemapPageType, React.ComponentType<{ className?: string }>> = {
  home: House,
  static: FileText,
  collection: Database,
  collection_item: File,
  utility: Settings,
  external: ExternalLink,
};

function PublicSitemapViewer() {
  const { slug } = useParams<{ slug: string }>();
  const [sitemap, setSitemap] = useState<ClientSitemap | null>(null);
  const [comments, setComments] = useState<SitemapComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [view, setView] = useState<PublicView>("canvas");

  // Fetch sitemap
  useEffect(() => {
    async function fetchSitemap() {
      try {
        const res = await fetch(`/api/sitemap/${slug}`);
        if (!res.ok) {
          setError(res.status === 404 ? "Sitemap not found" : "Failed to load sitemap");
          return;
        }
        const data = await res.json();
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
      const res = await fetch(`/api/sitemap/${slug}/comments`);
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

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

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
          {/* View toggle */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-background/50">
            <button
              type="button"
              onClick={() => setView("canvas")}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-md transition-colors ${
                view === "canvas"
                  ? "bg-surface text-text-primary font-medium shadow-sm"
                  : "text-text-dim hover:text-text-muted"
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              Canvas
            </button>
            <button
              type="button"
              onClick={() => setView("structure")}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-md transition-colors ${
                view === "structure"
                  ? "bg-surface text-text-primary font-medium shadow-sm"
                  : "text-text-dim hover:text-text-muted"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Structure
            </button>
          </div>

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

      {/* Canvas + Panels */}
      <div className="flex-1 flex overflow-hidden">
        {view === "structure" ? (
          <SitemapStructuralView
            nodes={sitemap.sitemap_data.nodes}
            edges={sitemap.sitemap_data.edges}
            selectedNodeId={selectedNodeId}
            onNodeSelect={setSelectedNodeId}
          />
        ) : (
          <div className="flex-1">
            <ReactFlow
              nodes={sitemap.sitemap_data.nodes}
              edges={sitemap.sitemap_data.edges}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={{
                type: "bezier",
                animated: false,
                style: {
                  stroke: "var(--color-border-hover)",
                  strokeWidth: 1.5,
                },
              }}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.1}
              maxZoom={2}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={true}
              proOptions={{ hideAttribution: false }}
            >
              <Background gap={24} size={0.8} color="var(--color-border)" />
              <MiniMap
                nodeColor={(node) => {
                  const data = node.data as SitemapPageData;
                  return data.color || (PAGE_TYPE_CONFIG[data.pageType]?.color ?? "#64748b");
                }}
                maskColor="rgba(0,0,0,0.5)"
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderRadius: "12px",
                  border: "1px solid var(--color-border)",
                }}
              />
            </ReactFlow>
          </div>
        )}

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
                    {selectedNode.data.status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Badge>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-text-dim">Path</span>
                    <p className="font-mono text-text-muted mt-0.5">{selectedNode.data.path}</p>
                  </div>
                  <div>
                    <span className="text-text-dim">Type</span>
                    <p className="text-text-muted capitalize mt-0.5">{selectedNode.data.pageType.replace("_", " ")}</p>
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
  return (
    <ReactFlowProvider>
      <PublicSitemapViewer />
    </ReactFlowProvider>
  );
}
