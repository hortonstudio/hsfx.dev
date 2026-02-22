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

function ConfigCard({ config }: { config: ConfigWithCount }) {
  const formUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/onboard/${config.client_slug}`;
  const [copied, setCopied] = useState(false);

  async function copyUrl(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(formUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Link
      href={`/dashboard/onboard/${config.client_slug}`}
      className="group block p-5 bg-surface border border-border rounded-xl hover:border-accent/50 hover:bg-accent/5 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-medium text-text-primary group-hover:text-accent transition-colors">
            {config.client_name}
          </h3>
          <p className="text-sm text-text-muted">{config.business_name}</p>
        </div>
        <Badge variant={STATUS_VARIANTS[config.status] ?? "default"} dot size="sm">
          {config.status}
        </Badge>
      </div>

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
  const [promptCopied, setPromptCopied] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [aiPrompt, setAiPrompt] = useState<string | null>(null);

  // Fetch AI prompt from Supabase
  useEffect(() => {
    if (!open || aiPrompt !== null) return;
    fetch("/api/onboard/settings?key=ai_prompt_template")
      .then((res) => res.json())
      .then((data) => {
        if (data.value) setAiPrompt(data.value);
      })
      .catch(() => {
        // Fallback: prompt not available
      });
  }, [open, aiPrompt]);

  // Auto-generate slug from client name unless manually edited
  const derivedSlug = useMemo(() => slugify(clientName), [clientName]);

  useEffect(() => {
    if (!slugManual) {
      setClientSlug(derivedSlug);
    }
  }, [derivedSlug, slugManual]);

  function handleSlugChange(val: string) {
    setSlugManual(true);
    setClientSlug(slugify(val));
  }

  async function copyPrompt() {
    if (!aiPrompt) return;
    await navigator.clipboard.writeText(aiPrompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  }

  // When JSON is pasted/changed, try to auto-extract top-level fields
  function handleConfigChange(raw: string) {
    setConfigJson(raw);
    setAutoFilled(false);

    // Try to parse and extract client_name, business_name, client_slug
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.config && parsed.client_slug) {
        // Full AI output detected — extract fields and keep only config
        if (parsed.client_name) setClientName(parsed.client_name);
        if (parsed.business_name) setBusinessName(parsed.business_name);
        if (parsed.client_slug) {
          setClientSlug(parsed.client_slug);
          setSlugManual(true);
        }
        setConfigJson(JSON.stringify(parsed.config, null, 2));
        setAutoFilled(true);
      }
    } catch {
      // Not valid JSON yet — that's fine, user is still typing/pasting
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
        {/* Step 1: Copy AI Prompt */}
        <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">
                Step 1: Generate config with AI
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                Copy the prompt, paste into ChatGPT/Claude with the client&apos;s website URL
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
                  {aiPrompt ? "Copy AI Prompt" : "Loading..."}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Step 2: Paste AI output */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Step 2: Paste the AI output
          </label>
          <textarea
            value={configJson}
            onChange={(e) => handleConfigChange(e.target.value)}
            placeholder="Paste the full JSON from ChatGPT/Claude here — fields will auto-fill below"
            className="w-full min-h-[200px] bg-background border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-dim focus:ring-1 focus:ring-accent focus:border-accent focus:outline-none transition-colors font-mono text-sm resize-y"
          />
          {autoFilled && (
            <p className="text-xs text-green-400 mt-1.5 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Auto-filled name, business, and slug from AI output
            </p>
          )}
        </div>

        {/* Auto-filled fields (editable) */}
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
                <ConfigCard key={config.id} config={config} />
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
