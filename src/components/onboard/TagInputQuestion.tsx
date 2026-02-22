"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button, Input } from "@/components/ui";
import type { QuestionProps } from "@/lib/onboard/types";

export function TagInputQuestion({
  question,
  value,
  onChange,
  onNext,
}: QuestionProps) {
  const tags = useMemo(
    () => (Array.isArray(value) ? (value as string[]) : []),
    [value]
  );
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);

  const suggestions = question.suggestions ?? [];
  const minTags = question.minTags;
  const maxTags = question.maxTags;
  const isAtMax = maxTags !== undefined && tags.length >= maxTags;
  const meetsMin = minTags === undefined || tags.length >= minTags;

  // On first load, if value is empty and suggestions exist, pre-populate with all suggestions
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (tags.length === 0 && suggestions.length > 0) {
      const initial = maxTags
        ? suggestions.slice(0, maxTags)
        : [...suggestions];
      onChange(initial);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-focus the input after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const addTag = useCallback(
    (raw: string) => {
      const tag = raw.trim();
      if (!tag) return;
      if (tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
      if (isAtMax) return;

      const updated = [...tags, tag];
      onChange(updated);
      setInputValue("");
    },
    [tags, isAtMax, onChange]
  );

  const removeTag = useCallback(
    (index: number) => {
      const updated = tags.filter((_, i) => i !== index);
      onChange(updated);
      // Re-focus the input after removing a tag
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [tags, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
    }
    // Backspace on empty input removes the last tag
    if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Comma triggers adding the tag
    if (val.includes(",")) {
      const parts = val.split(",");
      for (const part of parts) {
        addTag(part);
      }
      return;
    }
    setInputValue(val);
  };

  // Suggestions that haven't been added yet
  const remainingSuggestions = suggestions.filter(
    (s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase())
  );

  // Build hint text
  const hintText = (() => {
    if (minTags !== undefined && maxTags !== undefined) {
      return `Add ${minTags}\u2013${maxTags} items`;
    }
    if (minTags !== undefined) {
      return `Add at least ${minTags}`;
    }
    if (maxTags !== undefined) {
      return `Add up to ${maxTags}`;
    }
    return null;
  })();

  return (
    <div className="space-y-4">
      {/* Tags grid */}
      {tags.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {tags.map((tag, index) => (
            <div
              key={`${tag}-${index}`}
              className="
                flex items-center justify-between gap-2
                px-4 py-2.5 min-h-[44px]
                bg-accent/10 border border-accent/30 rounded-xl
                text-text-primary text-sm font-medium
              "
            >
              <span className="truncate">{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="flex-shrink-0 p-1 text-accent/50 hover:text-red-400 transition-colors cursor-pointer"
                aria-label={`Remove ${tag}`}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isAtMax
                ? `Maximum of ${maxTags} reached`
                : question.placeholder ?? "Type and press Enter to add..."
            }
            disabled={isAtMax}
            className="!text-base !py-3 !px-4"
          />
        </div>
        <Button
          onClick={() => addTag(inputValue)}
          size="md"
          variant="outline"
          disabled={isAtMax || !inputValue.trim()}
        >
          Add
        </Button>
      </div>

      {/* Suggestions */}
      {remainingSuggestions.length > 0 && !isAtMax && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-text-dim text-sm">Suggestions:</span>
          {remainingSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className="
                px-3 py-1.5 text-sm
                bg-surface border border-border rounded-lg
                text-text-muted hover:border-accent/50 hover:text-text-primary
                transition-colors cursor-pointer
              "
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Hint text and count */}
      {(hintText || (minTags !== undefined || maxTags !== undefined)) && (
        <div className="flex items-center justify-between text-sm text-text-dim">
          {hintText && <span>{hintText}</span>}
          {(minTags !== undefined || maxTags !== undefined) && (
            <span className="tabular-nums">
              {tags.length}
              {maxTags !== undefined ? ` / ${maxTags}` : ""}
            </span>
          )}
        </div>
      )}

      {/* Continue button */}
      <div className="pt-2 flex justify-end">
        <Button onClick={onNext} size="md" disabled={!meetsMin}>
          Continue
        </Button>
      </div>
    </div>
  );
}
