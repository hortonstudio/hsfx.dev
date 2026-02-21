"use client";

import { useState, useMemo } from "react";
import type {
  GsapPresetConfig,
  TriggerConfig,
  ScrollTriggerConfig,
  TimelineSettings,
} from "@/lib/gsap-creator/types";
import { generateCode } from "@/lib/gsap-creator/codegen";

interface ExportBarProps {
  config: GsapPresetConfig;
  presetName: string;
  onConfigUpdate: (updates: Partial<GsapPresetConfig>) => void;
}

const TRIGGER_TYPES = ["load", "scrollTrigger", "click", "hover"] as const;
const REDUCED_MOTION_MODES = ["skip", "instant", "simplified"] as const;

export function ExportBar({ config, presetName, onConfigUpdate }: ExportBarProps) {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const generated = useMemo(() => generateCode(config, presetName), [config, presetName]);

  const handleCopy = async (format: keyof typeof generated) => {
    await navigator.clipboard.writeText(generated[format]);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const updateTrigger = (updates: Partial<TriggerConfig>) => {
    onConfigUpdate({ trigger: { ...config.trigger, ...updates } });
  };

  const updateScrollTrigger = (updates: Partial<ScrollTriggerConfig>) => {
    const current = config.trigger.scrollTrigger || {
      trigger: ".section",
      start: "top 80%",
      end: "bottom 20%",
      scrub: false,
      pin: false,
      toggleActions: "play none none reverse",
      markers: false,
    };
    onConfigUpdate({
      trigger: { ...config.trigger, scrollTrigger: { ...current, ...updates } },
    });
  };

  const updateTimeline = (updates: Partial<TimelineSettings>) => {
    onConfigUpdate({ timelineSettings: { ...config.timelineSettings, ...updates } });
  };

  return (
    <div className="bg-surface border-t border-border">
      <div className="flex divide-x divide-border">
        {/* Left: Trigger + Settings */}
        <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-48">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-text-dim uppercase tracking-wider shrink-0">Trigger</span>
            {TRIGGER_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => updateTrigger({ type: t })}
                className={`px-2 py-1 text-[10px] rounded-md transition-colors
                  ${
                    config.trigger.type === t
                      ? "bg-accent/20 text-accent border border-accent/30"
                      : "bg-black/20 text-text-dim border border-border hover:text-text-muted"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* ScrollTrigger fields */}
          {config.trigger.type === "scrollTrigger" && (
            <div className="grid grid-cols-2 gap-2 pl-2 border-l-2 border-accent/20">
              <div>
                <label className="text-[10px] text-text-dim">Trigger</label>
                <input
                  type="text"
                  value={config.trigger.scrollTrigger?.trigger || ".section"}
                  onChange={(e) => updateScrollTrigger({ trigger: e.target.value })}
                  className="w-full h-6 px-1.5 text-[11px] font-mono bg-black/20 border border-border rounded"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-dim">Start</label>
                <input
                  type="text"
                  value={config.trigger.scrollTrigger?.start || "top 80%"}
                  onChange={(e) => updateScrollTrigger({ start: e.target.value })}
                  className="w-full h-6 px-1.5 text-[11px] font-mono bg-black/20 border border-border rounded"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-dim">End</label>
                <input
                  type="text"
                  value={config.trigger.scrollTrigger?.end || "bottom 20%"}
                  onChange={(e) => updateScrollTrigger({ end: e.target.value })}
                  className="w-full h-6 px-1.5 text-[11px] font-mono bg-black/20 border border-border rounded"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-dim">Toggle Actions</label>
                <input
                  type="text"
                  value={config.trigger.scrollTrigger?.toggleActions || "play none none reverse"}
                  onChange={(e) => updateScrollTrigger({ toggleActions: e.target.value })}
                  className="w-full h-6 px-1.5 text-[11px] font-mono bg-black/20 border border-border rounded"
                />
              </div>
              <label className="flex items-center gap-1.5 col-span-2">
                <input
                  type="checkbox"
                  checked={config.trigger.scrollTrigger?.scrub === true}
                  onChange={(e) => updateScrollTrigger({ scrub: e.target.checked })}
                  className="w-3 h-3 accent-accent"
                />
                <span className="text-[10px] text-text-dim">Scrub</span>
                <input
                  type="checkbox"
                  checked={config.trigger.scrollTrigger?.pin || false}
                  onChange={(e) => updateScrollTrigger({ pin: e.target.checked })}
                  className="w-3 h-3 accent-accent ml-3"
                />
                <span className="text-[10px] text-text-dim">Pin</span>
                <input
                  type="checkbox"
                  checked={config.trigger.scrollTrigger?.markers || false}
                  onChange={(e) => updateScrollTrigger({ markers: e.target.checked })}
                  className="w-3 h-3 accent-accent ml-3"
                />
                <span className="text-[10px] text-text-dim">Markers</span>
              </label>
            </div>
          )}

          {/* Timeline settings row */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] text-text-dim uppercase tracking-wider shrink-0">Timeline</span>
            <div className="flex items-center gap-1">
              <label className="text-[10px] text-text-dim">Repeat</label>
              <input
                type="number"
                value={config.timelineSettings.repeat}
                onChange={(e) => updateTimeline({ repeat: Number(e.target.value) })}
                className="w-12 h-6 px-1 text-[11px] font-mono text-center bg-black/20 border border-border rounded"
              />
            </div>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={config.timelineSettings.yoyo}
                onChange={(e) => updateTimeline({ yoyo: e.target.checked })}
                className="w-3 h-3 accent-accent"
              />
              <span className="text-[10px] text-text-dim">Yoyo</span>
            </label>
            <div className="flex items-center gap-1">
              <label className="text-[10px] text-text-dim">Delay</label>
              <input
                type="number"
                value={config.timelineSettings.delay}
                onChange={(e) => updateTimeline({ delay: Number(e.target.value) })}
                step={0.1}
                min={0}
                className="w-12 h-6 px-1 text-[11px] font-mono text-center bg-black/20 border border-border rounded"
              />
            </div>
          </div>

          {/* Reduced motion */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-text-dim uppercase tracking-wider shrink-0">Reduced Motion</span>
            {REDUCED_MOTION_MODES.map((m) => (
              <button
                key={m}
                onClick={() => onConfigUpdate({ reducedMotion: { mode: m } })}
                className={`px-2 py-1 text-[10px] rounded-md transition-colors
                  ${
                    config.reducedMotion.mode === m
                      ? "bg-accent/20 text-accent border border-accent/30"
                      : "bg-black/20 text-text-dim border border-border hover:text-text-muted"
                  }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Copy buttons */}
        <div className="w-48 p-3 flex flex-col gap-1.5">
          <span className="text-[10px] text-text-dim uppercase tracking-wider mb-1">Export</span>
          {(
            [
              { key: "full", label: "Full (hsfx.ready)" },
              { key: "timelineOnly", label: "Timeline Only" },
              { key: "importsOnly", label: "Imports" },
              { key: "minified", label: "Minified" },
              { key: "configJson", label: "Config JSON" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleCopy(key)}
              className={`w-full px-2 py-1.5 text-[11px] text-left rounded-md transition-colors
                ${
                  copiedFormat === key
                    ? "bg-green-500/20 text-green-400"
                    : "bg-black/20 text-text-muted hover:bg-white/5 hover:text-text-primary"
                }`}
            >
              {copiedFormat === key ? "Copied!" : label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
