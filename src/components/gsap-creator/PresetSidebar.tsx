"use client";

import { useState } from "react";
import type { GsapPresetEntry } from "@/lib/gsap-creator/types";

interface PresetSidebarProps {
  presets: GsapPresetEntry[];
  selectedPresetId: string | null;
  onSelect: (preset: GsapPresetEntry) => void;
  onNew: () => void;
  onDuplicate: (preset: GsapPresetEntry) => void;
  onDelete: (preset: GsapPresetEntry) => void;
  isLoading: boolean;
}

export function PresetSidebar({
  presets,
  selectedPresetId,
  onSelect,
  onNew,
  onDuplicate,
  onDelete,
  isLoading,
}: PresetSidebarProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ presetId: string; x: number; y: number } | null>(null);

  // Group by category
  const grouped = presets.reduce(
    (acc, preset) => {
      const cat = preset.category || "uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(preset);
      return acc;
    },
    {} as Record<string, GsapPresetEntry[]>
  );

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, presetId: string) => {
    e.preventDefault();
    setContextMenu({ presetId, x: e.clientX, y: e.clientY });
  };

  return (
    <div className="w-64 flex flex-col bg-surface border-r border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Presets</span>
        <button
          onClick={onNew}
          className="p-1 text-text-dim hover:text-accent rounded transition-colors"
          aria-label="New preset"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Preset list */}
      <div className="flex-1 overflow-y-auto py-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-xs text-text-dim">Loading...</div>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <p className="text-xs text-text-dim mb-2">No presets yet</p>
            <button
              onClick={onNew}
              className="text-xs text-accent hover:text-accent/80 transition-colors"
            >
              Create your first preset
            </button>
          </div>
        ) : (
          Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, items]) => (
              <div key={category}>
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium
                    text-text-dim uppercase tracking-wider hover:text-text-muted transition-colors"
                >
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={`transition-transform ${collapsedCategories.has(category) ? "" : "rotate-90"}`}
                  >
                    <polygon points="6 4 20 12 6 20" />
                  </svg>
                  {category}
                  <span className="ml-auto text-text-dim/50">{items.length}</span>
                </button>

                {!collapsedCategories.has(category) && (
                  <div className="pb-1">
                    {items.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => onSelect(preset)}
                        onContextMenu={(e) => handleContextMenu(e, preset.id)}
                        className={`w-full text-left px-4 py-1.5 flex items-center gap-2 text-xs
                          transition-colors group
                          ${
                            preset.id === selectedPresetId
                              ? "bg-accent/10 text-accent"
                              : "text-text-muted hover:bg-white/[0.03] hover:text-text-primary"
                          }`}
                      >
                        <span className="truncate flex-1">{preset.name}</span>
                        {!preset.is_published && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-500 shrink-0">
                            draft
                          </span>
                        )}
                        <span className="text-[10px] text-text-dim/50 shrink-0">
                          {preset.config?.tweens?.length || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 bg-surface border border-border rounded-lg shadow-xl py-1 min-w-[140px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => {
                const preset = presets.find((p) => p.id === contextMenu.presetId);
                if (preset) onDuplicate(preset);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-text-muted hover:bg-white/5 transition-colors"
            >
              Duplicate
            </button>
            <button
              onClick={() => {
                const preset = presets.find((p) => p.id === contextMenu.presetId);
                if (preset) onDelete(preset);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
