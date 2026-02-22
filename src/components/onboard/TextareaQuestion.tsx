"use client";

import { useEffect, useRef } from "react";
import { Textarea, Button } from "@/components/ui";
import type { QuestionProps } from "@/lib/onboard/types";

export function TextareaQuestion({
  question,
  value,
  onChange,
  onNext,
}: QuestionProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textValue = (value as string) ?? "";
  const maxLength = question.maxLength;

  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-4">
      <Textarea
        ref={textareaRef}
        value={textValue}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.shiftKey) {
            e.preventDefault();
            onNext();
          }
        }}
        placeholder={question.placeholder ?? "Type your answer..."}
        className="!text-lg !py-4 !px-5 min-h-[160px]"
        maxLength={maxLength}
      />
      <div className="flex items-center justify-between">
        {maxLength ? (
          <p className="text-text-dim text-sm">
            {textValue.length}/{maxLength} characters
          </p>
        ) : (
          <p className="text-text-dim text-sm">
            Press{" "}
            <span className="font-medium text-text-muted">Shift + Enter</span>{" "}
            to continue
          </p>
        )}
        <Button onClick={onNext} size="md">
          Continue
        </Button>
      </div>
    </div>
  );
}
