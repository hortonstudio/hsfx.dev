import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// GET /api/sitemap/[slug]/comments — list comments for a public sitemap
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const adminClient = createAdminClient();

  // Verify sitemap is public and allows comments
  const { data: sitemap } = await adminClient
    .from("client_sitemaps")
    .select("id, is_public, allow_comments")
    .eq("slug", slug)
    .single();

  if (!sitemap || !sitemap.is_public) {
    return NextResponse.json({ error: "Sitemap not found" }, { status: 404 });
  }

  const { data: comments, error } = await adminClient
    .from("sitemap_comments")
    .select("*")
    .eq("sitemap_id", sitemap.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(comments ?? []);
}

// POST /api/sitemap/[slug]/comments — add a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const adminClient = createAdminClient();

  // Verify sitemap is public and allows comments
  const { data: sitemap } = await adminClient
    .from("client_sitemaps")
    .select("id, is_public, allow_comments")
    .eq("slug", slug)
    .single();

  if (!sitemap || !sitemap.is_public) {
    return NextResponse.json({ error: "Sitemap not found" }, { status: 404 });
  }

  if (!sitemap.allow_comments) {
    return NextResponse.json({ error: "Comments are disabled" }, { status: 403 });
  }

  let body: {
    node_id?: string | null;
    section_name?: string | null;
    parent_id?: string | null;
    author_name: string;
    author_email?: string;
    author_type?: string;
    content: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.author_name?.trim() || !body.content?.trim()) {
    return NextResponse.json({ error: "Name and comment are required" }, { status: 400 });
  }

  const { data, error } = await adminClient
    .from("sitemap_comments")
    .insert({
      sitemap_id: sitemap.id,
      node_id: body.node_id ?? null,
      section_name: body.section_name ?? null,
      parent_id: body.parent_id ?? null,
      author_name: body.author_name.trim(),
      author_email: body.author_email?.trim() || null,
      author_type: body.author_type || "client",
      content: body.content.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
