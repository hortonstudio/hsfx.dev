"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Button,
  Spinner,
  Badge,
  EmptyState,
  Modal,
} from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { generateMarkdown } from "@/lib/onboard/markdown";
import { GenerateOnboardModal } from "./GenerateOnboardModal";
import type { Client } from "@/lib/clients/types";
import type {
  OnboardConfig,
  OnboardSubmission,
  ReviewStatus,
  AnswerValue,
  AddressValue,
  YesNoNAValue,
  TeamMember,
  ProjectGalleryValue,
  BrandColorsValue,
  QuestionConfig,
} from "@/lib/onboard/types";

// ════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════

interface OnboardingTabProps {
  client: Client;
  configs: OnboardConfig[];
  submissions: OnboardSubmission[];
  compiledKB: string | null;
  onDataChanged: () => void;
}

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

const STATUS_VARIANTS: Record<string, "success" | "warning" | "default"> = {
  active: "success",
  draft: "warning",
  archived: "default",
  submitted: "success",
  in_progress: "warning",
};

function formatAnswerDisplay(
  question: QuestionConfig,
  answer: AnswerValue,
  fileUrls?: string[]
): React.ReactNode {
  // File uploads: use file_urls if available
  if (question.type === "file_upload") {
    const urls =
      fileUrls && fileUrls.length > 0
        ? fileUrls
        : Array.isArray(answer)
          ? (answer as string[])
          : [];
    if (urls.length === 0) {
      return <span className="text-text-dim italic">No files uploaded</span>;
    }
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {urls.map((url, idx) => (
          <a
            key={idx}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block relative aspect-square rounded-lg overflow-hidden bg-background border border-border hover:border-accent/50 transition-colors"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`File ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          </a>
        ))}
      </div>
    );
  }

  if (answer === null || answer === undefined) {
    return <span className="text-text-dim italic">Not answered</span>;
  }

  switch (question.type) {
    case "text":
    case "textarea":
      return typeof answer === "string" && answer.trim() ? (
        <p className="text-text-secondary whitespace-pre-wrap">{answer}</p>
      ) : (
        <span className="text-text-dim italic">Not answered</span>
      );

    case "select":
      return typeof answer === "string" && answer.trim() ? (
        <Badge variant="info">{answer}</Badge>
      ) : (
        <span className="text-text-dim italic">Not selected</span>
      );

    case "multi_select":
      if (Array.isArray(answer) && answer.length > 0) {
        return (
          <div className="flex flex-wrap gap-2">
            {(answer as string[]).map((val) => (
              <Badge key={val} variant="info">
                {val}
              </Badge>
            ))}
          </div>
        );
      }
      return <span className="text-text-dim italic">None selected</span>;

    case "yes_no":
      if (typeof answer === "boolean") {
        return (
          <Badge variant={answer ? "success" : "error"}>
            {answer ? "Yes" : "No"}
          </Badge>
        );
      }
      return <span className="text-text-dim italic">Not answered</span>;

    case "color_picker":
    case "color_confirm":
      if (typeof answer === "string" && answer.trim()) {
        return (
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md border border-white/20"
              style={{ backgroundColor: answer }}
            />
            <span className="text-text-secondary font-mono text-sm">
              {answer}
            </span>
          </div>
        );
      }
      return <span className="text-text-dim italic">No color selected</span>;

    case "address": {
      if (typeof answer === "object" && !Array.isArray(answer)) {
        const addr = answer as AddressValue;
        const parts = [addr.street, addr.city, addr.state, addr.zip].filter(
          (p) => p?.trim()
        );
        if (parts.length > 0) {
          return <p className="text-text-secondary">{parts.join(", ")}</p>;
        }
      }
      return <span className="text-text-dim italic">No address provided</span>;
    }

    case "yes_no_na": {
      if (
        typeof answer === "object" &&
        !Array.isArray(answer) &&
        "answer" in answer
      ) {
        const val = answer as YesNoNAValue;
        const label =
          val.answer === "yes"
            ? "Yes"
            : val.answer === "no"
              ? "No"
              : "N/A";
        const variant =
          val.answer === "yes"
            ? "success"
            : val.answer === "no"
              ? "error"
              : "default";
        return (
          <div>
            <Badge variant={variant as "success" | "error" | "default"}>
              {label}
            </Badge>
            {val.details && (
              <p className="text-text-secondary text-sm mt-1">{val.details}</p>
            )}
          </div>
        );
      }
      return <span className="text-text-dim italic">Not answered</span>;
    }

    case "team_members": {
      if (Array.isArray(answer) && answer.length > 0) {
        const members = answer as TeamMember[];
        return (
          <div className="space-y-2">
            {members.map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                {m.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.photoUrl}
                    alt={m.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-text-dim text-xs">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-text-secondary text-sm font-medium">
                    {m.name}
                  </p>
                  {m.bio && (
                    <p className="text-text-dim text-xs">{m.bio}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      }
      return (
        <span className="text-text-dim italic">No team members added</span>
      );
    }

    case "project_gallery": {
      if (
        typeof answer === "object" &&
        !Array.isArray(answer) &&
        "projects" in answer
      ) {
        const val = answer as ProjectGalleryValue;
        if (val.projects.length === 0 && val.photos.length === 0) {
          return (
            <span className="text-text-dim italic">No projects added</span>
          );
        }
        return (
          <div className="space-y-4">
            {val.projects.map((project, pi) => (
              <div key={pi} className="space-y-2">
                {project.title && (
                  <p className="text-text-secondary text-sm font-medium">
                    {project.title}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {project.beforePhotos.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-text-dim text-xs font-medium uppercase tracking-wider">
                        Before
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {project.beforePhotos.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block relative aspect-square rounded-lg overflow-hidden bg-background border border-border hover:border-accent/50 transition-colors"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`Before ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {project.afterPhotos.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-text-dim text-xs font-medium uppercase tracking-wider">
                        After
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {project.afterPhotos.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block relative aspect-square rounded-lg overflow-hidden bg-background border border-border hover:border-accent/50 transition-colors"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`After ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {val.photos.length > 0 && (
              <div className="space-y-1">
                {val.projects.length > 0 && (
                  <p className="text-text-dim text-xs font-medium uppercase tracking-wider">
                    General Photos
                  </p>
                )}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {val.photos.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative aspect-square rounded-lg overflow-hidden bg-background border border-border hover:border-accent/50 transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }
      return <span className="text-text-dim italic">No projects added</span>;
    }

    case "brand_colors": {
      if (
        typeof answer === "object" &&
        !Array.isArray(answer) &&
        "theme" in answer
      ) {
        const val = answer as BrandColorsValue;
        const allColors = [...val.keptColors, ...val.customColors];
        return (
          <div className="space-y-2">
            {val.theme && <Badge variant="info">{val.theme} theme</Badge>}
            {allColors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {allColors.map((hex, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div
                      className="w-5 h-5 rounded border border-white/20"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-text-secondary font-mono text-xs">
                      {hex}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {val.description?.trim() && (
              <p className="text-text-secondary text-sm">{val.description}</p>
            )}
          </div>
        );
      }
      return (
        <span className="text-text-dim italic">
          No brand colors configured
        </span>
      );
    }

    case "tag_input": {
      if (Array.isArray(answer) && answer.length > 0) {
        return (
          <div className="flex flex-wrap gap-2">
            {(answer as string[]).map((tag) => (
              <Badge key={tag} variant="info">
                {tag}
              </Badge>
            ))}
          </div>
        );
      }
      return <span className="text-text-dim italic">No items added</span>;
    }

    default:
      return <span className="text-text-secondary">{String(answer)}</span>;
  }
}

function downloadMarkdown(config: OnboardConfig, submission: OnboardSubmission) {
  const md = generateMarkdown(config, submission);
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${config.client_slug}-onboarding.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ════════════════════════════════════════════════════════════
// CONFIG CARD (adapted for client detail page)
// ════════════════════════════════════════════════════════════

function ConfigCard({
  config,
  clientId,
  onDelete,
  onStatusChange,
}: {
  config: OnboardConfig;
  clientId: string;
  onDelete: (id: string) => void | Promise<void>;
  onStatusChange: () => void | Promise<void>;
}) {
  const formUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/onboard/${config.client_slug}`;
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [activating, setActivating] = useState(false);

  const questionCount = config.config?.questions?.length ?? 0;

  async function copyUrl() {
    await navigator.clipboard.writeText(formUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          client_id: clientId,
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

  return (
    <>
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-base font-medium text-text-primary">
              {config.client_name}
            </h3>
            <p className="text-sm text-text-muted">{config.business_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={STATUS_VARIANTS[config.status] ?? "default"}
              dot
              size="sm"
            >
              {config.status}
            </Badge>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="p-1 rounded transition-colors text-text-dim hover:text-red-400"
              title="Delete config"
            >
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <p className="text-xs text-text-dim font-mono mb-1">
          /{config.client_slug}
        </p>
        {config.client_email && (
          <p className="text-xs text-text-dim mb-1">{config.client_email}</p>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mt-3 mb-4 text-sm">
          <div>
            <p className="text-text-dim text-xs mb-0.5">Questions</p>
            <p className="text-text-primary font-medium">{questionCount}</p>
          </div>
          <div>
            <p className="text-text-dim text-xs mb-0.5">Created</p>
            <p className="text-text-primary font-medium">
              {new Date(config.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-text-dim text-xs mb-0.5">Form URL</p>
            <button
              type="button"
              onClick={copyUrl}
              className="text-text-primary font-medium hover:text-accent transition-colors flex items-center gap-1"
            >
              {copied ? (
                <>
                  <svg
                    className="w-3.5 h-3.5 text-green-400"
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
                  Copied
                </>
              ) : (
                <>
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
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action buttons for draft configs */}
        {config.status === "draft" && (
          <div className="flex items-center gap-2">
            <Link
              href={`/onboard/${config.client_slug}/preview`}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border bg-surface text-text-muted hover:border-accent/50 hover:text-accent transition-colors"
            >
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Preview
            </Link>
            {config.client_email && (
              <button
                type="button"
                onClick={() => setActivateOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors"
              >
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Activate &amp; Send
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Config"
      >
        <div className="mt-4 space-y-4">
          <p className="text-sm text-text-muted">
            Are you sure you want to delete{" "}
            <span className="text-text-primary font-medium">
              {config.business_name}
            </span>{" "}
            ({config.client_slug})? This will also delete all submissions and
            cannot be undone.
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

      {/* Activate confirmation modal */}
      <Modal
        open={activateOpen}
        onClose={() => setActivateOpen(false)}
        title="Activate & Send Invitation"
      >
        <div className="mt-4 space-y-4">
          <p className="text-sm text-text-muted">
            This will activate{" "}
            <span className="text-text-primary font-medium">
              {config.business_name}
            </span>{" "}
            and send an invitation email to{" "}
            <span className="text-text-primary font-medium">
              {config.client_email}
            </span>
            .
          </p>
          <p className="text-xs text-text-dim">
            The client will receive a magic link to access their onboarding
            form. Make sure you&apos;ve previewed the form before activating.
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
// INLINE SUBMISSION VIEWER
// ════════════════════════════════════════════════════════════

function SubmissionViewer({
  config,
  submission,
}: {
  config: OnboardConfig;
  submission: OnboardSubmission;
}) {
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>(
    submission.review_status ?? "new"
  );
  const [updating, setUpdating] = useState(false);

  async function updateReviewStatus(newStatus: string) {
    setUpdating(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("onboard_submissions")
      .update({
        review_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submission.id);

    if (!error) setReviewStatus(newStatus as ReviewStatus);
    setUpdating(false);
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Submission header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Badge
            variant={STATUS_VARIANTS[submission.status] ?? "default"}
            dot
            size="sm"
          >
            {submission.status === "submitted" ? "Submitted" : "In Progress"}
          </Badge>
          <select
            value={reviewStatus}
            onChange={(e) => updateReviewStatus(e.target.value)}
            disabled={updating}
            className="text-xs bg-surface border border-border rounded-md px-2 py-1 text-text-secondary focus:outline-none focus:border-accent"
          >
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="in_progress">In Review</option>
            <option value="complete">Complete</option>
          </select>
          {submission.submitted_at && (
            <span className="text-xs text-text-dim">
              {new Date(submission.submitted_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => downloadMarkdown(config, submission)}
        >
          <svg
            className="w-4 h-4 mr-1.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download MD
        </Button>
      </div>

      {/* Q&A pairs */}
      <div className="divide-y divide-border">
        {config.config.questions.map((question) => {
          const answer = submission.answers[question.id] ?? null;
          const fileUrls = submission.file_urls?.[question.id];
          return (
            <div key={question.id} className="px-5 py-4">
              <h4 className="text-sm font-medium text-text-primary mb-2">
                {question.question}
              </h4>
              <div>{formatAnswerDisplay(question, answer, fileUrls)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════

export function OnboardingTab({
  client,
  configs,
  submissions,
  compiledKB,
  onDataChanged,
}: OnboardingTabProps) {
  const [generateModalOpen, setGenerateModalOpen] = useState(false);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/onboard/config?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      onDataChanged();
    }
  }

  // ── State 1: No config exists ──────────────────────────
  if (configs.length === 0) {
    return (
      <>
        <EmptyState
          title="No onboarding form yet"
          description="No onboarding form has been created for this client yet. Generate one using AI and the client's knowledge base."
          action={
            <Button onClick={() => setGenerateModalOpen(true)}>
              <svg
                className="w-4 h-4 mr-2"
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
              Generate Onboarding Form
            </Button>
          }
        />

        <GenerateOnboardModal
          open={generateModalOpen}
          onClose={() => setGenerateModalOpen(false)}
          client={client}
          compiledKB={compiledKB}
          onCreated={onDataChanged}
        />
      </>
    );
  }

  // ── State 2 & 3: Config(s) exist ──────────────────────
  return (
    <>
      <div className="space-y-6">
        {/* Action bar */}
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium text-text-dim uppercase tracking-widest">
            Onboarding Forms
          </h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setGenerateModalOpen(true)}
          >
            <svg
              className="w-4 h-4 mr-1.5"
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
            New Form
          </Button>
        </div>

        {/* Config cards */}
        {configs.map((config) => {
          const configSubmissions = submissions.filter(
            (s) => s.config_id === config.id
          );

          return (
            <div key={config.id} className="space-y-4">
              <ConfigCard
                config={config}
                clientId={client.id}
                onDelete={handleDelete}
                onStatusChange={onDataChanged}
              />

              {/* Submissions for this config */}
              {configSubmissions.length > 0 && (
                <div className="space-y-4 ml-4 pl-4 border-l-2 border-border">
                  <h3 className="text-xs font-medium text-text-dim uppercase tracking-widest">
                    Submissions ({configSubmissions.length})
                  </h3>
                  {configSubmissions.map((sub) => (
                    <SubmissionViewer
                      key={sub.id}
                      config={config}
                      submission={sub}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <GenerateOnboardModal
        open={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        client={client}
        compiledKB={compiledKB}
        onCreated={onDataChanged}
      />
    </>
  );
}
