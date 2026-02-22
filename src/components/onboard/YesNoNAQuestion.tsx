"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input, Button } from "@/components/ui";
import type { QuestionProps, YesNoNAValue } from "@/lib/onboard/types";

const EMPTY_VALUE: YesNoNAValue = { answer: "yes", details: undefined };

export function YesNoNAQuestion({
  question,
  value,
  onChange,
  onNext,
}: QuestionProps) {
  const parsed: YesNoNAValue | null =
    value && typeof value === "object" && !Array.isArray(value) && "answer" in value
      ? (value as YesNoNAValue)
      : null;

  const [showDetails, setShowDetails] = useState(false);
  const detailsRef = useRef<HTMLInputElement>(null);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const detailsPrompt = question.detailsPrompt ?? "Any details to add?";

  const clearTimer = useCallback(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  useEffect(() => {
    if (showDetails) {
      const timer = setTimeout(() => {
        detailsRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showDetails]);

  const handleSelect = (answer: "yes" | "no" | "na") => {
    clearTimer();

    const newValue: YesNoNAValue = {
      ...EMPTY_VALUE,
      answer,
      details: parsed?.details,
    };
    onChange(newValue);

    if (answer === "na") {
      // N/A never shows details, auto-advance
      setShowDetails(false);
      autoAdvanceTimer.current = setTimeout(onNext, 600);
    } else {
      // Yes/No show optional details input
      setShowDetails(true);
    }
  };

  const handleDetailsChange = (details: string) => {
    if (!parsed) return;
    onChange({ ...parsed, details });
  };

  const handleContinue = () => {
    clearTimer();
    onNext();
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => handleSelect("yes")}
          className={`
            py-5 rounded-xl text-lg font-medium
            border-2 transition-all duration-200
            min-h-[48px] cursor-pointer
            ${
              parsed?.answer === "yes"
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface hover:border-accent/50 text-text-primary"
            }
          `}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => handleSelect("no")}
          className={`
            py-5 rounded-xl text-lg font-medium
            border-2 transition-all duration-200
            min-h-[48px] cursor-pointer
            ${
              parsed?.answer === "no"
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface hover:border-accent/50 text-text-primary"
            }
          `}
        >
          No
        </button>
        <button
          type="button"
          onClick={() => handleSelect("na")}
          className={`
            py-5 rounded-xl text-lg font-medium
            border-2 transition-all duration-200
            min-h-[48px] cursor-pointer
            ${
              parsed?.answer === "na"
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface hover:border-accent/50 text-text-dim"
            }
          `}
        >
          Not Applicable
        </button>
      </div>

      {showDetails && parsed && parsed.answer !== "na" && (
        <div className="space-y-3">
          <Input
            ref={detailsRef}
            value={parsed.details ?? ""}
            onChange={(e) => handleDetailsChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleContinue();
              }
            }}
            placeholder={detailsPrompt}
            className="!text-lg !py-4"
          />
          <div className="flex justify-end">
            <Button onClick={handleContinue} size="md">
              Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
