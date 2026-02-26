"use client";

import { useMemo, useCallback, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mouse, Command } from "lucide-react";
import type { SitemapNode, SitemapEdge, SitemapComment } from "@/lib/clients/sitemap-types";
import { buildGridLayout, PAGE_TYPE_CONFIG } from "@/lib/clients/sitemap-utils";
import { SitemapGridCard } from "./SitemapGridCard";
import { SitemapTemplateCard } from "./SitemapTemplateCard";

interface SitemapGridViewProps {
  nodes: SitemapNode[];
  edges: SitemapEdge[];
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  readOnly?: boolean;
  onDeleteNode?: (id: string) => void;
  onDuplicateNode?: (id: string) => void;
  onAddChild?: (id: string) => void;
  /** Render slot for section-level comment triggers on cards */
  commentSlot?: (nodeId: string, sectionName: string) => React.ReactNode;
  /** Live comments for computing per-node comment counts */
  comments?: SitemapComment[];
}

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 1.5;
const DRAG_THRESHOLD = 5;
const CONTENT_WIDTH = 5000;
const CONTENT_HEIGHT = 3000;
const PAN_MARGIN = 200;
const DOT_GAP = 24;
const CARD_WIDTH = 300;
const CARD_GAP = 24; // gap-6
const CANVAS_PAD = 80; // px-10 * 2

/** Tier visual config */
const TIER_STYLE = {
  home: { color: "#3b82f6", gradientTo: "#818cf8", label: "Home" },
  core: { color: "#7c3aed", gradientTo: "#a78bfa", label: "Core Pages" },
  resources: { color: "#06b6d4", gradientTo: "#22d3ee", label: "Resources & More" },
  legal: { color: "#f59e0b", gradientTo: "#fbbf24", label: "Legal & Other" },
} as const;

