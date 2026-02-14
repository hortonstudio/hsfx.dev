import { createClient } from "@/lib/supabase/server";
import { corsPreflightResponse, withCors } from "@/lib/api/cors";
import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS() {
  return corsPreflightResponse();
}

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.ICONS_API_KEY) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const { searchParams } = new URL(request.url);
  const group = searchParams.get("group");

  const supabase = await createClient();

  let query = supabase
    .from("icons")
    .select("name, group_name, svg_content, sort_order")
    .order("group_name")
    .order("sort_order")
    .order("name");

  if (group) {
    query = query.eq("group_name", group);
  }

  const { data, error } = await query;

  if (error) {
    return withCors(NextResponse.json({ error: error.message }, { status: 500 }));
  }

  if (!data || data.length === 0) {
    return withCors(NextResponse.json({ groups: [], icons: [] }));
  }

  const groups = Array.from(new Set(data.map((d) => d.group_name))).sort();
  const icons = data.map((d) => ({
    name: d.name,
    group: d.group_name,
    svg: d.svg_content,
  }));

  return withCors(
    NextResponse.json(
      { groups, icons },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300",
        },
      }
    )
  );
}
