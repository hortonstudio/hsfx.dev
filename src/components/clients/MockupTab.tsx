"use client";

import { useState, useRef } from "react";
import { Button, Badge, Spinner, Modal, useToast } from "@/components/ui";
import { WebflowDebugModal } from "./WebflowDebugModal";
import type { ClientMockup, KnowledgeDocument } from "@/lib/clients/types";

interface MockupTabProps {
  clientId: string;
  mockup: ClientMockup | null;
  compiledDoc: KnowledgeDocument | null;
  onDataChanged: () => void;
}

export function MockupTab({
  clientId,
  mockup,
  compiledDoc,
  onDataChanged,
}: MockupTabProps) {
  const { addToast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [generating, setGenerating] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [localMockup, setLocalMockup] = useState<ClientMockup | null>(mockup);
  const [configExpanded, setConfigExpanded] = useState(false);
  const [debugModalOpen, setDebugModalOpen] = useState(false);
  const [copyingPrompt, setCopyingPrompt] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importing, setImporting] = useState(false);

  const displayMockup = localMockup ?? mockup;
  const isDraft = displayMockup?.status === "draft";
  const isActive = displayMockup?.status === "active";

  // ──────────────────────────────────────────────────
  // GENERATE (AI → save as draft, no WF push)
  // ──────────────────────────────────────────────────

  async function handleGenerate() {
    setGenerating(true);

    try {
      const res = await fetch(`/api/clients/${clientId}/mockup/generate`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate mockup");
      }

      const data = await res.json();
      setLocalMockup(data.mockup);
      addToast({ variant: "success", title: "Config generated (draft)" });
      onDataChanged();
    } catch (err) {
      addToast({
        variant: "error",
        title: "Generation failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setGenerating(false);
    }
  }

  // ──────────────────────────────────────────────────
  // LOAD DEMO (save demo config as draft)
  // ──────────────────────────────────────────────────

  async function handleLoadDemo() {
    setGenerating(true);

    try {
      const res = await fetch(`/api/clients/${clientId}/mockup/demo`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load demo config");
      }

      const data = await res.json();
      setLocalMockup(data.mockup);
      addToast({ variant: "success", title: "Demo config loaded (draft)" });
      onDataChanged();
    } catch (err) {
      addToast({
        variant: "error",
        title: "Demo load failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setGenerating(false);
    }
  }

  // ──────────────────────────────────────────────────
  // PUSH TO WEBFLOW
  // ──────────────────────────────────────────────────

  async function handlePush() {
    setPushing(true);

    try {
      const res = await fetch(`/api/clients/${clientId}/mockup/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Webflow push failed");
      }

      const data = await res.json();
      setLocalMockup(data.mockup);
      addToast({ variant: "success", title: "Pushed to Webflow" });
      onDataChanged();
    } catch (err) {
      addToast({
        variant: "error",
        title: "Push failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setPushing(false);
    }
  }

  // ──────────────────────────────────────────────────
  // COPY PROMPT + KB
  // ──────────────────────────────────────────────────

  async function handleCopyPrompt() {
    setCopyingPrompt(true);

    try {
      const res = await fetch(`/api/clients/${clientId}/mockup/prompt`);
      if (!res.ok) throw new Error("Failed to fetch prompt");

      const data = await res.json();
      const fullText = `=== SYSTEM PROMPT ===\n${data.systemPrompt}\n\n=== KNOWLEDGE BASE ===\nClient: ${data.businessName}\n\n${data.knowledgeBase}\n\n=== AVAILABLE ICONS ===\n${data.iconList}\n\n=== INSTRUCTION ===\nGenerate the complete homepage mockup config JSON.`;

      await navigator.clipboard.writeText(fullText);
      addToast({ variant: "success", title: "Prompt + KB copied to clipboard" });
    } catch (err) {
      addToast({
        variant: "error",
        title: "Copy failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setCopyingPrompt(false);
    }
  }

  // ──────────────────────────────────────────────────
  // IMPORT CONFIG (paste JSON)
  // ──────────────────────────────────────────────────

  async function handleImport() {
    setImporting(true);

    try {
      let parsed;
      try {
        parsed = JSON.parse(importJson);
      } catch {
        throw new Error("Invalid JSON — check your syntax and try again.");
      }

      const res = await fetch(`/api/clients/${clientId}/mockup/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: parsed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Import failed");
      }

      const data = await res.json();
      setLocalMockup(data.mockup);
      setImportOpen(false);
      setImportJson("");
      addToast({ variant: "success", title: "Config imported (draft)" });
      onDataChanged();
    } catch (err) {
      addToast({
        variant: "error",
        title: "Import failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setImporting(false);
    }
  }

  // ──────────────────────────────────────────────────
  // LOGO UPLOAD
  // ──────────────────────────────────────────────────

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);

    try {
      const uploadRes = await fetch(`/api/clients/${clientId}/mockup/logo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to get upload URL");
      }

      const { signedUrl } = await uploadRes.json();

      const putRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!putRes.ok) throw new Error("Failed to upload logo");

      addToast({ variant: "success", title: "Logo uploaded" });
      onDataChanged();
    } catch (err) {
      addToast({
        variant: "error",
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }

  // ──────────────────────────────────────────────────
  // IMPORT MODAL (shared across states)
  // ──────────────────────────────────────────────────

  const importModal = (
    <Modal
      open={importOpen}
      onClose={() => {
        setImportOpen(false);
        setImportJson("");
      }}
      title="Import Mockup Config"
      size="lg"
    >
      <div className="space-y-4">
        <textarea
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
          placeholder="Paste your MockupConfig JSON here..."
          className="w-full min-h-[400px] rounded-lg border border-border bg-background p-3 text-sm text-text-primary font-mono placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-accent/50 resize-y"
          spellCheck={false}
        />
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setImportOpen(false);
              setImportJson("");
            }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleImport}
            disabled={importing || !importJson.trim()}
          >
            {importing ? (
              <>
                <Spinner size="sm" />
                Importing...
              </>
            ) : (
              "Import"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );

  // ──────────────────────────────────────────────────
  // STATE 1: NO COMPILED KB
  // ──────────────────────────────────────────────────

  if (!compiledDoc?.content) {
    return (
      <div className="space-y-4">
        <div className="bg-surface border border-yellow-500/30 rounded-xl p-6 text-center">
          <svg
            className="w-10 h-10 text-yellow-500 mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <h3 className="text-base font-medium text-text-primary mb-1">
            Knowledge Base Required
          </h3>
          <p className="text-sm text-text-muted">
            Compile the Knowledge Base first before generating a homepage mockup.
          </p>
        </div>

        <div className="flex items-center justify-center">
          <Button size="sm" variant="outline" onClick={() => setDebugModalOpen(true)}>
            <WrenchIcon />
            Webflow Debug
          </Button>
        </div>

        <WebflowDebugModal
          open={debugModalOpen}
          onClose={() => setDebugModalOpen(false)}
          clientId={clientId}
          mockup={displayMockup}
          onPushComplete={() => {
            setDebugModalOpen(false);
            onDataChanged();
          }}
        />
      </div>
    );
  }

  // ──────────────────────────────────────────────────
  // STATE 2: HAS KB, NO CONFIG
  // ──────────────────────────────────────────────────

  if (!displayMockup) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-emerald-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Knowledge Base compiled and ready
        </div>

        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <svg
            className="w-12 h-12 text-text-dim mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
            />
          </svg>
          <h3 className="text-lg font-medium text-text-primary mb-2">
            Generate Homepage Mockup
          </h3>
          <p className="text-sm text-text-muted mb-6 max-w-md mx-auto">
            AI will generate a full homepage configuration from the compiled
            knowledge base — all sections, colors, and content.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <>
                  <Spinner size="sm" />
                  Generating...
                </>
              ) : (
                "Generate Config"
              )}
            </Button>
            <Button variant="outline" onClick={handleLoadDemo} disabled={generating}>
              Load Demo
            </Button>
            <Button variant="outline" onClick={() => setImportOpen(true)} disabled={generating}>
              Import Config
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDebugModalOpen(true)}>
              <WrenchIcon />
              Webflow Debug
            </Button>
          </div>
        </div>

        {generating && (
          <div className="bg-surface border border-border rounded-xl p-6 flex items-center justify-center gap-3">
            <Spinner size="md" />
            <p className="text-sm text-text-muted">
              Generating mockup with AI... This may take 15-30 seconds.
            </p>
          </div>
        )}

        <WebflowDebugModal
          open={debugModalOpen}
          onClose={() => setDebugModalOpen(false)}
          clientId={clientId}
          mockup={displayMockup}
          onPushComplete={() => {
            setDebugModalOpen(false);
            onDataChanged();
          }}
        />

        {importModal}
      </div>
    );
  }

  // ──────────────────────────────────────────────────
  // STATE 3 & 4: CONFIG EXISTS (DRAFT or ACTIVE)
  // ──────────────────────────────────────────────────

  const config = displayMockup.config;
  const mj = config.master_json;

  return (
    <div className="space-y-6">
      {/* Header + Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-text-primary">Homepage Mockup</h3>
          <Badge variant={isActive ? "success" : "warning"}>
            {displayMockup.status}
          </Badge>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Primary: Push to Webflow */}
        <Button
          size="sm"
          variant={isDraft ? "primary" : "outline"}
          onClick={handlePush}
          disabled={pushing || generating}
        >
          {pushing ? (
            <>
              <Spinner size="sm" />
              Pushing...
            </>
          ) : isDraft ? (
            "Push to Webflow"
          ) : (
            "Re-push to Webflow"
          )}
        </Button>

        {/* Regenerate */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerate}
          disabled={generating || pushing}
        >
          {generating ? (
            <>
              <Spinner size="sm" />
              Generating...
            </>
          ) : (
            "Regenerate"
          )}
        </Button>

        {/* Import Config */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setImportOpen(true)}
          disabled={generating || pushing}
        >
          Import Config
        </Button>

        {/* Copy Prompt + KB */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopyPrompt}
          disabled={copyingPrompt}
        >
          {copyingPrompt ? (
            <>
              <Spinner size="sm" />
              Copying...
            </>
          ) : (
            <>
              <ClipboardIcon />
              Copy Prompt + KB
            </>
          )}
        </Button>

        {/* Webflow Debug */}
        <Button size="sm" variant="outline" onClick={() => setDebugModalOpen(true)}>
          <WrenchIcon />
          Webflow Debug
        </Button>
      </div>

      {/* Loading states */}
      {(generating || pushing) && (
        <div className="bg-surface border border-border rounded-xl p-6 flex items-center justify-center gap-3">
          <Spinner size="md" />
          <p className="text-sm text-text-muted">
            {generating
              ? "Generating mockup with AI... This may take 15-30 seconds."
              : "Pushing to Webflow..."}
          </p>
        </div>
      )}

      {/* Webflow Preview Link */}
      {displayMockup.webflow_url && (
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-xs text-text-dim mb-1">Preview URL</p>
          <a
            href={displayMockup.webflow_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent hover:underline inline-flex items-center gap-1.5"
          >
            {displayMockup.webflow_url}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}

      {/* Logo Upload */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <p className="text-xs text-text-dim mb-3">Logo</p>
        <div className="flex items-center gap-4">
          {displayMockup.logo_url ? (
            <div className="w-16 h-16 rounded-lg border border-border bg-white/5 flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayMockup.logo_url}
                alt="Client logo"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-lg border border-dashed border-border flex items-center justify-center">
              <svg className="w-6 h-6 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" />
              </svg>
            </div>
          )}
          <div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
            >
              {uploadingLogo ? (
                <>
                  <Spinner size="sm" />
                  Uploading...
                </>
              ) : displayMockup.logo_url ? (
                "Replace Logo"
              ) : (
                "Upload Logo"
              )}
            </Button>
            <p className="text-xs text-text-dim mt-1">SVG, PNG, or JPG recommended</p>
          </div>
          <input
            ref={logoInputRef}
            type="file"
            className="hidden"
            onChange={handleLogoUpload}
            accept="image/*,.svg"
          />
        </div>
      </div>

      {/* Config Viewer */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setConfigExpanded(!configExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
        >
          <p className="text-xs text-text-dim">Generated Config</p>
          <svg
            className={`w-4 h-4 text-text-dim transition-transform ${configExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {configExpanded && (
          <div className="border-t border-border p-4 space-y-4">
            <ConfigSection title="Hero">
              <ConfigField label="Variant" value={config.hero_variant} />
              <ConfigField label="Tag" value={config.hero_tag} />
              <ConfigField label="Heading" value={config.hero_heading} />
              <ConfigField label="Paragraph" value={config.hero_paragraph} />
              <ConfigField label="Button 1" value={config.hero_button_1_text} />
              <ConfigField label="Button 2" value={config.hero_button_2_text || "(empty)"} />
            </ConfigSection>

            <ConfigSection title={`Navbar (${config.navbar_variant})`}>
              <ConfigField
                label="Top Bar"
                value={mj?.navbar?.top_bar?.show ? "Visible" : "Hidden"}
              />
              {mj?.navbar?.top_bar?.show && mj?.navbar?.top_bar?.map?.show && (
                <ConfigField label="Map" value={mj.navbar.top_bar.map.text || "(empty)"} />
              )}
              <ConfigField label="Phone" value={mj?.config?.phone || "(empty)"} />
              <ConfigField label="CTA" value={mj?.navbar?.cta?.text || "(empty)"} />
              <ConfigField
                label="Links"
                value={
                  mj?.navbar?.nav_links
                    ?.map((l) => ("dropdown" in l ? `${l.text} (dropdown)` : l.text))
                    .join(", ") || "(none)"
                }
              />
            </ConfigSection>

            <ConfigSection title={`Services (${config.services_variant})`}>
              <ConfigField label="Tag" value={config.services_tag} />
              <ConfigField label="Heading" value={config.services_heading} />
              <ConfigField label="Cards" value={`${mj?.services?.cards?.length ?? 0} cards`} />
              {mj?.services?.cards?.map((card, i) => (
                <ConfigField key={i} label={`Card ${i + 1}`} value={card.heading} />
              ))}
            </ConfigSection>

            <ConfigSection title={`Process (${config.process_variant})`}>
              <ConfigField label="Tag" value={config.process_tag} />
              <ConfigField label="Heading" value={config.process_heading} />
              {mj?.process?.steps?.map((step, i) => (
                <ConfigField key={i} label={`Step ${i + 1}`} value={step.heading} />
              ))}
            </ConfigSection>

            <ConfigSection title="About">
              <ConfigField label="Tag" value={config.about_tag} />
              <ConfigField label="Heading" value={config.about_heading} />
              <ConfigField label="Button 1" value={config.about_button_1 || "(empty)"} />
              <ConfigField label="Button 2" value={config.about_button_2 || "(empty)"} />
            </ConfigSection>

            <ConfigSection title={config.stats_benefits_visibility}>
              {mj?.stats_benefits?.cards?.map((card, i) => (
                <div key={i} className="flex items-start gap-3 py-1">
                  {card.icon_svg && (
                    <div
                      className="w-5 h-5 flex-shrink-0 text-text-muted [&>svg]:w-full [&>svg]:h-full"
                      dangerouslySetInnerHTML={{ __html: card.icon_svg }}
                    />
                  )}
                  <div>
                    <span className="text-xs font-medium text-text-primary">{card.heading}</span>
                    <span className="text-xs text-text-muted ml-2">{card.paragraph}</span>
                  </div>
                </div>
              ))}
            </ConfigSection>

            <ConfigSection title="Testimonials">
              <ConfigField label="Tag" value={config.testimonials_tag} />
              <ConfigField label="Heading" value={config.testimonials_heading} />
              <ConfigField
                label="Reviews"
                value={`${(mj?.testimonials?.top_row?.length ?? 0) + (mj?.testimonials?.bottom_row?.length ?? 0)} total`}
              />
            </ConfigSection>

            <ConfigSection title={`FAQ (${config.faq_variant})`}>
              <ConfigField label="Tag" value={config.faq_tag} />
              <ConfigField label="Heading" value={config.faq_heading} />
              <ConfigField label="Items" value={`${mj?.faq?.items?.length ?? 0} questions`} />
            </ConfigSection>

            <ConfigSection title="CTA">
              <ConfigField label="Tag" value={config.cta_tag} />
              <ConfigField label="Heading" value={config.cta_heading} />
              <ConfigField label="Button 1" value={config.cta_button_1 || "(empty)"} />
              <ConfigField label="Button 2" value={config.cta_button_2 || "(empty)"} />
            </ConfigSection>

            <ConfigSection title={`Contact (${config.contact_variant})`}>
              <ConfigField label="Tag" value={config.contact_tag} />
              <ConfigField label="Heading" value={config.contact_heading} />
              <ConfigField label="Submit" value={mj?.contact?.form?.submit_button || "(default)"} />
            </ConfigSection>

            <ConfigSection title={`Footer (${config.footer_variant})`}>
              <ConfigField label="Company" value={mj?.config?.company || "(empty)"} />
              <ConfigField label="Phone" value={mj?.config?.phone || "(empty)"} />
              <ConfigField label="Email" value={mj?.config?.email || "(empty)"} />
              {config.footer_variant === "Full" &&
                (mj?.footer?.footer_groups?.length ?? 0) > 0 && (
                  <ConfigField
                    label="Groups"
                    value={mj.footer.footer_groups.map((g) => g.heading).join(", ")}
                  />
                )}
            </ConfigSection>

            <ConfigSection title={`CSS (${config.css?.theme ?? "light"} theme)`}>
              <div className="flex items-center gap-2 py-1">
                <div
                  className="w-4 h-4 rounded border border-border"
                  style={{ backgroundColor: config.css?.brand_1 }}
                />
                <span className="text-xs text-text-muted">Brand 1: {config.css?.brand_1}</span>
              </div>
              <div className="flex items-center gap-2 py-1">
                <div
                  className="w-4 h-4 rounded border border-border"
                  style={{ backgroundColor: config.css?.brand_2 }}
                />
                <span className="text-xs text-text-muted">Brand 2: {config.css?.brand_2}</span>
              </div>
              <ConfigField label="Radius" value={config.css?.radius ?? "rounded"} />
            </ConfigSection>
          </div>
        )}
      </div>

      {/* Timestamp */}
      <p className="text-xs text-text-dim text-right">
        Last updated:{" "}
        {new Date(displayMockup.updated_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
      </p>

      {/* Debug Modal */}
      <WebflowDebugModal
        open={debugModalOpen}
        onClose={() => setDebugModalOpen(false)}
        clientId={clientId}
        mockup={displayMockup}
        onPushComplete={() => {
          setDebugModalOpen(false);
          onDataChanged();
        }}
      />

      {/* Import Modal */}
      {importModal}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ════════════════════════════════════════════════════════════

function ConfigSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-xs font-medium text-text-primary mb-2">{title}</h4>
      <div className="space-y-1 pl-3 border-l border-border">{children}</div>
    </div>
  );
}

function ConfigField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 text-xs">
      <span className="text-text-dim min-w-[80px]">{label}</span>
      <span className="text-text-muted">{value}</span>
    </div>
  );
}

function WrenchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.42 15.17l-5.67 5.66a2.12 2.12 0 01-3-3l5.66-5.67M18.36 8.64a4.24 4.24 0 01-6 6l-1.42-1.42a4.24 4.24 0 016-6l1.42 1.42z"
      />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
      />
    </svg>
  );
}