export function SitemapGridView({
  nodes,
  edges,
  selectedNodeId,
  onNodeSelect,
  readOnly,
  onDeleteNode,
  onDuplicateNode,
  onAddChild,
  commentSlot,
  comments,
}: SitemapGridViewProps) {
  const layout = useMemo(
    () => buildGridLayout(nodes, edges),
    [nodes, edges]
  );

  // Compute canvas width from the widest tier row
  const canvasWidth = useMemo(() => {
    const maxCols = Math.max(
      layout.homeColumns.length,
      layout.coreColumns.length,
      layout.resourceColumns.length,
      layout.legalPages.length,
      1
    );
    return maxCols * CARD_WIDTH + (maxCols - 1) * CARD_GAP + CANVAS_PAD;
  }, [layout]);

  // Compute comment counts per node from live comments
  const commentCounts = useMemo(() => {
    if (!comments?.length) return new Map<string, number>();
    const counts = new Map<string, number>();
    for (const c of comments) {
      if (c.node_id && !c.parent_id) {
        counts.set(c.node_id, (counts.get(c.node_id) ?? 0) + 1);
      }
    }
    return counts;
  }, [comments]);

  // Zoom & pan state
  const [zoom, setZoom] = useState(0.65);
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

  // Clamp pan so content stays in view (accepts explicit zoom for atomic updates)
  const clampPanAt = useCallback((p: { x: number; y: number }, z: number) => {
    if (!containerRef.current) return p;
    const { width: cw, height: ch } = containerRef.current.getBoundingClientRect();
    const cWidth = CONTENT_WIDTH * z;
    const cHeight = CONTENT_HEIGHT * z;
    return {
      x: Math.max(-(cWidth - PAN_MARGIN), Math.min(cw - PAN_MARGIN, p.x)),
      y: Math.max(-(cHeight - PAN_MARGIN), Math.min(ch - PAN_MARGIN, p.y)),
    };
  }, []);

  const clampPan = useCallback(
    (p: { x: number; y: number }) => clampPanAt(p, zoomRef.current),
    [clampPanAt]
  );

  // Center content on initial mount
  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;
    const { width } = containerRef.current.getBoundingClientRect();
    const contentWidth = canvasWidth * zoom;
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

  // Wheel: Cmd/Ctrl+scroll = zoom toward cursor, plain scroll = pan
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      dismissHint();

      if (e.metaKey || e.ctrlKey) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const delta = e.deltaY > 0 ? -0.05 : 0.05;

        setZoom((oldZoom) => {
          const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldZoom + delta));
          if (newZoom === oldZoom) return oldZoom;

          setPan((oldPan) => {
            const contentX = (mouseX - oldPan.x) / oldZoom;
            const contentY = (mouseY - oldPan.y) / oldZoom;
            return clampPanAt(
              { x: mouseX - contentX * newZoom, y: mouseY - contentY * newZoom },
              newZoom
            );
          });

          return newZoom;
        });
      } else {
        setPan((p) => clampPan({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      }
    },
    [dismissHint, clampPan, clampPanAt]
  );

  // Mouse pan
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

  // Shared tier section renderer
  const renderTierSection = (
    tier: keyof typeof TIER_STYLE,
    columns: { page: SitemapNode; template: SitemapNode | null }[],
    count?: number
  ) => {
    const style = TIER_STYLE[tier];
    return (
      <section
        className="rounded-2xl border border-white/[0.04] p-6 pt-5"
        style={{ backgroundColor: `${style.color}06` }}
      >
        {/* Tier header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-1 h-7 rounded-full"
            style={{ background: `linear-gradient(to bottom, ${style.color}, ${style.gradientTo})` }}
          />
          <h3
            className="text-sm font-bold uppercase tracking-widest"
            style={{ color: style.color }}
          >
            {style.label}
          </h3>
          {count != null && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white/90"
              style={{ background: `linear-gradient(135deg, ${style.color}, ${style.gradientTo})` }}
            >
              {count}
            </span>
          )}
          <div
            className="flex-1 h-px"
            style={{ background: `linear-gradient(to right, ${style.color}30, transparent)` }}
          />
        </div>

        {/* Cards — single horizontal row */}
        <div className="flex justify-center gap-6">
          {columns.map((col) => {
            const nodeColor = col.page.data.color || PAGE_TYPE_CONFIG[col.page.data.pageType]?.color || "#7c3aed";
            return (
              <div key={col.page.id} style={{ width: CARD_WIDTH }} className="flex flex-col items-center">
                <SitemapGridCard
                  node={col.page}
                  selected={selectedNodeId === col.page.id}
                  onClick={() => handleCardClick(col.page.id)}
                  readOnly={readOnly}
                  onDelete={onDeleteNode}
                  onDuplicate={onDuplicateNode}
                  onAddChild={onAddChild}
                  commentSlot={commentSlot ? (s) => commentSlot(col.page.id, s) : undefined}
                  commentCount={commentCounts.get(col.page.id)}
                />
                {col.template && (
                  <>
                    <div
                      className="w-[2px] h-12"
                      style={{
                        background: `repeating-linear-gradient(to bottom, ${nodeColor}90 0px, ${nodeColor}90 5px, transparent 5px, transparent 10px)`,
                        backgroundSize: "2px 10px",
                        animation: "connector-march 1.2s linear infinite",
                      }}
                    />
                    <div className="w-full">
                      <SitemapTemplateCard
                        node={col.template}
                        selected={selectedNodeId === col.template.id}
                        onClick={() => handleCardClick(col.template?.id ?? col.page.id)}
                        commentSlot={commentSlot ? (s) => commentSlot(col.template!.id, s) : undefined}
                      />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  // Legal pages as flat cards (no template column)
  const renderLegalSection = () => {
    const style = TIER_STYLE.legal;
    return (
      <section
        className="rounded-2xl border border-white/[0.04] p-6 pt-5"
        style={{ backgroundColor: `${style.color}06` }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-1 h-7 rounded-full"
            style={{ background: `linear-gradient(to bottom, ${style.color}, ${style.gradientTo})` }}
          />
          <h3
            className="text-sm font-bold uppercase tracking-widest"
            style={{ color: style.color }}
          >
            {style.label}
          </h3>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white/90"
            style={{ background: `linear-gradient(135deg, ${style.color}, ${style.gradientTo})` }}
          >
            {layout.legalPages.length}
          </span>
          <div
            className="flex-1 h-px"
            style={{ background: `linear-gradient(to right, ${style.color}30, transparent)` }}
          />
        </div>
        <div className="flex justify-center gap-6">
          {layout.legalPages.map((node) => (
            <div key={node.id} style={{ width: CARD_WIDTH }}>
              <SitemapGridCard
                node={node}
                selected={selectedNodeId === node.id}
                onClick={() => handleCardClick(node.id)}
                readOnly={readOnly}
                onDelete={onDeleteNode}
                onDuplicate={onDuplicateNode}
                onAddChild={onAddChild}
                commentSlot={commentSlot ? (s) => commentSlot(node.id, s) : undefined}
                commentCount={commentCounts.get(node.id)}
              />
            </div>
          ))}
        </div>
      </section>
    );
  };

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
      {/* Zoomable/pannable content — fixed width canvas */}
      <div
        className="origin-top-left will-change-transform"
        data-pannable="true"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        <div
          className="py-10 px-10 flex flex-col gap-10"
          style={{ width: canvasWidth }}
          data-pannable="true"
        >
          {layout.homeColumns.length > 0 &&
            renderTierSection("home", layout.homeColumns)}

          {layout.coreColumns.length > 0 &&
            renderTierSection("core", layout.coreColumns, layout.coreColumns.length)}

          {layout.resourceColumns.length > 0 &&
            renderTierSection("resources", layout.resourceColumns, layout.resourceColumns.length)}

          {layout.legalPages.length > 0 &&
            renderLegalSection()}

          {layout.homeColumns.length === 0 && layout.coreColumns.length === 0 && layout.resourceColumns.length === 0 && layout.legalPages.length === 0 && (
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/40 backdrop-blur-[2px]"
          >
            <div className="flex flex-col items-center gap-5 text-white/70">
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-center gap-2">
                  <Mouse className="w-8 h-8" />
                  <span className="text-sm font-medium">Scroll or drag</span>
                  <span className="text-xs">to navigate</span>
                </div>
                <div className="w-px h-16 bg-border/30" />
                <div className="flex flex-col items-center gap-2">
                  <Command className="w-8 h-8" />
                  <span className="text-sm font-medium">Cmd + Scroll</span>
                  <span className="text-xs">to zoom</span>
                </div>
              </div>
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
