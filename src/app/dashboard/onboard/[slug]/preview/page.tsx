"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui";
import { OnboardForm } from "@/app/onboard/[slug]/OnboardForm";
import type { OnboardConfig } from "@/lib/onboard/types";

function PreviewContent({ slug }: { slug: string }) {
  const [config, setConfig] = useState<OnboardConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchConfig() {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("onboard_configs")
        .select("*")
        .eq("client_slug", slug)
        .single();

      if (fetchError || !data) {
        setError("Config not found");
        setLoading(false);
        return;
      }

      setConfig(data as OnboardConfig);
      setLoading(false);
    }
    fetchConfig();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-text-muted mb-4">{error || "Config not found"}</p>
          <button
            onClick={() => router.push("/dashboard/onboard")}
            className="text-accent hover:text-accent-hover transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <OnboardForm
      config={config}
      existingSubmission={null}
      preview
      onExitPreview={() => router.push(`/dashboard/onboard/${slug}`)}
    />
  );
}

export default function PreviewPage() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <ProtectedRoute>
      <PreviewContent slug={slug} />
    </ProtectedRoute>
  );
}
