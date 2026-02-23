"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ReactFlow,
  Background,
  MiniMap,
  Controls,
  ReactFlowProvider,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { ClientSitemap, SitemapPageData, SitemapComment } from "@/lib/clients/sitemap-types";
import SitemapNodeComponent from "@/components/sitemap/SitemapNode";
import { SitemapCommentPanel } from "@/components/sitemap/SitemapCommentPanel";

const nodeTypes = { "sitemap-page": SitemapNodeComponent };

function PublicSitemapViewer() {
  const { slug } = useParams<{ slug: string }>();
  const [sitemap, setSitemap] = useState<ClientSitemap | null>(null);
  const [comments, setComments] = useState<SitemapComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);

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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
      </div>
    );
  }

  if (error || !sitemap) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-white mb-2">{error || "Not Found"}</h1>
          <p className="text-white/50 text-sm">This sitemap may be private or does not exist.</p>
        </div>
      </div>
    );
  }

  const selectedNode = selectedNodeId
    ? sitemap.sitemap_data.nodes.find((n) => n.id === selectedNodeId)
    : null;

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#111]">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-medium">{sitemap.title}</h1>
          <span className="px-2 py-0.5 text-[10px] rounded-full border border-white/20 text-white/50">
            {sitemap.sitemap_data.nodes.length} pages
          </span>
        </div>
        <div className="flex items-center gap-2">
          {sitemap.allow_comments && (
            <button
              type="button"
              onClick={() => setCommentsOpen(!commentsOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-white/20 hover:bg-white/5 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Comments
              {comments.length > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-blue-500 text-white">
                  {comments.length}
                </span>
              )}
            </button>
          )}
          <span className="text-[10px] text-white/30">
            Powered by HSFX
          </span>
        </div>
      </div>

      {/* Canvas + Comments */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1">
          <ReactFlow
            nodes={sitemap.sitemap_data.nodes}
            edges={sitemap.sitemap_data.edges}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{ type: "smoothstep", animated: false }}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
            maxZoom={2}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={true}
            proOptions={{ hideAttribution: false }}
          >
            <Background gap={20} size={1} color="rgba(255,255,255,0.05)" />
            <MiniMap
              nodeColor={(node) => {
                const pageType = (node.data as SitemapPageData).pageType;
                const colors: Record<string, string> = {
                  home: "#3b82f6",
                  static: "#6b7280",
                  collection: "#10b981",
                  collection_item: "#34d399",
                  utility: "#f59e0b",
                  external: "#8b5cf6",
                };
                return colors[pageType] ?? "#6b7280";
              }}
              maskColor="rgba(0,0,0,0.7)"
              style={{ backgroundColor: "#111" }}
            />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>

        {/* Selected node detail popover */}
        {selectedNode && (
          <div className="w-72 border-l border-white/10 bg-[#111] p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">{selectedNode.data.label}</h3>
              <button
                type="button"
                onClick={() => setSelectedNodeId(null)}
                className="text-white/40 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-white/40">Path</span>
                <p className="font-mono text-white/70">{selectedNode.data.path}</p>
              </div>
              <div>
                <span className="text-white/40">Type</span>
                <p className="text-white/70 capitalize">{selectedNode.data.pageType.replace("_", " ")}</p>
              </div>
              {selectedNode.data.description && (
                <div>
                  <span className="text-white/40">Description</span>
                  <p className="text-white/70">{selectedNode.data.description}</p>
                </div>
              )}
              {selectedNode.data.sections && selectedNode.data.sections.length > 0 && (
                <div>
                  <span className="text-white/40">Sections</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedNode.data.sections.map((s) => (
                      <span key={s} className="px-1.5 py-0.5 text-[10px] rounded bg-white/10 text-white/60">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selectedNode.data.seoTitle && (
                <div>
                  <span className="text-white/40">SEO Title</span>
                  <p className="text-white/70">{selectedNode.data.seoTitle}</p>
                </div>
              )}
              {selectedNode.data.seoDescription && (
                <div>
                  <span className="text-white/40">Meta Description</span>
                  <p className="text-white/70">{selectedNode.data.seoDescription}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comment panel */}
        {commentsOpen && sitemap.allow_comments && (
          <SitemapCommentPanel
            slug={slug}
            comments={comments}
            selectedNodeId={selectedNodeId}
            onCommentAdded={fetchComments}
            onClose={() => setCommentsOpen(false)}
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
