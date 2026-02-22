import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { buildSubmissionEmail } from "@/lib/onboard/email-template";
import type { OnboardConfig, OnboardSubmission } from "@/lib/onboard/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json(
      { error: "Missing slug parameter" },
      { status: 400 }
    );
  }

  let body: {
    answers: Record<string, unknown>;
    file_urls?: Record<string, string[]>;
    status?: "in_progress" | "submitted";
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { answers, file_urls = {}, status = "in_progress" } = body;

  if (!answers || typeof answers !== "object") {
    return NextResponse.json(
      { error: "Missing or invalid answers" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Verify the config exists and is active
  const { data: config, error: configError } = await supabase
    .from("onboard_configs")
    .select("*")
    .eq("client_slug", slug)
    .eq("status", "active")
    .single();

  if (configError || !config) {
    return NextResponse.json(
      { error: "Onboarding configuration not found or inactive" },
      { status: 404 }
    );
  }

  const typedConfig = config as OnboardConfig;

  // Check for existing submission for this slug + config
  const { data: existing } = await supabase
    .from("onboard_submissions")
    .select("id")
    .eq("client_slug", slug)
    .eq("config_id", typedConfig.id)
    .single();

  const submissionData = {
    config_id: typedConfig.id,
    client_slug: slug,
    answers,
    file_urls,
    status,
    submitted_at: status === "submitted" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  let submission: OnboardSubmission;

  if (existing) {
    // Update existing submission
    const { data, error } = await supabase
      .from("onboard_submissions")
      .update(submissionData)
      .eq("id", existing.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Failed to update submission" },
        { status: 500 }
      );
    }

    submission = data as OnboardSubmission;
  } else {
    // Insert new submission
    const { data, error } = await supabase
      .from("onboard_submissions")
      .insert(submissionData)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Failed to create submission" },
        { status: 500 }
      );
    }

    submission = data as OnboardSubmission;
  }

  // Fire-and-forget email if submitting and Resend is configured
  if (status === "submitted" && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { subject, html } = buildSubmissionEmail(typedConfig, submission);

    resend.emails
      .send({
        from: "Onboarding <onboarding@hsfx.dev>",
        to: ["devan@hsfx.dev"],
        subject,
        html,
      })
      .catch((err) => {
        console.error("Failed to send submission email:", err);
      });
  }

  return NextResponse.json(submission);
}
