"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Button,
  Spinner,
  Modal,
  Input,
  Select,
} from "@/components/ui";
import {
  NICHE_OPTIONS,
  type BusinessNiche,
} from "@/lib/onboard/niche-prompts";
import type { Client } from "@/lib/clients/types";

// ════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════

interface GenerateOnboardModalProps {
  open: boolean;
  onClose: () => void;
  client: Client;
  compiledKB: string | null;
  onCreated: () => void;
}

interface ScreenshotItem {
  file: File;
  preview: string;
  dataUrl: string;
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

// ════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════

export function GenerateOnboardModal({
  open,
  onClose,
  client,
  compiledKB,
  onCreated,
}: GenerateOnboardModalProps) {
  // Pre-filled from client record
  const [clientName, setClientName] = useState(
    `${client.first_name} ${client.last_name}`
  );
  const [businessName, setBusinessName] = useState(client.business_name);
  const [clientEmail, setClientEmail] = useState(client.email);
  const [clientSlug, setClientSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);

  // Config fields
  const [niche, setNiche] = useState<BusinessNiche>("other");
  const [analyzeUrl, setAnalyzeUrl] = useState("");
  const [analyzeNotes, setAnalyzeNotes] = useState("");
  const [configJson, setConfigJson] = useState("");

  // Screenshot state
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([]);
  const [screenshotDragging, setScreenshotDragging] = useState(false);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  // Operation state
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);

