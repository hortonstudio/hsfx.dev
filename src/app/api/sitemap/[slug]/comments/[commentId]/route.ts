import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/sitemap/[slug]/comments/[commentId] — resolve/edit (auth required)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; commentId: string }> }
) {
  const { slug, commentId } = await params;
  const supabase = await createClient();

  // Auth required for resolving comments
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();

  // Verify sitemap exists
  const { data: sitemap } = await adminClient
    .from("client_sitemaps")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!sitemap) {
    return NextResponse.json({ error: "Sitemap not found" }, { status: 404 });
  }

  let body: { is_resolved?: boolean; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.is_resolved !== undefined) updates.is_resolved = body.is_resolved;
  if (body.content !== undefined) updates.content = body.content.trim();

  const { data, error } = await adminClient
    .from("sitemap_comments")
    .update(updates)
    .eq("id", commentId)
    .eq("sitemap_id", sitemap.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
