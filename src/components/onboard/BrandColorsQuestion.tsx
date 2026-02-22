"use client";

import { useState, useRef, useCallback } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import type { QuestionProps, BrandColorsValue } from "@/lib/onboard/types";

const MAX_CUSTOM_COLORS = 5;

function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

function normalizeHex(raw: string): string {
  return raw.startsWith("#") ? raw : `#${raw}`;
}

export function BrandColorsQuestion({
  question,
  value,
  onChange,
  onNext,
}: QuestionProps) {
  const detectedColors = question.detectedColors ?? [];
  const colorInputRef = useRef<HTMLInputElement>(null);

  const existing = value as BrandColorsValue | null;

  const [brandValue, setBrandValue] = useState<BrandColorsValue>(() => ({
    theme: existing?.theme ?? question.detectedTheme ?? null,
    keptColors:
      existing?.keptColors ?? detectedColors.map((dc) => dc.hex),
    customColors: existing?.customColors ?? [],
    description: existing?.description ?? "",
  }));

  const [hexInput, setHexInput] = useState("#000000");
  const [pickerColor, setPickerColor] = useState("#000000");

  const update = useCallback(
    (partial: Partial<BrandColorsValue>) => {
      setBrandValue((prev) => {
        const next = { ...prev, ...partial };
        onChange(next);
        return next;
      });
    },
    [onChange]
  );

  // --- Theme ---
  const selectTheme = (theme: "light" | "dark") => {
    update({ theme });
  };

  // --- Detected colors ---
  const toggleKeptColor = (hex: string) => {
    const isKept = brandValue.keptColors.includes(hex);
    const next = isKept
      ? brandValue.keptColors.filter((c) => c !== hex)
      : [...brandValue.keptColors, hex];
    update({ keptColors: next });
  };

  // --- Custom colors ---
  const addCustomColor = () => {
    const normalized = normalizeHex(hexInput);
    if (
      !isValidHex(normalized) ||
      brandValue.customColors.length >= MAX_CUSTOM_COLORS
    ) {
      return;
    }
    if (brandValue.customColors.includes(normalized.toLowerCase())) {
      return;
    }
    update({ customColors: [...brandValue.customColors, normalized] });
    setHexInput("#000000");
    setPickerColor("#000000");
  };

  const removeCustomColor = (hex: string) => {
    update({ customColors: brandValue.customColors.filter((c) => c !== hex) });
  };

  const handleHexInput = (raw: string) => {
    setHexInput(raw);
    const normalized = normalizeHex(raw);
    if (isValidHex(normalized)) {
      setPickerColor(normalized);
    }
  };

  const handlePickerChange = (hex: string) => {
    setPickerColor(hex);
    setHexInput(hex);
  };

  const canAddMore = brandValue.customColors.length < MAX_CUSTOM_COLORS;

  return (
    <div className="space-y-8">
      {/* 1. Theme preference */}
      <div className="space-y-3">
        <p className="text-text-primary font-medium text-lg">
          Theme preference
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Light card */}
          <button
            type="button"
            onClick={() => selectTheme("light")}
            className={`
              min-h-[80px] rounded-xl border-2 p-5
              transition-all duration-200 cursor-pointer
              flex flex-col items-center justify-center gap-2
              ${
                brandValue.theme === "light"
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surface hover:border-accent/50"
              }
            `}
          >
            <div className="w-full max-w-[140px] rounded-lg bg-white border border-neutral-200 p-3 space-y-1.5">
              <div className="h-2 w-3/4 rounded bg-neutral-800" />
              <div className="h-2 w-full rounded bg-neutral-300" />
              <div className="h-2 w-5/6 rounded bg-neutral-300" />
            </div>
            <span
              className={`text-base font-medium ${
                brandValue.theme === "light"
                  ? "text-accent"
                  : "text-text-primary"
              }`}
            >
              Light
            </span>
          </button>

          {/* Dark card */}
          <button
            type="button"
            onClick={() => selectTheme("dark")}
            className={`
              min-h-[80px] rounded-xl border-2 p-5
              transition-all duration-200 cursor-pointer
              flex flex-col items-center justify-center gap-2
              ${
                brandValue.theme === "dark"
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surface hover:border-accent/50"
              }
            `}
          >
            <div className="w-full max-w-[140px] rounded-lg bg-neutral-900 border border-neutral-700 p-3 space-y-1.5">
              <div className="h-2 w-3/4 rounded bg-neutral-100" />
              <div className="h-2 w-full rounded bg-neutral-600" />
              <div className="h-2 w-5/6 rounded bg-neutral-600" />
            </div>
            <span
              className={`text-base font-medium ${
                brandValue.theme === "dark"
                  ? "text-accent"
                  : "text-text-primary"
              }`}
            >
              Dark
            </span>
          </button>
        </div>
      </div>

      {/* 2. Detected colors */}
      {detectedColors.length > 0 && (
        <div className="space-y-3">
          <p className="text-text-primary font-medium text-lg">
            Colors from your current site
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {detectedColors.map((dc) => {
              const isKept = brandValue.keptColors.includes(dc.hex);
              return (
                <button
                  key={dc.hex}
                  type="button"
                  onClick={() => toggleKeptColor(dc.hex)}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl border-2
                    transition-all duration-200 cursor-pointer text-left
                    min-h-[48px]
                    ${
                      isKept
                        ? "border-accent bg-accent/10"
                        : "border-border bg-surface hover:border-accent/50 opacity-60"
                    }
                  `}
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-lg border border-border shadow-sm"
                      style={{ backgroundColor: dc.hex }}
                    />
                    {/* Checkbox overlay */}
                    <div
                      className={`
                        absolute -top-1 -right-1 w-5 h-5 rounded
                        border-2 flex items-center justify-center
                        transition-colors
                        ${
                          isKept
                            ? "bg-accent border-accent"
                            : "bg-background border-border"
                        }
                      `}
                    >
                      {isKept && (
                        <svg
                          width="12"
                          height="12"
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
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-text-primary text-sm font-medium truncate">
                      {dc.label}
                    </p>
                    <p className="text-text-dim text-xs font-mono">
                      {dc.hex.toUpperCase()}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Add custom colors */}
      <div className="space-y-3">
        <div>
          <p className="text-text-primary font-medium text-lg">
            Add your own colors
          </p>
          <p className="text-text-dim text-sm">(optional)</p>
        </div>

        {canAddMore && (
          <div className="flex items-center gap-3">
            {/* Native color input styled as swatch */}
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => colorInputRef.current?.click()}
                className="w-12 h-12 rounded-lg border-2 border-border cursor-pointer hover:border-accent/50 transition-colors shadow-sm overflow-hidden"
                style={{ backgroundColor: pickerColor }}
                aria-label="Pick a color"
              />
              <input
                ref={colorInputRef}
                type="color"
                value={pickerColor}
                onChange={(e) => handlePickerChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
            <Input
              value={hexInput}
              onChange={(e) => handleHexInput(e.target.value)}
              placeholder="#000000"
              className="!text-base max-w-[140px] font-mono"
              maxLength={7}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomColor();
                }
              }}
            />
            <Button
              onClick={addCustomColor}
              size="sm"
              variant="outline"
              disabled={!isValidHex(normalizeHex(hexInput))}
            >
              Add
            </Button>
          </div>
        )}

        {/* Custom color chips */}
        {brandValue.customColors.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {brandValue.customColors.map((hex) => (
              <div
                key={hex}
                className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-lg border border-border bg-surface"
              >
                <div
                  className="w-6 h-6 rounded border border-border shadow-sm flex-shrink-0"
                  style={{ backgroundColor: hex }}
                />
                <span className="text-text-primary text-sm font-mono">
                  {hex.toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={() => removeCustomColor(hex)}
                  className="ml-1 w-5 h-5 rounded flex items-center justify-center text-text-dim hover:text-text-primary hover:bg-background transition-colors cursor-pointer"
                  aria-label={`Remove color ${hex}`}
                >
                  <svg
                    width="12"
                    height="12"
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

        {!canAddMore && (
          <p className="text-text-dim text-sm">
            Maximum of {MAX_CUSTOM_COLORS} custom colors reached.
          </p>
        )}
      </div>

      {/* 4. Description */}
      <div className="space-y-2">
        <label className="block text-text-primary font-medium text-lg">
          Describe your color preferences
        </label>
        <Textarea
          value={brandValue.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="e.g. warm earth tones, navy and gold, bright and playful..."
          className="!text-base !min-h-[80px]"
          rows={3}
        />
      </div>

      {/* 5. Continue button */}
      <div className="flex justify-end">
        <Button onClick={onNext} size="md">
          Continue
        </Button>
      </div>
    </div>
  );
}
