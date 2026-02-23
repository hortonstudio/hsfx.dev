import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// POST /api/stock-images/upload — generate signed upload URL
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { filename: string; contentType: string; category: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { filename, contentType, category } = body;

  if (!filename || !contentType || !category) {
    return NextResponse.json(
      { error: "Missing required fields: filename, contentType, category" },
      { status: 400 }
    );
  }

  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `stock-images/${category}/${timestamp}-${sanitizedFilename}`;

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.storage
    .from("mockup-assets")
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }

  const { data: publicData } = adminClient.storage
    .from("mockup-assets")
    .getPublicUrl(storagePath);

  return NextResponse.json({
    signedUrl: data.signedUrl,
    publicUrl: publicData.publicUrl,
    path: storagePath,
  });
}
