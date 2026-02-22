"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui";
import type { QuestionProps } from "@/lib/onboard/types";

export function TextQuestion({ question, value, onChange, onNext }: QuestionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      <Input
        ref={inputRef}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onNext();
          }
        }}
        placeholder={question.placeholder ?? "Type your answer..."}
        className="!text-lg !py-4 !px-5"
      />
      <p className="text-text-dim text-sm">
        Press <span className="font-medium text-text-muted">Enter</span> to continue
      </p>
    </div>
  );
}
