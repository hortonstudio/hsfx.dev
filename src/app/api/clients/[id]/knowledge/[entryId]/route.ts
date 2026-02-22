import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, entryId } = await params;

  // Verify the entry belongs to this client
  const { data: entry, error: fetchError } = await supabase
    .from("client_knowledge_entries")
    .select("id")
    .eq("id", entryId)
    .eq("client_id", id)
    .single();

  if (fetchError || !entry) {
    return NextResponse.json(
      { error: "Knowledge entry not found for this client" },
      { status: 404 }
    );
  }

  const { error } = await supabase
    .from("client_knowledge_entries")
    .delete()
    .eq("id", entryId)
    .eq("client_id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete knowledge entry" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
