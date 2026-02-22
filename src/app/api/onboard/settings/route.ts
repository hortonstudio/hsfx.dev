import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");

  if (!key) {
    return NextResponse.json(
      { error: "Missing key parameter" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("onboard_settings")
    .select("value")
    .eq("key", key)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Setting not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ value: data.value });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { key: string; value: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { key, value } = body;
  if (!key || !value) {
    return NextResponse.json(
      { error: "Missing key or value" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("onboard_settings")
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

  if (error) {
    return NextResponse.json(
      { error: "Failed to save setting" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
