import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/sitemap/[slug] — public sitemap data
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("client_sitemaps")
    .select("id, client_id, slug, title, package_tier, published_data, published_at, is_public, allow_comments, status, created_at, updated_at")
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  if (error || !data || !data.published_data) {
    return NextResponse.json({ error: "Sitemap not found" }, { status: 404 });
  }

  // Remap published_data → sitemap_data so the public viewer doesn't need changes
  const { published_data, ...rest } = data;
  const responseData = { ...rest, sitemap_data: published_data };

  return NextResponse.json(responseData, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
    },
  });
}
