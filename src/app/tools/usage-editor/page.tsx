"use client";

import { useState, useEffect, useCallback } from "react";
import { marked } from "marked";

import Navbar from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/client";
import {
  GridBackground,
  PageTransition,
  CursorGlow,
  Button,
  Spinner,
  RichTextBlock,
} from "@/components/ui";

// ════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════

interface UsageData {
  description: string;
  whenToUse: string;
  patterns: string;
  variantGuide: string;
  gotchas: string;
  notes: string;
}

interface ComponentSummary {
  id: string;
  name: string;
  slug: string;
  group: string | null;
  usage: UsageData | null;
}

const EMPTY_USAGE: UsageData = {
  description: "",
  whenToUse: "",
  patterns: "",
  variantGuide: "",
  gotchas: "",
  notes: "",
};

const USAGE_FIELDS: { key: keyof UsageData; label: string; placeholder: string }[] = [
  {
    key: "description",
    label: "Description",
    placeholder: "A brief overview of this component and its purpose...",
  },
  {
    key: "whenToUse",
    label: "When to Use",
    placeholder: "Use this component when you need to...\n\n- Scenario 1\n- Scenario 2",
  },
  {
    key: "patterns",
    label: "Common Patterns",
    placeholder: "### Basic Usage\n\nDescribe how to use this component...\n\n### With Props\n\nExplain common prop combinations...",
  },
  {
    key: "variantGuide",
    label: "Variant Guide",
    placeholder: "### Primary\nUse for main CTAs...\n\n### Secondary\nUse for less prominent actions...",
  },
  {
    key: "gotchas",
    label: "Gotchas",
    placeholder: "- **Accessibility**: Ensure proper ARIA labels\n- **Performance**: Avoid rendering in loops without keys",
  },
  {
    key: "notes",
    label: "Additional Notes",
    placeholder: "Any other information that might be helpful...",
  },
];

// ════════════════════════════════════════════════════════════
// COMPONENT SELECTOR
// ════════════════════════════════════════════════════════════

