"use client";

import { useRef, useCallback, useState } from "react";
import type { Tween, TimelineViewState } from "@/lib/gsap-creator/types";

interface TweenBarProps {
  tween: Tween;
  isSelected: boolean;
  viewState: TimelineViewState;
  absoluteStart: number; // pre-resolved absolute position in seconds
  onSelect: () => void;
  onMove: (newPosition: number) => void;
  onResize: (newDuration: number, newPosition?: number) => void;
}

type DragMode = "move" | "resize-left" | "resize-right" | null;

export function TweenBar({
  tween,
  isSelected,
  viewState,
  absoluteStart,
  onSelect,
  onMove,
  onResize,
}: TweenBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    startPosition: number;
    startDuration: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { zoom, snapToGrid, gridSize } = viewState;
  const width = tween.duration * zoom;
  const left = absoluteStart * zoom;

  const snap = useCallback(
    (val: number) => {
      if (!snapToGrid) return val;
      return Math.round(val / gridSize) * gridSize;
    },
    [snapToGrid, gridSize]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, mode: DragMode) => {
      e.preventDefault();
      e.stopPropagation();
      onSelect();

      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);

      dragRef.current = {
        mode,
        startX: e.clientX,
        startPosition: absoluteStart,
        startDuration: tween.duration,
      };
      setIsDragging(true);
    },
    [absoluteStart, tween.duration, onSelect]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const { mode, startX, startPosition, startDuration } = dragRef.current;
      const deltaX = e.clientX - startX;
      const deltaTime = deltaX / zoom;

      if (mode === "move") {
        const newPos = snap(Math.max(0, startPosition + deltaTime));
        onMove(newPos);
      } else if (mode === "resize-right") {
        const newDur = snap(Math.max(0.05, startDuration + deltaTime));
        onResize(newDur);
      } else if (mode === "resize-left") {
        const rawDelta = deltaTime;
        const maxDelta = startDuration - 0.05;
        const clampedDelta = Math.min(rawDelta, maxDelta);
        const newPos = snap(Math.max(0, startPosition + clampedDelta));
        const newDur = snap(Math.max(0.05, startDuration - clampedDelta));
        onResize(newDur, newPos);
      }
    },
    [zoom, snap, onMove, onResize]
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  const handleResizeStyle =
    "absolute top-0 bottom-0 w-2 cursor-ew-resize z-10 hover:bg-white/10";

  return (
    <div
      ref={barRef}
      className={`absolute top-1 bottom-1 rounded-md flex items-center overflow-hidden
        transition-shadow duration-150 cursor-grab select-none group
        ${isSelected ? "ring-2 ring-accent shadow-lg shadow-accent/20 z-20" : "z-10 hover:brightness-110"}
        ${isDragging ? "cursor-grabbing opacity-90" : ""}`}
      style={{
        left,
        width: Math.max(width, 4),
        backgroundColor: tween.color + "cc",
      }}
    >
      {/* Left resize handle */}
      <div
        className={handleResizeStyle + " left-0 rounded-l-md"}
        onPointerDown={(e) => handlePointerDown(e, "resize-left")}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Main body (move) */}
      <div
        className="flex-1 h-full flex items-center justify-center px-3 min-w-0"
        onPointerDown={(e) => handlePointerDown(e, "move")}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <span className="text-[10px] font-medium text-white truncate drop-shadow-sm">
          {tween.target}
        </span>
      </div>

      {/* Right resize handle */}
      <div
        className={handleResizeStyle + " right-0 rounded-r-md"}
        onPointerDown={(e) => handlePointerDown(e, "resize-right")}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Duration label (on hover) */}
      <div
        className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100
        text-[9px] font-mono text-text-dim bg-surface border border-border rounded px-1 py-0.5
        pointer-events-none transition-opacity whitespace-nowrap"
      >
        {tween.duration.toFixed(2)}s
      </div>
    </div>
  );
}
