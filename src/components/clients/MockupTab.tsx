"use client";

import { useState, useRef } from "react";
import { Button, Badge, Spinner, useToast } from "@/components/ui";
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
  const [pushingDemo, setPushingDemo] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [localMockup, setLocalMockup] = useState<ClientMockup | null>(mockup);
  const [configExpanded, setConfigExpanded] = useState(false);

  const displayMockup = localMockup ?? mockup;

  // ──────────────────────────────────────────────────
  // GENERATE
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
      addToast({ variant: "success", title: "Homepage mockup generated" });
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
  // PUSH DEMO DATA
  // ──────────────────────────────────────────────────

  async function handlePushDemo() {
    setPushingDemo(true);

    try {
      const res = await fetch(`/api/clients/${clientId}/mockup/demo`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to push demo data");
      }

      const data = await res.json();
      setLocalMockup(data.mockup);
      addToast({
        variant: "success",
        title: "Demo data pushed to Webflow",
      });
      onDataChanged();
    } catch (err) {
      addToast({
        variant: "error",
        title: "Demo push failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setPushingDemo(false);
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
      // Step 1: Get signed upload URL
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

      // Step 2: Upload file
      const putRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!putRes.ok) {
        throw new Error("Failed to upload logo");
      }

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
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
    }
  }

  // ──────────────────────────────────────────────────
  // NO COMPILED KB
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
            The AI uses the compiled document as context.
          </p>
        </div>

        {/* Demo push still available without KB */}
        <div className="bg-surface border border-dashed border-border rounded-xl p-4 text-center">
          <p className="text-xs text-text-dim mb-3">
            Or push demo data to test the Webflow integration without AI
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={handlePushDemo}
            disabled={pushingDemo}
          >
            {pushingDemo ? (
              <>
                <Spinner size="sm" />
                Pushing Demo...
              </>
            ) : (
              "Push Demo Data"
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────
  // NO MOCKUP YET
  // ──────────────────────────────────────────────────

  if (!displayMockup) {
    return (
      <div className="space-y-4">
        {/* KB Ready indicator */}
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
            <Button onClick={handleGenerate} disabled={generating || pushingDemo}>
              {generating ? (
                <>
                  <Spinner size="sm" />
                  Generating...
                </>
              ) : (
                "Generate Homepage Mockup"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handlePushDemo}
              disabled={generating || pushingDemo}
            >
              {pushingDemo ? (
                <>
                  <Spinner size="sm" />
                  Pushing...
                </>
              ) : (
                "Push Demo Data"
              )}
            </Button>
          </div>
        </div>

        {(generating || pushingDemo) && (
          <div className="bg-surface border border-border rounded-xl p-6 flex items-center justify-center gap-3">
            <Spinner size="md" />
            <p className="text-sm text-text-muted">
              {generating
                ? "Generating mockup with AI... This may take 15-30 seconds."
                : "Pushing demo data to Webflow..."}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────────
  // MOCKUP EXISTS
  // ──────────────────────────────────────────────────

  const config = displayMockup.config;
  const mj = config.master_json;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-text-primary">
            Homepage Mockup
          </h3>
          <Badge
            variant={displayMockup.status === "active" ? "success" : "default"}
          >
            {displayMockup.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePushDemo}
            disabled={generating || pushingDemo}
          >
            {pushingDemo ? (
              <>
                <Spinner size="sm" />
                Pushing...
              </>
            ) : (
              "Push Demo"
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerate}
            disabled={generating || pushingDemo}
          >
            {generating ? (
              <>
                <Spinner size="sm" />
                Regenerating...
              </>
            ) : (
              "Regenerate"
            )}
          </Button>
        </div>
      </div>

      {(generating || pushingDemo) && (
        <div className="bg-surface border border-border rounded-xl p-6 flex items-center justify-center gap-3">
          <Spinner size="md" />
          <p className="text-sm text-text-muted">
            {generating
              ? "Regenerating mockup with AI... This may take 15-30 seconds."
              : "Pushing demo data to Webflow..."}
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
            <p className="text-xs text-text-dim mt-1">
              SVG, PNG, or JPG recommended
            </p>
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
            {/* Hero */}
            <ConfigSection title="Hero">
              <ConfigField label="Variant" value={config.hero_variant} />
              <ConfigField label="Tag" value={config.hero_tag} />
              <ConfigField label="Heading" value={config.hero_heading} />
              <ConfigField label="Paragraph" value={config.hero_paragraph} />
              <ConfigField label="Button 1" value={config.hero_button_1_text} />
              <ConfigField label="Button 2" value={config.hero_button_2_text || "(empty)"} />
            </ConfigSection>

            {/* Navbar */}
            <ConfigSection title={`Navbar (${config.navbar_variant})`}>
              <ConfigField
                label="Top Bar"
                value={mj?.navbar?.top_bar?.show ? "Visible" : "Hidden"}
              />
              {mj?.navbar?.top_bar?.show && mj?.navbar?.top_bar?.map?.show && (
                <ConfigField
                  label="Map"
                  value={mj.navbar.top_bar.map.text || "(empty)"}
                />
              )}
              <ConfigField
                label="Phone"
                value={mj?.config?.phone || "(empty)"}
              />
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

            {/* Services */}
            <ConfigSection title={`Services (${config.services_variant})`}>
              <ConfigField label="Tag" value={config.services_tag} />
              <ConfigField label="Heading" value={config.services_heading} />
              <ConfigField
                label="Cards"
                value={`${mj?.services?.cards?.length ?? 0} cards`}
              />
              {mj?.services?.cards?.map((card, i) => (
                <ConfigField
                  key={i}
                  label={`Card ${i + 1}`}
                  value={card.heading}
                />
              ))}
            </ConfigSection>

            {/* Process */}
            <ConfigSection title={`Process (${config.process_variant})`}>
              <ConfigField label="Tag" value={config.process_tag} />
              <ConfigField label="Heading" value={config.process_heading} />
              {mj?.process?.steps?.map((step, i) => (
                <ConfigField
                  key={i}
                  label={`Step ${i + 1}`}
                  value={step.heading}
                />
              ))}
            </ConfigSection>

            {/* About */}
            <ConfigSection title="About">
              <ConfigField label="Tag" value={config.about_tag} />
              <ConfigField label="Heading" value={config.about_heading} />
              <ConfigField label="Button 1" value={config.about_button_1 || "(empty)"} />
              <ConfigField label="Button 2" value={config.about_button_2 || "(empty)"} />
            </ConfigSection>

            {/* Stats/Benefits */}
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
                    <span className="text-xs font-medium text-text-primary">
                      {card.heading}
                    </span>
                    <span className="text-xs text-text-muted ml-2">
                      {card.paragraph}
                    </span>
                  </div>
                </div>
              ))}
            </ConfigSection>

            {/* Testimonials */}
            <ConfigSection title="Testimonials">
              <ConfigField label="Tag" value={config.testimonials_tag} />
              <ConfigField label="Heading" value={config.testimonials_heading} />
              <ConfigField
                label="Reviews"
                value={`${(mj?.testimonials?.top_row?.length ?? 0) + (mj?.testimonials?.bottom_row?.length ?? 0)} total`}
              />
            </ConfigSection>

            {/* FAQ */}
            <ConfigSection title={`FAQ (${config.faq_variant})`}>
              <ConfigField label="Tag" value={config.faq_tag} />
              <ConfigField label="Heading" value={config.faq_heading} />
              <ConfigField
                label="Items"
                value={`${mj?.faq?.items?.length ?? 0} questions`}
              />
            </ConfigSection>

            {/* CTA */}
            <ConfigSection title="CTA">
              <ConfigField label="Tag" value={config.cta_tag} />
              <ConfigField label="Heading" value={config.cta_heading} />
              <ConfigField label="Button 1" value={config.cta_button_1 || "(empty)"} />
              <ConfigField label="Button 2" value={config.cta_button_2 || "(empty)"} />
            </ConfigSection>

            {/* Contact */}
            <ConfigSection title={`Contact (${config.contact_variant})`}>
              <ConfigField label="Tag" value={config.contact_tag} />
              <ConfigField label="Heading" value={config.contact_heading} />
              <ConfigField
                label="Submit"
                value={mj?.contact?.form?.submit_button || "(default)"}
              />
            </ConfigSection>

            {/* Footer */}
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

            {/* CSS */}
            <ConfigSection title={`CSS (${config.css?.theme ?? "light"} theme)`}>
              <div className="flex items-center gap-2 py-1">
                <div
                  className="w-4 h-4 rounded border border-border"
                  style={{ backgroundColor: config.css?.brand_1 }}
                />
                <span className="text-xs text-text-muted">
                  Brand 1: {config.css?.brand_1}
                </span>
              </div>
              <div className="flex items-center gap-2 py-1">
                <div
                  className="w-4 h-4 rounded border border-border"
                  style={{ backgroundColor: config.css?.brand_2 }}
                />
                <span className="text-xs text-text-muted">
                  Brand 2: {config.css?.brand_2}
                </span>
              </div>
              <ConfigField label="Radius" value={config.css?.radius ?? "rounded"} />
            </ConfigSection>
          </div>
        )}
      </div>

      {/* Timestamp */}
      <p className="text-xs text-text-dim text-right">
        Last generated:{" "}
        {new Date(displayMockup.updated_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
      </p>
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
