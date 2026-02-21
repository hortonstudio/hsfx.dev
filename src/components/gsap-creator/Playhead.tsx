"use client";

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import type { TimelineViewState } from "@/lib/gsap-creator/types";

export interface PlayheadHandle {
  setTime: (time: number) => void;
}

interface PlayheadProps {
  viewState: TimelineViewState;
}

export const Playhead = forwardRef<PlayheadHandle, PlayheadProps>(
  function Playhead({ viewState }, ref) {
    const lineRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      setTime(time: number) {
        if (lineRef.current) {
          lineRef.current.style.left = `${time * viewState.zoom}px`;
        }
      },
    }));

    // Initialize at 0
    useEffect(() => {
      if (lineRef.current) {
        lineRef.current.style.left = "0px";
      }
    }, []);

    return (
      <div
        ref={lineRef}
        className="absolute top-0 bottom-0 w-px bg-red-500 z-30 pointer-events-none"
        style={{ left: 0 }}
      >
        {/* Playhead handle */}
        <div className="absolute -top-0.5 -left-1.5 w-3 h-3 bg-red-500 rounded-full shadow-sm" />
      </div>
    );
  }
);
