import { createClient } from "@/lib/supabase/server";
import { corsPreflightResponse, withCors } from "@/lib/api/cors";
import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS() {
  return corsPreflightResponse();
}

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.GSAP_PRESETS_API_KEY) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const category = searchParams.get("category");
  const format = searchParams.get("format"); // "code" = code only
  const minified = searchParams.get("minified") === "true";
  const raw = searchParams.get("raw") === "true";

  const supabase = await createClient();

  // Single preset by slug
  if (slug) {
    const { data, error } = await supabase
      .from("gsap_presets")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return withCors(NextResponse.json({ error: "Preset not found" }, { status: 404 }));
    }

    // Code-only format
    if (format === "code") {
      const code = minified ? (data.code_minified || data.code_raw) : data.code_raw;
      return withCors(
        new NextResponse(code, {
          headers: {
            "Content-Type": "application/javascript",
            "Cache-Control": "public, max-age=60, s-maxage=300",
          },
        })
      );
    }

    return withCors(
      NextResponse.json(data, {
        headers: { "Cache-Control": raw ? "no-cache" : "public, max-age=60, s-maxage=300" },
      })
    );
  }

  // List presets
  let query = supabase
    .from("gsap_presets")
    .select("*")
    .order("category")
    .order("sort_order");

  // Only show published presets unless raw mode
  if (!raw) {
    query = query.eq("is_published", true);
  }

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    return withCors(NextResponse.json({ error: error.message }, { status: 500 }));
  }

  return withCors(
    NextResponse.json(data || [], {
      headers: { "Cache-Control": raw ? "no-cache" : "public, max-age=60, s-maxage=300" },
    })
  );
}
