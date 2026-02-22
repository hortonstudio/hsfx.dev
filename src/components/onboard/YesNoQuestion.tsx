"use client";

import type { QuestionProps } from "@/lib/onboard/types";

export function YesNoQuestion({ value, onChange, onNext }: QuestionProps) {
  const handleSelect = (answer: boolean) => {
    onChange(answer);
    setTimeout(onNext, 200);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => handleSelect(true)}
        className={`
          py-6 rounded-xl text-xl font-medium
          border-2 transition-all duration-200
          min-h-[48px] cursor-pointer
          ${
            value === true
              ? "border-accent bg-accent/10 text-accent"
              : "border-border bg-surface hover:border-accent/50 text-text-primary"
          }
        `}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => handleSelect(false)}
        className={`
          py-6 rounded-xl text-xl font-medium
          border-2 transition-all duration-200
          min-h-[48px] cursor-pointer
          ${
            value === false
              ? "border-accent bg-accent/10 text-accent"
              : "border-border bg-surface hover:border-accent/50 text-text-primary"
          }
        `}
      >
        No
      </button>
    </div>
  );
}
