"use client";

import type { TimelineViewState } from "@/lib/gsap-creator/types";

interface TimelineRulerProps {
  viewState: TimelineViewState;
  duration: number;
  onSeek: (time: number) => void;
}

export function TimelineRuler({
  viewState,
  duration,
  onSeek,
}: TimelineRulerProps) {
  const { zoom } = viewState;
  const totalWidth = Math.max(duration * zoom, 800);

  // Calculate tick spacing based on zoom
  const getTickInterval = () => {
    if (zoom >= 400) return 0.1;
    if (zoom >= 200) return 0.2;
    if (zoom >= 100) return 0.5;
    return 1;
  };

  const tickInterval = getTickInterval();
  const totalTicks = Math.ceil(duration / tickInterval) + 1;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + viewState.scrollX;
    const time = Math.max(0, x / zoom);
    onSeek(time);
  };

  return (
    <div
      className="relative h-7 bg-surface border-b border-border cursor-pointer select-none overflow-hidden"
      onClick={handleClick}
    >
      <div className="relative h-full" style={{ width: totalWidth }}>
        {Array.from({ length: totalTicks }, (_, i) => {
          const time = i * tickInterval;
          const x = time * zoom;
          const isMajor =
            time % 1 === 0 || (tickInterval >= 0.5 && time % 0.5 === 0);
          const isWhole = Math.abs(time - Math.round(time)) < 0.001;

          return (
            <div
              key={i}
              className="absolute top-0 h-full"
              style={{ left: x }}
            >
              <div
                className={`absolute bottom-0 w-px ${
                  isWhole
                    ? "h-3 bg-text-dim"
                    : isMajor
                      ? "h-2 bg-border"
                      : "h-1.5 bg-border/50"
                }`}
              />
              {isWhole && (
                <span className="absolute top-0.5 left-1 text-[10px] text-text-dim font-mono select-none">
                  {time}s
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
