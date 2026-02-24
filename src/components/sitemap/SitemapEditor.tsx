"use client";

import { useState, useCallback, useRef, useEffect } from "react";

import { useToast } from "@/components/ui";
import type { ClientSitemap, SitemapData, SitemapPageData } from "@/lib/clients/sitemap-types";
import { createNode, createEdge, generateNodeId } from "@/lib/clients/sitemap-utils";
import { SitemapToolbar } from "./SitemapToolbar";
import { SitemapSidebar } from "./SitemapSidebar";
import { SitemapShareModal } from "./SitemapShareModal";
import { SitemapGridView } from "./SitemapGridView";

interface SitemapEditorProps {
  sitemap: ClientSitemap;
  clientId: string;
  onClose: () => void;
  onSaved: (updated: ClientSitemap) => void;
}

export function SitemapEditor({ sitemap, clientId, onClose, onSaved }: SitemapEditorProps) {
  const { addToast } = useToast();

  // Normalize node data defaults
  const initialNodes = sitemap.sitemap_data.nodes.map((n) => ({
    ...n,
    type: "sitemap-page" as const,
    data: { ...n.data, status: n.data.status || "planned", pageType: n.data.pageType || "static" },
  }));

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(sitemap.sitemap_data.edges);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(sitemap.updated_at);
  const [shareOpen, setShareOpen] = useState(false);
  const [currentSitemap, setCurrentSitemap] = useState(sitemap);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef(false);

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
  }, [saveToApi, setNodes, setEdges]);

  // ── Add page ───────────────────────────────────────────
  const handleAddPage = useCallback(() => {
    const newNode = createNode(
      { label: "New Page", path: "/new-page" },
      { x: 0, y: 0 }
    );
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(newNode.id);

    if (selectedNodeId) {
      const edge = createEdge(selectedNodeId, newNode.id);
      setEdges((eds) => [...eds, edge]);
    }
  }, [selectedNodeId]);

  // ── Update node data ──────────────────────────────────
  const handleUpdateNode = useCallback(
    (nodeId: string, updates: Partial<SitemapPageData>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n
        )
      );
    },
    []
  );

  // ── Delete node ────────────────────────────────────────
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    },
    [selectedNodeId]
  );

  // ── Duplicate node ─────────────────────────────────────
  const handleDuplicateNode = useCallback(
    (nodeId: string) => {
      setNodes((currentNodes) => {
        const original = currentNodes.find((n) => n.id === nodeId);
        if (!original) return currentNodes;

        const newId = generateNodeId();
        const newNode = {
          ...original,
          id: newId,
          position: { x: original.position.x + 40, y: original.position.y + 40 },
          data: { ...original.data, label: `${original.data.label} (copy)` },
        };

        setEdges((currentEdges) => {
          const parentEdge = currentEdges.find((e) => e.target === nodeId);
          if (parentEdge) {
            return [...currentEdges, createEdge(parentEdge.source, newId)];
          }
          return currentEdges;
        });

        setSelectedNodeId(newId);
        return [...currentNodes, newNode];
      });
    },
    []
  );

  // ── Add child ──────────────────────────────────────────
  const handleAddChild = useCallback(
    (parentId: string) => {
      setNodes((currentNodes) => {
        const parent = currentNodes.find((n) => n.id === parentId);
        const newNode = createNode(
          { label: "New Page", path: "/new-page" },
          {
            x: (parent?.position.x ?? 0) + 40,
            y: (parent?.position.y ?? 0) + 180,
          }
        );
        setEdges((eds) => [...eds, createEdge(parentId, newNode.id)]);
        setSelectedNodeId(newNode.id);
        return [...currentNodes, newNode];
      });
    },
    []
  );

  // ── Export JSON ───────────────────────────────────────
  const handleExport = useCallback(() => {
    const data = {
      nodes: nodes.map((n) => {
        const parentEdge = edges.find((e) => e.target === n.id);
        return {
          id: n.id,
          label: n.data.label,
          path: (n.data as SitemapPageData).path,
          pageType: (n.data as SitemapPageData).pageType,
          parentId: parentEdge?.source ?? null,
          status: (n.data as SitemapPageData).status,
          description: (n.data as SitemapPageData).description,
          sections: (n.data as SitemapPageData).sections,
          seoTitle: (n.data as SitemapPageData).seoTitle,
          seoDescription: (n.data as SitemapPageData).seoDescription,
          collectionName: (n.data as SitemapPageData).collectionName,
          estimatedItems: (n.data as SitemapPageData).estimatedItems,
          color: (n.data as SitemapPageData).color,
        };
      }),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sitemap.title.replace(/\s+/g, "-").toLowerCase()}-sitemap.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ variant: "success", title: "Sitemap exported" });
  }, [nodes, edges, sitemap.title, addToast]);

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
        onAddPage={handleAddPage}
        onExport={handleExport}
        onShare={() => setShareOpen(true)}
        onClose={() => {
          if (pendingSaveRef.current) {
            handleManualSave();
          }
          onClose();
        }}
        title={sitemap.title}
        status={sitemap.status}
      />

      <div className="flex-1 flex overflow-hidden">
        <SitemapGridView
          nodes={nodes as ClientSitemap["sitemap_data"]["nodes"]}
          edges={edges as ClientSitemap["sitemap_data"]["edges"]}
          selectedNodeId={selectedNodeId}
          onNodeSelect={setSelectedNodeId}
          onDeleteNode={handleDeleteNode}
          onDuplicateNode={handleDuplicateNode}
          onAddChild={handleAddChild}
        />

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
