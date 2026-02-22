"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  Tabs,
  TabList,
  Tab,
  Select,
} from "@/components/ui";
import Navbar from "@/components/layout/Navbar";
import type { OnboardConfig } from "@/lib/onboard/types";
import {
  NICHE_OPTIONS,
  type BusinessNiche,
  buildSystemPrompt,
} from "@/lib/onboard/niche-prompts";

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
  onDuplicate,
  onStatusChange,
}: {
  config: ConfigWithCount;
  onDelete: (id: string) => void | Promise<void>;
  onDuplicate: () => void | Promise<void>;
  onStatusChange: () => void | Promise<void>;
}) {
  const formUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/onboard/${config.client_slug}`;
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [activating, setActivating] = useState(false);

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

  async function handleActivate() {
    setActivating(true);
    try {
      const res = await fetch("/api/onboard/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_slug: config.client_slug,
          client_name: config.client_name,
          business_name: config.business_name,
          client_email: config.client_email,
          config: config.config,
          status: "active",
        }),
      });
      if (res.ok) {
        await onStatusChange();
      }
    } finally {
      setActivating(false);
      setActivateOpen(false);
    }
  }

  async function handleDuplicate(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDuplicating(true);

    const newSlug = `${config.client_slug}-copy-${Date.now().toString(36).slice(-4)}`;
    const res = await fetch("/api/onboard/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_slug: newSlug,
        client_name: `${config.client_name} (copy)`,
        business_name: config.business_name,
        client_email: config.client_email,
        config: config.config,
        status: "draft",
      }),
    });

    if (res.ok) {
      await onDuplicate();
    }
    setDuplicating(false);
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
              onClick={handleDuplicate}
              disabled={duplicating}
              className="p-1 rounded transition-colors text-text-dim hover:text-accent opacity-0 group-hover:opacity-100"
              title="Duplicate config"
            >
              {duplicating ? (
                <Spinner size="sm" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              )}
            </button>
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

        <p className="text-xs text-text-dim font-mono mb-1">/{config.client_slug}</p>
        {config.client_email && (
          <p className="text-xs text-text-dim mb-3">{config.client_email}</p>
        )}

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

        {config.status === "draft" && (
          <div className="flex items-center gap-2 mt-3">
            <Link
              href={`/dashboard/onboard/${config.client_slug}/preview`}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border bg-surface text-text-muted hover:border-accent/50 hover:text-accent transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </Link>
            {config.client_email && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActivateOpen(true);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Activate &amp; Send
              </button>
            )}
          </div>
        )}
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

      <Modal open={activateOpen} onClose={() => setActivateOpen(false)} title="Activate & Send Invitation">
        <div className="mt-4 space-y-4">
          <p className="text-sm text-text-muted">
            This will activate <span className="text-text-primary font-medium">{config.business_name}</span> and send an invitation email to <span className="text-text-primary font-medium">{config.client_email}</span>.
          </p>
          <p className="text-xs text-text-dim">
            The client will receive a magic link to access their onboarding form. Make sure you&apos;ve previewed the form before activating.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setActivateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleActivate}
              disabled={activating}
              className="flex-1 !bg-green-500/10 !border-green-500/30 !text-green-400 hover:!bg-green-500/20"
            >
              {activating ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" />
                  Activating...
                </span>
              ) : (
                "Activate & Send Email"
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

interface ScreenshotItem {
  file: File;
  preview: string;
  dataUrl: string;
}

async function compressScreenshot(file: File): Promise<ScreenshotItem> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  let targetWidth = width;
  let targetHeight = height;
  if (width > 800) {
    targetWidth = 800;
    targetHeight = Math.round((height / width) * 800);
  }
  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();
  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.8 });
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
  return {
    file,
    preview: URL.createObjectURL(blob),
    dataUrl,
  };
}

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
  const [clientEmail, setClientEmail] = useState("");
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
  const [analyzeNotes, setAnalyzeNotes] = useState("");
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [niche, setNiche] = useState<BusinessNiche>("other");

  // Screenshot state
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([]);
  const [screenshotDragging, setScreenshotDragging] = useState(false);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  // Manual flow state
  const [scraping, setScraping] = useState(false);
  const [scrapeCopied, setScrapeCopied] = useState(false);
  const [aiPrompt, setAiPrompt] = useState<string | null>(null);

  // Cleanup screenshot preview URLs
  useEffect(() => {
    return () => {
      screenshots.forEach((s) => URL.revokeObjectURL(s.preview));
    };
  }, [screenshots]);

  const addScreenshots = useCallback(async (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    const remaining = 5 - screenshots.length;
    if (remaining <= 0 || imageFiles.length === 0) return;
    const toAdd = imageFiles.slice(0, remaining);
    const compressed = await Promise.all(toAdd.map(compressScreenshot));
    setScreenshots((prev) => [...prev, ...compressed]);
  }, [screenshots.length]);

  const removeScreenshot = useCallback((index: number) => {
    setScreenshots((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Fetch AI prompt template for manual flow
  useEffect(() => {
    if (!open || aiPrompt !== null) return;
    fetch("/api/onboard/settings?key=ai_prompt_template")
      .then((res) => res.json())
      .then((data) => {
        if (data.value) setAiPrompt(data.value);
      })
      .catch(() => {});
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
    // Only auto-fill slug and config — name/email entered manually
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
        body: JSON.stringify({
          url: analyzeUrl,
          notes: analyzeNotes.trim() || undefined,
          niche,
          screenshots: screenshots.length > 0
            ? screenshots.map((s) => s.dataUrl)
            : undefined,
        }),
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

  // Manual: scrape + copy prompt to clipboard
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

      const notes = analyzeNotes.trim();

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

PAGES SCRAPED: ${scraped.pagesScraped?.join(", ") ?? analyzeUrl}

== END SCRAPED DATA ==${notes ? `

== NOTES FROM THE DESIGNER ==
These notes are from the designer who spoke with the client. They take PRIORITY over anything found on the website. If notes contradict scraped data, follow the notes.

${notes}

== END NOTES ==` : ""}

Using the scraped data above${notes ? " and the designer's notes" : ""}, generate a complete onboarding config JSON following the schema in your instructions. Use the real colors, contact info, and services found. Return ONLY the JSON, no explanation or markdown formatting.
`.trim();

      const fullSystemPrompt = buildSystemPrompt(aiPrompt, niche);

      const fullPrompt = `=== SYSTEM PROMPT (paste this first or use as system instructions) ===

${fullSystemPrompt}

=== USER MESSAGE (paste this as your message) ===

${userMessage}${screenshots.length > 0 ? `

NOTE: ${screenshots.length} screenshot(s) were provided but cannot be included in clipboard text. Upload them directly to Claude alongside this prompt for better results.` : ""}`;

      await navigator.clipboard.writeText(fullPrompt);
      setScrapeCopied(true);
      setTimeout(() => setScrapeCopied(false), 3000);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Scrape failed");
    } finally {
      setScraping(false);
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
          client_email: clientEmail.trim() || undefined,
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
      setClientEmail("");
      setClientSlug("");
      setSlugManual(false);
      setStatus("draft");
      setConfigJson("");
      setAutoFilled(false);
      setAnalyzeUrl("");
      setAnalyzeError(null);
      setAnalyzeNotes("");
      setNiche("other");
      setScreenshots([]);
      setScraping(false);
      setScrapeCopied(false);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create config");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Onboarding Config" size="lg">
      <div className="space-y-4 mt-4">
        {/* Tabbed analyze section */}
        <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
          <Tabs defaultValue="ai" onValueChange={(v) => setMode(v as "ai" | "manual")}>
            <TabList className="mb-3">
              <Tab value="ai">AI Analyze</Tab>
              <Tab value="manual">Manual</Tab>
            </TabList>
          </Tabs>

          {/* Shared: Business type */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-text-muted mb-1">
              Business type
            </label>
            <Select
              options={NICHE_OPTIONS}
              value={niche}
              onValueChange={(v) => setNiche(v as BusinessNiche)}
              placeholder="Select business type"
            />
          </div>

          {/* Shared: URL input + action button */}
          <div className="flex gap-2">
            <Input
              value={analyzeUrl}
              onChange={(e) => setAnalyzeUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={analyzing || scraping}
              onKeyDown={(e) => {
                if (e.key === "Enter" && analyzeUrl.trim() && !analyzing && !scraping) {
                  if (mode === "ai") handleAnalyze();
                  else handleCopyForClaude();
                }
              }}
            />
            {mode === "ai" ? (
              <Button
                onClick={handleAnalyze}
                disabled={analyzing || !analyzeUrl.trim()}
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
            ) : (
              <Button
                onClick={handleCopyForClaude}
                disabled={scraping || !analyzeUrl.trim() || !aiPrompt}
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
            )}
          </div>

          {/* Shared: Notes textarea */}
          <textarea
            value={analyzeNotes}
            onChange={(e) => setAnalyzeNotes(e.target.value)}
            placeholder="Optional notes, e.g. call logs, client preferences, specific requests. These override what's found on the website."
            disabled={analyzing || scraping}
            className="w-full mt-2 min-h-[60px] bg-background border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-dim focus:ring-1 focus:ring-accent focus:border-accent focus:outline-none transition-colors text-sm resize-y"
          />

          {/* Shared: Screenshot upload */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-text-muted">
                Screenshots (optional, up to 5)
              </label>
              {screenshots.length > 0 && (
                <span className="text-xs text-text-dim">{screenshots.length}/5</span>
              )}
            </div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setScreenshotDragging(true);
              }}
              onDragLeave={() => setScreenshotDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setScreenshotDragging(false);
                addScreenshots(Array.from(e.dataTransfer.files));
              }}
              onClick={() => screenshotInputRef.current?.click()}
              className={`
                rounded-lg border-2 border-dashed transition-colors cursor-pointer
                ${screenshotDragging
                  ? "border-accent bg-accent/10"
                  : "border-border hover:border-accent/50"
                }
                ${screenshots.length === 0 ? "px-4 py-3" : "p-2"}
              `}
            >
              <input
                ref={screenshotInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addScreenshots(Array.from(e.target.files));
                  e.target.value = "";
                }}
              />
              {screenshots.length === 0 ? (
                <p className="text-xs text-text-dim text-center">
                  Drop screenshots here or click to browse
                </p>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {screenshots.map((s, i) => (
                    <div key={i} className="relative group w-16 h-16 rounded-md overflow-hidden bg-background">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.preview}
                        alt={`Screenshot ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeScreenshot(i);
                        }}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {screenshots.length < 5 && (
                    <div className="w-16 h-16 rounded-md border-2 border-dashed border-border flex items-center justify-center text-text-dim hover:border-accent/50 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Shared: Error display */}
          {analyzeError && (
            <p className="text-xs text-red-400 mt-2">{analyzeError}</p>
          )}

          {/* AI tab: success indicator */}
          {mode === "ai" && autoFilled && (
            <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Config generated. Review fields below.
            </p>
          )}

          {/* Manual tab: copy confirmation + paste textarea */}
          {mode === "manual" && (
            <>
              {scrapeCopied && (
                <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Prompt + scraped data copied. Paste into Claude or ChatGPT.
                </p>
              )}
              <div className="mt-3">
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Paste AI output
                </label>
                <textarea
                  value={configJson}
                  onChange={(e) => handleConfigChange(e.target.value)}
                  placeholder="Paste the full JSON here. Fields will auto-fill below."
                  className="w-full min-h-[160px] bg-background border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-dim focus:ring-1 focus:ring-accent focus:border-accent focus:outline-none transition-colors font-mono text-sm resize-y"
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
        </div>

        {/* Config JSON (shown when AI auto-analyze filled it, for review/editing) */}
        {mode === "ai" && configJson && (
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

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Client Email
          </label>
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="client@example.com"
            className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          />
          <p className="text-xs text-text-dim mt-1">
            Client will use this email to access their portal
          </p>
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
                  onDuplicate={fetchConfigs}
                  onStatusChange={fetchConfigs}
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
