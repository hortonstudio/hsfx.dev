"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { createClient } from "@/lib/supabase/client";
import {
  Button,
  Spinner,
  GridBackground,
  PageTransition,
  CursorGlow,
  useToast,
} from "@/components/ui";
import Navbar from "@/components/layout/Navbar";

// ════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════

interface Prompt {
  id: string;
  content: string;
}

// ════════════════════════════════════════════════════════════
// PROMPT CARD
// ════════════════════════════════════════════════════════════

function PromptCard({
  prompt,
  onSave,
  onCopy,
}: {
  prompt: Prompt;
  onSave: (id: string, content: string) => Promise<void>;
  onCopy: (content: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(prompt.content);
  const [saving, setSaving] = useState(false);

  // Sync local content when prompt prop changes (e.g. after save)
  useEffect(() => {
    setEditContent(prompt.content);
  }, [prompt.content]);

  const handleEdit = () => {
    setExpanded(true);
    setEditing(true);
    setEditContent(prompt.content);
  };

  const handleCancel = () => {
    setEditing(false);
    setEditContent(prompt.content);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(prompt.id, editContent);
    setSaving(false);
    setEditing(false);
  };

  const lineCount = prompt.content.split("\n").length;

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 text-left flex-1 min-w-0"
        >
          <svg
            className={`w-4 h-4 text-text-dim flex-shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-text-primary font-mono truncate">
              {prompt.id}
            </h3>
            <p className="text-xs text-text-dim mt-0.5">
              {lineCount} {lineCount === 1 ? "line" : "lines"} &middot;{" "}
              {prompt.content.length.toLocaleString()} chars
            </p>
          </div>
        </button>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
          <Button variant="ghost" size="sm" onClick={() => onCopy(prompt.content)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </Button>
          {!editing ? (
            <Button variant="ghost" size="sm" onClick={handleEdit}>
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
              </svg>
              Edit
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Spinner size="sm" />
                    <span className="ml-1">Saving...</span>
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Collapsible content area */}
      {expanded && (
        <div className="border-t border-border">
          {editing ? (
            <textarea
              data-lenis-prevent
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full min-h-[300px] max-h-[600px] px-5 py-4 bg-background text-text-primary text-sm font-mono leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-accent/30"
              spellCheck={false}
            />
          ) : (
            <pre
              data-lenis-prevent
              className="w-full max-h-[500px] overflow-y-auto px-5 py-4 bg-background text-text-muted text-sm font-mono leading-relaxed whitespace-pre-wrap break-words"
            >
              {prompt.content}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// NEW PROMPT FORM
// ════════════════════════════════════════════════════════════

function NewPromptForm({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (id: string, content: string) => Promise<void>;
}) {
  const [id, setId] = useState("");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);

  const handleSubmit = async () => {
    if (!id.trim() || !content.trim()) return;
    setCreating(true);
    await onCreate(id.trim(), content.trim());
    setCreating(false);
  };

  return (
    <div className="bg-surface border border-accent/30 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-accent/5">
        <h3 className="text-sm font-medium text-accent">New Prompt</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-dim mb-1.5">Prompt ID</label>
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="e.g. mockup-generator"
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary font-mono placeholder:text-text-dim focus:outline-none focus:border-accent/50"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-dim mb-1.5">Content</label>
          <textarea
            data-lenis-prevent
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter the prompt content..."
            className="w-full min-h-[200px] max-h-[400px] px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary font-mono leading-relaxed placeholder:text-text-dim resize-y focus:outline-none focus:border-accent/50"
            spellCheck={false}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!id.trim() || !content.trim() || creating}
          >
            {creating ? (
              <>
                <Spinner size="sm" />
                <span className="ml-1">Creating...</span>
              </>
            ) : (
              "Create Prompt"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN CONTENT
// ════════════════════════════════════════════════════════════

function PromptsContent() {
  const { addToast } = useToast();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Fetch all prompts ──────────────────────────────────
  const fetchPrompts = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("prompts")
      .select("*")
      .order("id");

    if (error) {
      console.error("Error fetching prompts:", error);
      addToast({ variant: "error", title: "Failed to load prompts" });
      setLoading(false);
      return;
    }

    setPrompts(data || []);
    setLoading(false);
  }, [addToast]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  // ── Update prompt ──────────────────────────────────────
  const handleSave = async (id: string, content: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("prompts")
      .update({ content })
      .eq("id", id);

    if (error) {
      console.error("Save error:", error);
      addToast({ variant: "error", title: "Failed to save prompt" });
      return;
    }

    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, content } : p))
    );
    addToast({ variant: "success", title: `Prompt "${id}" saved` });
  };

  // ── Create prompt ──────────────────────────────────────
  const handleCreate = async (id: string, content: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("prompts")
      .insert({ id, content })
      .select()
      .single();

    if (error) {
      console.error("Create error:", error);
      addToast({
        variant: "error",
        title: error.code === "23505" ? `Prompt "${id}" already exists` : "Failed to create prompt",
      });
      return;
    }

    setPrompts((prev) => [...prev, data].sort((a, b) => a.id.localeCompare(b.id)));
    setShowNewForm(false);
    addToast({ variant: "success", title: `Prompt "${id}" created` });
  };

  // ── Copy to clipboard ─────────────────────────────────
  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
    addToast({ variant: "success", title: "Copied to clipboard" });
  };

  // ── Filtered prompts ──────────────────────────────────
  const filteredPrompts = prompts.filter(
    (p) =>
      !searchQuery ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <h1 className="font-serif text-lg font-medium text-text-primary">AI Prompts</h1>
              <span className="text-xs text-text-dim bg-surface px-2 py-0.5 rounded-full">
                {prompts.length} {prompts.length === 1 ? "prompt" : "prompts"}
              </span>
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
                  placeholder="Search prompts..."
                  className="pl-8 pr-3 py-1.5 w-48 text-sm bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent/50"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewForm(true)}
                disabled={showNewForm}
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Prompt
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {/* New Prompt Form */}
          {showNewForm && (
            <NewPromptForm
              onClose={() => setShowNewForm(false)}
              onCreate={handleCreate}
            />
          )}

          {/* Prompt Cards */}
          {filteredPrompts.length > 0 ? (
            filteredPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onSave={handleSave}
                onCopy={handleCopy}
              />
            ))
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
                  d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
              <h2 className="font-serif text-xl text-text-primary mb-2">
                {searchQuery ? "No prompts match" : "No prompts yet"}
              </h2>
              <p className="text-text-muted text-sm max-w-xs">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Create your first prompt to get started"}
              </p>
            </div>
          )}
        </div>
      </main>
    </PageTransition>
  );
}

// ════════════════════════════════════════════════════════════
// PAGE EXPORT
// ════════════════════════════════════════════════════════════

export default function PromptsPage() {
  return (
    <ProtectedRoute>
      <PromptsContent />
    </ProtectedRoute>
  );
}
