import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const WEBFLOW_API_BASE = "https://api.webflow.com/v2";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.WEBFLOW_API_TOKEN;
  const collectionId = process.env.WEBFLOW_COLLECTION_ID;

  if (!token || !collectionId) {
    return NextResponse.json(
      { error: "Webflow not configured. Set WEBFLOW_API_TOKEN and WEBFLOW_COLLECTION_ID." },
      { status: 503 }
    );
  }

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    accept: "application/json",
  };

  try {
    // Fetch collection schema (fields) and items in parallel
    const [schemaRes, itemsRes] = await Promise.all([
      fetch(`${WEBFLOW_API_BASE}/collections/${collectionId}`, { headers }),
      fetch(`${WEBFLOW_API_BASE}/collections/${collectionId}/items`, { headers }),
    ]);

    if (!schemaRes.ok) {
      const err = await schemaRes.json().catch(() => ({}));
      throw new Error(`Schema fetch failed: ${err.message || schemaRes.statusText}`);
    }

    if (!itemsRes.ok) {
      const err = await itemsRes.json().catch(() => ({}));
      throw new Error(`Items fetch failed: ${err.message || itemsRes.statusText}`);
    }

    const schema = await schemaRes.json();
    const itemsData = await itemsRes.json();

    // Extract field info
    const fields = (schema.fields ?? []).map(
      (f: { slug: string; displayName: string; type: string; validations?: Record<string, unknown> }) => ({
        slug: f.slug,
        displayName: f.displayName,
        type: f.type,
        validations: f.validations,
      })
    );

    // Extract item summaries (name + slug only)
    const items = (itemsData.items ?? []).map(
      (item: { id: string; fieldData: { name?: string; slug?: string } }) => ({
        id: item.id,
        name: item.fieldData?.name ?? "",
        slug: item.fieldData?.slug ?? "",
      })
    );

    return NextResponse.json({
      collectionId,
      displayName: schema.displayName ?? "",
      fields,
      items,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Webflow collection inspect failed:", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
