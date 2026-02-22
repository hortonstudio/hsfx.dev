"use client";

import { useEffect, useCallback, useMemo } from "react";
import type { QuestionProps } from "@/lib/onboard/types";

const SHORTCUT_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function SelectQuestion({
  question,
  value,
  onChange,
  onNext,
}: QuestionProps) {
  const options = useMemo(() => question.options ?? [], [question.options]);

  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange(optionValue);
      setTimeout(onNext, 200);
    },
    [onChange, onNext]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const key = e.key.toUpperCase();
      const index = SHORTCUT_LETTERS.indexOf(key);
      if (index >= 0 && index < options.length) {
        e.preventDefault();
        handleSelect(options[index].value);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [options, handleSelect]);

  return (
    <div className="space-y-3">
      {options.map((option, index) => {
        const isSelected = value === option.value;
        const letter = SHORTCUT_LETTERS[index] ?? "";

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={`
              w-full flex items-center gap-4 px-5 py-4
              border-2 rounded-xl text-left
              transition-all duration-200
              min-h-[48px] cursor-pointer
              ${
                isSelected
                  ? "border-accent bg-accent/10 text-text-primary"
                  : "border-border bg-surface hover:border-accent/50 text-text-primary"
              }
            `}
          >
            <span
              className={`
                flex-shrink-0 w-8 h-8 rounded-md
                flex items-center justify-center
                text-sm font-semibold
                border transition-colors
                ${
                  isSelected
                    ? "border-accent bg-accent text-white"
                    : "border-border bg-background text-text-muted"
                }
              `}
            >
              {letter}
            </span>
            <span className="text-lg">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
