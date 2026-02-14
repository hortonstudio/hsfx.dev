"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import type { IconEntry } from "@/lib/icon-manager/types";

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
// SVG PREVIEW
// ════════════════════════════════════════════════════════════

function SvgPreview({ svg, size = "md" }: { svg: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-24 h-24",
  }[size];

  return (
    <div
      className={`${sizeClass} text-text-secondary [&>svg]:w-full [&>svg]:h-full`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

// ════════════════════════════════════════════════════════════
// GROUP FILTER BAR
// ════════════════════════════════════════════════════════════

function GroupFilterBar({
  groups,
  activeGroup,
  counts,
  onSelect,
}: {
  groups: string[];
  activeGroup: string | null;
  counts: Map<string, number>;
  onSelect: (group: string | null) => void;
}) {
  const total = Array.from(counts.values()).reduce((sum, n) => sum + n, 0);

  return (
    <div className="flex gap-1.5 px-4 py-2.5 border-b border-border overflow-x-auto">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
          activeGroup === null
            ? "bg-accent/20 text-accent font-medium"
            : "text-text-muted hover:text-text-primary hover:bg-surface"
        }`}
      >
        All ({total})
      </button>
      {groups.map((g) => (
        <button
          key={g}
          type="button"
          onClick={() => onSelect(g)}
          className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
            activeGroup === g
              ? "bg-accent/20 text-accent font-medium"
              : "text-text-muted hover:text-text-primary hover:bg-surface"
          }`}
        >
          {g} ({counts.get(g) || 0})
        </button>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ICON CARD
// ════════════════════════════════════════════════════════════

function IconCard({ icon, onClick }: { icon: IconEntry; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square flex items-center justify-center p-4 rounded-lg border border-border hover:border-accent/50 hover:bg-surface/50 transition-all"
      title={`${icon.name} (${icon.group_name})`}
    >
      <SvgPreview svg={icon.svg_content} size="sm" />
      <span className="absolute bottom-1 left-1 right-1 text-[10px] text-text-dim truncate text-center opacity-0 group-hover:opacity-100 transition-opacity">
        {icon.name}
      </span>
    </button>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN CONTENT
// ════════════════════════════════════════════════════════════

function IconManagerContent() {
  // Data
  const [icons, setIcons] = useState<IconEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit modal
  const [editingIcon, setEditingIcon] = useState<IconEntry | null>(null);
  const [editSvg, setEditSvg] = useState("");
  const [editName, setEditName] = useState("");
  const [editGroup, setEditGroup] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // New modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [newGroupInput, setNewGroupInput] = useState("");
  const [useNewGroup, setUseNewGroup] = useState(false);
  const [newSvg, setNewSvg] = useState("");

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Sync
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

  // Upload & drag-drop
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadPreview, setUploadPreview] = useState<{ name: string; group: string; svg: string }[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  // Derived data
  const groupCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const icon of icons) {
      map.set(icon.group_name, (map.get(icon.group_name) || 0) + 1);
    }
    return map;
  }, [icons]);

  const groupNames = useMemo(
    () => Array.from(groupCounts.keys()).sort(),
    [groupCounts]
  );

  const filteredIcons = useMemo(() => {
    return icons.filter((icon) => {
      const matchesGroup = !activeGroup || icon.group_name === activeGroup;
      const matchesSearch =
        !searchQuery || icon.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesGroup && matchesSearch;
    });
  }, [icons, activeGroup, searchQuery]);

  const uploadGroupCounts = useMemo(() => {
    if (!uploadPreview) return null;
    const map = new Map<string, number>();
    for (const item of uploadPreview) {
      map.set(item.group, (map.get(item.group) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [uploadPreview]);

  // ── Fetch ──────────────────────────────────────────────
  const fetchIcons = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("icons")
      .select("*")
      .order("group_name")
      .order("sort_order")
      .order("name");

    if (error) {
      console.error("Error fetching icons:", error);
      setLoading(false);
      return;
    }

    setIcons(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchIcons();
  }, [fetchIcons]);

  // ── Open edit modal ────────────────────────────────────
  const openEditor = (icon: IconEntry) => {
    setEditingIcon(icon);
    setEditSvg(icon.svg_content);
    setEditName(icon.name);
    setEditGroup(icon.group_name);
    setHasUnsavedChanges(false);
    setSyncStatus("idle");
  };

  const closeEditor = () => {
    setEditingIcon(null);
    setEditSvg("");
    setEditName("");
    setEditGroup("");
    setHasUnsavedChanges(false);
  };

  // ── Save existing icon ─────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!editingIcon) return;

    setSyncStatus("saving");

    const supabase = createClient();
    const { error } = await supabase
      .from("icons")
      .update({
        svg_content: editSvg,
        name: editName.trim(),
        group_name: editGroup.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingIcon.id);

    if (error) {
      console.error("Save error:", error);
      setSyncStatus("error");
      return;
    }

    setIcons((prev) =>
      prev.map((i) =>
        i.id === editingIcon.id
          ? {
              ...i,
              svg_content: editSvg,
              name: editName.trim(),
              group_name: editGroup.trim(),
              updated_at: new Date().toISOString(),
            }
          : i
      )
    );
    setEditingIcon((prev) =>
      prev ? { ...prev, svg_content: editSvg, name: editName.trim(), group_name: editGroup.trim() } : null
    );
    setHasUnsavedChanges(false);
    setSyncStatus("saved");
    setTimeout(() => setSyncStatus("idle"), 2000);
  }, [editingIcon, editSvg, editName, editGroup]);

  // ── Create icon ────────────────────────────────────────
  const handleCreate = async () => {
    const groupName = useNewGroup ? newGroupInput.trim() : newGroup;
    const name = newName.trim();
    if (!name || !groupName || !newSvg.trim()) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("icons")
      .insert({ name, group_name: groupName, svg_content: newSvg })
      .select()
      .single();

    if (error) {
      console.error("Create error:", error);
      return;
    }

    setIcons((prev) => [...prev, data]);
    setShowNewModal(false);
    setNewName("");
    setNewGroup("");
    setNewGroupInput("");
    setUseNewGroup(false);
    setNewSvg("");
    // Open the newly created icon in editor
    openEditor(data);
  };

  // ── Delete icon ────────────────────────────────────────
  const handleDelete = async () => {
    if (!editingIcon) return;

    const supabase = createClient();
    const { error } = await supabase.from("icons").delete().eq("id", editingIcon.id);

    if (error) {
      console.error("Delete error:", error);
      return;
    }

    setIcons((prev) => prev.filter((i) => i.id !== editingIcon.id));
    setShowDeleteModal(false);
    closeEditor();
  };

  // ── File upload ──────────────────────────────────────
  useEffect(() => {
    fileInputRef.current?.setAttribute("webkitdirectory", "");
  }, []);

  const parseSvgFiles = (files: { name: string; path: string; content: string }[]) => {
    const parsed: { name: string; group: string; svg: string }[] = [];
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith(".svg")) continue;
      const parts = file.path.split("/");
      const fileName = parts[parts.length - 1].replace(/\.svg$/i, "");
      const groupName = parts.length >= 2 ? parts[parts.length - 2] : "ungrouped";
      parsed.push({ name: fileName, group: groupName, svg: file.content });
    }
    return parsed;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: { name: string; path: string; content: string }[] = [];
    for (const file of Array.from(files)) {
      const content = await file.text();
      fileList.push({ name: file.name, path: file.webkitRelativePath || file.name, content });
    }

    const parsed = parseSvgFiles(fileList);
    if (parsed.length > 0) setUploadPreview(parsed);
    e.target.value = "";
  };

  const handleUploadConfirm = async () => {
    if (!uploadPreview || uploadPreview.length === 0) return;

    const supabase = createClient();
    const rows = uploadPreview.map((icon) => ({
      name: icon.name,
      group_name: icon.group,
      svg_content: icon.svg,
    }));

    const { error } = await supabase
      .from("icons")
      .upsert(rows, { onConflict: "group_name,name" });

    if (error) {
      console.error("Upload error:", error);
      return;
    }

    setUploadPreview(null);
    fetchIcons();
  };

  // ── Drag & drop ────────────────────────────────────
  interface FileEntry {
    isFile: boolean;
    isDirectory: boolean;
    name: string;
    fullPath: string;
    file: (cb: (f: File) => void) => void;
    createReader: () => { readEntries: (cb: (entries: FileEntry[]) => void) => void };
  }

  const traverseFileTree = async (entry: FileEntry, path = ""): Promise<{ name: string; path: string; content: string }[]> => {
    if (entry.isFile) {
      return new Promise((resolve) => {
        entry.file(async (file) => {
          const content = await file.text();
          resolve([{ name: file.name, path: path + file.name, content }]);
        });
      });
    }
    if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const entries = await new Promise<FileEntry[]>((resolve) => {
        dirReader.readEntries((entries) => resolve(entries));
      });
      const results: { name: string; path: string; content: string }[] = [];
      for (const child of entries) {
        const childResults = await traverseFileTree(child, path + entry.name + "/");
        results.push(...childResults);
      }
      return results;
    }
    return [];
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    const allFiles: { name: string; path: string; content: string }[] = [];
    for (const item of Array.from(items)) {
      const entry = item.webkitGetAsEntry?.() as FileEntry | null;
      if (entry) {
        const files = await traverseFileTree(entry);
        allFiles.push(...files);
      }
    }

    const parsed = parseSvgFiles(allFiles);
    if (parsed.length > 0) setUploadPreview(parsed);
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

      <main
        className="min-h-screen pt-16 md:pt-20 relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
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
              <h1 className="font-serif text-lg font-medium text-text-primary">Icon Manager</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <svg
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search icons..."
                  className="pl-8 pr-3 py-1.5 w-48 text-sm bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/50"
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Folder
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowNewModal(true)}>
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Icon
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                multiple
                accept=".svg"
              />
            </div>
          </div>
        </header>

        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-dashed border-accent/50 bg-accent/5">
              <svg className="w-12 h-12 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-accent font-medium">Drop SVG folder here</p>
              <p className="text-text-muted text-sm">Folder structure determines groups</p>
            </div>
          </div>
        )}

        {/* Group filter tabs */}
        <GroupFilterBar
          groups={groupNames}
          activeGroup={activeGroup}
          counts={groupCounts}
          onSelect={setActiveGroup}
        />

        {/* Icon grid */}
        <div className="p-4">
          {filteredIcons.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
              {filteredIcons.map((icon) => (
                <IconCard key={icon.id} icon={icon} onClick={() => openEditor(icon)} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <svg
                className="w-16 h-16 text-text-dim mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z"
                />
              </svg>
              <h2 className="font-serif text-xl text-text-primary mb-2">
                {searchQuery || activeGroup ? "No icons match" : "No icons yet"}
              </h2>
              <p className="text-text-muted text-sm max-w-xs">
                {searchQuery || activeGroup
                  ? "Try adjusting your search or filter"
                  : "Create your first icon to get started"}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* ═══ Edit Icon Modal ═══ */}
      <Modal
        open={!!editingIcon}
        onClose={closeEditor}
        title={editingIcon ? `Edit: ${editingIcon.name}` : "Edit Icon"}
        size="xl"
      >
        {editingIcon && (
          <div className="space-y-4">
            {/* Name + Group + Preview row */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-20 h-20 flex items-center justify-center rounded-lg border border-border bg-background">
                <SvgPreview svg={editSvg} size="lg" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-text-dim mb-1">Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => {
                        setEditName(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent/50"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-text-dim mb-1">Group</label>
                    <input
                      type="text"
                      value={editGroup}
                      onChange={(e) => {
                        setEditGroup(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent/50"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <SyncIndicator status={syncStatus} />
                  <div className="flex-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={!hasUnsavedChanges || syncStatus === "saving"}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>

            {/* SVG Editor */}
            <CodeEditor
              value={editSvg}
              onChange={(val) => {
                setEditSvg(val);
                setHasUnsavedChanges(true);
              }}
              language="svg"
              height={350}
              onSave={handleSave}
            />
          </div>
        )}
      </Modal>

      {/* ═══ New Icon Modal ═══ */}
      <Modal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="New Icon"
        size="xl"
      >
        <div className="space-y-4">
          {/* Preview + fields */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-20 h-20 flex items-center justify-center rounded-lg border border-border bg-background">
              {newSvg.trim() ? (
                <SvgPreview svg={newSvg} size="lg" />
              ) : (
                <span className="text-xs text-text-dim">Preview</span>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-dim mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. arrow-right"
                  className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/50"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-dim mb-1">Group</label>
                {!useNewGroup ? (
                  <div className="space-y-1.5">
                    {groupNames.length > 0 && (
                      <select
                        value={newGroup}
                        onChange={(e) => setNewGroup(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-accent/50"
                      >
                        <option value="">Select a group...</option>
                        {groupNames.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={() => setUseNewGroup(true)}
                      className="text-xs text-accent hover:text-accent-hover transition-colors"
                    >
                      + Create new group
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={newGroupInput}
                      onChange={(e) => setNewGroupInput(e.target.value)}
                      placeholder="e.g. arrows"
                      className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/50"
                    />
                    {groupNames.length > 0 && (
                      <button
                        type="button"
                        onClick={() => { setUseNewGroup(false); setNewGroupInput(""); }}
                        className="text-xs text-text-muted hover:text-text-primary transition-colors"
                      >
                        Use existing group
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SVG Code Editor */}
          <CodeEditor
            value={newSvg}
            onChange={setNewSvg}
            language="svg"
            height={300}
          />

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setShowNewModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!newName.trim() || (!newGroup && !newGroupInput.trim()) || !newSvg.trim()}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* ═══ Delete Confirmation ═══ */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Icon"
        size="sm"
      >
        <p className="text-sm text-text-muted mb-4">
          Are you sure you want to delete <strong className="text-text-primary">{editingIcon?.name}</strong>?
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
          >
            Delete
          </button>
        </div>
      </Modal>

      {/* ═══ Upload Preview Modal ═══ */}
      <Modal
        open={!!uploadPreview}
        onClose={() => setUploadPreview(null)}
        title="Upload Icons"
        size="sm"
      >
        {uploadPreview && uploadGroupCounts && (
          <div className="space-y-3">
            <p className="text-sm text-text-muted">
              Found <strong className="text-text-primary">{uploadPreview.length}</strong> SVG files in{" "}
              <strong className="text-text-primary">{uploadGroupCounts.length}</strong> groups:
            </p>
            <ul className="space-y-1.5">
              {uploadGroupCounts.map(([group, count]) => (
                <li key={group} className="flex items-center gap-2 text-sm">
                  <span className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent font-medium">{group}</span>
                  <span className="text-text-dim">{count} {count === 1 ? "icon" : "icons"}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-text-dim">
              Existing icons with the same name and group will be updated.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setUploadPreview(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleUploadConfirm}>
                Upload All
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}

// ════════════════════════════════════════════════════════════
// PAGE EXPORT
// ════════════════════════════════════════════════════════════

export default function IconManagerPage() {
  return (
    <ProtectedRoute>
      <IconManagerContent />
    </ProtectedRoute>
  );
}