  // Fetch existing slugs when modal opens for deduplication
  const [existingSlugs, setExistingSlugs] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    // Reset form state when opening
    setClientName(`${client.first_name} ${client.last_name}`);
    setBusinessName(client.business_name);
    setClientEmail(client.email);
    setSlugManual(false);
    setNiche("other");
    setAnalyzeUrl("");
    setAnalyzeNotes("");
    setConfigJson("");
    setScreenshots([]);
    setAnalyzing(false);
    setAnalyzeError(null);
    setSaving(false);
    setError(null);
    setAutoFilled(false);
  }, [open, client]);

  useEffect(() => {
    if (!open) return;
    async function fetchSlugs() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("onboard_configs")
        .select("client_slug");
      if (data) setExistingSlugs(data.map((r) => r.client_slug));
    }
    fetchSlugs();
  }, [open]);

  // Cleanup screenshot preview URLs
  useEffect(() => {
    return () => {
      screenshots.forEach((s) => URL.revokeObjectURL(s.preview));
    };
  }, [screenshots]);

  // Auto-generate slug from business name
  const derivedSlug = useMemo(() => {
    const base = slugify(businessName);
    if (!base) return "";
    if (!existingSlugs.includes(base)) return base;
    let i = 2;
    while (existingSlugs.includes(`${base}-${i}`)) i++;
    return `${base}-${i}`;
  }, [businessName, existingSlugs]);

  useEffect(() => {
    if (!slugManual) {
      setClientSlug(derivedSlug);
    }
  }, [derivedSlug, slugManual]);

  function handleSlugChange(val: string) {
    setSlugManual(true);
    setClientSlug(slugify(val));
  }

  const addScreenshots = useCallback(
    async (files: File[]) => {
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      const remaining = 5 - screenshots.length;
      if (remaining <= 0 || imageFiles.length === 0) return;
      const toAdd = imageFiles.slice(0, remaining);
      const compressed = await Promise.all(toAdd.map(compressScreenshot));
      setScreenshots((prev) => [...prev, ...compressed]);
    },
    [screenshots.length]
  );

  const removeScreenshot = useCallback((index: number) => {
    setScreenshots((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Generate with AI handler
  async function handleGenerate() {
    setAnalyzeError(null);
    setError(null);
    setAnalyzing(true);

    try {
      const payload: Record<string, unknown> = {
        url: analyzeUrl.trim() || `https://${slugify(businessName)}.com`,
        niche,
      };

      if (compiledKB) {
        payload.knowledgeBase = compiledKB;
      }

      if (analyzeNotes.trim()) {
        payload.notes = analyzeNotes.trim();
      }

      if (screenshots.length > 0) {
        payload.screenshots = screenshots.map((s) => s.dataUrl);
      }

      const res = await fetch("/api/onboard/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Analysis failed");
      }

      const data = await res.json();

      if (!data.success || !data.config) {
        throw new Error("Invalid response from analysis");
      }

      // Auto-fill config JSON
      if (data.config.config) {
        setConfigJson(JSON.stringify(data.config.config, null, 2));
      }

      // Auto-fill slug if provided
      if (data.config.client_slug) {
        setClientSlug(data.config.client_slug);
        setSlugManual(true);
      }

      setAutoFilled(true);

      if (data.usage) {
        console.log(
          `[generate] ${data.usage.input_tokens + data.usage.output_tokens} tokens used`
        );
      }
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  // Create config handler
  async function handleCreate() {
    setError(null);

    if (!clientName.trim() || !businessName.trim() || !clientSlug.trim()) {
      setError("Client name, business name, and slug are required.");
      return;
    }

    let parsedConfig;
    try {
      parsedConfig = configJson.trim()
        ? JSON.parse(configJson)
        : { questions: [] };
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
          client_id: client.id,
          status: "draft",
          config: parsedConfig,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create config");
      }

      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create config");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate Onboarding Form"
      size="lg"
    >
      <div className="space-y-4 mt-4">
        {/* Knowledge base indicator */}
        {compiledKB ? (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm flex items-center gap-2">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Knowledge base available ({Math.round(compiledKB.length / 1024)}KB).
            AI generation will use this context.
          </div>
        ) : (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm flex items-center gap-2">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            No compiled knowledge base. Add entries and compile first for better
            results.
          </div>
        )}

        {/* Pre-filled fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Client Name
            </label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Chad Smith"
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
              Client Email
            </label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="client@example.com"
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
            />
          </div>
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
        </div>

        {/* Configuration section */}
        <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl space-y-3">
          <h3 className="text-sm font-medium text-text-primary">
            AI Generation Settings
          </h3>

          {/* Niche select */}
          <div>
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

          {/* Website URL */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">
              Website URL (optional)
            </label>
            <Input
              value={analyzeUrl}
              onChange={(e) => setAnalyzeUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={analyzing}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">
              Additional notes (optional)
            </label>
            <textarea
              value={analyzeNotes}
              onChange={(e) => setAnalyzeNotes(e.target.value)}
              placeholder="Call logs, client preferences, specific requests. These override other data."
              disabled={analyzing}
              className="w-full min-h-[60px] bg-background border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-dim focus:ring-1 focus:ring-accent focus:border-accent focus:outline-none transition-colors text-sm resize-y"
            />
          </div>

          {/* Screenshot upload */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-text-muted">
                Screenshots (optional, up to 5)
              </label>
              {screenshots.length > 0 && (
                <span className="text-xs text-text-dim">
                  {screenshots.length}/5
                </span>
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
                ${
                  screenshotDragging
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
                  if (e.target.files)
                    addScreenshots(Array.from(e.target.files));
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
                    <div
                      key={i}
                      className="relative group w-16 h-16 rounded-md overflow-hidden bg-background"
                    >
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
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {screenshots.length < 5 && (
                    <div className="w-16 h-16 rounded-md border-2 border-dashed border-border flex items-center justify-center text-text-dim hover:border-accent/50 transition-colors">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={analyzing}
            className="w-full"
          >
            {analyzing ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                Generating with AI...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Generate with AI
              </span>
            )}
          </Button>

          {analyzeError && (
            <p className="text-xs text-red-400">{analyzeError}</p>
          )}

          {autoFilled && (
            <p className="text-xs text-green-400 flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Config generated. Review and edit below.
            </p>
          )}
        </div>

        {/* Config JSON editor */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Config JSON {autoFilled ? "(generated, editable)" : "(paste or generate)"}
          </label>
          <textarea
            value={configJson}
            onChange={(e) => {
              setConfigJson(e.target.value);
              setAutoFilled(false);
            }}
            placeholder='{"questions": [...]} — Generate with AI above or paste config JSON here'
            className="w-full min-h-[200px] bg-background border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-dim focus:ring-1 focus:ring-accent focus:border-accent focus:outline-none transition-colors font-mono text-sm resize-y"
          />
        </div>

        {/* Error display */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
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
              "Create Draft"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
