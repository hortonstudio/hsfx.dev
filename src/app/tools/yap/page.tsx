"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { createClient } from "@/lib/supabase/client";
import { Button, Spinner } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";

// ════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════

interface ComponentSummary {
  slug: string;
  name: string;
  group: string | null;
}

interface YapData {
  id?: string;
  component_slug: string;
  what_is_it: string;
  when_to_use: string;
  how_to_use: string;
  gotchas: string;
  raw_notes: string;
  status: "draft" | "processing" | "published";
  updated_at?: string;
}

type YapField = "what_is_it" | "when_to_use" | "how_to_use" | "gotchas" | "raw_notes";

const QUESTIONS: { field: YapField; question: string; placeholder: string }[] = [
  {
    field: "what_is_it",
    question: "What is this component?",
    placeholder: "Describe what this component is and what it does...",
  },
  {
    field: "when_to_use",
    question: "When should someone use it?",
    placeholder: "When is this the right component to reach for? What problems does it solve?",
  },
  {
    field: "how_to_use",
    question: "How do you use it?",
    placeholder: "Common patterns, prop combinations, typical setups...",
  },
  {
    field: "gotchas",
    question: "Any gotchas or warnings?",
    placeholder: "Edge cases, accessibility concerns, performance notes, things to watch out for...",
  },
  {
    field: "raw_notes",
    question: "Anything else?",
    placeholder: "Any other notes, thoughts, or context that might be helpful...",
  },
];

const EMPTY_YAP: Omit<YapData, "component_slug"> = {
  what_is_it: "",
  when_to_use: "",
  how_to_use: "",
  gotchas: "",
  raw_notes: "",
  status: "draft",
};

// ════════════════════════════════════════════════════════════
// SYNC STATUS INDICATOR
// ════════════════════════════════════════════════════════════

type SyncStatus = "idle" | "saving" | "saved" | "error";

