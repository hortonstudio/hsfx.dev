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

    // Keep latest callbacks/zoom in refs so window listeners always read fresh values
    const zoomRef = useRef(viewState.zoom);
    zoomRef.current = viewState.zoom;
    const onScrubRef = useRef(onScrub);
    onScrubRef.current = onScrub;
    const onSeekRef = useRef(onSeek);
    onSeekRef.current = onSeek;

    const getTime = useCallback(() => {
      if (!lineRef.current) return 0;
      return parseFloat(lineRef.current.style.left) / zoomRef.current;
    }, []);

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
        dragRef.current = { startX: e.clientX, startTime: getTime() };

        const handlePointerMove = (ev: PointerEvent) => {
          if (!dragRef.current || !lineRef.current) return;
          const deltaX = ev.clientX - dragRef.current.startX;
          const deltaTime = deltaX / zoomRef.current;
          const newTime = Math.max(0, dragRef.current.startTime + deltaTime);
          lineRef.current.style.left = `${newTime * zoomRef.current}px`;
          onScrubRef.current?.(newTime);
        };

        const handlePointerUp = () => {
          window.removeEventListener("pointermove", handlePointerMove);
          window.removeEventListener("pointerup", handlePointerUp);
          if (lineRef.current) {
            const finalTime =
              parseFloat(lineRef.current.style.left) / zoomRef.current;
            onSeekRef.current?.(Math.max(0, finalTime));
          }
          dragRef.current = null;
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
      },
      [getTime]
    );

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
        />
      </div>
    );
  }
);
