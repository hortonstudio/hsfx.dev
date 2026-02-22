import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { OnboardConfig } from "@/lib/onboard/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json(
      { error: "Missing slug parameter" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("onboard_configs")
    .select("*")
    .eq("client_slug", slug)
    .eq("status", "active")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Onboarding configuration not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(data as OnboardConfig);
}
