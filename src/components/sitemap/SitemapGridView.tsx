"use client";

import { useMemo, useCallback, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mouse, ZoomIn } from "lucide-react";
import { Badge } from "@/components/ui";
import type { SitemapNode, SitemapEdge } from "@/lib/clients/sitemap-types";
import { groupNodesIntoSections } from "@/lib/clients/sitemap-utils";
import { SitemapGridCard } from "./SitemapGridCard";

interface SitemapGridViewProps {
  nodes: SitemapNode[];
  edges: SitemapEdge[];
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  readOnly?: boolean;
  onDeleteNode?: (id: string) => void;
  onDuplicateNode?: (id: string) => void;
  onAddChild?: (id: string) => void;
}

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 1.5;

export function SitemapGridView({
  nodes,
  edges,
  selectedNodeId,
  onNodeSelect,
  readOnly,
  onDeleteNode,
  onDuplicateNode,
  onAddChild,
}: SitemapGridViewProps) {
  const sections = useMemo(
    () => groupNodesIntoSections(nodes, edges),
    [nodes, edges]
  );

  // Zoom & pan state
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const hasInteracted = useRef(false);

  // Dismiss hint on first interaction
  const dismissHint = useCallback(() => {
    if (!hasInteracted.current) {
      hasInteracted.current = true;
      setShowHint(false);
    }
  }, []);

  // Auto-dismiss hint after 4s
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      dismissHint();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)));
    },
    [dismissHint]
  );

  // Pan start
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only pan on middle-click or when clicking background (not cards)
      if (e.button === 1 || (e.target === e.currentTarget || (e.target as HTMLElement).dataset?.pannable === "true")) {
        e.preventDefault();
        setIsPanning(true);
        dismissHint();
        panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      }
    },
    [pan, dismissHint]
  );

  // Pan move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy });
    },
    [isPanning]
  );

  // Pan end
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Background click to deselect
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget || (e.target as HTMLElement).dataset?.pannable === "true") {
        onNodeSelect(null);
      }
    },
    [onNodeSelect]
  );

  return (
    <div
      ref={containerRef}
      className={`flex-1 overflow-hidden bg-background relative ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
      data-lenis-prevent
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
    >
      {/* Zoomable/pannable content */}
      <div
        className="origin-top-left will-change-transform"
        data-pannable="true"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        <div className="w-[1400px] px-12 py-10 space-y-12" data-pannable="true">
          {sections.map((section) => (
            <section key={section.id}>
              {/* Section header */}
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="h-0.5 w-12"
                  style={{ backgroundColor: section.color }}
                />
                <h3
                  className="text-sm font-bold uppercase tracking-widest"
                  style={{ color: section.color }}
                >
                  {section.label}
                </h3>
                <Badge variant="default" size="sm">
                  {section.nodes.length}
                </Badge>
                <div className="flex-1 h-px bg-border/30" />
              </div>

              {/* Horizontal grid */}
              <div className="grid grid-cols-4 gap-4">
                {section.nodes.map((node) => (
                  <SitemapGridCard
                    key={node.id}
                    node={node}
                    selected={selectedNodeId === node.id}
                    onClick={() =>
                      onNodeSelect(selectedNodeId === node.id ? null : node.id)
                    }
                    readOnly={readOnly}
                    onDelete={onDeleteNode}
                    onDuplicate={onDuplicateNode}
                    onAddChild={onAddChild}
                  />
                ))}
              </div>
            </section>
          ))}

          {sections.length === 0 && (
            <div className="text-center py-20 text-text-dim text-sm">
              No pages yet
            </div>
          )}
        </div>
      </div>

      {/* First-use hint */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-5 py-3 rounded-xl bg-surface/95 backdrop-blur-sm border border-border shadow-lg"
          >
            <div className="flex items-center gap-2 text-text-muted text-xs">
              <Mouse className="w-4 h-4 text-text-dim" />
              <span>Scroll to zoom</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2 text-text-muted text-xs">
              <ZoomIn className="w-4 h-4 text-text-dim" />
              <span>Click &amp; drag to pan</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoom indicator */}
      <div className="absolute bottom-6 right-6 px-2.5 py-1 rounded-md bg-surface/80 backdrop-blur-sm border border-border text-[10px] text-text-dim font-mono">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
