import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { KnowledgeEntry } from "@/lib/clients/types";

const VALID_ENTRY_TYPES = [
  "meeting_notes",
  "screenshot",
  "website_scrape",
  "submission_summary",
  "file",
  "other",
] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await supabase
    .from("client_knowledge_entries")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch knowledge entries" },
      { status: 500 }
    );
  }

  return NextResponse.json(data as KnowledgeEntry[]);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: {
    type: string;
    title?: string;
    content?: string;
    file_url?: string;
    file_type?: string;
    metadata?: Record<string, unknown>;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (
    !body.type ||
    !VALID_ENTRY_TYPES.includes(body.type as (typeof VALID_ENTRY_TYPES)[number])
  ) {
    return NextResponse.json(
      {
        error: `Invalid type. Must be one of: ${VALID_ENTRY_TYPES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("client_knowledge_entries")
    .insert({
      client_id: id,
      type: body.type,
      title: body.title || null,
      content: body.content || null,
      file_url: body.file_url || null,
      file_type: body.file_type || null,
      metadata: body.metadata || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create knowledge entry" },
      { status: 500 }
    );
  }

  return NextResponse.json(data as KnowledgeEntry, { status: 201 });
}
