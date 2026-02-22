"use client";

import { useState, useEffect } from "react";
import { Input, Button } from "@/components/ui";
import type { QuestionProps } from "@/lib/onboard/types";

const MINI_SWATCHES = [
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#14B8A6",
  "#3B82F6",
  "#6366F1",
  "#A855F7",
  "#EC4899",
  "#262626",
  "#737373",
  "#F5F5F5",
];

interface ColorState {
  hex: string;
  editing: boolean;
  hexInput: string;
}

export function ColorConfirmQuestion({
  question,
  value,
  onChange,
  onNext,
}: QuestionProps) {
  const detectedColors = question.detectedColors ?? [];
  const [colors, setColors] = useState<ColorState[]>([]);

  useEffect(() => {
    const existing = Array.isArray(value) ? (value as string[]) : [];
    setColors(
      detectedColors.map((dc, i) => ({
        hex: existing[i] ?? dc.hex,
        editing: false,
        hexInput: existing[i] ?? dc.hex,
      }))
    );
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateColor = (index: number, updates: Partial<ColorState>) => {
    setColors((prev) => {
      const next = prev.map((c, i) =>
        i === index ? { ...c, ...updates } : c
      );
      onChange(next.map((c) => c.hex));
      return next;
    });
  };

  const handleHexInput = (index: number, raw: string) => {
    const normalized = raw.startsWith("#") ? raw : `#${raw}`;
    const updates: Partial<ColorState> = { hexInput: raw };
    if (/^#[0-9A-Fa-f]{6}$/.test(normalized)) {
      updates.hex = normalized;
    }
    updateColor(index, updates);
  };

  return (
    <div className="space-y-6">
      {colors.map((color, index) => {
        const detected = detectedColors[index];
        if (!detected) return null;

        return (
          <div
            key={detected.hex + index}
            className="border border-border rounded-xl p-5 bg-surface space-y-4"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-lg border border-border shadow-sm flex-shrink-0"
                style={{ backgroundColor: color.hex }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-text-primary font-medium text-lg">
                  {detected.label}
                </p>
                <p className="text-text-dim text-sm">
                  {color.hex.toUpperCase()}
                  {detected.source && (
                    <span className="ml-2 text-text-dim">
                      from {detected.source}
                    </span>
                  )}
                </p>
              </div>
              {!color.editing ? (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      updateColor(index, { editing: false })
                    }
                    className="px-4 py-2 rounded-lg bg-accent/10 text-accent font-medium text-sm cursor-pointer hover:bg-accent/20 transition-colors min-h-[48px]"
                  >
                    Keep
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateColor(index, { editing: true })
                    }
                    className="px-4 py-2 rounded-lg border border-border text-text-muted font-medium text-sm cursor-pointer hover:border-accent/50 transition-colors min-h-[48px]"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    updateColor(index, { editing: false })
                  }
                  className="px-4 py-2 rounded-lg bg-accent/10 text-accent font-medium text-sm cursor-pointer hover:bg-accent/20 transition-colors min-h-[48px] flex-shrink-0"
                >
                  Done
                </button>
              )}
            </div>

            {color.editing && (
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex flex-wrap gap-2">
                  {MINI_SWATCHES.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() =>
                        updateColor(index, {
                          hex,
                          hexInput: hex,
                        })
                      }
                      className={`
                        w-8 h-8 rounded-md border-2 cursor-pointer
                        transition-all duration-150 hover:scale-110
                        ${
                          color.hex === hex
                            ? "border-accent ring-2 ring-accent/30 scale-110"
                            : "border-transparent hover:border-accent/50"
                        }
                      `}
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                </div>
                <Input
                  value={color.hexInput}
                  onChange={(e) => handleHexInput(index, e.target.value)}
                  placeholder="#000000"
                  className="!text-base max-w-[180px] font-mono"
                  maxLength={7}
                />
              </div>
            )}
          </div>
        );
      })}

      <div className="flex justify-end">
        <Button onClick={onNext} size="md">
          Continue
        </Button>
      </div>
    </div>
  );
}
