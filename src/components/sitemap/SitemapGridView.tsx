"use client";

import { useMemo, useCallback, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mouse, Command } from "lucide-react";
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
const DRAG_THRESHOLD = 5;
const CONTENT_WIDTH = 1400;
const CONTENT_HEIGHT = 2000;
const PAN_MARGIN = 200;
const DOT_GAP = 24;

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
  const didDragRef = useRef(false);
  const initializedRef = useRef(false);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  // Touch refs
  const touchStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const pinchStartRef = useRef<{ distance: number; zoom: number } | null>(null);

  // Clamp pan so content stays in view
  const clampPan = useCallback((p: { x: number; y: number }) => {
    if (!containerRef.current) return p;
    const { width: cw, height: ch } = containerRef.current.getBoundingClientRect();
    const z = zoomRef.current;
    const cWidth = CONTENT_WIDTH * z;
    const cHeight = CONTENT_HEIGHT * z;
    return {
      x: Math.max(-(cWidth - PAN_MARGIN), Math.min(cw - PAN_MARGIN, p.x)),
      y: Math.max(-(cHeight - PAN_MARGIN), Math.min(ch - PAN_MARGIN, p.y)),
    };
  }, []);

  // Center content on initial mount
  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;
    const { width } = containerRef.current.getBoundingClientRect();
    const contentWidth = CONTENT_WIDTH * zoom;
    const x = Math.max(20, (width - contentWidth) / 2);
    setPan(clampPan({ x, y: 30 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Wheel: Cmd/Ctrl+scroll = zoom, plain scroll = pan
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      dismissHint();

      if (e.metaKey || e.ctrlKey) {
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)));
      } else {
        setPan((p) => clampPan({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      }
    },
    [dismissHint, clampPan]
  );

  // Mouse pan — works from anywhere
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0 && e.button !== 1) return;
      setIsPanning(true);
      didDragRef.current = false;
      dismissHint();
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    },
    [pan, dismissHint]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
        didDragRef.current = true;
      }
      setPan(clampPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy }));
    },
    [isPanning, clampPan]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Touch helpers
  const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Touch pan + pinch-to-zoom
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      dismissHint();
      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          panX: pan.x,
          panY: pan.y,
        };
        pinchStartRef.current = null;
      } else if (e.touches.length === 2) {
        touchStartRef.current = null;
        pinchStartRef.current = {
          distance: getTouchDistance(e.touches),
          zoom,
        };
      }
    },
    [pan, zoom, dismissHint]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && touchStartRef.current) {
        const dx = e.touches[0].clientX - touchStartRef.current.x;
        const dy = e.touches[0].clientY - touchStartRef.current.y;
        setPan(clampPan({ x: touchStartRef.current.panX + dx, y: touchStartRef.current.panY + dy }));
      } else if (e.touches.length === 2 && pinchStartRef.current) {
        const currentDistance = getTouchDistance(e.touches);
        const scale = currentDistance / pinchStartRef.current.distance;
        const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinchStartRef.current.zoom * scale));
        setZoom(newZoom);
      }
    },
    [clampPan]
  );

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    pinchStartRef.current = null;
  }, []);

  // Card click — suppressed if user dragged
  const handleCardClick = useCallback(
    (nodeId: string) => {
      if (didDragRef.current) return;
      onNodeSelect(selectedNodeId === nodeId ? null : nodeId);
    },
    [onNodeSelect, selectedNodeId]
  );

  // Background click to deselect (only if no drag)
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (didDragRef.current) return;
      if (e.target === e.currentTarget || (e.target as HTMLElement).dataset?.pannable === "true") {
        onNodeSelect(null);
      }
    },
    [onNodeSelect]
  );

  const dotSize = DOT_GAP * zoom;

  return (
    <div
      ref={containerRef}
      className={`flex-1 overflow-hidden relative touch-none select-none ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
      data-lenis-prevent
      style={{
        backgroundColor: "var(--color-background)",
        backgroundImage: "radial-gradient(circle, var(--color-border) 0.8px, transparent 0.8px)",
        backgroundSize: `${dotSize}px ${dotSize}px`,
        backgroundPosition: `${pan.x % dotSize}px ${pan.y % dotSize}px`,
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
                  className="h-px w-10 flex-shrink-0"
                  style={{ backgroundColor: section.color }}
                />
                <h3
                  className="text-sm font-bold uppercase tracking-widest flex-shrink-0"
                  style={{ color: section.color }}
                >
                  {section.label}
                </h3>
                <Badge variant="default" size="sm">
                  {section.nodes.length}
                </Badge>
                <div className="flex-1 h-px bg-border/30" />
              </div>

              {/* Card grid — items-start so cards align to top, not stretch */}
              <div className="grid grid-cols-4 gap-4 items-start">
                {section.nodes.map((node) => (
                  <SitemapGridCard
                    key={node.id}
                    node={node}
                    selected={selectedNodeId === node.id}
                    onClick={() => handleCardClick(node.id)}
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
              <span>Scroll or drag to navigate</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2 text-text-muted text-xs">
              <Command className="w-3.5 h-3.5 text-text-dim" />
              <span>+ Scroll to zoom</span>
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
