"use client";

import { useCallback, useState, useEffect } from "react";
import type { Tween, AnimatedProperty, StaggerConfig, TriggerConfig, ScrollTriggerConfig } from "@/lib/gsap-creator/types";
import { PROPERTY_META, TWEEN_COLORS } from "@/lib/gsap-creator/types";
import { getGroupedEases } from "@/lib/gsap-creator/eases";
import { PropertySection } from "./PropertySection";
import { NumberInput } from "./NumberInput";

interface PropertyPanelProps {
  tweens: Tween[];
  onUpdate: (tweenId: string, updates: Partial<Tween>) => void;
  triggerConfig?: TriggerConfig;
  onTriggerUpdate?: (updates: Partial<TriggerConfig>) => void;
}

const UNITS = ["px", "%", "vw", "vh", "em", "rem", "deg"];
const TWEEN_TYPES = ["from", "to", "fromTo", "set"] as const;
const STAGGER_FROM_OPTIONS = ["start", "end", "center", "edges", "random"] as const;
const SPLIT_TYPES = ["chars", "words", "lines"] as const;

const SELECTOR_TYPES = ["attribute", "class", "id", "tag", "custom"] as const;
type SelectorType = (typeof SELECTOR_TYPES)[number];

interface SelectorParts {
  type: SelectorType;
  attrName: string;
  attrValue: string;
  className: string;
  idName: string;
  tagName: string;
  customSelector: string;
  combinator: string; // "" for self, " > *" for direct children, " *" for all descendants, or custom
}

function parseSelectorType(selector: string): SelectorParts {
  const defaults: SelectorParts = {
    type: "attribute",
    attrName: "data-hs-anim",
    attrValue: "element",
    className: "element",
    idName: "element",
    tagName: "div",
    customSelector: selector,
    combinator: "",
  };

  // Try to detect combinator suffix — look for the base selector pattern then a trailing part
  let base = selector;
  let combinator = "";

  // Check for attribute selector with possible combinator
  if (selector.startsWith("[")) {
    const closeIdx = selector.indexOf("]");
    if (closeIdx !== -1 && closeIdx < selector.length - 1) {
      base = selector.slice(0, closeIdx + 1);
      combinator = selector.slice(closeIdx + 1); // e.g. " > *"
    }
    const match = base.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
    if (match) {
      return { ...defaults, type: "attribute", attrName: match[1], attrValue: match[2] || "", combinator };
    }
  }
  if (selector.startsWith("#")) {
    const spaceIdx = selector.indexOf(" ");
    if (spaceIdx !== -1) {
      base = selector.slice(0, spaceIdx);
      combinator = selector.slice(spaceIdx);
    }
    return { ...defaults, type: "id", idName: base.slice(1), combinator };
  }
  if (selector.startsWith(".")) {
    const spaceIdx = selector.indexOf(" ");
    if (spaceIdx !== -1) {
      base = selector.slice(0, spaceIdx);
      combinator = selector.slice(spaceIdx);
    }
    return { ...defaults, type: "class", className: base.slice(1), combinator };
  }
  if (/^[a-z][a-z0-9]*$/i.test(selector)) {
    return { ...defaults, type: "tag", tagName: selector, combinator: "" };
  }
  // For tag with combinator (e.g. "div > *")
  if (/^[a-z][a-z0-9]*/i.test(selector)) {
    const spaceIdx = selector.indexOf(" ");
    if (spaceIdx !== -1) {
      base = selector.slice(0, spaceIdx);
      combinator = selector.slice(spaceIdx);
      return { ...defaults, type: "tag", tagName: base, combinator };
    }
  }
  return { ...defaults, type: "custom", combinator: "" };
}

function buildSelector(parts: SelectorParts): string {
  let base: string;
  switch (parts.type) {
    case "attribute":
      base = parts.attrValue ? `[${parts.attrName}="${parts.attrValue}"]` : `[${parts.attrName}]`;
      break;
    case "class":
      base = `.${parts.className}`;
      break;
    case "id":
      base = `#${parts.idName}`;
      break;
    case "tag":
      base = parts.tagName;
      break;
    case "custom":
      return parts.customSelector; // custom already includes everything
    default:
      base = "";
  }
  return base + parts.combinator;
}

function getCommonValue<T>(items: Tween[], getter: (t: Tween) => T): T | "mixed" {
  if (items.length === 0) return "mixed";
  const first = getter(items[0]);
  for (let i = 1; i < items.length; i++) {
    if (JSON.stringify(getter(items[i])) !== JSON.stringify(first)) return "mixed";
  }
  return first;
}

