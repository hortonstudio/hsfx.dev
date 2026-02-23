import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { generateSlug } from "@/lib/clients/sitemap-utils";

// GET /api/clients/[id]/sitemap — fetch client's sitemap
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

  const { data, error } = await supabase
    .from("client_sitemaps")
    .select("*")
    .eq("client_id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(null);
  }

  return NextResponse.json(data);
}

// POST /api/clients/[id]/sitemap — create a new sitemap
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

  let body: {
    title?: string;
    package_tier?: number;
    sitemap_data?: unknown;
    slug?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Generate slug from client business name if not provided
  let slug = body.slug;
  if (!slug) {
    const { data: client } = await supabase
      .from("clients")
      .select("business_name, first_name, last_name")
      .eq("id", id)
      .single();

    const name = client?.business_name || `${client?.first_name}-${client?.last_name}` || "sitemap";
    slug = generateSlug(name);
  }

  const { data, error } = await supabase
    .from("client_sitemaps")
    .upsert(
      {
        client_id: id,
        slug,
        title: body.title ?? "Site Map",
        package_tier: body.package_tier ?? null,
        sitemap_data: body.sitemap_data ?? { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
        status: "draft",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PATCH /api/clients/[id]/sitemap — update sitemap (auto-save from editor)
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

  let body: {
    sitemap_data?: unknown;
    title?: string;
    is_public?: boolean;
    allow_comments?: boolean;
    access_token?: string | null;
    status?: string;
    slug?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.sitemap_data !== undefined) updates.sitemap_data = body.sitemap_data;
  if (body.title !== undefined) updates.title = body.title;
  if (body.is_public !== undefined) updates.is_public = body.is_public;
  if (body.allow_comments !== undefined) updates.allow_comments = body.allow_comments;
  if (body.access_token !== undefined) updates.access_token = body.access_token;
  if (body.status !== undefined) updates.status = body.status;
  if (body.slug !== undefined) updates.slug = body.slug;

  const { data, error } = await supabase
    .from("client_sitemaps")
    .update(updates)
    .eq("client_id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
