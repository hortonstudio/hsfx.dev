"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { OnboardConfig, OnboardSubmission } from "@/lib/onboard/types";
import type { User } from "@supabase/supabase-js";

interface ClientPortalProps {
  user: User | null;
  configs: OnboardConfig[];
  submissions: OnboardSubmission[];
  redirectTo?: string;
}

function getSubmissionForConfig(
  config: OnboardConfig,
  submissions: OnboardSubmission[]
): OnboardSubmission | undefined {
  return submissions.find((s) => s.client_slug === config.client_slug);
}

function StatusBadge({ submission }: { submission?: OnboardSubmission }) {
  if (!submission) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-500/20 px-3 py-1 text-xs font-medium text-gray-400">
        Not Started
      </span>
    );
  }

  if (submission.status === "in_progress") {
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-medium text-yellow-400">
        In Progress
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
      Submitted
    </span>
  );
}

function getButtonText(submission?: OnboardSubmission): string {
  if (!submission) return "Get Started";
  if (submission.status === "in_progress") return "Continue";
  return "View & Edit";
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function LoginView({
  redirectTo,
}: {
  redirectTo?: string;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const supabase = createClient();
    const origin = window.location.origin;

    const nextPath = redirectTo
      ? `/auth/callback?next=${encodeURIComponent(redirectTo)}`
      : "/auth/callback?next=/client";
    const emailRedirectTo = `${origin}${nextPath}`;

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo,
      },
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
    } else {
      setMessage("Check your email! We sent you a magic link to sign in.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-2xl animate-fade-in text-center">
        <h1 className="mb-3 text-3xl font-bold text-text-primary">
          Welcome to your client portal
        </h1>
        <p className="mb-8 text-text-dim">
          Enter your email to access your onboarding forms.
        </p>

        <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-lg border border-border-primary bg-bg-secondary px-4 py-3 text-text-primary placeholder:text-text-dim/50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Magic Link"}
          </button>
        </form>

        {message && (
          <p className="mt-6 animate-fade-in text-green-400">{message}</p>
        )}
        {error && (
          <p className="mt-6 animate-fade-in text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}

function PortalView({
  user,
  configs,
  submissions,
}: {
  user: User;
  configs: OnboardConfig[];
  submissions: OnboardSubmission[];
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-bg-primary px-4 py-12">
      <div className="mx-auto max-w-4xl animate-fade-in">
        <div className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">
              Welcome back!
            </h1>
            <p className="mt-1 text-text-dim">{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="rounded-lg border border-border-primary px-4 py-2 text-sm text-text-dim transition-colors hover:border-red-500/50 hover:text-red-400 disabled:opacity-50"
          >
            {signingOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>

        {configs.length === 0 ? (
          <div className="rounded-xl border border-border-primary bg-bg-secondary p-12 text-center">
            <p className="text-text-dim">
              No onboarding forms have been assigned to your email yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {configs.map((config) => {
              const submission = getSubmissionForConfig(config, submissions);
              const lastUpdated = submission
                ? submission.updated_at
                : config.updated_at;

              return (
                <Link
                  key={config.id}
                  href={`/onboard/${config.client_slug}`}
                  className="group rounded-xl border border-border-primary bg-bg-secondary p-6 transition-colors hover:border-blue-500/50"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <h2 className="text-xl font-semibold text-text-primary group-hover:text-blue-400">
                      {config.business_name}
                    </h2>
                    <StatusBadge submission={submission} />
                  </div>
                  <p className="mb-4 text-sm text-text-dim">
                    {config.client_name}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-dim">
                      Updated {formatDate(lastUpdated)}
                    </span>
                    <span className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors group-hover:bg-blue-700">
                      {getButtonText(submission)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function ClientPortal({
  user,
  configs,
  submissions,
  redirectTo,
}: ClientPortalProps) {
  if (!user) {
    return <LoginView redirectTo={redirectTo} />;
  }

  return <PortalView user={user} configs={configs} submissions={submissions} />;
}