export function PropertyPanel({ tweens, onUpdate, triggerConfig, onTriggerUpdate }: PropertyPanelProps) {
  const tween = tweens.length === 1 ? tweens[0] : null;
  const isMulti = tweens.length > 1;
  const groupedEases = getGroupedEases();

  const multiUpdate = useCallback(
    (updates: Partial<Tween>) => {
      for (const t of tweens) {
        onUpdate(t.id, updates);
      }
    },
    [tweens, onUpdate]
  );

  const update = useCallback(
    (updates: Partial<Tween>) => {
      if (isMulti) {
        multiUpdate(updates);
      } else if (tween) {
        onUpdate(tween.id, updates);
      }
    },
    [tween, isMulti, multiUpdate, onUpdate]
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

  const [selectorParts, setSelectorParts] = useState<SelectorParts>(() =>
    parseSelectorType(tween?.target || '[data-hs-anim="element"]')
  );

  const tweenId = tween?.id;
  useEffect(() => {
    if (tween) {
      setSelectorParts(parseSelectorType(tween.target));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tweenId]); // Only re-parse on tween switch, not on every target change

  const updateSelector = useCallback(
    (updatedParts: SelectorParts) => {
      setSelectorParts(updatedParts);
      update({ target: buildSelector(updatedParts) });
    },
    [update]
  );

  // ── Empty state ───────────────────────────────────────
  if (tweens.length === 0) {
    return (
      <div className="w-80 flex flex-col bg-surface border-l border-border overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-text-dim text-center px-4">Select a tween to edit its properties</p>
        </div>
      </div>
    );
  }

  // ── Multi-select panel ────────────────────────────────
  if (isMulti) {
    const commonType = getCommonValue(tweens, (t) => t.type);
    const commonDuration = getCommonValue(tweens, (t) => t.duration);
    const commonEase = getCommonValue(tweens, (t) => t.ease);

    return (
      <div className="w-80 flex flex-col bg-surface border-l border-border min-h-0 overflow-y-auto" data-lenis-prevent>
        {/* Header */}
        <div className="px-3 py-2 border-b border-border">
          <span className="text-xs font-medium text-text-primary">{tweens.length} tweens selected</span>
        </div>

        {/* Bulk Type */}
        <PropertySection title="Type">
          <div className="flex gap-1">
            {TWEEN_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => update({ type: t })}
                className={`flex-1 px-2 py-1.5 text-[10px] font-mono rounded-md transition-colors
                  ${
                    commonType === t
                      ? "bg-accent/20 text-accent border border-accent/30"
                      : "bg-black/20 text-text-dim border border-border hover:text-text-muted"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
          {commonType === "mixed" && (
            <span className="text-[9px] text-text-dim italic">Mixed types</span>
          )}
        </PropertySection>

        {/* Bulk Timing */}
        <PropertySection title="Timing">
          <NumberInput
            label={commonDuration === "mixed" ? "Duration (mixed)" : "Duration"}
            value={commonDuration === "mixed" ? 0 : commonDuration}
            onChange={(v) => update({ duration: v })}
            min={0}
            step={0.05}
          />
          <div>
            <label className="text-[10px] text-text-dim block mb-1">Ease</label>
            <select
              value={commonEase === "mixed" ? "" : commonEase}
              onChange={(e) => update({ ease: e.target.value })}
              className="w-full h-7 px-2 text-xs font-mono text-text-primary bg-black/20
                border border-border rounded-md focus:outline-none focus:border-accent/50"
            >
              {commonEase === "mixed" && (
                <option value="" disabled>Mixed</option>
              )}
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

        {/* Bulk Appearance */}
        <PropertySection title="Appearance">
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-text-dim">Bar Color</label>
            <div className="flex gap-1">
              {TWEEN_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => update({ color: c })}
                  className="w-5 h-5 rounded-full transition-all hover:scale-110"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </PropertySection>
      </div>
    );
  }

  // ── Single-select panel (unchanged) ───────────────────
  // At this point tweens.length === 1, so tween is guaranteed non-null
  const activeTween = tween!;
  const availableProps = Object.keys(PROPERTY_META).filter((p) => !activeTween.properties[p]);

  return (
    <div className="w-80 bg-surface border-l border-border overflow-y-auto overscroll-contain" data-lenis-prevent>
      {/* Target */}
      <PropertySection title="Target">
        {/* Selector type tabs */}
        <div className="flex gap-0.5">
          {SELECTOR_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => {
                const newParts = { ...selectorParts, type: t };
                updateSelector(newParts);
              }}
              className={`flex-1 px-1.5 py-1 text-[9px] font-mono rounded transition-colors
                ${
                  selectorParts.type === t
                    ? "bg-accent/20 text-accent border border-accent/30"
                    : "bg-black/20 text-text-dim border border-transparent hover:text-text-muted"
                }`}
            >
              {t === "attribute" ? "attr" : t}
            </button>
          ))}
        </div>

        {/* Type-specific inputs */}
        {selectorParts.type === "attribute" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[9px] text-text-dim block mb-0.5">Attribute</label>
              <input
                type="text"
                value={selectorParts.attrName}
                onChange={(e) => updateSelector({ ...selectorParts, attrName: e.target.value })}
                className="w-full h-7 px-2 text-xs font-mono text-text-primary bg-black/20
                  border border-border rounded-md focus:outline-none focus:border-accent/50"
                placeholder="data-hs-anim"
              />
            </div>
            <div>
              <label className="text-[9px] text-text-dim block mb-0.5">Value</label>
              <input
                type="text"
                value={selectorParts.attrValue}
                onChange={(e) => updateSelector({ ...selectorParts, attrValue: e.target.value })}
                className="w-full h-7 px-2 text-xs font-mono text-text-primary bg-black/20
                  border border-border rounded-md focus:outline-none focus:border-accent/50"
                placeholder="element"
              />
            </div>
          </div>
        )}

        {selectorParts.type === "class" && (
          <div>
            <label className="text-[9px] text-text-dim block mb-0.5">Class name</label>
            <div className="flex items-center">
              <span className="text-xs font-mono text-text-dim mr-1">.</span>
              <input
                type="text"
                value={selectorParts.className}
                onChange={(e) => updateSelector({ ...selectorParts, className: e.target.value })}
                className="w-full h-7 px-2 text-xs font-mono text-text-primary bg-black/20
                  border border-border rounded-md focus:outline-none focus:border-accent/50"
                placeholder="element"
              />
            </div>
          </div>
        )}

        {selectorParts.type === "id" && (
          <div>
            <label className="text-[9px] text-text-dim block mb-0.5">ID</label>
            <div className="flex items-center">
              <span className="text-xs font-mono text-text-dim mr-1">#</span>
              <input
                type="text"
                value={selectorParts.idName}
                onChange={(e) => updateSelector({ ...selectorParts, idName: e.target.value })}
                className="w-full h-7 px-2 text-xs font-mono text-text-primary bg-black/20
                  border border-border rounded-md focus:outline-none focus:border-accent/50"
                placeholder="hero-title"
              />
            </div>
          </div>
        )}

        {selectorParts.type === "tag" && (
          <div>
            <label className="text-[9px] text-text-dim block mb-0.5">Tag</label>
            <select
              value={selectorParts.tagName}
              onChange={(e) => updateSelector({ ...selectorParts, tagName: e.target.value })}
              className="w-full h-7 px-2 text-xs font-mono text-text-primary bg-black/20
                border border-border rounded-md focus:outline-none focus:border-accent/50"
            >
              {["div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6", "section", "article", "button", "a", "img", "ul", "li"].map(
                (tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                )
              )}
            </select>
          </div>
        )}

        {selectorParts.type === "custom" && (
          <div>
            <label className="text-[9px] text-text-dim block mb-0.5">CSS Selector</label>
            <input
              type="text"
              value={selectorParts.customSelector}
              onChange={(e) => updateSelector({ ...selectorParts, customSelector: e.target.value })}
              className="w-full h-7 px-2 text-xs font-mono text-text-primary bg-black/20
                border border-border rounded-md focus:outline-none focus:border-accent/50"
              placeholder='.parent > .child[data-active="true"]'
            />
          </div>
        )}

        {/* Combinator / targeting */}
        {selectorParts.type !== "custom" && (
          <div className="space-y-1">
            <label className="text-[9px] text-text-dim block">Targeting</label>
            <div className="flex gap-0.5">
              {(
                [
                  { value: "", label: "Self" },
                  { value: " > *", label: "> *" },
                  { value: " *", label: "All *" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => updateSelector({ ...selectorParts, combinator: opt.value })}
                  className={`flex-1 px-1.5 py-1 text-[9px] font-mono rounded transition-colors ${
                    selectorParts.combinator === opt.value
                      ? "bg-accent/20 text-accent border border-accent/30"
                      : "bg-black/20 text-text-dim border border-transparent hover:text-text-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <button
                onClick={() =>
                  updateSelector({
                    ...selectorParts,
                    combinator:
                      selectorParts.combinator !== "" &&
                      selectorParts.combinator !== " > *" &&
                      selectorParts.combinator !== " *"
                        ? ""
                        : " > ",
                  })
                }
                className={`flex-1 px-1.5 py-1 text-[9px] font-mono rounded transition-colors ${
                  selectorParts.combinator !== "" &&
                  selectorParts.combinator !== " > *" &&
                  selectorParts.combinator !== " *"
                    ? "bg-accent/20 text-accent border border-accent/30"
                    : "bg-black/20 text-text-dim border border-transparent hover:text-text-muted"
                }`}
              >
                Custom
              </button>
            </div>
            {selectorParts.combinator !== "" &&
              selectorParts.combinator !== " > *" &&
              selectorParts.combinator !== " *" && (
                <input
                  type="text"
                  value={selectorParts.combinator}
                  onChange={(e) => updateSelector({ ...selectorParts, combinator: e.target.value })}
                  className="w-full h-7 px-2 text-xs font-mono text-text-primary bg-black/20
                    border border-border rounded-md focus:outline-none focus:border-accent/50"
                  placeholder=" > button:first-child"
                />
              )}
          </div>
        )}

        {/* Computed selector preview */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-black/10 rounded border border-border/50">
          <span className="text-[9px] text-text-dim shrink-0">Selector:</span>
          <code className="text-[10px] font-mono text-accent truncate">{activeTween.target}</code>
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
                  activeTween.type === t
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
            value={activeTween.duration}
            onChange={(v) => update({ duration: v })}
            min={0}
            step={0.05}
          />
          <div>
            <label className="text-[10px] text-text-dim block mb-1">Position</label>
            <input
              type="text"
              value={activeTween.position}
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
            value={activeTween.ease}
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
        {Object.entries(activeTween.properties).map(([prop, val]) => {
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
              {activeTween.type === "fromTo" && (
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
      <PropertySection title="Stagger">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!activeTween.stagger}
            onChange={(e) => {
              update({
                stagger: e.target.checked
                  ? { each: 0.1, from: "start", ease: "power1.out", grid: null, count: 5 }
                  : null,
              });
            }}
            className="w-3 h-3 accent-accent"
          />
          <span className="text-[11px] text-text-muted">Enable stagger</span>
        </label>
        {activeTween.stagger && (
          <div className="space-y-2 mt-1">
            <NumberInput
              label="Each"
              value={activeTween.stagger.each}
              onChange={(v) => update({ stagger: { ...activeTween.stagger!, each: v } })}
              min={0}
              step={0.01}
            />
            <div>
              <label className="text-[10px] text-text-dim block mb-1">From</label>
              <select
                value={activeTween.stagger.from}
                onChange={(e) =>
                  update({ stagger: { ...activeTween.stagger!, from: e.target.value as StaggerConfig["from"] } })
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
            <NumberInput
              label="Elements"
              value={activeTween.stagger.count}
              onChange={(v) => update({ stagger: { ...activeTween.stagger!, count: Math.max(1, Math.round(v)) } })}
              min={1}
              step={1}
            />
          </div>
        )}
      </PropertySection>

      {/* Split Text */}
      <PropertySection title="Split Text">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!activeTween.splitText?.enabled}
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
        {activeTween.splitText?.enabled && (
          <div className="space-y-2 mt-1">
            <div>
              <label className="text-[10px] text-text-dim block mb-1">Split by</label>
              <div className="flex gap-1">
                {SPLIT_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => update({ splitText: { ...activeTween.splitText!, type: t } })}
                    className={`flex-1 px-2 py-1 text-[10px] rounded-md transition-colors
                      ${
                        activeTween.splitText!.type === t
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
                checked={activeTween.splitText!.mask}
                onChange={(e) => update({ splitText: { ...activeTween.splitText!, mask: e.target.checked } })}
                className="w-3 h-3 accent-accent"
              />
              <span className="text-[11px] text-text-muted">Mask (overflow hidden)</span>
            </label>
            <NumberInput
              label="Stagger"
              value={activeTween.splitText!.staggerEach}
              onChange={(v) => update({ splitText: { ...activeTween.splitText!, staggerEach: v } })}
              min={0}
              step={0.005}
            />
          </div>
        )}
      </PropertySection>

      {/* Color & Label */}
      <PropertySection title="Appearance">
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-text-dim">Bar Color</label>
          <div className="flex gap-1">
            {TWEEN_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => update({ color: c })}
                className={`w-5 h-5 rounded-full transition-all
                  ${activeTween.color === c ? "ring-2 ring-white ring-offset-1 ring-offset-surface scale-110" : "hover:scale-110"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] text-text-dim block mb-1">Label</label>
          <input
            type="text"
            value={activeTween.label}
            onChange={(e) => update({ label: e.target.value })}
            className="w-full h-7 px-2 text-xs font-mono text-text-primary bg-black/20
              border border-border rounded-md focus:outline-none focus:border-accent/50"
            placeholder="Optional label"
          />
        </div>
      </PropertySection>

      {/* Trigger */}
      <PropertySection title="Trigger">
        <div>
          <label className="text-[10px] text-text-dim block mb-1">Type</label>
          <select
            value={triggerConfig?.type || "load"}
            onChange={(e) => {
              const type = e.target.value as TriggerConfig["type"];
              onTriggerUpdate?.({
                type,
                scrollTrigger: type === "scrollTrigger" ? {
                  trigger: activeTween.target,
                  start: "top 80%",
                  end: "bottom 20%",
                  scrub: false,
                  pin: false,
                  toggleActions: "play none none reverse",
                  markers: true,
                } : undefined,
              });
            }}
            className="w-full h-7 px-2 text-xs font-mono text-text-primary bg-black/20
              border border-border rounded-md focus:outline-none focus:border-accent/50"
          >
            <option value="load">On Load</option>
            <option value="scrollTrigger">ScrollTrigger</option>
            <option value="click">On Click</option>
            <option value="hover">On Hover</option>
          </select>
        </div>

        {triggerConfig?.type === "scrollTrigger" && triggerConfig.scrollTrigger && (() => {
          const st = triggerConfig.scrollTrigger as ScrollTriggerConfig;
          const updateST = (updates: Partial<ScrollTriggerConfig>) => {
            onTriggerUpdate?.({
              ...triggerConfig,
              scrollTrigger: { ...st, ...updates },
            });
          };
          return (
            <div className="space-y-2 mt-2">
              <div>
                <label className="text-[10px] text-text-dim block mb-1">Trigger selector</label>
                <input
                  type="text"
                  value={st.trigger}
                  onChange={(e) => updateST({ trigger: e.target.value })}
                  className="w-full h-7 px-2 text-xs font-mono text-text-primary bg-black/20
                    border border-border rounded-md focus:outline-none focus:border-accent/50"
                  placeholder=".section"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-text-dim block mb-1">Start</label>
                  <input
                    type="text"
                    value={st.start}
                    onChange={(e) => updateST({ start: e.target.value })}
                    className="w-full h-7 px-2 text-xs font-mono text-text-primary bg-black/20
                      border border-border rounded-md focus:outline-none focus:border-accent/50"
                    placeholder="top 80%"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-text-dim block mb-1">End</label>
                  <input
                    type="text"
                    value={st.end}
                    onChange={(e) => updateST({ end: e.target.value })}
                    className="w-full h-7 px-2 text-xs font-mono text-text-primary bg-black/20
                      border border-border rounded-md focus:outline-none focus:border-accent/50"
                    placeholder="bottom 20%"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-text-dim block mb-1">Toggle Actions</label>
                <select
                  value={st.toggleActions}
                  onChange={(e) => updateST({ toggleActions: e.target.value })}
                  className="w-full h-7 px-2 text-xs font-mono text-text-primary bg-black/20
                    border border-border rounded-md focus:outline-none focus:border-accent/50"
                >
                  <option value="play none none reverse">play none none reverse</option>
                  <option value="play none none none">play none none none</option>
                  <option value="play pause resume reverse">play pause resume reverse</option>
                  <option value="restart none none reverse">restart none none reverse</option>
                  <option value="play complete complete reset">play complete complete reset</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={st.scrub === true || typeof st.scrub === "number"}
                    onChange={(e) => updateST({ scrub: e.target.checked ? true : false })}
                    className="w-3 h-3 accent-accent"
                  />
                  <span className="text-[11px] text-text-muted">Scrub</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={st.pin}
                    onChange={(e) => updateST({ pin: e.target.checked })}
                    className="w-3 h-3 accent-accent"
                  />
                  <span className="text-[11px] text-text-muted">Pin</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={st.markers}
                    onChange={(e) => updateST({ markers: e.target.checked })}
                    className="w-3 h-3 accent-accent"
                  />
                  <span className="text-[11px] text-text-muted">Markers</span>
                </label>
              </div>
            </div>
          );
        })()}
      </PropertySection>
    </div>
  );
}
