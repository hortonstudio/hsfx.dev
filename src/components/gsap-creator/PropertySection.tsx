"use client";

import { useState } from "react";

interface PropertySectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function PropertySection({ title, defaultOpen = true, children }: PropertySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-1.5 px-3 py-2 text-[10px] font-medium
          text-text-dim uppercase tracking-wider hover:text-text-muted transition-colors"
      >
        <svg
          width="8"
          height="8"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`transition-transform ${isOpen ? "rotate-90" : ""}`}
        >
          <polygon points="6 4 20 12 6 20" />
        </svg>
        {title}
      </button>
      {isOpen && <div className="px-3 pb-3 space-y-2">{children}</div>}
    </div>
  );
}
