"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { createClient } from "@/lib/supabase/client";
import {
  Button,
  Spinner,
  GridBackground,
  PageTransition,
  CursorGlow,
} from "@/components/ui";
import Navbar from "@/components/layout/Navbar";

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
// MARKDOWN RENDERER (lightweight)
// ════════════════════════════════════════════════════════════

function renderMarkdown(md: string): string {
  return md
    // Code blocks (```lang ... ```)
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
      const escaped = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `<pre class="bg-black/30 border border-border rounded-lg p-4 overflow-x-auto mb-4"><code class="text-sm font-mono text-text-primary" data-lang="${lang}">${escaped}</code></pre>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-black/20 text-accent px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    // H1
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-serif font-bold text-text-primary mt-8 mb-3">$1</h1>')
    // H2
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-serif font-semibold text-text-primary mt-8 mb-3 pb-2 border-b border-border">$1</h2>')
    // H3
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-medium text-text-primary mt-6 mb-2">$1</h3>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-text-primary">$1</strong>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="border-border my-6" />')
    // List items
    .replace(/^- (.+)$/gm, '<li class="text-text-muted ml-4 mb-1">$1</li>')
    // Paragraphs (lines with content that aren't tags)
    .replace(/^(?!<[hluopr])((?!<).+)$/gm, '<p class="text-text-muted leading-relaxed mb-3">$1</p>')
    // Wrap consecutive <li> in <ul>
    .replace(
      /(<li[^>]*>.*?<\/li>\n?)+/g,
      (match) => `<ul class="list-disc mb-4">${match}</ul>`
    );
}

// ════════════════════════════════════════════════════════════
// SECTION NAV
// ════════════════════════════════════════════════════════════

function extractHeadings(md: string): { level: number; text: string; id: string }[] {
  const headings: { level: number; text: string; id: string }[] = [];
  const lines = md.split("\n");
  for (const line of lines) {
    const match = line.match(/^(#{1,3}) (.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      headings.push({ level, text, id });
    }
  }
  return headings;
}

// ════════════════════════════════════════════════════════════
// MAIN CONTENT
// ════════════════════════════════════════════════════════════

function AttrDocsContent() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [mode, setMode] = useState<"edit" | "preview" | "split">("split");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // ── Fetch ───────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("attr_docs")
        .select("content")
        .eq("id", "main")
        .single();

      if (data) {
        setContent(data.content);
      }
      setLoading(false);
    }
    load();
  }, []);

  // ── Save ────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSyncStatus("saving");
    const supabase = createClient();

    const { error } = await supabase
      .from("attr_docs")
      .upsert({
        id: "main",
        content,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Save error:", error);
      setSyncStatus("error");
      return;
    }

    setIsDirty(false);
    setSyncStatus("saved");
    setTimeout(() => setSyncStatus("idle"), 2000);
  }, [content]);

  // ── Keyboard shortcuts ─────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (isDirty) handleSave();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDirty, handleSave]);

  // ── Copy section ────────────────────────────────────────
  const copySection = useCallback(
    (heading: string) => {
      const lines = content.split("\n");
      let capturing = false;
      const sectionLines: string[] = [];
      const headingLevel = heading.startsWith("## ") ? 2 : heading.startsWith("### ") ? 3 : 1;

      for (const line of lines) {
        const match = line.match(/^(#{1,3}) /);
        if (match && line.includes(heading.replace(/^#+\s*/, ""))) {
          capturing = true;
          sectionLines.push(line);
          continue;
        }
        if (capturing) {
          if (match && match[1].length <= headingLevel) break;
          sectionLines.push(line);
        }
      }

      navigator.clipboard.writeText(sectionLines.join("\n").trim());
      setActiveSection(heading);
      setTimeout(() => setActiveSection(null), 1500);
    },
    [content]
  );

  // ── Headings ────────────────────────────────────────────
  const headings = extractHeadings(content);

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
              <h1 className="font-serif text-lg font-medium text-text-primary">@hsfx/attr Docs</h1>
              {isDirty && <span className="text-[10px] text-yellow-500 font-medium">Unsaved</span>}
            </div>

            <div className="flex items-center gap-3">
              {/* Mode toggle */}
              <div className="flex bg-black/20 rounded-md border border-border overflow-hidden">
                {(["edit", "split", "preview"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3 py-1 text-[11px] font-medium transition-colors ${
                      mode === m
                        ? "bg-accent/20 text-accent"
                        : "text-text-dim hover:text-text-muted"
                    }`}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>

              <SyncIndicator status={syncStatus} />

              <Button size="sm" onClick={handleSave} disabled={!isDirty || syncStatus === "saving"}>
                Save
              </Button>
            </div>
          </div>
        </header>

        {/* Main layout */}
        <div className="flex h-[calc(100vh-8.5rem)]">
          {/* Section nav sidebar */}
          <div className="w-56 shrink-0 bg-surface border-r border-border overflow-y-auto p-3">
            <p className="text-[10px] text-text-dim uppercase tracking-wider mb-3">Sections</p>
            <div className="space-y-0.5">
              {headings.map((h) => (
                <button
                  key={h.id}
                  onClick={() => copySection(`${"#".repeat(h.level)} ${h.text}`)}
                  className={`w-full text-left px-2 py-1.5 rounded text-[11px] transition-colors ${
                    activeSection?.includes(h.text)
                      ? "bg-green-500/20 text-green-400"
                      : "text-text-muted hover:text-text-primary hover:bg-white/5"
                  }`}
                  style={{ paddingLeft: `${(h.level - 1) * 12 + 8}px` }}
                  title="Click to copy section"
                >
                  {activeSection?.includes(h.text) ? "Copied!" : h.text}
                </button>
              ))}
            </div>
          </div>

          {/* Editor / Preview */}
          <div className="flex-1 flex min-w-0 overflow-hidden">
            {/* Editor pane */}
            {(mode === "edit" || mode === "split") && (
              <div className={`flex flex-col ${mode === "split" ? "w-1/2 border-r border-border" : "flex-1"}`}>
                <div className="px-3 py-1.5 border-b border-border bg-surface">
                  <span className="text-[10px] text-text-dim uppercase tracking-wider">Markdown</span>
                </div>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setIsDirty(true);
                  }}
                  className="flex-1 w-full p-4 bg-background text-text-primary font-mono text-sm
                    leading-relaxed resize-none focus:outline-none placeholder:text-text-dim"
                  placeholder="Write your markdown documentation here..."
                  spellCheck={false}
                />
              </div>
            )}

            {/* Preview pane */}
            {(mode === "preview" || mode === "split") && (
              <div className={`flex flex-col ${mode === "split" ? "w-1/2" : "flex-1"}`}>
                <div className="px-3 py-1.5 border-b border-border bg-surface">
                  <span className="text-[10px] text-text-dim uppercase tracking-wider">Preview</span>
                </div>
                <div
                  ref={previewRef}
                  className="flex-1 overflow-y-auto p-6 bg-background"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </PageTransition>
  );
}

// ════════════════════════════════════════════════════════════
// PAGE EXPORT
// ════════════════════════════════════════════════════════════

export default function AttrDocsPage() {
  return (
    <ProtectedRoute>
      <AttrDocsContent />
    </ProtectedRoute>
  );
}
