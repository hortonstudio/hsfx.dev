import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/stock-images/[id] — update name, category, sort_order
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

  let body: { name?: string; category?: string; sort_order?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) updates.name = body.name;
  if (body.category !== undefined) updates.category = body.category;
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;

  const { data, error } = await supabase
    .from("stock_images")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/stock-images/[id] — delete record + storage file
export async function DELETE(
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

  // Get the image to find the storage path
  const { data: image } = await supabase
    .from("stock_images")
    .select("image_url")
    .eq("id", id)
    .single();

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  // Extract storage path from URL
  const url = image.image_url;
  const bucketPrefix = "/storage/v1/object/public/mockup-assets/";
  const pathIndex = url.indexOf(bucketPrefix);
  if (pathIndex !== -1) {
    const storagePath = url.slice(pathIndex + bucketPrefix.length);
    const adminClient = createAdminClient();
    await adminClient.storage.from("mockup-assets").remove([storagePath]);
  }

  // Delete DB record
  const { error } = await supabase.from("stock_images").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
