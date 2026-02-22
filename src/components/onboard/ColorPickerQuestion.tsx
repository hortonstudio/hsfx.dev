"use client";

import { useState } from "react";
import { Input, Button } from "@/components/ui";
import type { QuestionProps } from "@/lib/onboard/types";

const PRESET_COLORS = [
  // Reds
  "#EF4444",
  "#DC2626",
  "#B91C1C",
  "#991B1B",
  // Oranges
  "#F97316",
  "#EA580C",
  "#C2410C",
  "#9A3412",
  // Yellows
  "#EAB308",
  "#CA8A04",
  "#A16207",
  "#854D0E",
  // Greens
  "#22C55E",
  "#16A34A",
  "#15803D",
  "#166534",
  // Teals
  "#14B8A6",
  "#0D9488",
  "#0F766E",
  "#115E59",
  // Blues
  "#3B82F6",
  "#2563EB",
  "#1D4ED8",
  "#1E40AF",
  // Indigos
  "#6366F1",
  "#4F46E5",
  "#4338CA",
  "#3730A3",
  // Purples
  "#A855F7",
  "#9333EA",
  "#7E22CE",
  "#6B21A8",
  // Pinks
  "#EC4899",
  "#DB2777",
  "#BE185D",
  "#9D174D",
  // Neutrals
  "#F5F5F5",
  "#D4D4D4",
  "#737373",
  "#262626",
];

export function ColorPickerQuestion({
  value,
  onChange,
  onNext,
}: QuestionProps) {
  const selectedColor = (value as string) ?? "";
  const [hexInput, setHexInput] = useState(selectedColor);

  const handleSelectColor = (hex: string) => {
    onChange(hex);
    setHexInput(hex);
  };

  const handleHexChange = (raw: string) => {
    setHexInput(raw);
    const normalized = raw.startsWith("#") ? raw : `#${raw}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(normalized)) {
      onChange(normalized);
    }
  };

  return (
    <div className="space-y-6">
      {selectedColor && (
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-xl border-2 border-border shadow-sm"
            style={{ backgroundColor: selectedColor }}
          />
          <div>
            <p className="text-text-primary text-lg font-medium">
              {selectedColor.toUpperCase()}
            </p>
            <p className="text-text-dim text-sm">Selected color</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-8 gap-2 sm:gap-3">
        {PRESET_COLORS.map((hex) => (
          <button
            key={hex}
            type="button"
            onClick={() => handleSelectColor(hex)}
            className={`
              aspect-square rounded-lg border-2 transition-all duration-150
              cursor-pointer hover:scale-110 min-h-[36px]
              ${
                selectedColor === hex
                  ? "border-accent ring-2 ring-accent/30 scale-110"
                  : "border-transparent hover:border-accent/50"
              }
            `}
            style={{ backgroundColor: hex }}
            title={hex}
          />
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-muted mb-1.5">
          Or enter a hex code
        </label>
        <Input
          value={hexInput}
          onChange={(e) => handleHexChange(e.target.value)}
          placeholder="#000000"
          className="!text-lg !py-4 max-w-[200px] font-mono"
          maxLength={7}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} size="md" disabled={!selectedColor}>
          Continue
        </Button>
      </div>
    </div>
  );
}
