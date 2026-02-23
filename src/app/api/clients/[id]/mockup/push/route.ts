import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  createCmsItem,
  updateCmsItem,
  publishCmsItem,
} from "@/lib/webflow/index";
import { buildCssStyleBlock } from "@/lib/clients/css-builder";
import { slugify, buildWebflowFields } from "@/lib/clients/mockup-utils";
import type { MockupConfig } from "@/lib/clients/types";

export const maxDuration = 30;

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

  // Parse optional body
  let body: { config?: MockupConfig; name?: string; slug?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Empty body is fine — will read config from DB
  }

  // Fetch client for default name
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Fetch existing mockup row
  const { data: existingMockup } = await supabase
    .from("client_mockups")
    .select("*")
    .eq("client_id", id)
    .maybeSingle();

  // Determine config: from body, or from DB
  let config: MockupConfig | null = body.config ?? null;
  if (!config && existingMockup?.config) {
    config = existingMockup.config as MockupConfig;
  }

  if (!config) {
    return NextResponse.json(
      { error: "No mockup config to push. Generate or paste one first." },
      { status: 400 }
    );
  }

  // Determine name and slug
  const businessName =
    client.business_name || `${client.first_name} ${client.last_name}`;
  const pushName = body.name || businessName;
  const pushSlug = body.slug || slugify(pushName);

  // Build CSS and Webflow fields
  const cssStyleBlock = buildCssStyleBlock(config.css);
  const webflowFields = buildWebflowFields(config, pushName, pushSlug, cssStyleBlock);

  // Push to Webflow
  let webflowItemId = existingMockup?.webflow_item_id ?? "";
  let webflowUrl = existingMockup?.webflow_url ?? "";

  try {
    if (webflowItemId) {
      await updateCmsItem(webflowItemId, webflowFields);
    } else {
      const item = await createCmsItem(webflowFields);
      webflowItemId = item.id;
    }
    await publishCmsItem(webflowItemId);

    const siteDomain = process.env.WEBFLOW_SITE_DOMAIN ?? "";
    if (siteDomain) {
      webflowUrl = `https://${siteDomain}/mockup/${pushSlug}`;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Webflow push failed:", msg);
    return NextResponse.json(
      { error: `Webflow push failed: ${msg}` },
      { status: 502 }
    );
  }

  // Update DB row: set active, store WF IDs
  // If config was provided via body (manual JSON), also upsert the config
  const upsertData: Record<string, unknown> = {
    client_id: id,
    webflow_item_id: webflowItemId,
    webflow_url: webflowUrl,
    status: "active",
    updated_at: new Date().toISOString(),
  };

  if (body.config) {
    // Manual JSON push — also save the config + logo
    upsertData.config = body.config;
    upsertData.logo_url = existingMockup?.logo_url ?? "";
  }

  const { data: mockupRow, error: upsertError } = await supabase
    .from("client_mockups")
    .upsert(upsertData, { onConflict: "client_id" })
    .select()
    .single();

  if (upsertError) {
    console.error("Failed to update mockup:", upsertError);
    return NextResponse.json(
      { error: "Pushed to Webflow but failed to update DB" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    mockup: mockupRow,
    webflow_item_id: webflowItemId,
    webflow_url: webflowUrl,
  });
}
