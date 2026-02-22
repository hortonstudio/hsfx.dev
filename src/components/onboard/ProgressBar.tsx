"use client";

export function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-border/30">
      <div
        className="h-full bg-accent transition-all duration-500 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
