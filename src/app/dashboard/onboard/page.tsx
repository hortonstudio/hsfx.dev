"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { createClient } from "@/lib/supabase/client";
import {
  Button,
  Spinner,
  Modal,
  Input,
  Badge,
  EmptyState,
  GridBackground,
  PageTransition,
  CursorGlow,
} from "@/components/ui";
import Navbar from "@/components/layout/Navbar";
import type { OnboardConfig } from "@/lib/onboard/types";

// ════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════

interface ConfigWithCount extends OnboardConfig {
  submission_count: number;
}

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const STATUS_VARIANTS: Record<string, "success" | "warning" | "default"> = {
  active: "success",
  draft: "warning",
  archived: "default",
};

// ════════════════════════════════════════════════════════════
// CONFIG CARD
// ════════════════════════════════════════════════════════════

function ConfigCard({
  config,
  onDelete,
}: {
  config: ConfigWithCount;
  onDelete: (id: string) => void | Promise<void>;
}) {
  const formUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/onboard/${config.client_slug}`;
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function copyUrl(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(formUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openDeleteModal(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    setDeleting(true);
    await onDelete(config.id);
    setDeleting(false);
    setDeleteOpen(false);
  }

  return (
    <>
      <Link
        href={`/dashboard/onboard/${config.client_slug}`}
        className="group block p-5 bg-surface border border-border rounded-xl hover:border-accent/50 hover:bg-accent/5 transition-all duration-200"
      >
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-base font-medium text-text-primary group-hover:text-accent transition-colors">
              {config.client_name}
            </h3>
            <p className="text-sm text-text-muted">{config.business_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANTS[config.status] ?? "default"} dot size="sm">
              {config.status}
            </Badge>
            <button
              type="button"
              onClick={openDeleteModal}
              className="p-1 rounded transition-colors text-text-dim hover:text-red-400 opacity-0 group-hover:opacity-100"
              title="Delete config"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <p className="text-xs text-text-dim font-mono mb-3">/{config.client_slug}</p>

        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-text-dim">
            {config.submission_count} submission{config.submission_count !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={copyUrl}
            className="text-xs text-text-dim hover:text-accent transition-colors flex items-center gap-1"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy URL
              </>
            )}
          </button>
        </div>
      </Link>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Config">
        <div className="mt-4 space-y-4">
          <p className="text-sm text-text-muted">
            Are you sure you want to delete <span className="text-text-primary font-medium">{config.business_name}</span> ({config.client_slug})? This will also delete all submissions and cannot be undone.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              className="flex-1 !bg-red-500/10 !border-red-500/30 !text-red-400 hover:!bg-red-500/20"
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" />
                  Deleting...
                </span>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ════════════════════════════════════════════════════════════
// NEW CONFIG MODAL
// ════════════════════════════════════════════════════════════

function NewConfigModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [clientName, setClientName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [clientSlug, setClientSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [status, setStatus] = useState<"draft" | "active">("draft");
  const [configJson, setConfigJson] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);

  // Analyze state
  const [analyzeUrl, setAnalyzeUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [hasAnalyzeApi, setHasAnalyzeApi] = useState<boolean | null>(null);
  const [showManualFlow, setShowManualFlow] = useState(false);

  // Copy for Claude state
  const [scraping, setScraping] = useState(false);
  const [scrapeCopied, setScrapeCopied] = useState(false);

  // Manual flow state
  const [aiPrompt, setAiPrompt] = useState<string | null>(null);
  const [promptCopied, setPromptCopied] = useState(false);

  // Check if analyze API is available + fetch prompt for manual fallback
  useEffect(() => {
    if (!open) return;
    fetch("/api/onboard/analyze")
      .then((res) => res.json())
      .then((data) => setHasAnalyzeApi(data.available === true))
      .catch(() => setHasAnalyzeApi(false));

    if (aiPrompt === null) {
      fetch("/api/onboard/settings?key=ai_prompt_template")
        .then((res) => res.json())
        .then((data) => {
          if (data.value) setAiPrompt(data.value);
        })
        .catch(() => {});
    }
  }, [open, aiPrompt]);

  // Fetch existing slugs when modal opens for deduplication
  const [existingSlugs, setExistingSlugs] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    supabase
      .from("onboard_configs")
      .select("client_slug")
      .then(({ data }) => {
        if (data) setExistingSlugs(data.map((r) => r.client_slug));
      });
  }, [open]);

  const derivedSlug = useMemo(() => {
    const base = slugify(clientName);
    if (!base) return "";
    if (!existingSlugs.includes(base)) return base;
    let i = 2;
    while (existingSlugs.includes(`${base}-${i}`)) i++;
    return `${base}-${i}`;
  }, [clientName, existingSlugs]);

  useEffect(() => {
    if (!slugManual) {
      setClientSlug(derivedSlug);
    }
  }, [derivedSlug, slugManual]);

  function handleSlugChange(val: string) {
    setSlugManual(true);
    setClientSlug(slugify(val));
  }

  // Auto-fill fields from a full config object (used by both analyze and manual paste)
  function applyConfig(parsed: {
    client_name?: string;
    business_name?: string;
    client_slug?: string;
    config?: object;
  }) {
    if (parsed.client_name) setClientName(parsed.client_name);
    if (parsed.business_name) setBusinessName(parsed.business_name);
    if (parsed.client_slug) {
      setClientSlug(parsed.client_slug);
      setSlugManual(true);
    }
    if (parsed.config) {
      setConfigJson(JSON.stringify(parsed.config, null, 2));
    }
    setAutoFilled(true);
  }

  // Analyze handler
  async function handleAnalyze() {
    setAnalyzeError(null);
    setError(null);
    setAnalyzing(true);

    try {
      const res = await fetch("/api/onboard/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: analyzeUrl }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Analysis failed");
      }

      const data = await res.json();

      if (!data.success || !data.config) {
        throw new Error("Invalid response from analysis");
      }

      applyConfig(data.config);

      if (data.usage) {
        console.log(
          `[analyze] ${data.usage.input_tokens + data.usage.output_tokens} tokens used`
        );
      }
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  // Manual paste handler
  function handleConfigChange(raw: string) {
    setConfigJson(raw);
    setAutoFilled(false);

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.config && parsed.client_slug) {
        applyConfig(parsed);
      }
    } catch {
      // Not valid JSON yet
    }
  }

  async function copyPrompt() {
    if (!aiPrompt) return;
    await navigator.clipboard.writeText(aiPrompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  }

  // Scrape site + build full prompt + copy to clipboard
  async function handleCopyForClaude() {
    if (!analyzeUrl.trim() || !aiPrompt) return;
    setAnalyzeError(null);
    setScraping(true);

    try {
      const res = await fetch("/api/onboard/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: analyzeUrl }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Scrape failed");
      }

      const { data: scraped } = await res.json();

      const colorsText = scraped.colors.length > 0
        ? scraped.colors.slice(0, 8).map((c: { hex: string; count: number; sources: string[] }) =>
            `  - ${c.hex} (found ${c.count}x in: ${c.sources.join(", ")})`
          ).join("\n")
        : "  No colors detected";

      const userMessage = `
Website URL: ${analyzeUrl}

== SCRAPED DATA FROM THE WEBSITE ==

COLORS FOUND (ranked by frequency):
${colorsText}

META:
  Title: ${scraped.meta.title ?? "N/A"}
  Description: ${scraped.meta.description ?? "N/A"}
  OG Title: ${scraped.meta.ogTitle ?? "N/A"}
  OG Description: ${scraped.meta.ogDescription ?? "N/A"}

CONTACT:
  Phones: ${scraped.contact.phones.join(", ") || "N/A"}
  Emails: ${scraped.contact.emails.join(", ") || "N/A"}

HEADINGS:
${scraped.content.headings.length > 0
    ? scraped.content.headings.map((h: string) => `  - ${h}`).join("\n")
    : "  None found"}

SERVICES DETECTED:
${scraped.content.services.length > 0
    ? scraped.content.services.map((s: string) => `  - ${s}`).join("\n")
    : "  None found"}

LOGO: ${scraped.logoUrl ?? "Not found"}

== END SCRAPED DATA ==

Using the scraped data above, generate a complete onboarding config JSON following the schema in your instructions. Use the real colors, contact info, and services found. Return ONLY the JSON — no explanation or markdown formatting.
`.trim();

      const fullPrompt = `=== SYSTEM PROMPT (paste this first or use as system instructions) ===

${aiPrompt}

=== USER MESSAGE (paste this as your message) ===

${userMessage}`;

      await navigator.clipboard.writeText(fullPrompt);
      setScrapeCopied(true);
      setTimeout(() => setScrapeCopied(false), 3000);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Scrape failed");
    } finally {
      setScraping(false);
    }
  }

  async function handleCreate() {
    setError(null);

    if (!clientName.trim() || !businessName.trim() || !clientSlug.trim()) {
      setError("Client name, business name, and slug are required.");
      return;
    }

    let parsedConfig;
    try {
      parsedConfig = configJson.trim() ? JSON.parse(configJson) : { questions: [] };
    } catch {
      setError("Invalid JSON configuration. Please check the format.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/onboard/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: clientName.trim(),
          business_name: businessName.trim(),
          client_slug: clientSlug.trim(),
          status,
          config: parsedConfig,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create config");
      }

      // Reset form
      setClientName("");
      setBusinessName("");
      setClientSlug("");
      setSlugManual(false);
      setStatus("draft");
      setConfigJson("");
      setAutoFilled(false);
      setAnalyzeUrl("");
      setAnalyzeError(null);
      setShowManualFlow(false);
      setScrapeCopied(false);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create config");
    } finally {
      setSaving(false);
    }
  }

  const showAnalyze = hasAnalyzeApi === true;

  return (
    <Modal open={open} onClose={onClose} title="New Onboarding Config" size="lg">
      <div className="space-y-4 mt-4">
        {/* Analyze / Copy for Claude section */}
        <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
          <p className="text-sm font-medium text-text-primary mb-1">
            Analyze client website
          </p>
          <p className="text-xs text-text-muted mb-3">
            {showAnalyze
              ? "Scrape the site for colors, services, and contact info, then generate a config automatically."
              : "Scrape the site and copy a ready-made prompt to paste into Claude or ChatGPT."}
          </p>
          <div className="flex gap-2">
            <Input
              value={analyzeUrl}
              onChange={(e) => setAnalyzeUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={analyzing || scraping}
              onKeyDown={(e) => {
                if (e.key === "Enter" && analyzeUrl.trim() && !analyzing && !scraping) {
                  if (showAnalyze) handleAnalyze();
                  else handleCopyForClaude();
                }
              }}
            />
            {showAnalyze && (
              <Button
                onClick={handleAnalyze}
                disabled={analyzing || scraping || !analyzeUrl.trim()}
              >
                {analyzing ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    Analyzing...
                  </span>
                ) : (
                  "Analyze"
                )}
              </Button>
            )}
            <Button
              variant={showAnalyze ? "ghost" : "primary"}
              onClick={handleCopyForClaude}
              disabled={scraping || analyzing || !analyzeUrl.trim() || !aiPrompt}
              title="Scrape the site and copy a full prompt for Claude/ChatGPT"
            >
              {scraping ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" />
                  Scraping...
                </span>
              ) : scrapeCopied ? (
                <span className="flex items-center gap-1.5 text-green-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </span>
              ) : (
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy for Claude
                </span>
              )}
            </Button>
          </div>
          {analyzeError && (
            <p className="text-xs text-red-400 mt-2">{analyzeError}</p>
          )}
          {scrapeCopied && (
            <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Prompt + scraped data copied — paste into Claude or ChatGPT
            </p>
          )}
          {autoFilled && (
            <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Config generated — review fields below
            </p>
          )}
          <button
            type="button"
            onClick={() => setShowManualFlow(!showManualFlow)}
            className="text-xs text-text-dim hover:text-accent mt-2 transition-colors"
          >
            {showManualFlow ? "Hide manual flow" : "Or enter config manually"}
          </button>
        </div>

        {/* Manual flow (collapsed fallback) */}
        {showManualFlow && (
          <>
            <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    Manual config entry
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Copy just the system prompt, then paste into ChatGPT/Claude with the client&apos;s website URL
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={copyPrompt} disabled={!aiPrompt}>
                  {promptCopied ? (
                    <span className="flex items-center gap-1.5 text-green-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {aiPrompt ? "Copy Prompt" : "Loading..."}
                    </span>
                  )}
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Paste AI output
              </label>
              <textarea
                value={configJson}
                onChange={(e) => handleConfigChange(e.target.value)}
                placeholder="Paste the full JSON here — fields will auto-fill below"
                className="w-full min-h-[200px] bg-background border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-dim focus:ring-1 focus:ring-accent focus:border-accent focus:outline-none transition-colors font-mono text-sm resize-y"
              />
              {autoFilled && (
                <p className="text-xs text-green-400 mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Auto-filled from AI output
                </p>
              )}
            </div>
          </>
        )}

        {/* Config JSON (shown when auto-analyze filled it, for review/editing) */}
        {showAnalyze && !showManualFlow && configJson && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Generated config (editable)
            </label>
            <textarea
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              className="w-full min-h-[160px] bg-background border border-border rounded-lg px-4 py-3 text-text-primary focus:ring-1 focus:ring-accent focus:border-accent focus:outline-none transition-colors font-mono text-sm resize-y"
            />
          </div>
        )}

        {/* Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Client Name
            </label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Chad"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Business Name
            </label>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Chad's Plumbing"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Slug
            </label>
            <Input
              value={clientSlug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="auto-generated"
            />
            <p className="text-xs text-text-dim mt-1">
              /onboard/{clientSlug || "..."}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Status
            </label>
            <div className="flex gap-3">
              {(["draft", "active"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`
                    flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all capitalize
                    ${status === s
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-surface text-text-muted hover:border-accent/50"
                    }
                  `}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={saving} className="flex-1">
            {saving ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                Creating...
              </span>
            ) : (
              "Push to Supabase"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════
// PAGE CONTENT
// ════════════════════════════════════════════════════════════

function OnboardDashboardContent() {
  const [configs, setConfigs] = useState<ConfigWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  async function handleDelete(id: string) {
    const res = await fetch(`/api/onboard/config?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setConfigs((prev) => prev.filter((c) => c.id !== id));
    }
  }

  const fetchConfigs = async () => {
    const supabase = createClient();

    const { data: configRows, error } = await supabase
      .from("onboard_configs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching configs:", error);
      setLoading(false);
      return;
    }

    // Fetch submission counts per config
    const { data: submissions } = await supabase
      .from("onboard_submissions")
      .select("config_id");

    const countMap: Record<string, number> = {};
    if (submissions) {
      for (const sub of submissions) {
        countMap[sub.config_id] = (countMap[sub.config_id] ?? 0) + 1;
      }
    }

    const withCounts: ConfigWithCount[] = (configRows ?? []).map((c) => ({
      ...c,
      submission_count: countMap[c.id] ?? 0,
    }));

    setConfigs(withCounts);
    setLoading(false);
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  return (
    <PageTransition>
      <GridBackground />
      <CursorGlow />
      <Navbar />
      <main className="min-h-screen pt-24 md:pt-28 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl text-text-primary mb-1">
                Client Onboarding
              </h1>
              <p className="text-text-muted">
                Manage onboarding forms and view submissions
              </p>
            </div>
            <Button onClick={() => setModalOpen(true)}>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Config
            </Button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <Spinner size="lg" />
            </div>
          ) : configs.length === 0 ? (
            <EmptyState
              title="No onboarding configs"
              description="Create your first onboarding config to start collecting client information."
              action={
                <Button onClick={() => setModalOpen(true)}>
                  Create First Config
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {configs.map((config) => (
                <ConfigCard
                  key={config.id}
                  config={config}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <NewConfigModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={fetchConfigs}
      />
    </PageTransition>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════

export default function OnboardDashboardPage() {
  return (
    <ProtectedRoute>
      <OnboardDashboardContent />
    </ProtectedRoute>
  );
}
