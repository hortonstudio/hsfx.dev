"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  ConnectionLineType,
  type Connection,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useToast } from "@/components/ui";
import type { ClientSitemap, SitemapData, SitemapPageData } from "@/lib/clients/sitemap-types";
import { createNode, createEdge, generateNodeId, PAGE_TYPE_CONFIG } from "@/lib/clients/sitemap-utils";
import { autoLayout } from "@/lib/clients/sitemap-layout";
import SitemapNodeComponent from "./SitemapNode";
import { SitemapToolbar, type SitemapView } from "./SitemapToolbar";
import { SitemapSidebar } from "./SitemapSidebar";
import { SitemapShareModal } from "./SitemapShareModal";
import { SitemapLegend } from "./SitemapLegend";
import { SitemapStructuralView } from "./SitemapStructuralView";

const nodeTypes = { "sitemap-page": SitemapNodeComponent };

interface SitemapEditorProps {
  sitemap: ClientSitemap;
  clientId: string;
  onClose: () => void;
  onSaved: (updated: ClientSitemap) => void;
}

function SitemapEditorInner({ sitemap, clientId, onClose, onSaved }: SitemapEditorProps) {
  const { addToast } = useToast();
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(sitemap.sitemap_data.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(sitemap.sitemap_data.edges);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(sitemap.updated_at);
  const [shareOpen, setShareOpen] = useState(false);
  const [currentSitemap, setCurrentSitemap] = useState(sitemap);
  const [view, setView] = useState<SitemapView>("canvas");

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef(false);

  // ── Selected node data ────────────────────────────────
  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;

  // ── Save to API ────────────────────────────────────────
  const saveToApi = useCallback(
    async (data: SitemapData) => {
      setSaving(true);
      try {
        const res = await fetch(`/api/clients/${clientId}/sitemap`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sitemap_data: data }),
        });

        if (!res.ok) throw new Error("Save failed");

        const updated = await res.json();
        setLastSaved(updated.updated_at);
        onSaved(updated);
      } catch {
        addToast({ variant: "error", title: "Failed to save sitemap" });
      } finally {
        setSaving(false);
        pendingSaveRef.current = false;
      }
    },
    [clientId, addToast, onSaved]
  );

  // ── Debounced auto-save ────────────────────────────────
  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    pendingSaveRef.current = true;
    saveTimeoutRef.current = setTimeout(() => {
      setNodes((currentNodes) => {
        setEdges((currentEdges) => {
          saveToApi({
            nodes: currentNodes as ClientSitemap["sitemap_data"]["nodes"],
            edges: currentEdges as ClientSitemap["sitemap_data"]["edges"],
            viewport: { x: 0, y: 0, zoom: 1 },
          });
          return currentEdges;
        });
        return currentNodes;
      });
    }, 3000);
  }, [saveToApi, setNodes, setEdges]);

  useEffect(() => {
    scheduleSave();
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  // ── Manual save ────────────────────────────────────────
  const handleManualSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveToApi({
      nodes: nodes as ClientSitemap["sitemap_data"]["nodes"],
      edges: edges as ClientSitemap["sitemap_data"]["edges"],
      viewport: { x: 0, y: 0, zoom: 1 },
    });
  }, [nodes, edges, saveToApi]);

  // ── Node selection ─────────────────────────────────────
  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // ── Connect nodes ──────────────────────────────────────
  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        const newEdge = createEdge(connection.source, connection.target);
        setEdges((eds) => [...eds, newEdge]);
      }
    },
    [setEdges]
  );

  // ── Auto layout ────────────────────────────────────────
  const handleAutoLayout = useCallback(() => {
    const laidOut = autoLayout(
      nodes as ClientSitemap["sitemap_data"]["nodes"],
      edges as ClientSitemap["sitemap_data"]["edges"]
    );
    setNodes(laidOut);
    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
    addToast({ variant: "success", title: "Layout applied" });
  }, [nodes, edges, setNodes, fitView, addToast]);

  // ── Add page ───────────────────────────────────────────
  const handleAddPage = useCallback(() => {
    const newNode = createNode(
      { label: "New Page", path: "/new-page" },
      { x: Math.random() * 400, y: Math.random() * 400 }
    );
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(newNode.id);

    if (selectedNodeId) {
      const edge = createEdge(selectedNodeId, newNode.id);
      setEdges((eds) => [...eds, edge]);
    }
  }, [setNodes, setEdges, selectedNodeId]);

  // ── Update node data ──────────────────────────────────
  const handleUpdateNode = useCallback(
    (nodeId: string, updates: Partial<SitemapPageData>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n
        )
      );
    },
    [setNodes]
  );

  // ── Delete node ────────────────────────────────────────
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    },
    [setNodes, setEdges, selectedNodeId]
  );

  // ── Duplicate node ─────────────────────────────────────
  const handleDuplicateNode = useCallback(
    (nodeId: string) => {
      const original = nodes.find((n) => n.id === nodeId);
      if (!original) return;

      const newId = generateNodeId();
      const newNode = {
        ...original,
        id: newId,
        position: { x: original.position.x + 40, y: original.position.y + 40 },
        data: { ...original.data, label: `${original.data.label} (copy)` },
      };
      setNodes((nds) => [...nds, newNode]);

      const parentEdge = edges.find((e) => e.target === nodeId);
      if (parentEdge) {
        setEdges((eds) => [...eds, createEdge(parentEdge.source, newId)]);
      }

      setSelectedNodeId(newId);
    },
    [nodes, edges, setNodes, setEdges]
  );

  // ── Add child ──────────────────────────────────────────
  const handleAddChild = useCallback(
    (parentId: string) => {
      const parent = nodes.find((n) => n.id === parentId);
      const newNode = createNode(
        { label: "New Page", path: "/new-page" },
        {
          x: (parent?.position.x ?? 0) + 40,
          y: (parent?.position.y ?? 0) + 180,
        }
      );
      setNodes((nds) => [...nds, newNode]);
      setEdges((eds) => [...eds, createEdge(parentId, newNode.id)]);
      setSelectedNodeId(newNode.id);
    },
    [nodes, setNodes, setEdges]
  );

  // ── Keyboard shortcuts ─────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedNodeId) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;
        handleDeleteNode(selectedNodeId);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleManualSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeId, handleDeleteNode, handleManualSave]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col" data-lenis-prevent>
      <SitemapToolbar
        nodeCount={nodes.length}
        lastSaved={lastSaved}
        saving={saving}
        onSave={handleManualSave}
        onAutoLayout={handleAutoLayout}
        onAddPage={handleAddPage}
        onFitView={() => fitView({ padding: 0.2, duration: 300 })}
        onZoomIn={() => zoomIn({ duration: 200 })}
        onZoomOut={() => zoomOut({ duration: 200 })}
        onShare={() => setShareOpen(true)}
        onClose={() => {
          if (pendingSaveRef.current) {
            handleManualSave();
          }
          onClose();
        }}
        title={sitemap.title}
        status={sitemap.status}
        view={view}
        onViewChange={setView}
      />

      <div className="flex-1 flex overflow-hidden">
        {view === "structure" ? (
          <SitemapStructuralView
            nodes={nodes as ClientSitemap["sitemap_data"]["nodes"]}
            edges={edges as ClientSitemap["sitemap_data"]["edges"]}
            selectedNodeId={selectedNodeId}
            onNodeSelect={setSelectedNodeId}
          />
        ) : (
          <div className="flex-1 relative">
            <SitemapLegend />
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
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
              connectionLineType={ConnectionLineType.Bezier}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.1}
              maxZoom={2}
              proOptions={{ hideAttribution: false }}
            >
              <Background gap={24} size={0.8} color="var(--color-border)" />
              <MiniMap
                nodeColor={(node) => {
                  const pageType = (node.data as SitemapPageData).pageType;
                  return PAGE_TYPE_CONFIG[pageType]?.color ?? "#64748b";
                }}
                maskColor="rgba(0,0,0,0.5)"
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderRadius: "12px",
                  border: "1px solid var(--color-border)",
                }}
                pannable
                zoomable
              />
            </ReactFlow>
          </div>
        )}

        {/* Sidebar */}
        {selectedNode && (
          <SitemapSidebar
            nodeId={selectedNode.id}
            data={selectedNode.data as SitemapPageData}
            onUpdate={handleUpdateNode}
            onDelete={handleDeleteNode}
            onDuplicate={handleDuplicateNode}
            onAddChild={handleAddChild}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>

      {/* Share modal */}
      {shareOpen && (
        <SitemapShareModal
          sitemap={currentSitemap}
          clientId={clientId}
          onClose={() => setShareOpen(false)}
          onUpdated={(updated) => {
            setCurrentSitemap(updated);
            onSaved(updated);
          }}
        />
      )}
    </div>
  );
}

export function SitemapEditor(props: SitemapEditorProps) {
  return (
    <ReactFlowProvider>
      <SitemapEditorInner {...props} />
    </ReactFlowProvider>
  );
}
