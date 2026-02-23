import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

interface SeedImage {
  name: string;
  category: string;
  url: string;
}

// POST /api/stock-images/seed — download from URLs, upload to storage, insert DB records
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { images: SeedImage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { images } = body;
  if (!images || !Array.isArray(images) || images.length === 0) {
    return NextResponse.json({ error: "Missing images array" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const results: { name: string; category: string; success: boolean; error?: string }[] = [];

  for (const img of images) {
    try {
      // Download image from URL
      const response = await fetch(img.url);
      if (!response.ok) {
        results.push({ name: img.name, category: img.category, success: false, error: `Fetch failed: ${response.status}` });
        continue;
      }

      const contentType = response.headers.get("content-type") || "image/jpeg";
      const buffer = Buffer.from(await response.arrayBuffer());

      // Determine file extension
      const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
      const timestamp = Date.now();
      const sanitizedName = img.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `stock-images/${img.category}/${timestamp}-${sanitizedName}.${ext}`;

      // Upload to storage
      const { error: uploadError } = await adminClient.storage
        .from("mockup-assets")
        .upload(storagePath, buffer, { contentType, upsert: true });

      if (uploadError) {
        results.push({ name: img.name, category: img.category, success: false, error: uploadError.message });
        continue;
      }

      // Get public URL
      const { data: publicData } = adminClient.storage
        .from("mockup-assets")
        .getPublicUrl(storagePath);

      const width: number | null = null;
      const height: number | null = null;

      // Insert DB record
      const { error: insertError } = await supabase
        .from("stock_images")
        .upsert(
          {
            name: img.name,
            category: img.category,
            image_url: publicData.publicUrl,
            width,
            height,
          },
          { onConflict: "category,name" }
        );

      if (insertError) {
        results.push({ name: img.name, category: img.category, success: false, error: insertError.message });
        continue;
      }

      results.push({ name: img.name, category: img.category, success: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      results.push({ name: img.name, category: img.category, success: false, error: msg });
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return NextResponse.json({ succeeded, failed, results });
}
