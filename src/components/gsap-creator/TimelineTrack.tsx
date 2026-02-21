"use client";

import type { Tween, TimelineViewState } from "@/lib/gsap-creator/types";
import { TweenBar } from "./TweenBar";

interface TimelineTrackProps {
  tween: Tween;
  index: number;
  isSelected: boolean;
  viewState: TimelineViewState;
  absoluteStart: number;
  onSelect: () => void;
  onMove: (tweenId: string, newPosition: number) => void;
  onResize: (
    tweenId: string,
    newDuration: number,
    newPosition?: number
  ) => void;
  onDelete: (tweenId: string) => void;
}

export function TimelineTrack({
  tween,
  isSelected,
  viewState,
  absoluteStart,
  onSelect,
  onMove,
  onResize,
  onDelete,
}: TimelineTrackProps) {
  return (
    <div
      className={`relative h-10 border-b border-border/50 group
        ${isSelected ? "bg-accent/5" : "hover:bg-white/[0.02]"}`}
    >
      {/* Track label */}
      <div
        className="absolute left-0 top-0 bottom-0 w-32 flex items-center px-2 z-20
        bg-surface border-r border-border/50"
      >
        <span className="text-[10px] font-mono text-text-muted truncate flex-1">
          {tween.target}
        </span>
        <span
          className="text-[10px] text-text-dim/50 opacity-0 group-hover:opacity-100 cursor-pointer
            hover:text-red-400 transition-all ml-1 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(tween.id);
          }}
        >
          x
        </span>
      </div>

      {/* Bar area */}
      <div className="absolute left-32 right-0 top-0 bottom-0">
        <TweenBar
          tween={tween}
          isSelected={isSelected}
          viewState={viewState}
          absoluteStart={absoluteStart}
          onSelect={onSelect}
          onMove={(pos) => onMove(tween.id, pos)}
          onResize={(dur, pos) => onResize(tween.id, dur, pos)}
        />
      </div>
    </div>
  );
}
