"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { createClient } from "@/lib/supabase/client";
import {
  Button,
  Spinner,
  Modal,
  GridBackground,
  PageTransition,
  CursorGlow,
} from "@/components/ui";
import Navbar from "@/components/layout/Navbar";
import type {
  GsapPresetEntry,
  GsapPresetConfig,
  Tween,
  PlaybackState,
  TimelineViewState,
  SceneElement,
  SceneElementType,
  TriggerConfig,
} from "@/lib/gsap-creator/types";
import { DEFAULT_CONFIG, DEFAULT_TWEEN, TWEEN_COLORS } from "@/lib/gsap-creator/types";
import { generateCode } from "@/lib/gsap-creator/codegen";
import { PresetSidebar } from "@/components/gsap-creator/PresetSidebar";
import { PreviewArea } from "@/components/gsap-creator/PreviewArea";
import { TimelineEditor } from "@/components/gsap-creator/TimelineEditor";
import { PropertyPanel } from "@/components/gsap-creator/PropertyPanel";
import { ExportBar } from "@/components/gsap-creator/ExportBar";
import type { PlayheadHandle } from "@/components/gsap-creator/Playhead";
import { ContextMenu, type ContextMenuItem } from "@/components/gsap-creator/ContextMenu";
import type { PreviewAreaHandle } from "@/components/gsap-creator/PreviewArea";

// ════════════════════════════════════════════════════════════
// SYNC INDICATOR
// ════════════════════════════════════════════════════════════

type SyncStatus = "idle" | "saving" | "saved" | "error";

