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
    .select("id, client_id, slug, title, package_tier, sitemap_data, is_public, allow_comments, status, created_at, updated_at")
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Sitemap not found" }, { status: 404 });
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
    },
  });
}
