"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui";
import type { QuestionProps } from "@/lib/onboard/types";

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function TextQuestion({ question, value, onChange, onNext }: QuestionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isPhone = question.format === "phone";

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
        onChange={(e) => {
          const val = e.target.value;
          onChange(isPhone ? formatPhone(val) : val);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onNext();
          }
        }}
        placeholder={question.placeholder ?? "Type your answer..."}
        className="!text-lg !py-4 !px-5"
        {...(isPhone ? { inputMode: "tel" as const } : {})}
      />
      <p className="text-text-dim text-sm">
        Press <span className="font-medium text-text-muted">Enter</span> to continue
      </p>
    </div>
  );
}
