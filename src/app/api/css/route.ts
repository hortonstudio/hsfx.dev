import { createClient } from "@/lib/supabase/server";
import { wrapInStyleTags } from "@/lib/css-manager/minify";
import { corsPreflightResponse, withCors } from "@/lib/api/cors";
import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS() {
  return corsPreflightResponse();
}

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.CSS_API_KEY) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const { searchParams } = new URL(request.url);
  const group = searchParams.get("group");
  if (!group) {
    return withCors(
      NextResponse.json({ error: "group parameter required" }, { status: 400 })
    );
  }

  const entry = searchParams.get("entry");
  const combined = searchParams.get("combined") === "true";
  const minified = searchParams.get("minified") === "true";
  const tags = searchParams.get("tags") === "true";

  const supabase = await createClient();

  // Fast path: combined requests use pre-computed css_groups table
  if (combined && !entry) {
    const { data: groupData } = await supabase
      .from("css_groups")
      .select("combined_css, combined_css_minified")
      .eq("group_name", group)
      .single();

    if (groupData) {
      let css = minified
        ? groupData.combined_css_minified || groupData.combined_css
        : groupData.combined_css;
      if (tags) css = wrapInStyleTags(css);

      return withCors(
        new NextResponse(css, {
          headers: {
            "Content-Type": "text/css",
            "Cache-Control": "public, max-age=60, s-maxage=300",
          },
        })
      );
    }
    // Fall through to individual entries if no pre-computed data
  }

  let query = supabase
    .from("page_css")
    .select("name, css_content, css_minified, sort_order")
    .eq("group_name", group)
    .order("sort_order");

  if (entry) {
    query = query.eq("name", entry);
  }

  const { data, error } = await query;

  if (error) {
    return withCors(NextResponse.json({ error: error.message }, { status: 500 }));
  }

  if (!data || data.length === 0) {
    return withCors(
      new NextResponse("/* No CSS found */", {
        headers: { "Content-Type": "text/css" },
      })
    );
  }

  // Single entry or combined mode → return as text/css
  if (combined || data.length === 1) {
    let css = minified
      ? data.map((d) => d.css_minified || d.css_content).join("")
      : data.map((d) => d.css_content).join("\n\n");
    if (tags) css = wrapInStyleTags(css);

    return withCors(
      new NextResponse(css, {
        headers: {
          "Content-Type": "text/css",
          "Cache-Control": "public, max-age=60, s-maxage=300",
        },
      })
    );
  }

  // Multiple entries without combined → return JSON listing
  const entries = data.map((d) => ({
    name: d.name,
    css: minified ? (d.css_minified || d.css_content) : d.css_content,
  }));

  return withCors(NextResponse.json(entries));
}
