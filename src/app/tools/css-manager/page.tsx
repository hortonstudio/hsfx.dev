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
import { minifyCSS, wrapInStyleTags } from "@/lib/css-manager/minify";
import type { CSSEntry, CSSBackup } from "@/lib/css-manager/types";

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
// COPY BUTTON
// ════════════════════════════════════════════════════════════

function CopyButton({
  label,
  getText,
  variant = "ghost",
}: {
  label: string;
  getText: () => string;
  variant?: "ghost" | "outline";
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = getText();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant={variant} size="sm" onClick={handleCopy}>
      {copied ? (
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
      {copied ? "Copied!" : label}
    </Button>
  );
}

// ════════════════════════════════════════════════════════════
// SIDEBAR
// ════════════════════════════════════════════════════════════

function GroupSidebar({
  groups,
  selectedId,
  selectedGroup,
  collapsedGroups,
  onSelect,
  onSelectGroup,
  onToggleGroup,
}: {
  groups: Map<string, CSSEntry[]>;
  selectedId: string | null;
  selectedGroup: string | null;
  collapsedGroups: Set<string>;
  onSelect: (id: string) => void;
  onSelectGroup: (group: string) => void;
  onToggleGroup: (group: string) => void;
}) {
  const sortedGroupNames = Array.from(groups.keys()).sort();

  return (
    <div className="w-72 border-r border-border overflow-y-auto flex-shrink-0">
      {sortedGroupNames.map((groupName) => {
        const entries = groups.get(groupName)!;
        const isCollapsed = collapsedGroups.has(groupName);
        const isGroupSelected = selectedGroup === groupName;

        return (
          <div key={groupName}>
            <div
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                isGroupSelected
                  ? "bg-accent/10 text-accent"
                  : "text-text-dim bg-background hover:bg-border/30"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectGroup(groupName)}
                className="flex-1 text-left"
                title={`View combined CSS for "${groupName}" group`}
              >
                {groupName}
              </button>
              <div className="flex items-center gap-2">
                <span className={isGroupSelected ? "text-accent/50" : "text-text-dim/50"}>{entries.length}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleGroup(groupName);
                  }}
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
                    title={`Edit "${entry.name}" — sort order: ${entry.sort_order}`}
                    className={`w-full text-left px-5 py-2 text-sm transition-colors truncate ${
                      entry.id === selectedId
                        ? "bg-accent/10 text-accent border-r-2 border-accent"
                        : "text-text-secondary hover:bg-border/30 hover:text-text-primary"
                    }`}
                  >
                    {entry.name}
                  </button>
                ))}
          </div>
        );
      })}
      {groups.size === 0 && (
        <div className="px-4 py-8 text-center text-sm text-text-dim">
          No entries yet. Create one to get started.
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// BACKUP PANEL
// ════════════════════════════════════════════════════════════

function BackupPanel({
  backups,
  onRestore,
}: {
  backups: CSSBackup[];
  onRestore: (css: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (backups.length === 0) return null;

  return (
    <div className="border-t border-border">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-text-dim uppercase tracking-wider hover:bg-border/30 transition-colors"
      >
        <span>Backups ({backups.length})</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="divide-y divide-border">
          {backups.map((backup) => (
            <div key={backup.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted">
                  {new Date(backup.backed_up_at).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-xs text-text-dim mt-0.5 font-mono truncate max-w-[200px]">
                  {backup.css_content.slice(0, 60)}...
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onRestore(backup.css_content)}>
                Restore
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN CONTENT
// ════════════════════════════════════════════════════════════

function CSSManagerContent() {
  // Data state
  const [entries, setEntries] = useState<CSSEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Backup state
  const [backups, setBackups] = useState<CSSBackup[]>([]);

  // UI state
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

  // Editor tab state
  const [editorTab, setEditorTab] = useState<"raw" | "minified">("raw");

  // Modal state
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newEntryName, setNewEntryName] = useState("");
  const [newEntryGroup, setNewEntryGroup] = useState("");
  const [newGroupInput, setNewGroupInput] = useState("");
  const [useNewGroup, setUseNewGroup] = useState(false);

  const selectedEntry = entries.find((e) => e.id === selectedId);

  // Group entries by group_name
  const groups = useMemo(() => {
    const map = new Map<string, CSSEntry[]>();
    for (const entry of entries) {
      const existing = map.get(entry.group_name) || [];
      existing.push(entry);
      map.set(entry.group_name, existing);
    }
    return map;
  }, [entries]);

  const groupNames = Array.from(groups.keys()).sort();

  // Combined CSS for group view
  const combinedGroupCSS = useMemo(() => {
    if (!selectedGroup) return "";
    const groupEntries = groups.get(selectedGroup) || [];
    return groupEntries
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
      .map((e) => `/* === ${e.name} === */\n${e.css_content}`)
      .join("\n\n");
  }, [selectedGroup, groups]);

  const selectedGroupEntryCount = selectedGroup ? (groups.get(selectedGroup) || []).length : 0;

  // Minified content memos for preview tabs
  const minifiedEntryCSS = useMemo(() => minifyCSS(editorContent), [editorContent]);
  const minifiedGroupCSS = useMemo(() => minifyCSS(combinedGroupCSS), [combinedGroupCSS]);

  // ── Fetch all entries ──────────────────────────────────
  const fetchEntries = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("page_css")
      .select("*")
      .order("group_name")
      .order("sort_order")
      .order("name");

    if (error) {
      console.error("Error fetching CSS entries:", error);
      setLoading(false);
      return;
    }

    setEntries(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // ── Fetch backups when entry selected ──────────────────
  const fetchBackups = useCallback(async (entryId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("page_css_backups")
      .select("*")
      .eq("css_entry_id", entryId)
      .order("backed_up_at", { ascending: false })
      .limit(3);

    setBackups(data || []);
  }, []);

  // ── Recompute group combined CSS in Supabase ───────────
  const recomputeGroupCSS = useCallback(async (groupName: string) => {
    const supabase = createClient();
    const { data: groupEntries } = await supabase
      .from("page_css")
      .select("name, css_content, sort_order")
      .eq("group_name", groupName)
      .order("sort_order")
      .order("name");

    if (!groupEntries || groupEntries.length === 0) {
      await supabase.from("css_groups").delete().eq("group_name", groupName);
      return;
    }

    const combinedRaw = groupEntries
      .map((e) => `/* === ${e.name} === */\n${e.css_content}`)
      .join("\n\n");
    const combinedMinified = minifyCSS(
      groupEntries.map((e) => e.css_content).join("\n\n")
    );

    await supabase.from("css_groups").upsert(
      {
        group_name: groupName,
        combined_css: combinedRaw,
        combined_css_minified: combinedMinified,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "group_name" }
    );
  }, []);

  // ── Select entry ───────────────────────────────────────
  const handleSelect = useCallback(
    (id: string) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry) return;
      setSelectedId(id);
      setSelectedGroup(null);
      setEditorContent(entry.css_content);
      setHasUnsavedChanges(false);
      setSyncStatus("idle");
      setEditorTab("raw");
      fetchBackups(id);
    },
    [entries, fetchBackups]
  );

  // ── Select group ───────────────────────────────────────
  const handleSelectGroup = useCallback((groupName: string) => {
    setSelectedGroup(groupName);
    setSelectedId(null);
    setEditorContent("");
    setHasUnsavedChanges(false);
    setBackups([]);
    setSyncStatus("idle");
    setEditorTab("raw");
  }, []);

  // ── Editor change ──────────────────────────────────────
  const handleEditorChange = (value: string) => {
    setEditorContent(value);
    setHasUnsavedChanges(true);
  };

  // ── Save with backup rotation ──────────────────────────
  const handleSave = useCallback(async () => {
    if (!selectedId || !selectedEntry) return;

    setSyncStatus("saving");

    const supabase = createClient();

    // Step 1: Create backup of current content (before overwrite)
    if (selectedEntry.css_content.trim()) {
      const { error: backupError } = await supabase
        .from("page_css_backups")
        .insert({
          css_entry_id: selectedId,
          css_content: selectedEntry.css_content,
        });

      if (backupError) {
        console.error("Backup error:", backupError);
      }

      // Step 2: Rotate backups — keep max 3
      const { data: allBackups } = await supabase
        .from("page_css_backups")
        .select("id, backed_up_at")
        .eq("css_entry_id", selectedId)
        .order("backed_up_at", { ascending: false });

      if (allBackups && allBackups.length > 3) {
        const toDelete = allBackups.slice(3).map((b) => b.id);
        await supabase
          .from("page_css_backups")
          .delete()
          .in("id", toDelete);
      }
    }

    // Step 3: Update the entry (pre-compute minified for API)
    const { error: updateError } = await supabase
      .from("page_css")
      .update({
        css_content: editorContent,
        css_minified: minifyCSS(editorContent),
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedId);

    if (updateError) {
      console.error("Save error:", updateError);
      setSyncStatus("error");
      return;
    }

    // Step 4: Refresh local state
    setEntries((prev) =>
      prev.map((e) =>
        e.id === selectedId
          ? { ...e, css_content: editorContent, updated_at: new Date().toISOString() }
          : e
      )
    );
    setHasUnsavedChanges(false);
    setSyncStatus("saved");
    fetchBackups(selectedId);

    // Step 5: Recompute group combined CSS
    await recomputeGroupCSS(selectedEntry.group_name);

    setTimeout(() => setSyncStatus("idle"), 2000);
  }, [selectedId, selectedEntry, editorContent, fetchBackups, recomputeGroupCSS]);

  // ── Create entry ───────────────────────────────────────
  const handleCreateEntry = async () => {
    const groupName = useNewGroup ? newGroupInput.trim() : newEntryGroup;
    const name = newEntryName.trim();
    if (!name || !groupName) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("page_css")
      .insert({ name, group_name: groupName, css_content: "", css_minified: "" })
      .select()
      .single();

    if (error) {
      console.error("Create error:", error);
      return;
    }

    setEntries((prev) => [...prev, data]);
    setShowNewEntryModal(false);
    setNewEntryName("");
    setNewEntryGroup("");
    setNewGroupInput("");
    setUseNewGroup(false);
    handleSelect(data.id);

    // Recompute group combined
    await recomputeGroupCSS(groupName);
  };

  // ── Delete entry ───────────────────────────────────────
  const handleDeleteEntry = async () => {
    if (!selectedId || !selectedEntry) return;
    const groupName = selectedEntry.group_name;

    const supabase = createClient();
    const { error } = await supabase.from("page_css").delete().eq("id", selectedId);

    if (error) {
      console.error("Delete error:", error);
      return;
    }

    setEntries((prev) => prev.filter((e) => e.id !== selectedId));
    setSelectedId(null);
    setEditorContent("");
    setBackups([]);
    setShowDeleteModal(false);

    // Recompute group combined
    await recomputeGroupCSS(groupName);
  };

  // ── Rebuild group minified ──────────────────────────────
  const rebuildGroupMinified = useCallback(
    async (groupName: string) => {
      setSyncStatus("saving");
      const supabase = createClient();

      const groupEntries = entries.filter((e) => e.group_name === groupName);

      // Minify each entry individually
      for (const entry of groupEntries) {
        const entryMinified = minifyCSS(entry.css_content);
        await supabase
          .from("page_css")
          .update({ css_minified: entryMinified, updated_at: new Date().toISOString() })
          .eq("id", entry.id);
      }

      // Recompute group combined
      await recomputeGroupCSS(groupName);

      setSyncStatus("saved");
      setTimeout(() => setSyncStatus("idle"), 2000);
    },
    [entries, recomputeGroupCSS]
  );

  // ── Restore backup ────────────────────────────────────
  const handleRestore = (css: string) => {
    setEditorContent(css);
    setHasUnsavedChanges(true);
  };

  // ── Get group CSS (for combined copy from entry view) ──
  const getGroupCSS = useCallback(() => {
    if (!selectedEntry) return "";
    const groupEntries = groups.get(selectedEntry.group_name) || [];
    return groupEntries
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
      .map((e) => `/* === ${e.name} === */\n${e.id === selectedId ? editorContent : e.css_content}`)
      .join("\n\n");
  }, [selectedEntry, groups, selectedId, editorContent]);

  // ── Toggle collapsed group ─────────────────────────────
  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
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
              <h1 className="font-serif text-lg font-medium text-text-primary">CSS Manager</h1>
            </div>
            <div className="flex items-center gap-2">
              <SyncIndicator status={syncStatus} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewEntryModal(true)}
                title="Create a new CSS entry in an existing or new group"
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
          <GroupSidebar
            groups={groups}
            selectedId={selectedId}
            selectedGroup={selectedGroup}
            collapsedGroups={collapsedGroups}
            onSelect={handleSelect}
            onSelectGroup={handleSelectGroup}
            onToggleGroup={toggleGroup}
          />

          {/* Editor panel */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {selectedEntry ? (
              <>
                {/* Entry header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface/50">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent font-medium cursor-help"
                      title={`Group: ${selectedEntry.group_name} — Click the group name in the sidebar to view combined CSS`}
                    >
                      {selectedEntry.group_name}
                    </span>
                    <span className="text-sm font-medium text-text-primary">{selectedEntry.name}</span>
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
                      title="Save changes and update minified cache (Ctrl+S)"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteModal(true)}
                      title="Delete this CSS entry and all its backups"
                    >
                      <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>

                {/* Editor tabs */}
                <div className="flex items-center border-b border-border bg-surface/30">
                  <button
                    type="button"
                    onClick={() => setEditorTab("raw")}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                      editorTab === "raw"
                        ? "text-accent"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                    title="Edit the raw CSS source — this is stored in Supabase and served via the API"
                  >
                    Raw CSS
                    {editorTab === "raw" && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab("minified")}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                      editorTab === "minified"
                        ? "text-accent"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                    title="Preview the minified output — this is what gets served when ?minified=true"
                  >
                    Minified Preview
                    {editorTab === "minified" && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                    )}
                  </button>
                  {editorTab === "minified" && (
                    <span className="ml-auto mr-4 text-xs text-text-dim">
                      {minifiedEntryCSS.length} chars
                      {editorContent.length > 0 && (
                        <> ({Math.round((1 - minifiedEntryCSS.length / editorContent.length) * 100)}% smaller)</>
                      )}
                    </span>
                  )}
                </div>

                {/* Code editor — raw or minified preview */}
                <div className="flex-1 min-h-0">
                  {editorTab === "raw" ? (
                    <CodeEditor
                      value={editorContent}
                      onChange={handleEditorChange}
                      language="css"
                      height="100%"
                      onSave={handleSave}
                      minimap={false}
                    />
                  ) : (
                    <CodeEditor
                      value={minifiedEntryCSS}
                      language="css"
                      height="100%"
                      readOnly
                      minimap={false}
                      filename="minified output (read-only)"
                    />
                  )}
                </div>

                {/* Copy toolbar */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border bg-surface/50 overflow-x-auto">
                  <span className="text-xs text-text-dim uppercase tracking-wider mr-1 flex-shrink-0 cursor-help" title="Copy this entry's CSS in different formats">Copy:</span>
                  <CopyButton
                    label="Minified + Tags"
                    getText={() => wrapInStyleTags(minifyCSS(editorContent))}
                  />
                  <CopyButton
                    label="Minified"
                    getText={() => minifyCSS(editorContent)}
                  />
                  <CopyButton
                    label="Raw"
                    getText={() => editorContent}
                  />
                  <span className="text-border mx-1 flex-shrink-0">|</span>
                  <span className="text-xs text-text-dim uppercase tracking-wider mr-1 flex-shrink-0 cursor-help" title="Copy all entries in this group combined">Group:</span>
                  <CopyButton
                    label="Group + Tags"
                    getText={() => wrapInStyleTags(minifyCSS(getGroupCSS()))}
                    variant="outline"
                  />
                  <CopyButton
                    label="Group Combined"
                    getText={() => minifyCSS(getGroupCSS())}
                    variant="outline"
                  />
                </div>

                {/* Backup panel */}
                <BackupPanel backups={backups} onRestore={handleRestore} />
              </>
            ) : selectedGroup ? (
              <>
                {/* Group header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent font-medium">
                      {selectedGroup}
                    </span>
                    <span className="text-sm font-medium text-text-primary">
                      Combined ({selectedGroupEntryCount} {selectedGroupEntryCount === 1 ? "entry" : "entries"})
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => rebuildGroupMinified(selectedGroup)}
                    disabled={syncStatus === "saving"}
                    title="Re-minify each entry individually, then rebuild the combined minified CSS stored in the css_groups table for fast API serving"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Rebuild Minified
                  </Button>
                </div>

                {/* Group editor tabs */}
                <div className="flex items-center border-b border-border bg-surface/30">
                  <button
                    type="button"
                    onClick={() => setEditorTab("raw")}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                      editorTab === "raw"
                        ? "text-accent"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                    title="View the combined raw CSS from all entries in this group"
                  >
                    Combined Raw
                    {editorTab === "raw" && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab("minified")}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                      editorTab === "minified"
                        ? "text-accent"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                    title="Preview the minified combined output — this is cached in the css_groups table and served via the API"
                  >
                    Minified Preview
                    {editorTab === "minified" && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                    )}
                  </button>
                  {editorTab === "minified" && (
                    <span className="ml-auto mr-4 text-xs text-text-dim">
                      {minifiedGroupCSS.length} chars
                      {combinedGroupCSS.length > 0 && (
                        <> ({Math.round((1 - minifiedGroupCSS.length / combinedGroupCSS.length) * 100)}% smaller)</>
                      )}
                    </span>
                  )}
                </div>

                {/* Read-only combined editor */}
                <div className="flex-1 min-h-0">
                  {editorTab === "raw" ? (
                    <CodeEditor
                      value={combinedGroupCSS}
                      language="css"
                      height="100%"
                      readOnly
                      minimap={false}
                    />
                  ) : (
                    <CodeEditor
                      value={minifiedGroupCSS}
                      language="css"
                      height="100%"
                      readOnly
                      minimap={false}
                      filename="minified combined output (read-only)"
                    />
                  )}
                </div>

                {/* API info bar */}
                <div className="flex items-center gap-2 px-4 py-2 border-t border-border bg-surface/30">
                  <svg className="w-3.5 h-3.5 text-text-dim flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-text-dim">
                    <span className="font-medium text-text-muted">API:</span>{" "}
                    <code className="px-1 py-0.5 rounded bg-background font-mono text-[11px]">/api/css?group={selectedGroup}&combined=true&minified=true</code>{" "}
                    serves pre-cached minified CSS from the <code className="px-1 py-0.5 rounded bg-background font-mono text-[11px]">css_groups</code> table.
                  </p>
                </div>

                {/* Group copy toolbar */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border bg-surface/50 overflow-x-auto">
                  <span className="text-xs text-text-dim uppercase tracking-wider mr-1 flex-shrink-0">Copy:</span>
                  <CopyButton
                    label="Minified + Tags"
                    getText={() => wrapInStyleTags(minifiedGroupCSS)}
                  />
                  <CopyButton
                    label="Minified"
                    getText={() => minifiedGroupCSS}
                  />
                  <CopyButton
                    label="Raw"
                    getText={() => combinedGroupCSS}
                  />
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
                      d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
                    />
                  </svg>
                  <h2 className="font-serif text-xl text-text-primary mb-2">Select an entry or group</h2>
                  <p className="text-text-muted text-sm mb-4">
                    Click a <strong className="text-text-primary">group name</strong> in the sidebar to view combined CSS, or an <strong className="text-text-primary">entry</strong> to edit it.
                  </p>
                  <div className="text-left text-xs text-text-dim space-y-2 p-3 rounded-lg border border-border bg-surface/30">
                    <p className="font-medium text-text-muted uppercase tracking-wider mb-1">How it works</p>
                    <p>Each entry stores raw CSS. On save, it is minified and cached.</p>
                    <p>Clicking a group shows all entries combined. Use <strong className="text-text-muted">Rebuild Minified</strong> to re-minify everything and update the <code className="px-1 py-0.5 rounded bg-background font-mono">css_groups</code> cache.</p>
                    <p>The API at <code className="px-1 py-0.5 rounded bg-background font-mono">/api/css</code> serves pre-cached minified CSS for fast delivery.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* New Entry Modal */}
      <Modal
        open={showNewEntryModal}
        onClose={() => setShowNewEntryModal(false)}
        title="New CSS Entry"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Name</label>
            <input
              type="text"
              value={newEntryName}
              onChange={(e) => setNewEntryName(e.target.value)}
              placeholder="e.g. header-styles"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/50"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Group</label>
            {!useNewGroup ? (
              <div className="space-y-2">
                {groupNames.length > 0 ? (
                  <select
                    value={newEntryGroup}
                    onChange={(e) => setNewEntryGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent/50"
                  >
                    <option value="">Select a group...</option>
                    {groupNames.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                ) : null}
                <button
                  type="button"
                  onClick={() => setUseNewGroup(true)}
                  className="text-sm text-accent hover:text-accent-hover transition-colors"
                >
                  + Create new group
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newGroupInput}
                  onChange={(e) => setNewGroupInput(e.target.value)}
                  placeholder="e.g. global"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/50"
                />
                {groupNames.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setUseNewGroup(false);
                      setNewGroupInput("");
                    }}
                    className="text-sm text-text-muted hover:text-text-primary transition-colors"
                  >
                    Use existing group
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowNewEntryModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateEntry}
              disabled={!newEntryName.trim() || (!newEntryGroup && !newGroupInput.trim())}
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
          Are you sure you want to delete <strong className="text-text-primary">{selectedEntry?.name}</strong>?
          This will also delete all backups. This action cannot be undone.
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

export default function CSSManagerPage() {
  return (
    <ProtectedRoute>
      <CSSManagerContent />
    </ProtectedRoute>
  );
}
