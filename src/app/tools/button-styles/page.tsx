"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { createClient } from "@/lib/supabase/client";
import {
  Button,
  Spinner,
  CodeEditor,
  Modal,
  GridBackground,
  PageTransition,
  CursorGlow,
} from "@/components/ui";
import Navbar from "@/components/layout/Navbar";
import type { ButtonStyleEntry } from "@/lib/button-styles/types";

// ════════════════════════════════════════════════════════════
// COMPONENT DISPLAY NAMES
// ════════════════════════════════════════════════════════════

const COMPONENT_LABELS: Record<string, string> = {
  "button-main": "Button Main",
  accessory: "Accessory",
  arrow: "Arrow",
  close: "Close",
  play: "Play",
  "footer-link": "Footer Link",
};

const COMPONENT_ORDER = ["button-main", "accessory", "arrow", "close", "play", "footer-link"];

function getComponentLabel(component: string) {
  return COMPONENT_LABELS[component] || component;
}

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
// SIDEBAR
// ════════════════════════════════════════════════════════════

function ComponentSidebar({
  components,
  selectedId,
  collapsedComponents,
  onSelect,
  onToggleComponent,
}: {
  components: Map<string, ButtonStyleEntry[]>;
  selectedId: string | null;
  collapsedComponents: Set<string>;
  onSelect: (id: string) => void;
  onToggleComponent: (component: string) => void;
}) {
  const sortedComponents = COMPONENT_ORDER.filter((c) => components.has(c));
  // Add any components not in the predefined order
  for (const key of Array.from(components.keys())) {
    if (!sortedComponents.includes(key)) sortedComponents.push(key);
  }

  return (
    <div className="w-72 border-r border-border overflow-y-auto flex-shrink-0">
      {sortedComponents.map((componentName) => {
        const entries = components.get(componentName)!;
        const isCollapsed = collapsedComponents.has(componentName);

        return (
          <div key={componentName}>
            <div className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-text-dim bg-background hover:bg-border/30">
              <span className="flex-1 text-left">{getComponentLabel(componentName)}</span>
              <div className="flex items-center gap-2">
                <span className="text-text-dim/50">{entries.length}</span>
                <button
                  type="button"
                  onClick={() => onToggleComponent(componentName)}
                  className="p-0.5 hover:bg-border/50 rounded transition-colors"
                >
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
            {!isCollapsed &&
              entries
                .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
                .map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onSelect(entry.id)}
                    title={`${entry.type} — ${entry.name}`}
                    className={`w-full text-left px-5 py-2 text-sm transition-colors truncate flex items-center gap-2 ${
                      entry.id === selectedId
                        ? "bg-accent/10 text-accent border-r-2 border-accent"
                        : "text-text-secondary hover:bg-border/30 hover:text-text-primary"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        entry.type === "config"
                          ? "bg-blue-400"
                          : entry.type === "defaults"
                            ? "bg-amber-400"
                            : "bg-green-400"
                      }`}
                    />
                    {entry.name}
                  </button>
                ))}
          </div>
        );
      })}
      {components.size === 0 && (
        <div className="px-4 py-8 text-center text-sm text-text-dim">
          No entries yet. Create one to get started.
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN CONTENT
// ════════════════════════════════════════════════════════════

function ButtonStylesContent() {
  // Data state
  const [entries, setEntries] = useState<ButtonStyleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // UI state
  const [collapsedComponents, setCollapsedComponents] = useState<Set<string>>(new Set());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

  // Modal state
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newComponent, setNewComponent] = useState("button-main");
  const [newType, setNewType] = useState<"animation" | "defaults" | "config">("animation");

  const selectedEntry = entries.find((e) => e.id === selectedId);
  const editorLanguage = selectedEntry?.type === "config" ? "json" : "css";

  // Group entries by component
  const components = useMemo(() => {
    const map = new Map<string, ButtonStyleEntry[]>();
    for (const entry of entries) {
      const existing = map.get(entry.component) || [];
      existing.push(entry);
      map.set(entry.component, existing);
    }
    return map;
  }, [entries]);

  // ── Fetch all entries ──────────────────────────────────
  const fetchEntries = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("button_styles")
      .select("*")
      .order("component")
      .order("sort_order");

    if (error) {
      console.error("Error fetching button styles:", error);
      setLoading(false);
      return;
    }

    setEntries(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // ── Select entry ───────────────────────────────────────
  const handleSelect = useCallback(
    (id: string) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry) return;
      setSelectedId(id);

      if (entry.type === "config") {
        setEditorContent(JSON.stringify(entry.config, null, 2));
      } else {
        setEditorContent(entry.css || "");
      }

      setHasUnsavedChanges(false);
      setSyncStatus("idle");
    },
    [entries]
  );

  // ── Editor change ──────────────────────────────────────
  const handleEditorChange = (value: string) => {
    setEditorContent(value);
    setHasUnsavedChanges(true);
  };

  // ── Save ───────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!selectedId || !selectedEntry) return;

    setSyncStatus("saving");
    const supabase = createClient();

    if (selectedEntry.type === "config") {
      // Validate JSON before saving
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(editorContent);
      } catch {
        setSyncStatus("error");
        return;
      }

      const { error } = await supabase
        .from("button_styles")
        .update({
          config: parsed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedId);

      if (error) {
        console.error("Save error:", error);
        setSyncStatus("error");
        return;
      }

      setEntries((prev) =>
        prev.map((e) =>
          e.id === selectedId
            ? { ...e, config: parsed, updated_at: new Date().toISOString() }
            : e
        )
      );
    } else {
      const { error } = await supabase
        .from("button_styles")
        .update({
          css: editorContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedId);

      if (error) {
        console.error("Save error:", error);
        setSyncStatus("error");
        return;
      }

      setEntries((prev) =>
        prev.map((e) =>
          e.id === selectedId
            ? { ...e, css: editorContent, updated_at: new Date().toISOString() }
            : e
        )
      );
    }

    setHasUnsavedChanges(false);
    setSyncStatus("saved");
    setTimeout(() => setSyncStatus("idle"), 2000);
  }, [selectedId, selectedEntry, editorContent]);

  // ── Create entry ───────────────────────────────────────
  const handleCreateEntry = async () => {
    const name = newName.trim();
    if (!name || !newComponent) return;

    const supabase = createClient();

    // Get max sort_order for this component
    const componentEntries = entries.filter((e) => e.component === newComponent);
    const maxOrder = componentEntries.reduce((max, e) => Math.max(max, e.sort_order), -1);

    const insertData: Record<string, unknown> = {
      component: newComponent,
      name,
      type: newType,
      sort_order: maxOrder + 1,
    };

    if (newType === "config") {
      insertData.config = {};
    } else {
      insertData.css = "";
    }

    const { data, error } = await supabase
      .from("button_styles")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Create error:", error);
      return;
    }

    setEntries((prev) => [...prev, data]);
    setShowNewModal(false);
    setNewName("");
    setNewType("animation");
    handleSelect(data.id);
  };

  // ── Delete entry ───────────────────────────────────────
  const handleDeleteEntry = async () => {
    if (!selectedId) return;

    const supabase = createClient();
    const { error } = await supabase.from("button_styles").delete().eq("id", selectedId);

    if (error) {
      console.error("Delete error:", error);
      return;
    }

    setEntries((prev) => prev.filter((e) => e.id !== selectedId));
    setSelectedId(null);
    setEditorContent("");
    setShowDeleteModal(false);
  };

  // ── Toggle collapsed component ─────────────────────────
  const toggleComponent = (component: string) => {
    setCollapsedComponents((prev) => {
      const next = new Set(prev);
      if (next.has(component)) next.delete(component);
      else next.add(component);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  const canDelete =
    selectedEntry &&
    selectedEntry.type === "animation";

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
              <h1 className="font-serif text-lg font-medium text-text-primary">Button Styles</h1>
            </div>
            <div className="flex items-center gap-2">
              <SyncIndicator status={syncStatus} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewModal(true)}
                title="Create a new button style entry"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Entry
              </Button>
            </div>
          </div>
        </header>

        {/* Main layout */}
        <div className="flex h-[calc(100vh-8.5rem)]">
          {/* Sidebar */}
          <ComponentSidebar
            components={components}
            selectedId={selectedId}
            collapsedComponents={collapsedComponents}
            onSelect={handleSelect}
            onToggleComponent={toggleComponent}
          />

          {/* Editor panel */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {selectedEntry ? (
              <>
                {/* Entry header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface/50">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        selectedEntry.type === "config"
                          ? "bg-blue-500/10 text-blue-400"
                          : selectedEntry.type === "defaults"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-green-500/10 text-green-400"
                      }`}
                    >
                      {getComponentLabel(selectedEntry.component)}
                    </span>
                    <span className="text-sm font-medium text-text-primary">{selectedEntry.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-border/50 text-text-dim">
                      {selectedEntry.type}
                    </span>
                    {hasUnsavedChanges && (
                      <span className="w-2 h-2 rounded-full bg-yellow-500" title="Unsaved changes — press Ctrl+S or click Save" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSave}
                      disabled={!hasUnsavedChanges || syncStatus === "saving"}
                      title="Save changes (Ctrl+S)"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Save
                    </Button>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteModal(true)}
                        title="Delete this animation"
                      >
                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Code editor */}
                <div className="flex-1 min-h-0">
                  <CodeEditor
                    value={editorContent}
                    onChange={handleEditorChange}
                    language={editorLanguage}
                    height="100%"
                    onSave={handleSave}
                    minimap={false}
                  />
                </div>

                {/* API info bar */}
                <div className="flex items-center gap-2 px-4 py-2 border-t border-border bg-surface/30">
                  <svg className="w-3.5 h-3.5 text-text-dim flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-text-dim">
                    <span className="font-medium text-text-muted">API:</span>{" "}
                    <code className="px-1 py-0.5 rounded bg-background font-mono text-[11px]">/api/button-styles</code>{" "}
                    serves pre-parsed button styles.{" "}
                    <code className="px-1 py-0.5 rounded bg-background font-mono text-[11px]">?component={selectedEntry.component}</code>{" "}
                    filters by component.{" "}
                    <code className="px-1 py-0.5 rounded bg-background font-mono text-[11px]">?raw=true</code>{" "}
                    returns flat entries.
                  </p>
                </div>
              </>
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
                      d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59"
                    />
                  </svg>
                  <h2 className="font-serif text-xl text-text-primary mb-2">Select a button style</h2>
                  <p className="text-text-muted text-sm mb-4">
                    Click an entry in the sidebar to edit its CSS or config JSON.
                  </p>
                  <div className="text-left text-xs text-text-dim space-y-2 p-3 rounded-lg border border-border bg-surface/30">
                    <p className="font-medium text-text-muted uppercase tracking-wider mb-1">Legend</p>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      <span><strong className="text-text-muted">Config</strong> — JSON configuration for the component</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span><strong className="text-text-muted">Defaults</strong> — Base CSS applied to all animations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      <span><strong className="text-text-muted">Animation</strong> — Individual animation CSS</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* New Entry Modal */}
      <Modal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="New Button Style Entry"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. fade-in"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/50"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Component</label>
            <select
              value={newComponent}
              onChange={(e) => setNewComponent(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent/50"
            >
              {COMPONENT_ORDER.map((c) => (
                <option key={c} value={c}>
                  {getComponentLabel(c)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as "animation" | "defaults" | "config")}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent/50"
            >
              <option value="animation">Animation</option>
              <option value="defaults">Defaults</option>
              <option value="config">Config</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowNewModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateEntry}
              disabled={!newName.trim()}
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
        title="Delete Entry"
        size="sm"
      >
        <p className="text-sm text-text-muted mb-4">
          Are you sure you want to delete <strong className="text-text-primary">{selectedEntry?.name}</strong> from{" "}
          <strong className="text-text-primary">{selectedEntry ? getComponentLabel(selectedEntry.component) : ""}</strong>?
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <button
            onClick={handleDeleteEntry}
            className="px-4 py-2 text-sm font-medium rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
          >
            Delete
          </button>
        </div>
      </Modal>
    </PageTransition>
  );
}

// ════════════════════════════════════════════════════════════
// PAGE EXPORT
// ════════════════════════════════════════════════════════════

export default function ButtonStylesPage() {
  return (
    <ProtectedRoute>
      <ButtonStylesContent />
    </ProtectedRoute>
  );
}
