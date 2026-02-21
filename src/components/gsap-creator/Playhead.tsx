"use client";

import { useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import type { TimelineViewState } from "@/lib/gsap-creator/types";

export interface PlayheadHandle {
  setTime: (time: number) => void;
}

interface PlayheadProps {
  viewState: TimelineViewState;
  onSeek?: (time: number) => void;
  onScrub?: (time: number) => void;
}

export const Playhead = forwardRef<PlayheadHandle, PlayheadProps>(
  function Playhead({ viewState, onSeek, onScrub }, ref) {
    const lineRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{ startX: number; startTime: number } | null>(null);

    const getTime = useCallback(() => {
      if (!lineRef.current) return 0;
      return parseFloat(lineRef.current.style.left) / viewState.zoom;
    }, [viewState.zoom]);

    useImperativeHandle(ref, () => ({
      setTime(time: number) {
        if (lineRef.current) {
          lineRef.current.style.left = `${time * viewState.zoom}px`;
        }
      },
    }));

    const handlePointerDown = useCallback(
      (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const target = e.currentTarget as HTMLElement;
        target.setPointerCapture(e.pointerId);
        dragRef.current = { startX: e.clientX, startTime: getTime() };
      },
      [getTime]
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent) => {
        if (!dragRef.current || !lineRef.current) return;
        const deltaX = e.clientX - dragRef.current.startX;
        const deltaTime = deltaX / viewState.zoom;
        const newTime = Math.max(0, dragRef.current.startTime + deltaTime);
        lineRef.current.style.left = `${newTime * viewState.zoom}px`;
        onScrub?.(newTime);
      },
      [viewState.zoom, onScrub]
    );

    const handlePointerUp = useCallback(() => {
      if (lineRef.current) {
        const finalTime = parseFloat(lineRef.current.style.left) / viewState.zoom;
        onSeek?.(Math.max(0, finalTime));
      }
      dragRef.current = null;
    }, [viewState.zoom, onSeek]);

    return (
      <div
        ref={lineRef}
        className="absolute top-0 bottom-0 w-px bg-red-500 z-30 pointer-events-none"
        style={{ left: 0 }}
      >
        {/* Draggable playhead handle */}
        <div
          className="absolute -top-1 -left-2 w-4 h-4 bg-red-500 rounded-full shadow-sm
            pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </div>
    );
  }
);
