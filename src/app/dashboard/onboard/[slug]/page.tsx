"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { createClient } from "@/lib/supabase/client";
import {
  Button,
  Spinner,
  Badge,
  EmptyState,
  GridBackground,
  PageTransition,
  CursorGlow,
} from "@/components/ui";
import Navbar from "@/components/layout/Navbar";
import { generateMarkdown } from "@/lib/onboard/markdown";
import type {
  OnboardConfig,
  OnboardSubmission,
  AnswerValue,
  AddressValue,
  YesNoNAValue,
  TeamMember,
  ProjectGalleryValue,
  BrandColorsValue,
  QuestionConfig,
} from "@/lib/onboard/types";

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
    const urls = fileUrls && fileUrls.length > 0 ? fileUrls : (Array.isArray(answer) ? answer as string[] : []);
    if (urls.length === 0) {
      return <span className="text-text-dim italic">No files uploaded</span>;
    }
    return (
      <div className="space-y-1">
        {urls.map((url, idx) => (
          <a
            key={idx}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-accent hover:underline truncate"
          >
            {url.split("/").pop() ?? url}
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
            <span className="text-text-secondary font-mono text-sm">{answer}</span>
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
      if (typeof answer === "object" && !Array.isArray(answer) && "answer" in answer) {
        const val = answer as YesNoNAValue;
        const label = val.answer === "yes" ? "Yes" : val.answer === "no" ? "No" : "N/A";
        const variant = val.answer === "yes" ? "success" : val.answer === "no" ? "error" : "default";
        return (
          <div>
            <Badge variant={variant as "success" | "error" | "default"}>{label}</Badge>
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
                  <img src={m.photoUrl} alt={m.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-text-dim text-xs">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-text-secondary text-sm font-medium">{m.name}</p>
                  {m.bio && <p className="text-text-dim text-xs">{m.bio}</p>}
                </div>
              </div>
            ))}
          </div>
        );
      }
      return <span className="text-text-dim italic">No team members added</span>;
    }

    case "project_gallery": {
      if (typeof answer === "object" && !Array.isArray(answer) && "projects" in answer) {
        const val = answer as ProjectGalleryValue;
        const parts: string[] = [];
        if (val.projects.length > 0) parts.push(`${val.projects.length} project(s)`);
        if (val.photos.length > 0) parts.push(`${val.photos.length} photo(s)`);
        if (parts.length > 0) {
          return <p className="text-text-secondary text-sm">{parts.join(", ")}</p>;
        }
      }
      return <span className="text-text-dim italic">No projects added</span>;
    }

    case "brand_colors": {
      if (typeof answer === "object" && !Array.isArray(answer) && "theme" in answer) {
        const val = answer as BrandColorsValue;
        const allColors = [...val.keptColors, ...val.customColors];
        return (
          <div className="space-y-2">
            {val.theme && (
              <Badge variant="info">{val.theme} theme</Badge>
            )}
            {allColors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {allColors.map((hex, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div
                      className="w-5 h-5 rounded border border-white/20"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-text-secondary font-mono text-xs">{hex}</span>
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
      return <span className="text-text-dim italic">No brand colors configured</span>;
    }

    case "tag_input": {
      if (Array.isArray(answer) && answer.length > 0) {
        return (
          <div className="flex flex-wrap gap-2">
            {(answer as string[]).map((tag) => (
              <Badge key={tag} variant="info">{tag}</Badge>
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
// SUBMISSION CARD
// ════════════════════════════════════════════════════════════

function SubmissionCard({
  config,
  submission,
}: {
  config: OnboardConfig;
  submission: OnboardSubmission;
}) {
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
// PAGE CONTENT
// ════════════════════════════════════════════════════════════

function SubmissionViewerContent({ slug }: { slug: string }) {
  const [config, setConfig] = useState<OnboardConfig | null>(null);
  const [submissions, setSubmissions] = useState<OnboardSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const { data: configData, error: configError } = await supabase
        .from("onboard_configs")
        .select("*")
        .eq("client_slug", slug)
        .single();

      if (configError) {
        console.error("Error fetching config:", configError);
        setLoading(false);
        return;
      }

      setConfig(configData as OnboardConfig);

      const { data: submissionData } = await supabase
        .from("onboard_submissions")
        .select("*")
        .eq("client_slug", slug)
        .order("created_at", { ascending: false });

      setSubmissions((submissionData as OnboardSubmission[]) ?? []);
      setLoading(false);
    }

    fetchData();
  }, [slug]);

  async function copyFormUrl() {
    const url = `${window.location.origin}/onboard/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!config) {
    return (
      <EmptyState
        title="Config not found"
        description={`No onboarding config found for slug "${slug}".`}
        action={
          <Link href="/dashboard/onboard">
            <Button>Back to Onboarding</Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/onboard"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Onboarding
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-serif text-3xl md:text-4xl text-text-primary">
                {config.client_name}
              </h1>
              <Badge variant={STATUS_VARIANTS[config.status] ?? "default"} dot>
                {config.status}
              </Badge>
            </div>
            <p className="text-text-muted">{config.business_name}</p>
          </div>
          <Button variant="ghost" onClick={copyFormUrl}>
            {copied ? (
              <>
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Form URL
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Config summary card */}
      <div className="bg-surface border border-border rounded-xl p-5 mb-8">
        <h2 className="text-xs font-medium text-text-dim uppercase tracking-widest mb-3">
          Config Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-text-dim mb-0.5">Questions</p>
            <p className="text-text-primary font-medium">{config.config.questions.length}</p>
          </div>
          <div>
            <p className="text-text-dim mb-0.5">Submissions</p>
            <p className="text-text-primary font-medium">{submissions.length}</p>
          </div>
          <div>
            <p className="text-text-dim mb-0.5">Created</p>
            <p className="text-text-primary font-medium">
              {new Date(config.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-text-dim mb-0.5">Slug</p>
            <p className="text-text-primary font-medium font-mono">{config.client_slug}</p>
          </div>
        </div>
      </div>

      {/* Submissions section */}
      <section>
        <h2 className="text-xs font-medium text-text-dim uppercase tracking-widest mb-5">
          Submissions
        </h2>

        {submissions.length === 0 ? (
          <EmptyState
            title="No submissions yet"
            description="Once a client fills out the onboarding form, their submission will appear here."
          />
        ) : (
          <div className="space-y-6">
            {submissions.map((sub) => (
              <SubmissionCard key={sub.id} config={config} submission={sub} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════

export default function SubmissionViewerPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  return (
    <ProtectedRoute>
      <PageTransition>
        <GridBackground />
        <CursorGlow />
        <Navbar />
        <main className="min-h-screen pt-24 md:pt-28 pb-16 px-6">
          <div className="max-w-5xl mx-auto">
            <SubmissionViewerContent slug={slug} />
          </div>
        </main>
      </PageTransition>
    </ProtectedRoute>
  );
}
