"use client";

import { useCallback } from "react";
import type { Tween, AnimatedProperty, StaggerConfig } from "@/lib/gsap-creator/types";
import { PROPERTY_META, TWEEN_COLORS } from "@/lib/gsap-creator/types";
import { getGroupedEases } from "@/lib/gsap-creator/eases";
import { PropertySection } from "./PropertySection";
import { NumberInput } from "./NumberInput";

interface PropertyPanelProps {
  tween: Tween | null;
  onUpdate: (tweenId: string, updates: Partial<Tween>) => void;
}

const UNITS = ["px", "%", "vw", "vh", "em", "rem", "deg"];
const TWEEN_TYPES = ["from", "to", "fromTo", "set"] as const;
const STAGGER_FROM_OPTIONS = ["start", "end", "center", "edges", "random"] as const;
const SPLIT_TYPES = ["chars", "words", "lines"] as const;

export function PropertyPanel({ tween, onUpdate }: PropertyPanelProps) {
  const groupedEases = getGroupedEases();

  const update = useCallback(
    (updates: Partial<Tween>) => {
      if (tween) onUpdate(tween.id, updates);
    },
    [tween, onUpdate]
  );

  const updateProperty = useCallback(
    (prop: string, field: "from" | "to" | "unit", value: number | string) => {
      if (!tween) return;
      const existing = tween.properties[prop] || { to: 0 };
      const updated = { ...existing, [field]: value };
      onUpdate(tween.id, {
        properties: { ...tween.properties, [prop]: updated },
      });
    },
    [tween, onUpdate]
  );

  const addProperty = useCallback(
    (prop: string) => {
      if (!tween) return;
      const meta = PROPERTY_META[prop];
      const newProp: AnimatedProperty = {
        to: meta?.defaultTo ?? 0,
        from: meta?.defaultFrom ?? 0,
        unit: meta?.defaultUnit,
      };
      onUpdate(tween.id, {
        properties: { ...tween.properties, [prop]: newProp },
      });
    },
    [tween, onUpdate]
  );

  const removeProperty = useCallback(
    (prop: string) => {
      if (!tween) return;
      const newProps = { ...tween.properties };
      delete newProps[prop];
      onUpdate(tween.id, { properties: newProps });
    },
    [tween, onUpdate]
  );

  if (!tween) {
    return (
      <div className="w-80 flex flex-col bg-surface border-l border-border overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-text-dim text-center px-4">Select a tween to edit its properties</p>
        </div>
      </div>
    );
  }

  const availableProps = Object.keys(PROPERTY_META).filter((p) => !tween.properties[p]);

  return (
    <div className="w-80 flex flex-col bg-surface border-l border-border overflow-y-auto">
      {/* Target */}
      <PropertySection title="Target">
        <div>
          <label className="text-[10px] text-text-dim block mb-1">Selector</label>
          <input
            type="text"
            value={tween.target}
            onChange={(e) => update({ target: e.target.value })}
            className="w-full h-7 px-2 text-xs font-mono text-text-primary bg-black/20
              border border-border rounded-md focus:outline-none focus:border-accent/50"
            placeholder=".element"
          />
        </div>
      </PropertySection>

      {/* Type */}
      <PropertySection title="Type">
        <div className="flex gap-1">
          {TWEEN_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => update({ type: t })}
              className={`flex-1 px-2 py-1.5 text-[10px] font-mono rounded-md transition-colors
                ${
                  tween.type === t
                    ? "bg-accent/20 text-accent border border-accent/30"
                    : "bg-black/20 text-text-dim border border-border hover:text-text-muted"
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </PropertySection>

      {/* Timing */}
      <PropertySection title="Timing">
        <div className="grid grid-cols-2 gap-2">
          <NumberInput
            label="Duration"
            value={tween.duration}
            onChange={(v) => update({ duration: v })}
            min={0}
            step={0.05}
          />
          <div>
            <label className="text-[10px] text-text-dim block mb-1">Position</label>
            <input
              type="text"
              value={tween.position}
              onChange={(e) => update({ position: e.target.value })}
              className="w-full h-7 px-2 text-xs font-mono text-text-primary bg-black/20
                border border-border rounded-md focus:outline-none focus:border-accent/50"
              placeholder=">-=0.2"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-text-dim block mb-1">Ease</label>
          <select
            value={tween.ease}
            onChange={(e) => update({ ease: e.target.value })}
            className="w-full h-7 px-2 text-xs font-mono text-text-primary bg-black/20
              border border-border rounded-md focus:outline-none focus:border-accent/50"
          >
            {Object.entries(groupedEases).map(([cat, eases]) => (
              <optgroup key={cat} label={cat}>
                {eases.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </PropertySection>

      {/* Animated Properties */}
      <PropertySection title="Properties">
        {Object.entries(tween.properties).map(([prop, val]) => {
          const meta = PROPERTY_META[prop];
          const av = val as AnimatedProperty;
          const isColor = prop === "backgroundColor" || prop === "color";
          const isString = prop === "clipPath" || prop === "filter";

          return (
            <div key={prop} className="flex items-center gap-1">
              <span className="text-[10px] text-text-dim w-16 shrink-0 truncate" title={meta?.label || prop}>
                {meta?.label || prop}
              </span>

              {/* From value (only for fromTo) */}
              {tween.type === "fromTo" && (
                <>
                  {isColor || isString ? (
                    <input
                      type={isColor ? "color" : "text"}
                      value={String(av.from ?? "")}
                      onChange={(e) => updateProperty(prop, "from", e.target.value)}
                      className="h-7 flex-1 min-w-0 px-1 text-xs bg-black/20 border border-border rounded-md"
                    />
                  ) : (
                    <NumberInput
                      value={Number(av.from ?? 0)}
                      onChange={(v) => updateProperty(prop, "from", v)}
                      step={meta?.step || 1}
                      min={meta?.min}
                      max={meta?.max}
                      className="flex-1 min-w-0"
                    />
                  )}
                  <span className="text-[10px] text-text-dim">&rarr;</span>
                </>
              )}

              {/* To value */}
              {isColor || isString ? (
                <input
                  type={isColor ? "color" : "text"}
                  value={String(av.to)}
                  onChange={(e) => updateProperty(prop, "to", e.target.value)}
                  className="h-7 flex-1 min-w-0 px-1 text-xs bg-black/20 border border-border rounded-md"
                />
              ) : (
                <NumberInput
                  value={Number(av.to)}
                  onChange={(v) => updateProperty(prop, "to", v)}
                  step={meta?.step || 1}
                  min={meta?.min}
                  max={meta?.max}
                  unit={av.unit}
                  units={meta?.defaultUnit ? UNITS : undefined}
                  onUnitChange={(u) => updateProperty(prop, "unit", u)}
                  className="flex-1 min-w-0"
                />
              )}

              {/* Remove */}
              <button
                onClick={() => removeProperty(prop)}
                className="text-text-dim/40 hover:text-red-400 transition-colors shrink-0"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          );
        })}

        {/* Add property button */}
        {availableProps.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) addProperty(e.target.value);
            }}
            className="w-full h-7 px-2 text-[11px] text-text-dim bg-black/10 border border-dashed
              border-border rounded-md focus:outline-none cursor-pointer"
          >
            <option value="">+ Add property...</option>
            {availableProps.map((p) => (
              <option key={p} value={p}>
                {PROPERTY_META[p]?.label || p}
              </option>
            ))}
          </select>
        )}
      </PropertySection>

      {/* Stagger */}
      <PropertySection title="Stagger" defaultOpen={false}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!tween.stagger}
            onChange={(e) => {
              update({
                stagger: e.target.checked
                  ? { each: 0.1, from: "start", ease: "power1.out", grid: null }
                  : null,
              });
            }}
            className="w-3 h-3 accent-accent"
          />
          <span className="text-[11px] text-text-muted">Enable stagger</span>
        </label>
        {tween.stagger && (
          <div className="space-y-2 mt-1">
            <NumberInput
              label="Each"
              value={tween.stagger.each}
              onChange={(v) => update({ stagger: { ...tween.stagger!, each: v } })}
              min={0}
              step={0.01}
            />
            <div>
              <label className="text-[10px] text-text-dim block mb-1">From</label>
              <select
                value={tween.stagger.from}
                onChange={(e) =>
                  update({ stagger: { ...tween.stagger!, from: e.target.value as StaggerConfig["from"] } })
                }
                className="w-full h-7 px-2 text-xs bg-black/20 border border-border rounded-md"
              >
                {STAGGER_FROM_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </PropertySection>

      {/* Split Text */}
      <PropertySection title="Split Text" defaultOpen={false}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!tween.splitText?.enabled}
            onChange={(e) => {
              update({
                splitText: e.target.checked
                  ? { enabled: true, type: "chars", mask: true, staggerEach: 0.03 }
                  : null,
              });
            }}
            className="w-3 h-3 accent-accent"
          />
          <span className="text-[11px] text-text-muted">Enable split text</span>
        </label>
        {tween.splitText?.enabled && (
          <div className="space-y-2 mt-1">
            <div>
              <label className="text-[10px] text-text-dim block mb-1">Split by</label>
              <div className="flex gap-1">
                {SPLIT_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => update({ splitText: { ...tween.splitText!, type: t } })}
                    className={`flex-1 px-2 py-1 text-[10px] rounded-md transition-colors
                      ${
                        tween.splitText!.type === t
                          ? "bg-accent/20 text-accent border border-accent/30"
                          : "bg-black/20 text-text-dim border border-border"
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={tween.splitText.mask}
                onChange={(e) => update({ splitText: { ...tween.splitText!, mask: e.target.checked } })}
                className="w-3 h-3 accent-accent"
              />
              <span className="text-[11px] text-text-muted">Mask (overflow hidden)</span>
            </label>
            <NumberInput
              label="Stagger"
              value={tween.splitText.staggerEach}
              onChange={(v) => update({ splitText: { ...tween.splitText!, staggerEach: v } })}
              min={0}
              step={0.005}
            />
          </div>
        )}
      </PropertySection>

      {/* Color & Label */}
      <PropertySection title="Appearance" defaultOpen={false}>
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-text-dim">Bar Color</label>
          <div className="flex gap-1">
            {TWEEN_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => update({ color: c })}
                className={`w-5 h-5 rounded-full transition-all
                  ${tween.color === c ? "ring-2 ring-white ring-offset-1 ring-offset-surface scale-110" : "hover:scale-110"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] text-text-dim block mb-1">Label</label>
          <input
            type="text"
            value={tween.label}
            onChange={(e) => update({ label: e.target.value })}
            className="w-full h-7 px-2 text-xs font-mono text-text-primary bg-black/20
              border border-border rounded-md focus:outline-none focus:border-accent/50"
            placeholder="Optional label"
          />
        </div>
      </PropertySection>
    </div>
  );
}