function ComponentSelector({
  components,
  selectedSlug,
  onSelect,
}: {
  components: ComponentSummary[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
}) {
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
    <div className="w-64 flex-shrink-0 border-r border-border overflow-y-auto h-[calc(100vh-12rem)]">
      <div className="p-4">
        <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">
          Components
        </h3>
        <div className="space-y-4">
          {sortedGroups.map((groupName) => {
            const groupComps = groups.get(groupName)!;
            return (
              <div key={groupName}>
                <div className="text-xs text-text-dim font-medium mb-2">
                  {groupName}
                </div>
                <div className="space-y-1">
                  {groupComps
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((comp) => {
                      const isSelected = comp.slug === selectedSlug;
                      const hasUsage = comp.usage && Object.values(comp.usage).some(v => v && v.trim());
                      return (
                        <button
                          key={comp.slug}
                          onClick={() => onSelect(comp.slug)}
                          className={`
                            w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                            flex items-center justify-between
                            ${isSelected
                              ? "bg-accent/20 text-accent"
                              : "text-text-secondary hover:bg-surface hover:text-text-primary"
                            }
                          `}
                        >
                          <span className="truncate">{comp.name}</span>
                          {hasUsage && (
                            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// USAGE EDITOR
// ════════════════════════════════════════════════════════════

function UsageEditor({
  component,
  onSave,
  isSaving,
}: {
  component: ComponentSummary;
  onSave: (usage: UsageData) => Promise<void>;
  isSaving: boolean;
}) {
  const [usage, setUsage] = useState<UsageData>(component.usage || EMPTY_USAGE);
  const [activeField, setActiveField] = useState<keyof UsageData>("description");
  const [previewMode, setPreviewMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Reset when component changes
  useEffect(() => {
    setUsage(component.usage || EMPTY_USAGE);
    setHasChanges(false);
    setPreviewMode(false);
  }, [component.slug, component.usage]);

  const handleFieldChange = (key: keyof UsageData, value: string) => {
    setUsage((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await onSave(usage);
    setHasChanges(false);
  };

  const currentField = USAGE_FIELDS.find((f) => f.key === activeField)!;
  const currentValue = usage[activeField];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h2 className="font-serif text-xl text-text-primary">{component.name}</h2>
          <p className="text-sm text-text-muted">{component.group || "Ungrouped"}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              previewMode
                ? "bg-accent/20 text-accent"
                : "text-text-muted hover:text-text-primary hover:bg-surface"
            }`}
          >
            {previewMode ? "Edit" : "Preview"}
          </button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            size="sm"
          >
            {isSaving ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>

      {/* Field Tabs */}
      <div className="flex gap-1 p-2 border-b border-border overflow-x-auto">
        {USAGE_FIELDS.map((field) => {
          const hasContent = usage[field.key]?.trim();
          return (
            <button
              key={field.key}
              onClick={() => setActiveField(field.key)}
              className={`
                px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors
                flex items-center gap-2
                ${activeField === field.key
                  ? "bg-accent/20 text-accent"
                  : "text-text-muted hover:text-text-primary hover:bg-surface"
                }
              `}
            >
              {field.label}
              {hasContent && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Editor/Preview Area */}
      <div className="flex-1 p-4 overflow-auto">
        {previewMode ? (
          <div className="max-w-3xl">
            <h3 className="text-lg font-medium text-text-primary mb-4">
              {currentField.label}
            </h3>
            {currentValue ? (
              <RichTextBlock html={marked.parse(currentValue) as string} />
            ) : (
              <p className="text-text-dim italic">No content yet</p>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <label className="text-sm font-medium text-text-primary mb-2">
              {currentField.label}
            </label>
            <textarea
              value={currentValue}
              onChange={(e) => handleFieldChange(activeField, e.target.value)}
              placeholder={currentField.placeholder}
              className="
                flex-1 w-full p-4 rounded-lg
                bg-[#0d0d0d] border border-border
                text-text-primary text-sm font-mono
                placeholder:text-text-dim
                focus:outline-none focus:border-accent/50
                resize-none
              "
            />
            <p className="text-xs text-text-dim mt-2">
              Supports Markdown formatting
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════

export default function UsageEditorPage() {
  const [components, setComponents] = useState<ComponentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch all components
  useEffect(() => {
    async function fetchComponents() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("component_docs")
        .select("id, name, slug, group, usage")
        .order("group")
        .order("name");

      if (error) {
        console.error("Error fetching components:", error);
        setLoading(false);
        return;
      }

      setComponents(data || []);
      setLoading(false);

      // Auto-select first component
      if (data && data.length > 0 && !selectedSlug) {
        setSelectedSlug(data[0].slug);
      }
    }

    fetchComponents();
  }, [selectedSlug]);

  const selectedComponent = components.find((c) => c.slug === selectedSlug);

  const handleSave = useCallback(async (usage: UsageData) => {
    if (!selectedSlug) return;

    setIsSaving(true);
    setSaveMessage(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("component_docs")
      .update({ usage, updated_at: new Date().toISOString() })
      .eq("slug", selectedSlug);

    if (error) {
      console.error("Error saving usage:", error);
      setSaveMessage({ type: "error", text: "Failed to save changes" });
    } else {
      setSaveMessage({ type: "success", text: "Changes saved" });
      // Update local state
      setComponents((prev) =>
        prev.map((c) => (c.slug === selectedSlug ? { ...c, usage } : c))
      );
    }

    setIsSaving(false);

    // Clear message after 3 seconds
    setTimeout(() => setSaveMessage(null), 3000);
  }, [selectedSlug]);

  return (
    <PageTransition>
      <GridBackground />
      <CursorGlow />
      <Navbar />
      <main className="min-h-screen pt-20">
        {/* Header */}
        <div className="border-b border-border">
          <div className="max-w-[1600px] mx-auto px-6 py-6">
            <h1 className="font-serif text-3xl text-text-primary mb-2">
              Usage Editor
            </h1>
            <p className="text-text-muted">
              Add usage documentation, patterns, and guidelines to components
            </p>
          </div>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div
            className={`
              fixed top-24 right-6 z-50 px-4 py-2 rounded-lg text-sm
              ${saveMessage.type === "success"
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
              }
            `}
          >
            {saveMessage.text}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : components.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-muted">
              No components found. Run the Doc Generator first.
            </p>
          </div>
        ) : (
          <div className="flex h-[calc(100vh-12rem)]">
            <ComponentSelector
              components={components}
              selectedSlug={selectedSlug}
              onSelect={setSelectedSlug}
            />
            {selectedComponent ? (
              <UsageEditor
                component={selectedComponent}
                onSave={handleSave}
                isSaving={isSaving}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-text-muted">
                Select a component to edit
              </div>
            )}
          </div>
        )}
      </main>
    </PageTransition>
  );
}