function SyncIndicator({ status }: { status: SyncStatus }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {status === "saving" && (
        <>
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          <span className="text-text-muted">Saving...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-text-muted">Saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-red-400">Error saving</span>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CONTEXT MENU STATE
// ════════════════════════════════════════════════════════════

interface ContextMenuState {
  x: number;
  y: number;
  tweenId?: string;
}

// ════════════════════════════════════════════════════════════
// SLUG HELPER
// ════════════════════════════════════════════════════════════

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ════════════════════════════════════════════════════════════
// MAIN CONTENT
// ════════════════════════════════════════════════════════════

function GsapCreatorContent() {
  // ── Preset data ────────────────────────────────────────
  const [presets, setPresets] = useState<GsapPresetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // ── Current preset editing state ───────────────────────
  const [presetName, setPresetName] = useState("");
  const [presetCategory, setPresetCategory] = useState("uncategorized");
  const [isPublished, setIsPublished] = useState(false);
  const [config, setConfig] = useState<GsapPresetConfig>(DEFAULT_CONFIG);
  const [isDirty, setIsDirty] = useState(false);

  // ── UI state ───────────────────────────────────────────
  const [selectedTweenIds, setSelectedTweenIds] = useState<Set<string>>(new Set());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [playback, setPlayback] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 2,
    speed: 1,
    loop: false,
  });
  const [viewState, setViewState] = useState<TimelineViewState>({
    zoom: 200,
    scrollX: 0,
    snapToGrid: true,
    gridSize: 0.1,
  });

  // ── Modal state ────────────────────────────────────────
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetCategory, setNewPresetCategory] = useState("uncategorized");

  // ── Refs ───────────────────────────────────────────────
  const playheadRef = useRef<PlayheadHandle>(null);
  const previewRef = useRef<PreviewAreaHandle>(null);

  // ── Undo/redo ──────────────────────────────────────────
  const undoStackRef = useRef<GsapPresetConfig[]>([]);
  const redoStackRef = useRef<GsapPresetConfig[]>([]);
  const isUndoRedoRef = useRef(false);

  // ── Context menu ───────────────────────────────────────
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // ── Clipboard ──────────────────────────────────────────
  const clipboardRef = useRef<Tween | null>(null);

  // ── Derived ────────────────────────────────────────────
  const selectedPreset = presets.find((p) => p.id === selectedPresetId);
  const selectedTweens = config.tweens.filter((t) => selectedTweenIds.has(t.id));

  // ── Fetch presets ──────────────────────────────────────
  const fetchPresets = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("gsap_presets")
      .select("*")
      .order("category")
      .order("sort_order");

    if (error) {
      console.error("Error fetching GSAP presets:", error);
      setLoading(false);
      return;
    }

    setPresets(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  // ── Select preset ──────────────────────────────────────
  const handleSelectPreset = useCallback(
    (preset: GsapPresetEntry) => {
      setSelectedPresetId(preset.id);
      setPresetName(preset.name);
      setPresetCategory(preset.category);
      setIsPublished(preset.is_published);
      setConfig(preset.config);
      setSelectedTweenIds(new Set(preset.config.tweens[0] ? [preset.config.tweens[0].id] : []));
      setIsDirty(false);
      setSyncStatus("idle");
      undoStackRef.current = [];
      redoStackRef.current = [];
      setPlayback((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
    },
    []
  );

  // ── Mark dirty on config changes ───────────────────────
  const updateConfig = useCallback((updater: (prev: GsapPresetConfig) => GsapPresetConfig) => {
    setConfig((prev) => {
      if (!isUndoRedoRef.current) {
        undoStackRef.current = [...undoStackRef.current.slice(-49), structuredClone(prev)];
        redoStackRef.current = [];
      }
      const next = updater(prev);
      setIsDirty(true);
      return next;
    });
  }, []);

  // ── Undo/redo handlers ─────────────────────────────────
  const handleUndo = useCallback(() => {
    const stack = undoStackRef.current;
    if (stack.length === 0) return;
    const prev = stack[stack.length - 1];
    undoStackRef.current = stack.slice(0, -1);
    redoStackRef.current = [...redoStackRef.current, structuredClone(config)];
    isUndoRedoRef.current = true;
    setConfig(prev);
    setIsDirty(true);
    isUndoRedoRef.current = false;
  }, [config]);

  const handleRedo = useCallback(() => {
    const stack = redoStackRef.current;
    if (stack.length === 0) return;
    const next = stack[stack.length - 1];
    redoStackRef.current = stack.slice(0, -1);
    undoStackRef.current = [...undoStackRef.current, structuredClone(config)];
    isUndoRedoRef.current = true;
    setConfig(next);
    setIsDirty(true);
    isUndoRedoRef.current = false;
  }, [config]);

  // ── Save preset ────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!selectedPresetId) return;

    setSyncStatus("saving");
    const supabase = createClient();

    const slug = toSlug(presetName);
    const generated = generateCode(config, presetName);

    const { error } = await supabase
      .from("gsap_presets")
      .update({
        name: presetName,
        slug,
        category: presetCategory,
        is_published: isPublished,
        config,
        code_raw: generated.full,
        code_minified: generated.minified,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedPresetId);

    if (error) {
      console.error("Save error:", error);
      setSyncStatus("error");
      return;
    }

    setPresets((prev) =>
      prev.map((p) =>
        p.id === selectedPresetId
          ? {
              ...p,
              name: presetName,
              slug,
              category: presetCategory,
              is_published: isPublished,
              config,
              code_raw: generated.full,
              code_minified: generated.minified,
              updated_at: new Date().toISOString(),
            }
          : p
      )
    );

    setIsDirty(false);
    setSyncStatus("saved");
    setTimeout(() => setSyncStatus("idle"), 2000);
  }, [selectedPresetId, presetName, presetCategory, isPublished, config]);

  // ── Create preset ──────────────────────────────────────
  const handleCreatePreset = async () => {
    const name = newPresetName.trim();
    if (!name) return;

    const supabase = createClient();
    const slug = toSlug(name);
    const maxOrder = presets
      .filter((p) => p.category === newPresetCategory)
      .reduce((max, p) => Math.max(max, p.sort_order), -1);

    const { data, error } = await supabase
      .from("gsap_presets")
      .insert({
        name,
        slug,
        category: newPresetCategory,
        config: DEFAULT_CONFIG,
        code_raw: "",
        code_minified: "",
        sort_order: maxOrder + 1,
        is_published: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Create error:", error);
      return;
    }

    setPresets((prev) => [...prev, data]);
    setShowNewModal(false);
    setNewPresetName("");
    setNewPresetCategory("uncategorized");
    handleSelectPreset(data);
  };

  // ── Duplicate preset ───────────────────────────────────
  const handleDuplicate = useCallback(
    async (preset: GsapPresetEntry) => {
      const supabase = createClient();
      const newName = `${preset.name} (copy)`;
      const slug = toSlug(newName);
      const maxOrder = presets
        .filter((p) => p.category === preset.category)
        .reduce((max, p) => Math.max(max, p.sort_order), -1);

      const { data, error } = await supabase
        .from("gsap_presets")
        .insert({
          name: newName,
          slug,
          category: preset.category,
          description: preset.description,
          config: preset.config,
          code_raw: preset.code_raw,
          code_minified: preset.code_minified,
          sort_order: maxOrder + 1,
          is_published: false,
        })
        .select()
        .single();

      if (error) {
        console.error("Duplicate error:", error);
        return;
      }

      setPresets((prev) => [...prev, data]);
      handleSelectPreset(data);
    },
    [presets, handleSelectPreset]
  );

  // ── Delete preset ──────────────────────────────────────
  const handleDeletePreset = async () => {
    if (!selectedPresetId) return;

    const supabase = createClient();
    const { error } = await supabase.from("gsap_presets").delete().eq("id", selectedPresetId);

    if (error) {
      console.error("Delete error:", error);
      return;
    }

    setPresets((prev) => prev.filter((p) => p.id !== selectedPresetId));
    setSelectedPresetId(null);
    setConfig(DEFAULT_CONFIG);
    setPresetName("");
    setSelectedTweenIds(new Set());
    setShowDeleteModal(false);
  };

  // ── Tween operations ───────────────────────────────────
  const handleAddTween = useCallback(() => {
    const newId = crypto.randomUUID();
    const colorIndex = config.tweens.length % TWEEN_COLORS.length;

    // Default target to first scene element if custom scene exists
    let defaultTarget = DEFAULT_TWEEN.target;
    if (config.scene?.elements.length) {
      const firstEl = config.scene.elements[0];
      defaultTarget = `[data-hs-anim="${firstEl.animId}"]`;
    }

    const newTween: Tween = {
      ...DEFAULT_TWEEN,
      id: newId,
      target: defaultTarget,
      color: TWEEN_COLORS[colorIndex],
      label: `Tween ${config.tweens.length + 1}`,
    };

    updateConfig((prev) => ({
      ...prev,
      tweens: [...prev.tweens, newTween],
    }));

    setSelectedTweenIds(new Set([newId]));
  }, [config.tweens.length, config.scene, updateConfig]);

  const handleSelectTween = useCallback((id: string, e?: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean }) => {
    if (e?.metaKey || e?.ctrlKey) {
      // Toggle individual selection
      setSelectedTweenIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    } else if (e?.shiftKey && selectedTweenIds.size > 0) {
      // Range select
      const tweenIds = config.tweens.map(t => t.id);
      const lastSelected = Array.from(selectedTweenIds).pop()!;
      const lastIdx = tweenIds.indexOf(lastSelected);
      const clickIdx = tweenIds.indexOf(id);
      const [start, end] = lastIdx < clickIdx ? [lastIdx, clickIdx] : [clickIdx, lastIdx];
      const range = new Set(tweenIds.slice(start, end + 1));
      setSelectedTweenIds(range);
    } else {
      // Single select
      setSelectedTweenIds(new Set([id]));
    }
  }, [selectedTweenIds, config.tweens]);

  const handleMoveTween = useCallback(
    (id: string, newPosition: number) => {
      // If moving a selected tween and multiple are selected, move all together
      if (selectedTweenIds.has(id) && selectedTweenIds.size > 1) {
        updateConfig((prev) => {
          const movingTween = prev.tweens.find(t => t.id === id);
          if (!movingTween) return prev;
          const oldPos = parseFloat(movingTween.position) || 0;
          const delta = newPosition - oldPos;
          return {
            ...prev,
            tweens: prev.tweens.map((t) =>
              selectedTweenIds.has(t.id)
                ? { ...t, position: String(Math.max(0, (parseFloat(t.position) || 0) + delta)) }
                : t
            ),
          };
        });
      } else {
        updateConfig((prev) => ({
          ...prev,
          tweens: prev.tweens.map((t) =>
            t.id === id ? { ...t, position: String(newPosition) } : t
          ),
        }));
      }
    },
    [updateConfig, selectedTweenIds]
  );

  const handleResizeTween = useCallback(
    (id: string, newDuration: number, newPosition?: number) => {
      updateConfig((prev) => ({
        ...prev,
        tweens: prev.tweens.map((t) =>
          t.id === id
            ? {
                ...t,
                duration: Math.max(0.05, newDuration),
                ...(newPosition !== undefined ? { position: String(newPosition) } : {}),
              }
            : t
        ),
      }));
    },
    [updateConfig]
  );

  const handleDeleteTween = useCallback(
    (id: string) => {
      updateConfig((prev) => ({
        ...prev,
        tweens: prev.tweens.filter((t) => t.id !== id),
      }));
      if (selectedTweenIds.has(id)) {
        setSelectedTweenIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [selectedTweenIds, updateConfig]
  );

  const handleDuplicateTween = useCallback(
    (id: string) => {
      const tween = config.tweens.find((t) => t.id === id);
      if (!tween) return;
      const newId = crypto.randomUUID();
      const cloned: Tween = { ...structuredClone(tween), id: newId };
      updateConfig((prev) => ({
        ...prev,
        tweens: [...prev.tweens, cloned],
      }));
      setSelectedTweenIds(new Set([newId]));
    },
    [config.tweens, updateConfig]
  );

  const handleUpdateTween = useCallback(
    (tweenId: string, updates: Partial<Tween>) => {
      updateConfig((prev) => ({
        ...prev,
        tweens: prev.tweens.map((t) =>
          t.id === tweenId ? { ...t, ...updates } : t
        ),
      }));
    },
    [updateConfig]
  );

  // ── Copy/paste tween ───────────────────────────────────
  const handleCopyTween = useCallback(
    (id: string) => {
      const tween = config.tweens.find((t) => t.id === id);
      if (tween) clipboardRef.current = structuredClone(tween);
    },
    [config.tweens]
  );

  const handlePasteTween = useCallback(() => {
    if (!clipboardRef.current) return;
    const newId = crypto.randomUUID();
    const pasted: Tween = { ...structuredClone(clipboardRef.current), id: newId };
    updateConfig((prev) => ({
      ...prev,
      tweens: [...prev.tweens, pasted],
    }));
    setSelectedTweenIds(new Set([newId]));
  }, [updateConfig]);

  // ── Context menu handler ───────────────────────────────
  const handleTimelineContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const tweenBar = (e.target as HTMLElement).closest("[data-tween-bar]");
    if (tweenBar) {
      const tweenId = tweenBar.getAttribute("data-tween-id") || undefined;
      setContextMenu({ x: e.clientX, y: e.clientY, tweenId });
    } else {
      setContextMenu({ x: e.clientX, y: e.clientY });
    }
  }, []);

  // ── Build context menu items ───────────────────────────
  const contextMenuItems: ContextMenuItem[] = contextMenu?.tweenId
    ? [
        { label: "Duplicate", onClick: () => handleDuplicateTween(contextMenu.tweenId!) },
        { label: "Copy", onClick: () => handleCopyTween(contextMenu.tweenId!) },
        { label: "Paste", onClick: handlePasteTween, disabled: !clipboardRef.current },
        { label: "", onClick: () => {}, separator: true },
        ...(selectedTweenIds.size > 1
          ? [{ label: `Delete ${selectedTweenIds.size} Selected`, onClick: () => {
              selectedTweenIds.forEach(id => handleDeleteTween(id));
            }, danger: true }]
          : [{ label: "Delete", onClick: () => handleDeleteTween(contextMenu.tweenId!), danger: true }]
        ),
      ]
    : [
        { label: "Add Tween", onClick: handleAddTween },
        { label: "Paste", onClick: handlePasteTween, disabled: !clipboardRef.current },
      ];

  // ── Playback ───────────────────────────────────────────
  const handleSeek = useCallback((time: number) => {
    setPlayback((prev) => ({ ...prev, currentTime: time, isPlaying: false }));
    playheadRef.current?.setTime(time);
    previewRef.current?.seek(time);
  }, []);

  const handleScrub = useCallback((time: number) => {
    previewRef.current?.scrub(time);
  }, []);

  const handlePlaybackChange = useCallback((updates: Partial<PlaybackState>) => {
    setPlayback((prev) => ({ ...prev, ...updates }));
  }, []);

  // ── View state ─────────────────────────────────────────
  const handleViewStateChange = useCallback((updates: Partial<TimelineViewState>) => {
    setViewState((prev) => ({ ...prev, ...updates }));
  }, []);

  // ── Config updates from ExportBar ──────────────────────
  const handleConfigUpdate = useCallback(
    (updates: Partial<GsapPresetConfig>) => {
      updateConfig((prev) => ({ ...prev, ...updates }));
    },
    [updateConfig]
  );

  // ── Scene CRUD ────────────────────────────────────────
  const handleAddSceneElement = useCallback((type: string) => {
    updateConfig((prev) => {
      const scene = prev.scene || { layout: "column" as const, elements: [] };
      const typeCount = scene.elements.filter(e => e.type === type).length + 1;
      const animId = `${type}-${typeCount}`;
      const newElement: SceneElement = {
        id: crypto.randomUUID(),
        type: type as SceneElementType,
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${typeCount}`,
        animId,
      };
      return {
        ...prev,
        scene: { ...scene, elements: [...scene.elements, newElement] },
      };
    });
  }, [updateConfig]);

  const handleRemoveSceneElement = useCallback((elementId: string) => {
    updateConfig((prev) => {
      if (!prev.scene) return prev;
      const element = prev.scene.elements.find(e => e.id === elementId);
      const newElements = prev.scene.elements.filter(e => e.id !== elementId);
      const removedAnimId = element?.animId;
      const newTweens = removedAnimId
        ? prev.tweens.filter(t => !t.target.includes(removedAnimId))
        : prev.tweens;
      return {
        ...prev,
        scene: { ...prev.scene, elements: newElements },
        tweens: newTweens,
      };
    });
  }, [updateConfig]);

  const handleSceneLayoutChange = useCallback((layout: "column" | "center" | "grid") => {
    updateConfig((prev) => {
      const scene = prev.scene || { layout: "column" as const, elements: [] };
      return { ...prev, scene: { ...scene, layout } };
    });
  }, [updateConfig]);

  // ── Trigger config ────────────────────────────────────
  const handleTriggerUpdate = useCallback((updates: Partial<TriggerConfig>) => {
    updateConfig((prev) => ({
      ...prev,
      trigger: { ...prev.trigger, ...updates },
    }));
  }, [updateConfig]);

  // ── Keyboard shortcuts ─────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (isDirty && selectedPresetId) handleSave();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === " " && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setPlayback((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDirty, selectedPresetId, handleSave, handleUndo, handleRedo]);

  // ── Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <PageTransition>
      <GridBackground />
      <CursorGlow />
      <Navbar />

      <main className="min-h-screen pt-16 md:pt-20">
        {/* Header */}
        <header className="sticky top-16 md:top-20 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm">Back</span>
              </Link>
              <span className="text-border">|</span>
              <h1 className="font-serif text-lg font-medium text-text-primary">GSAP Creator</h1>

              {/* Undo/redo buttons */}
              {selectedPresetId && (
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={handleUndo}
                    disabled={undoStackRef.current.length === 0}
                    className="p-1.5 rounded text-text-dim hover:text-text-primary hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Undo (Cmd+Z)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 10h10a5 5 0 0 1 0 10H9" />
                      <polyline points="7 14 3 10 7 6" />
                    </svg>
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={redoStackRef.current.length === 0}
                    className="p-1.5 rounded text-text-dim hover:text-text-primary hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Redo (Cmd+Shift+Z)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10H11a5 5 0 0 0 0 10h4" />
                      <polyline points="17 14 21 10 17 6" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Preset name input */}
              {selectedPresetId && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={presetName}
                    onChange={(e) => {
                      setPresetName(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Preset name"
                    className="w-48 px-2 py-1 text-sm bg-background border border-border rounded text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/50"
                  />
                  <input
                    type="text"
                    value={presetCategory}
                    onChange={(e) => {
                      setPresetCategory(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Category"
                    className="w-32 px-2 py-1 text-sm bg-background border border-border rounded text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/50"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsPublished(!isPublished);
                      setIsDirty(true);
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                      isPublished
                        ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                        : "bg-border/50 text-text-dim hover:bg-border"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${isPublished ? "bg-green-400" : "bg-text-dim"}`} />
                    {isPublished ? "Published" : "Draft"}
                  </button>
                </div>
              )}

              <SyncIndicator status={syncStatus} />

              {selectedPresetId && (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!isDirty || syncStatus === "saving"}
                >
                  Save
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewModal(true)}
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Preset
              </Button>
            </div>
          </div>
        </header>

        {/* Main layout */}
        <div className="flex h-[calc(100vh-8.5rem)]">
          {/* Left: Preset Sidebar */}
          <PresetSidebar
            presets={presets}
            selectedPresetId={selectedPresetId}
            onSelect={handleSelectPreset}
            onNew={() => setShowNewModal(true)}
            onDuplicate={handleDuplicate}
            onDelete={(preset) => {
              setSelectedPresetId(preset.id);
              setShowDeleteModal(true);
            }}
            isLoading={loading}
          />

          {/* Center + Bottom */}
          {selectedPresetId ? (
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Preview */}
              <PreviewArea
                ref={previewRef}
                config={config}
                playback={playback}
                onPlaybackChange={handlePlaybackChange}
                playheadRef={playheadRef}
                onRemoveSceneElement={handleRemoveSceneElement}
                onAddSceneElement={handleAddSceneElement}
                onSceneLayoutChange={handleSceneLayoutChange}
              />

              {/* Timeline Editor */}
              <div className="border-t border-border" onContextMenu={handleTimelineContextMenu}>
                <TimelineEditor
                  tweens={config.tweens}
                  selectedTweenIds={selectedTweenIds}
                  viewState={viewState}
                  playback={playback}
                  onSelectTween={handleSelectTween}
                  onMoveTween={handleMoveTween}
                  onResizeTween={handleResizeTween}
                  onDeleteTween={handleDeleteTween}
                  onAddTween={handleAddTween}
                  onViewStateChange={handleViewStateChange}
                  onSeek={handleSeek}
                  onScrub={handleScrub}
                  playheadRef={playheadRef as React.RefObject<PlayheadHandle>}
                />
              </div>

              {/* Export Bar */}
              <ExportBar
                config={config}
                presetName={presetName}
                onConfigUpdate={handleConfigUpdate}
              />
            </div>
          ) : (
            /* Empty state */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-sm">
                <svg
                  className="w-16 h-16 mx-auto text-text-dim mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 12 6 12.504 6 13.125"
                  />
                </svg>
                <h2 className="font-serif text-xl text-text-primary mb-2">
                  Select or create a preset
                </h2>
                <p className="text-text-muted text-sm mb-4">
                  Choose a preset from the sidebar or create a new one to start building GSAP animations.
                </p>
                <Button size="sm" onClick={() => setShowNewModal(true)}>
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Create First Preset
                </Button>
              </div>
            </div>
          )}

          {/* Right: Property Panel */}
          {selectedPresetId && (
            <PropertyPanel
              tweens={selectedTweens}
              onUpdate={handleUpdateTween}
              triggerConfig={config.trigger}
              onTriggerUpdate={handleTriggerUpdate}
            />
          )}
        </div>
      </main>

      {/* New Preset Modal */}
      <Modal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="New GSAP Preset"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Name</label>
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="e.g. Hero Fade In"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/50"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newPresetName.trim()) handleCreatePreset();
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Category</label>
            <input
              type="text"
              value={newPresetCategory}
              onChange={(e) => setNewPresetCategory(e.target.value)}
              placeholder="e.g. hero, scroll, interaction"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/50"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowNewModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreatePreset}
              disabled={!newPresetName.trim()}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Preset"
        size="sm"
      >
        <p className="text-sm text-text-muted mb-4">
          Are you sure you want to delete{" "}
          <strong className="text-text-primary">{selectedPreset?.name}</strong>? This action cannot be
          undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <button
            onClick={handleDeletePreset}
            className="px-4 py-2 text-sm font-medium rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
          >
            Delete
          </button>
        </div>
      </Modal>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </PageTransition>
  );
}

// ════════════════════════════════════════════════════════════
// PAGE EXPORT
// ════════════════════════════════════════════════════════════

export default function GsapCreatorPage() {
  return (
    <ProtectedRoute>
      <GsapCreatorContent />
    </ProtectedRoute>
  );
}
