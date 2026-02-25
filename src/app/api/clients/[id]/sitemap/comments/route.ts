import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/clients/[id]/sitemap/comments — list comments for client's sitemap (authenticated)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the sitemap for this client
  const { data: sitemap } = await supabase
    .from("client_sitemaps")
    .select("id")
    .eq("client_id", id)
    .maybeSingle();

  if (!sitemap) {
    return NextResponse.json({ error: "Sitemap not found" }, { status: 404 });
  }

  const { data: comments, error } = await supabase
    .from("sitemap_comments")
    .select("*")
    .eq("sitemap_id", sitemap.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(comments ?? []);
}

// POST /api/clients/[id]/sitemap/comments — add a comment (authenticated agency user)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: sitemap } = await supabase
    .from("client_sitemaps")
    .select("id")
    .eq("client_id", id)
    .maybeSingle();

  if (!sitemap) {
    return NextResponse.json({ error: "Sitemap not found" }, { status: 404 });
  }

  let body: {
    node_id?: string | null;
    section_name?: string | null;
    parent_id?: string | null;
    content: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.content?.trim()) {
    return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("sitemap_comments")
    .insert({
      sitemap_id: sitemap.id,
      node_id: body.node_id ?? null,
      section_name: body.section_name ?? null,
      parent_id: body.parent_id ?? null,
      author_name: user.email?.split("@")[0] ?? "Agency",
      author_email: user.email ?? null,
      author_type: "agency",
      content: body.content.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PATCH /api/clients/[id]/sitemap/comments — resolve/unresolve a comment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify sitemap belongs to this client
  const { data: sitemap } = await supabase
    .from("client_sitemaps")
    .select("id")
    .eq("client_id", id)
    .maybeSingle();

  if (!sitemap) {
    return NextResponse.json({ error: "Sitemap not found" }, { status: 404 });
  }

  let body: { comment_id: string; is_resolved: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.comment_id) {
    return NextResponse.json({ error: "comment_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("sitemap_comments")
    .update({ is_resolved: body.is_resolved, updated_at: new Date().toISOString() })
    .eq("id", body.comment_id)
    .eq("sitemap_id", sitemap.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
