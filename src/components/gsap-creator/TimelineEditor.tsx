"use client";

import { useRef, useMemo } from "react";
import type {
  Tween,
  TimelineViewState,
  PlaybackState,
} from "@/lib/gsap-creator/types";
import { TimelineRuler } from "./TimelineRuler";
import { TimelineTrack } from "./TimelineTrack";
import { Playhead, type PlayheadHandle } from "./Playhead";

interface TimelineEditorProps {
  tweens: Tween[];
  selectedTweenId: string | null;
  viewState: TimelineViewState;
  playback: PlaybackState;
  onSelectTween: (id: string) => void;
  onMoveTween: (id: string, newPosition: number) => void;
  onResizeTween: (
    id: string,
    newDuration: number,
    newPosition?: number
  ) => void;
  onDeleteTween: (id: string) => void;
  onAddTween: () => void;
  onViewStateChange: (updates: Partial<TimelineViewState>) => void;
  onSeek: (time: number) => void;
  playheadRef: React.RefObject<PlayheadHandle>;
}

/** Resolve position strings to absolute seconds */
function resolvePositions(tweens: Tween[]): number[] {
  const positions: number[] = [];
  let runningEnd = 0;

  for (let i = 0; i < tweens.length; i++) {
    const tween = tweens[i];
    const pos = tween.position;
    let absStart = 0;

    if (!pos || pos === "") {
      // Default: start at end of previous
      absStart = runningEnd;
    } else if (pos === "<") {
      // Same start as previous
      absStart = i > 0 ? positions[i - 1] : 0;
    } else if (pos === ">=") {
      absStart = runningEnd;
    } else if (pos.startsWith("<")) {
      // Relative to previous start: "<+=0.2" or "<-=0.1"
      const prevStart = i > 0 ? positions[i - 1] : 0;
      const offset =
        parseFloat(pos.slice(1).replace("+=", "").replace("-=", "-")) || 0;
      absStart = prevStart + offset;
    } else if (pos.startsWith(">")) {
      // Relative to previous end
      const offset =
        parseFloat(pos.slice(1).replace("+=", "").replace("-=", "-")) || 0;
      absStart = runningEnd + offset;
    } else if (pos.startsWith("+=") || pos.startsWith("-=")) {
      const offset =
        parseFloat(pos.replace("+=", "").replace("-=", "-")) || 0;
      absStart = runningEnd + offset;
    } else {
      // Absolute number
      const parsed = parseFloat(pos);
      absStart = isNaN(parsed) ? runningEnd : parsed;
    }

    absStart = Math.max(0, absStart);
    positions.push(absStart);
    runningEnd = Math.max(runningEnd, absStart + tween.duration);
  }

  return positions;
}

export function TimelineEditor({
  tweens,
  selectedTweenId,
  viewState,
  onSelectTween,
  onMoveTween,
  onResizeTween,
  onDeleteTween,
  onAddTween,
  onViewStateChange,
  onSeek,
  playheadRef,
}: TimelineEditorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const absolutePositions = useMemo(() => resolvePositions(tweens), [tweens]);

  const totalDuration = useMemo(() => {
    if (tweens.length === 0) return 2;
    let max = 0;
    for (let i = 0; i < tweens.length; i++) {
      max = Math.max(max, absolutePositions[i] + tweens[i].duration);
    }
    return Math.max(max + 0.5, 2);
  }, [tweens, absolutePositions]);

  return (
    <div className="flex flex-col bg-surface border-t border-border">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-border bg-surface">
        <button
          onClick={onAddTween}
          className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-accent
            bg-accent/10 hover:bg-accent/20 rounded transition-colors"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Tween
        </button>

        <div className="h-4 w-px bg-border" />

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-text-dim">Zoom</span>
          <input
            type="range"
            min={50}
            max={500}
            value={viewState.zoom}
            onChange={(e) =>
              onViewStateChange({ zoom: Number(e.target.value) })
            }
            className="w-20 h-1 accent-accent"
          />
          <span className="text-[10px] font-mono text-text-dim w-8">
            {viewState.zoom}
          </span>
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Snap toggle */}
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={viewState.snapToGrid}
            onChange={(e) =>
              onViewStateChange({ snapToGrid: e.target.checked })
            }
            className="w-3 h-3 accent-accent"
          />
          <span className="text-[10px] text-text-dim">Snap</span>
        </label>

        {viewState.snapToGrid && (
          <select
            value={viewState.gridSize}
            onChange={(e) =>
              onViewStateChange({ gridSize: Number(e.target.value) })
            }
            className="h-6 px-1 text-[10px] font-mono text-text-dim bg-black/20 border border-border
              rounded focus:outline-none"
          >
            <option value={0.05}>0.05s</option>
            <option value={0.1}>0.1s</option>
            <option value={0.25}>0.25s</option>
            <option value={0.5}>0.5s</option>
            <option value={1}>1s</option>
          </select>
        )}
      </div>

      {/* Scrollable timeline area */}
      <div
        ref={scrollContainerRef}
        className="relative overflow-x-auto overflow-y-auto flex-1"
        style={{ minHeight: Math.max(tweens.length * 40 + 28, 120) }}
        onScroll={(e) => {
          onViewStateChange({
            scrollX: (e.target as HTMLElement).scrollLeft,
          });
        }}
      >
        {/* Ruler */}
        <div className="sticky top-0 z-20">
          <div className="ml-32">
            <TimelineRuler
              viewState={viewState}
              duration={totalDuration}
              onSeek={onSeek}
            />
          </div>
        </div>

        {/* Tracks */}
        <div className="relative">
          {tweens.map((tween, index) => (
            <TimelineTrack
              key={tween.id}
              tween={tween}
              index={index}
              isSelected={tween.id === selectedTweenId}
              viewState={viewState}
              absoluteStart={absolutePositions[index] || 0}
              onSelect={() => onSelectTween(tween.id)}
              onMove={onMoveTween}
              onResize={onResizeTween}
              onDelete={onDeleteTween}
            />
          ))}

          {tweens.length === 0 && (
            <div className="flex items-center justify-center h-20 text-text-dim text-xs">
              Add a tween to start building your timeline
            </div>
          )}

          {/* Playhead overlay - positioned in the bar area */}
          <div className="absolute top-0 bottom-0 left-32 right-0 pointer-events-none">
            <Playhead ref={playheadRef} viewState={viewState} />
          </div>
        </div>
      </div>
    </div>
  );
}
