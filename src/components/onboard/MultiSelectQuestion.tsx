"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Input } from "@/components/ui";
import type { QuestionProps } from "@/lib/onboard/types";

const SHORTCUT_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function MultiSelectQuestion({
  question,
  value,
  onChange,
  onNext,
}: QuestionProps) {
  const options = useMemo(() => question.options ?? [], [question.options]);
  const selected = useMemo(() => Array.isArray(value) ? (value as string[]) : [], [value]);
  const [otherText, setOtherText] = useState("");
  const OTHER_VALUE = "__other__";

  const toggleOption = useCallback(
    (optionValue: string) => {
      const next = selected.includes(optionValue)
        ? selected.filter((v) => v !== optionValue)
        : [...selected, optionValue];
      onChange(next);
    },
    [selected, onChange]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      const key = e.key.toUpperCase();
      const totalOptions = question.allowOther
        ? options.length + 1
        : options.length;
      const index = SHORTCUT_LETTERS.indexOf(key);
      if (index >= 0 && index < totalOptions) {
        e.preventDefault();
        if (index < options.length) {
          toggleOption(options[index].value);
        } else {
          toggleOption(OTHER_VALUE);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [options, question.allowOther, toggleOption]);

  const handleContinue = () => {
    let finalValues = [...selected];
    if (selected.includes(OTHER_VALUE) && otherText.trim()) {
      finalValues = finalValues.filter((v) => v !== OTHER_VALUE);
      finalValues.push(otherText.trim());
    } else {
      finalValues = finalValues.filter((v) => v !== OTHER_VALUE);
    }
    onChange(finalValues);
    setTimeout(onNext, 50);
  };

  const allOptions = [
    ...options.map((o) => ({ label: o.label, value: o.value })),
    ...(question.allowOther
      ? [{ label: "Other", value: OTHER_VALUE }]
      : []),
  ];

  return (
    <div className="space-y-3">
      {allOptions.map((option, index) => {
        const isSelected = selected.includes(option.value);
        const letter = SHORTCUT_LETTERS[index] ?? "";

        return (
          <div key={option.value}>
            <button
              type="button"
              onClick={() => toggleOption(option.value)}
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
              <span className="flex-1 text-lg">{option.label}</span>
              <div
                className={`
                  w-6 h-6 rounded border-2 flex items-center justify-center
                  transition-colors flex-shrink-0
                  ${
                    isSelected
                      ? "bg-accent border-accent"
                      : "border-border bg-background"
                  }
                `}
              >
                {isSelected && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </button>
            {option.value === OTHER_VALUE && isSelected && (
              <div className="mt-2 ml-12">
                <Input
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  placeholder="Please specify..."
                  className="!text-base"
                  autoFocus
                />
              </div>
            )}
          </div>
        );
      })}
      <div className="pt-4 flex justify-end">
        <Button onClick={handleContinue} size="md">
          Continue
        </Button>
      </div>
    </div>
  );
}
