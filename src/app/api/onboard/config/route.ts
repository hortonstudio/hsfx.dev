import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
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
    config,
    status,
    updated_at: new Date().toISOString(),
  };

  let result: OnboardConfig;

  if (existing) {
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

  return NextResponse.json(result);
}
