"use client";

import { useState, useRef, useEffect } from "react";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onUnitChange?: (unit: string) => void;
  units?: string[];
  label?: string;
  className?: string;
  disabled?: boolean;
}

const SCRUB_SENSITIVITY = 0.5;

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  onUnitChange,
  units,
  label,
  className = "",
  disabled = false,
}: NumberInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const scrubRef = useRef<{ startX: number; startValue: number } | null>(null);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(String(value));
    }
  }, [value, isFocused]);

  const clamp = (v: number) => {
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  };

  const commit = (raw: string) => {
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      const rounded = Math.round(parsed / step) * step;
      const clamped = clamp(parseFloat(rounded.toFixed(10)));
      onChange(clamped);
      setLocalValue(String(clamped));
    } else {
      setLocalValue(String(value));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      commit(localValue);
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setLocalValue(String(value));
      inputRef.current?.blur();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const increment = e.shiftKey ? step * 10 : step;
      const newVal = clamp(value + increment);
      onChange(newVal);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const decrement = e.shiftKey ? step * 10 : step;
      const newVal = clamp(value - decrement);
      onChange(newVal);
    }
  };

  // Label drag scrubbing
  const handleLabelPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    scrubRef.current = { startX: e.clientX, startValue: value };
  };

  const handleLabelPointerMove = (e: React.PointerEvent) => {
    if (!scrubRef.current) return;
    const delta =
      (e.clientX - scrubRef.current.startX) * SCRUB_SENSITIVITY * step;
    const newVal = clamp(scrubRef.current.startValue + delta);
    const rounded = Math.round(newVal / step) * step;
    onChange(parseFloat(rounded.toFixed(10)));
  };

  const handleLabelPointerUp = () => {
    scrubRef.current = null;
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {label && (
        <label
          className="text-[11px] text-text-dim select-none cursor-ew-resize min-w-[3rem] shrink-0"
          onPointerDown={handleLabelPointerDown}
          onPointerMove={handleLabelPointerMove}
          onPointerUp={handleLabelPointerUp}
        >
          {label}
        </label>
      )}
      <div className="flex items-center flex-1 min-w-0">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={isFocused ? localValue : String(value)}
          onChange={(e) => setLocalValue(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            setLocalValue(String(value));
          }}
          onBlur={() => {
            setIsFocused(false);
            commit(localValue);
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`w-full h-7 px-1.5 text-xs font-mono text-text-primary bg-black/20
            border border-border rounded-md text-center
            focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20
            disabled:opacity-40 disabled:cursor-not-allowed
            ${units ? "rounded-r-none border-r-0" : ""}`}
        />
        {units && onUnitChange && (
          <select
            value={unit}
            onChange={(e) => onUnitChange(e.target.value)}
            disabled={disabled}
            className="h-7 px-1 text-[10px] font-mono text-text-dim bg-black/20
              border border-border rounded-r-md
              focus:outline-none focus:border-accent/50
              disabled:opacity-40 appearance-none cursor-pointer"
          >
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
