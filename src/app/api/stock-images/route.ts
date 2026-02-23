import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/stock-images — list all, ordered by category + sort_order
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("stock_images")
    .select("*")
    .order("category")
    .order("sort_order")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/stock-images — create a record
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name: string; category: string; image_url: string; width?: number; height?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, category, image_url, width, height } = body;

  if (!name || !category || !image_url) {
    return NextResponse.json(
      { error: "Missing required fields: name, category, image_url" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("stock_images")
    .insert({ name, category, image_url, width: width ?? null, height: height ?? null })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
