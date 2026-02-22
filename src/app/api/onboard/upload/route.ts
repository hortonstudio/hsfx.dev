import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let body: {
    slug: string;
    questionId: string;
    filename: string;
    contentType: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { slug, questionId, filename, contentType } = body;

  if (!slug || !questionId || !filename || !contentType) {
    return NextResponse.json(
      { error: "Missing required fields: slug, questionId, filename, contentType" },
      { status: 400 }
    );
  }

  // Verify the slug exists in onboard_configs
  const supabase = await createClient();
  const { data: config, error: configError } = await supabase
    .from("onboard_configs")
    .select("id")
    .eq("client_slug", slug)
    .limit(1)
    .single();

  if (configError || !config) {
    return NextResponse.json(
      { error: "Onboarding configuration not found for this slug" },
      { status: 404 }
    );
  }

  // Generate signed upload URL using the admin client
  const adminClient = createAdminClient();
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${slug}/${questionId}/${timestamp}-${sanitizedFilename}`;

  const { data: signedData, error: uploadError } = await adminClient.storage
    .from("onboard-uploads")
    .createSignedUploadUrl(path);

  if (uploadError || !signedData) {
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }

  // Build the public URL
  const { data: publicUrlData } = adminClient.storage
    .from("onboard-uploads")
    .getPublicUrl(path);

  return NextResponse.json({
    signedUrl: signedData.signedUrl,
    path,
    token: signedData.token,
    publicUrl: publicUrlData.publicUrl,
    contentType,
  });
}
