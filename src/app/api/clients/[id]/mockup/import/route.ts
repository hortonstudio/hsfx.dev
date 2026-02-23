import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type {
  MockupConfig,
  NavbarVariant,
  HeroVariant,
  FooterVariant,
  ServicesVariant,
  ProcessVariant,
  FAQVariant,
  ContactVariant,
} from "@/lib/clients/types";

export const maxDuration = 30;

// ── Allowed enum values ──

const NAVBAR_VARIANTS: NavbarVariant[] = [
  "Full",
  "Full, no top",
  "Island",
  "Island, no top",
];

const HERO_VARIANTS: HeroVariant[] = [
  "Full Height, Left Align",
  "Auto Height, Center Align",
  "Text and Image 2 Grid",
];

const FOOTER_VARIANTS: FooterVariant[] = ["Full", "Minimal"];

const SERVICES_VARIANTS: ServicesVariant[] = ["Three Grid", "Sticky List"];

const PROCESS_VARIANTS: ProcessVariant[] = ["Sticky List", "Card Grid"];

const FAQ_VARIANTS: FAQVariant[] = ["Center", "Two Grid"];

const CONTACT_VARIANTS: ContactVariant[] = ["Two Grid", "Center"];

// ── Validation helpers ──

function validateVariant<T extends string>(
  value: unknown,
  allowed: T[],
  fieldName: string
): string | null {
  if (value === undefined || value === null) return null;
  if (!allowed.includes(value as T)) {
    return `Invalid ${fieldName}: "${value}". Allowed: ${allowed.join(", ")}`;
  }
  return null;
}

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

  // Parse body
  let body: { config: MockupConfig };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const config = body?.config;
  if (!config || typeof config !== "object") {
    return NextResponse.json(
      { error: "Missing required field: config" },
      { status: 400 }
    );
  }

  // ── Validate required fields ──

  const missing: string[] = [];
  if (!config.hero_heading) missing.push("hero_heading");
  if (!config.hero_paragraph) missing.push("hero_paragraph");
  if (!config.css) missing.push("css");

  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  // ── Validate variant enums (if present) ──

  const variantErrors: string[] = [];

  const checks: [unknown, string[], string][] = [
    [config.navbar_variant, NAVBAR_VARIANTS, "navbar_variant"],
    [config.hero_variant, HERO_VARIANTS, "hero_variant"],
    [config.footer_variant, FOOTER_VARIANTS, "footer_variant"],
    [config.services_variant, SERVICES_VARIANTS, "services_variant"],
    [config.process_variant, PROCESS_VARIANTS, "process_variant"],
    [config.faq_variant, FAQ_VARIANTS, "faq_variant"],
    [config.contact_variant, CONTACT_VARIANTS, "contact_variant"],
  ];

  for (const [value, allowed, name] of checks) {
    const err = validateVariant(value, allowed, name);
    if (err) variantErrors.push(err);
  }

  if (variantErrors.length > 0) {
    return NextResponse.json(
      { error: variantErrors.join("; ") },
      { status: 400 }
    );
  }

  // ── Fetch existing mockup to preserve logo_url and WF IDs ──

  const { data: existingMockup } = await supabase
    .from("client_mockups")
    .select("*")
    .eq("client_id", id)
    .maybeSingle();

  // Preserve existing logo_url inside master_json.config.logo.src
  const logoUrl = existingMockup?.logo_url ?? "";
  const importedConfig: MockupConfig = {
    ...config,
    master_json: {
      ...config.master_json,
      config: {
        ...config.master_json?.config,
        logo: {
          ...config.master_json?.config?.logo,
          src: logoUrl || config.master_json?.config?.logo?.src || "",
        },
      },
    },
  };

  // ── Upsert as draft ──

  const { data: mockupRow, error: upsertError } = await supabase
    .from("client_mockups")
    .upsert(
      {
        client_id: id,
        webflow_item_id: existingMockup?.webflow_item_id ?? "",
        webflow_url: existingMockup?.webflow_url ?? "",
        config: importedConfig,
        logo_url: logoUrl,
        status: "draft",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id" }
    )
    .select()
    .single();

  if (upsertError) {
    console.error("Failed to save imported mockup:", upsertError);
    return NextResponse.json(
      { error: "Failed to save mockup" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    mockup: mockupRow,
  });
}
