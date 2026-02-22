import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { buildInvitationEmail } from "@/lib/onboard/emails/invitation";
import type { OnboardConfig } from "@/lib/onboard/types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    client_slug: string;
    client_name: string;
    business_name: string;
    client_email?: string;
    client_id?: string;
    config: OnboardConfig["config"];
    status?: "draft" | "active" | "archived";
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const {
    client_slug,
    client_name,
    business_name,
    config,
    status = "draft",
  } = body;

  // Validate required fields
  if (!client_slug || !client_name || !business_name) {
    return NextResponse.json(
      { error: "Missing required fields: client_slug, client_name, business_name" },
      { status: 400 }
    );
  }

  // Validate config has questions
  if (
    !config ||
    !config.questions ||
    !Array.isArray(config.questions) ||
    config.questions.length === 0
  ) {
    return NextResponse.json(
      { error: "Config must include a non-empty questions array" },
      { status: 400 }
    );
  }

  // Check for existing config with this slug
  const { data: existing } = await supabase
    .from("onboard_configs")
    .select("id")
    .eq("client_slug", client_slug)
    .single();

  const configData = {
    client_slug,
    client_name,
    business_name,
    client_email: body.client_email || null,
    client_id: body.client_id || null,
    config,
    status,
    updated_at: new Date().toISOString(),
  };

  let result: OnboardConfig;
  let previousStatus: string | null = null;

  if (existing) {
    // Fetch current status before updating
    const { data: currentConfig } = await supabase
      .from("onboard_configs")
      .select("status")
      .eq("id", existing.id)
      .single();
    previousStatus = currentConfig?.status ?? null;

    // Update existing config
    const { data, error } = await supabase
      .from("onboard_configs")
      .update(configData)
      .eq("id", existing.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Failed to update configuration" },
        { status: 500 }
      );
    }

    result = data as OnboardConfig;
  } else {
    // Insert new config
    const { data, error } = await supabase
      .from("onboard_configs")
      .insert(configData)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Failed to create configuration" },
        { status: 500 }
      );
    }

    result = data as OnboardConfig;
  }

  // Send invitation email on any transition to "active" status
  if (
    status === "active" &&
    previousStatus !== "active" &&
    body.client_email &&
    process.env.RESEND_API_KEY
  ) {
    const adminClient = createAdminClient();
    const origin = request.nextUrl.origin;

    adminClient.auth.admin
      .generateLink({
        type: "magiclink",
        email: body.client_email,
        options: {
          redirectTo: `${origin}/auth/callback?next=/onboard/${client_slug}`,
        },
      })
      .then(({ data: linkData }) => {
        if (!linkData?.properties?.action_link) return;

        const { subject, html } = buildInvitationEmail({
          clientName: client_name,
          businessName: business_name,
          senderName: "Devan Horton",
          magicLink: linkData.properties.action_link,
        });

        const resend = new Resend(process.env.RESEND_API_KEY);
        return resend.emails.send({
          from: "Onboarding <onboarding@hsfx.dev>",
          to: [body.client_email!],
          subject,
          html,
        });
      })
      .catch((err) => {
        console.error("Failed to send invitation email:", err);
      });
  }

  return NextResponse.json(result);
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "Missing id parameter" },
      { status: 400 }
    );
  }

  // Delete submissions first (foreign key)
  await supabase
    .from("onboard_submissions")
    .delete()
    .eq("config_id", id);

  const { error } = await supabase
    .from("onboard_configs")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete config" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
