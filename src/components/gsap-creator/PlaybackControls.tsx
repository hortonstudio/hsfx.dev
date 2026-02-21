"use client";

import type { PlaybackState } from "@/lib/gsap-creator/types";

interface PlaybackControlsProps {
  playback: PlaybackState;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  onToggleLoop: () => void;
  onSpeedChange: (speed: number) => void;
}

const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2];

export function PlaybackControls({
  playback,
  onPlay,
  onPause,
  onRestart,
  onToggleLoop,
  onSpeedChange,
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border-t border-border">
      {/* Restart */}
      <button
        onClick={onRestart}
        className="p-1.5 text-text-muted hover:text-text-primary rounded transition-colors"
        aria-label="Restart"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      </button>

      {/* Play/Pause */}
      <button
        onClick={playback.isPlaying ? onPause : onPlay}
        className="p-1.5 text-text-primary hover:text-accent rounded transition-colors"
        aria-label={playback.isPlaying ? "Pause" : "Play"}
      >
        {playback.isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
      </button>

      {/* Time display */}
      <span className="text-[11px] font-mono text-text-dim min-w-[5rem] text-center">
        {playback.currentTime.toFixed(2)}s / {playback.duration.toFixed(2)}s
      </span>

      {/* Loop toggle */}
      <button
        onClick={onToggleLoop}
        className={`p-1.5 rounded transition-colors ${
          playback.loop
            ? "text-accent"
            : "text-text-dim hover:text-text-muted"
        }`}
        aria-label="Toggle loop"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
      </button>

      {/* Speed selector */}
      <div className="flex items-center gap-0.5 ml-auto">
        {SPEED_OPTIONS.map((speed) => (
          <button
            key={speed}
            onClick={() => onSpeedChange(speed)}
            className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors
              ${
                playback.speed === speed
                  ? "bg-accent/20 text-accent"
                  : "text-text-dim hover:text-text-muted hover:bg-white/5"
              }`}
          >
            {speed}x
          </button>
        ))}
      </div>
    </div>
  );
}
