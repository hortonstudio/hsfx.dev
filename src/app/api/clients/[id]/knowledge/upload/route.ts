import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

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

  let body: { filename: string; contentType: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { filename, contentType } = body;

  if (!filename || !contentType) {
    return NextResponse.json(
      { error: "Missing required fields: filename, contentType" },
      { status: 400 }
    );
  }

  // Generate storage path
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${id}/${timestamp}-${sanitizedFilename}`;

  // Create signed upload URL using admin client
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.storage
    .from("client-uploads")
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }

  // Get public URL
  const { data: publicData } = adminClient.storage
    .from("client-uploads")
    .getPublicUrl(storagePath);

  return NextResponse.json({
    signedUrl: data.signedUrl,
    publicUrl: publicData.publicUrl,
    path: storagePath,
  });
}