function SyncIndicator({ status, lastSaved }: { status: SyncStatus; lastSaved?: string }) {
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
          <span className="text-text-muted">Synced</span>
        </>
      )}
      {status === "error" && (
        <>
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-red-400">Error saving</span>
        </>
      )}
      {status === "idle" && lastSaved && (
        <>
          <div className="w-2 h-2 rounded-full bg-text-dim" />
          <span className="text-text-dim">
            {new Date(lastSaved).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PROGRESS DOTS
// ════════════════════════════════════════════════════════════

function ProgressDots({
  questions,
  currentIndex,
  yap,
  onDotClick,
}: {
  questions: typeof QUESTIONS;
  currentIndex: number;
  yap: Omit<YapData, "component_slug">;
  onDotClick: (index: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {questions.map((q, idx) => {
        const hasContent = yap[q.field]?.trim();
        const isCurrent = idx === currentIndex;
        return (
          <button
            key={q.field}
            type="button"
            onClick={() => onDotClick(idx)}
            className={`
              w-3 h-3 rounded-full transition-all
              ${isCurrent ? "scale-125" : ""}
              ${hasContent ? "bg-green-500" : isCurrent ? "bg-accent" : "bg-border"}
            `}
            aria-label={`Go to question ${idx + 1}`}
          />
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COMPONENT SELECTOR
// ════════════════════════════════════════════════════════════

function ComponentSelector({
  components,
  selectedSlug,
  yapSlugs,
  onSelect,
}: {
  components: ComponentSummary[];
  selectedSlug: string | null;
  yapSlugs: Set<string>;
  onSelect: (slug: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = components.find((c) => c.slug === selectedSlug);

  // Group by group name
  const groups = new Map<string, ComponentSummary[]>();
  for (const comp of components) {
    const group = comp.group || "Ungrouped";
    const existing = groups.get(group) || [];
    existing.push(comp);
    groups.set(group, existing);
  }
  const sortedGroups = Array.from(groups.keys()).sort();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface border border-border rounded-lg text-left"
      >
        <div className="flex items-center gap-2">
          {selected ? (
            <>
              <span className="text-text-primary font-medium">{selected.name}</span>
              {yapSlugs.has(selected.slug) && (
                <span className="w-2 h-2 rounded-full bg-green-500" />
              )}
            </>
          ) : (
            <span className="text-text-muted">Select a component...</span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[60vh] overflow-y-auto bg-surface border border-border rounded-lg shadow-xl">
            {sortedGroups.map((groupName) => {
              const groupComps = groups.get(groupName)!;
              return (
                <div key={groupName}>
                  <div className="px-3 py-2 text-xs font-medium text-text-dim uppercase tracking-wider bg-background sticky top-0">
                    {groupName}
                  </div>
                  {groupComps
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((comp) => (
                      <button
                        key={comp.slug}
                        type="button"
                        onClick={() => {
                          onSelect(comp.slug);
                          setIsOpen(false);
                        }}
                        className={`
                          w-full flex items-center justify-between px-4 py-3 text-left
                          transition-colors
                          ${comp.slug === selectedSlug
                            ? "bg-accent/20 text-accent"
                            : "text-text-secondary hover:bg-border/50"
                          }
                        `}
                      >
                        <span>{comp.name}</span>
                        {yapSlugs.has(comp.slug) && (
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                        )}
                      </button>
                    ))}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN PAGE CONTENT
// ════════════════════════════════════════════════════════════

function YapPageContent() {
  const { user } = useAuth();
  const [components, setComponents] = useState<ComponentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [yapSlugs, setYapSlugs] = useState<Set<string>>(new Set());
  const [currentYap, setCurrentYap] = useState<Omit<YapData, "component_slug">>(EMPTY_YAP);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSaved, setLastSaved] = useState<string | undefined>();
  const [freeFormMode, setFreeFormMode] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch components and existing yaps
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      // Fetch components
      const { data: comps, error: compsError } = await supabase
        .from("component_docs")
        .select("slug, name, group")
        .order("group")
        .order("name");

      if (compsError) {
        console.error("Error fetching components:", compsError);
        setLoading(false);
        return;
      }

      setComponents(comps || []);

      // Fetch existing yaps (just slugs for indicator)
      const { data: yaps } = await supabase
        .from("component_yaps")
        .select("component_slug")
        .eq("user_id", user?.id);

      if (yaps) {
        setYapSlugs(new Set(yaps.map((y) => y.component_slug)));
      }

      setLoading(false);
    }

    if (user) {
      fetchData();
    }
  }, [user]);

  // Fetch yap when component is selected
  useEffect(() => {
    async function fetchYap() {
      if (!selectedSlug || !user) return;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("component_yaps")
        .select("*")
        .eq("component_slug", selectedSlug)
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching yap:", error);
      }

      if (data) {
        setCurrentYap({
          what_is_it: data.what_is_it || "",
          when_to_use: data.when_to_use || "",
          how_to_use: data.how_to_use || "",
          gotchas: data.gotchas || "",
          raw_notes: data.raw_notes || "",
          status: data.status,
        });
        setLastSaved(data.updated_at);
      } else {
        setCurrentYap(EMPTY_YAP);
        setLastSaved(undefined);
      }
      setCurrentQuestion(0);
      setSyncStatus("idle");
    }

    fetchYap();
  }, [selectedSlug, user]);

  // Auto-focus textarea
  useEffect(() => {
    if (textareaRef.current && selectedSlug) {
      textareaRef.current.focus();
    }
  }, [selectedSlug, currentQuestion]);

  // Debounced auto-save
  const saveYap = useCallback(
    async (yapData: Omit<YapData, "component_slug">) => {
      if (!selectedSlug || !user) return;

      setSyncStatus("saving");

      const supabase = createClient();
      const { error } = await supabase.from("component_yaps").upsert(
        {
          component_slug: selectedSlug,
          user_id: user.id,
          ...yapData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "component_slug,user_id" }
      );

      if (error) {
        console.error("Error saving yap:", error);
        setSyncStatus("error");
      } else {
        setSyncStatus("saved");
        setLastSaved(new Date().toISOString());
        setYapSlugs((prev) => {
          const next = new Set(prev);
          next.add(selectedSlug);
          return next;
        });

        // Reset to idle after 2 seconds
        setTimeout(() => setSyncStatus("idle"), 2000);
      }
    },
    [selectedSlug, user]
  );

  const handleFieldChange = (field: YapField, value: string) => {
    const newYap = { ...currentYap, [field]: value };
    setCurrentYap(newYap);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save
    saveTimeoutRef.current = setTimeout(() => {
      saveYap(newYap);
    }, 500);
  };

  const currentQ = QUESTIONS[currentQuestion];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href="/tools"
            className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Back</span>
          </Link>
          <h1 className="font-serif text-lg font-medium text-text-primary">Yap Capture</h1>
          <button
            type="button"
            onClick={() => setFreeFormMode(!freeFormMode)}
            className={`text-sm px-2 py-1 rounded transition-colors ${
              freeFormMode ? "bg-accent/20 text-accent" : "text-text-muted hover:text-text-primary"
            }`}
          >
            {freeFormMode ? "Guided" : "All"}
          </button>
        </div>
      </header>

      {/* Component Selector */}
      <div className="px-4 py-3 border-b border-border">
        <ComponentSelector
          components={components}
          selectedSlug={selectedSlug}
          yapSlugs={yapSlugs}
          onSelect={setSelectedSlug}
        />
      </div>

      {/* Main Content */}
      {selectedSlug ? (
        <>
          {freeFormMode ? (
            /* Free-form mode: show all fields */
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {QUESTIONS.map((q) => (
                <div key={q.field}>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {q.question}
                  </label>
                  <textarea
                    value={currentYap[q.field]}
                    onChange={(e) => handleFieldChange(q.field, e.target.value)}
                    placeholder={q.placeholder}
                    className="w-full min-h-[120px] p-3 bg-[#0d0d0d] border border-border rounded-lg text-text-primary placeholder:text-text-dim resize-y focus:outline-none focus:border-accent/50"
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Guided mode: one question at a time */
            <div className="flex-1 flex flex-col p-4">
              <div className="mb-4">
                <h2 className="text-lg font-medium text-text-primary mb-1">{currentQ.question}</h2>
                <p className="text-sm text-text-muted">
                  Question {currentQuestion + 1} of {QUESTIONS.length}
                </p>
              </div>

              <textarea
                ref={textareaRef}
                value={currentYap[currentQ.field]}
                onChange={(e) => handleFieldChange(currentQ.field, e.target.value)}
                placeholder={currentQ.placeholder}
                className="flex-1 w-full p-4 bg-[#0d0d0d] border border-border rounded-lg text-text-primary placeholder:text-text-dim resize-none focus:outline-none focus:border-accent/50 text-base leading-relaxed"
                style={{ minHeight: "200px" }}
              />

              {/* Navigation */}
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestion === 0}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Prev
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentQuestion((prev) => Math.min(QUESTIONS.length - 1, prev + 1))}
                  disabled={currentQuestion === QUESTIONS.length - 1}
                >
                  Next
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <ProgressDots
                questions={QUESTIONS}
                currentIndex={currentQuestion}
                yap={currentYap}
                onDotClick={setCurrentQuestion}
              />
              <SyncIndicator status={syncStatus} lastSaved={lastSaved} />
            </div>
          </footer>
        </>
      ) : (
        /* No component selected */
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-4xl mb-4">
              <svg className="w-16 h-16 mx-auto text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="font-serif text-xl text-text-primary mb-2">Select a component</h2>
            <p className="text-text-muted max-w-xs mx-auto">
              Choose a component from the dropdown above to start documenting
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════

export default function YapPage() {
  return (
    <ProtectedRoute>
      <YapPageContent />
    </ProtectedRoute>
  );
}
