import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Missing submission ID" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("onboard_submissions")
    .select("*, onboard_configs(*)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
