import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import {
  createCmsItem,
  updateCmsItem,
  publishCmsItem,
} from "@/lib/webflow/index";
import type { MockupConfig } from "@/lib/clients/types";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a web designer generating a homepage mockup configuration for a home service business website. You will receive a compiled knowledge base document about the client and must produce a complete JSON config.

The JSON must include these top-level keys:

- navbar (object): { logo: { src: "", alt: "Business Name" }, top_bar: { show: boolean, map: { show: boolean, text: string, href: "#service-area" }, phone: { show: boolean, text: string, href: "tel:..." } }, nav_links: array of { text, href } or { text, dropdown: [{ text, href }] }, cta: { text, href: "#contact" } }
- navbar_variant (one of: "Full With Top", "Full Without Top", "Island With Top", "Island Without Top")
- footer (object): { logo: { src: "", alt: "Business Name" }, company: string, contact: { phone, phone_href, email, email_href }, socials: { facebook, instagram, youtube, tiktok, x, linkedin, pinterest } (empty string to hide), footer_nav: [{ text, href }], footer_groups: [{ heading, links: [{ text, href }] }] }
- footer_variant (one of: "Minimal", "Full")
- hero_tag (short label above heading)
- hero_heading (main headline)
- hero_paragraph (supporting text)
- hero_button_1_text (primary CTA, usually "Get a Free Quote")
- hero_button_2_text (secondary CTA, can be empty string)
- hero_variant (one of: "Full Height Left Align", "Auto Height Center Align", "Text and Image 2 Grid")
- hero_image (leave as empty string "")
- stats_benefits_visibility (one of: "Statistics", "Benefits")
- stats_benefits_cards (array of exactly 4 objects with icon_name, heading, paragraph)

Rules:
- All nav/footer hrefs are anchor links (#about, #services, #contact, #global, #service-area, #areas)
- CTA buttons always href to #contact
- Logo src must be empty string "" (admin uploads separately)
- hero_image must be empty string "" (admin sets separately)
- For stats_benefits_cards, pick icon_name from the available icons list provided. Prefer "home-service" and "general" group icons first.
- Use "Statistics" when the KB contains real numbers (years in business, jobs completed, reviews count, etc). Use "Benefits" when no real stats are available. NEVER fabricate statistics.
- For navbar_variant: use "With Top" variants when phone/map info is available in the KB
- For footer_variant: use "Full" for businesses with multiple service categories, "Minimal" for simpler businesses
- For hero_variant: use "Full Height Left Align" for dramatic/impact niches, "Auto Height Center Align" for trust-focused, "Text and Image 2 Grid" for owner-operated
- Do NOT fabricate contact info. Use what is in the KB or leave fields empty.
- footer_nav is for the Minimal variant, footer_groups is for the Full variant. Populate both so either variant works.
- footer_groups should have 2-4 groups. Typical order: Site, Services, Service Areas (optional), Contact.
- Social media URLs: use what's in the KB, empty string "" for unknown platforms.
- Return ONLY valid JSON, no markdown code blocks, no explanation text.`;

interface IconRow {
  name: string;
  group_name: string;
  svg_content: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Claude API not configured. Add ANTHROPIC_API_KEY to environment." },
      { status: 503 }
    );
  }

  // Fetch client record
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Fetch compiled KB document
  const { data: kbDoc } = await supabase
    .from("client_knowledge_documents")
    .select("*")
    .eq("client_id", id)
    .single();

  if (!kbDoc?.content) {
    return NextResponse.json(
      { error: "No compiled knowledge base found. Compile the Knowledge Base first." },
      { status: 400 }
    );
  }

  // Fetch existing mockup (to preserve logo_url on regenerate)
  const { data: existingMockup } = await supabase
    .from("client_mockups")
    .select("*")
    .eq("client_id", id)
    .maybeSingle();

  // Fetch available icons
  const adminClient = createAdminClient();
  const { data: icons } = await adminClient
    .from("icons")
    .select("name, group_name, svg_content")
    .order("group_name")
    .order("name");

  const typedIcons = (icons ?? []) as IconRow[];

  // Build icon names grouped by group_name
  const iconsByGroup: Record<string, string[]> = {};
  for (const icon of typedIcons) {
    if (!iconsByGroup[icon.group_name]) {
      iconsByGroup[icon.group_name] = [];
    }
    iconsByGroup[icon.group_name].push(icon.name);
  }

  const iconListText = Object.entries(iconsByGroup)
    .map(([group, names]) => `  ${group}: ${names.join(", ")}`)
    .join("\n");

  // Build user message
  const userMessage = `Client: ${client.business_name || `${client.first_name} ${client.last_name}`}

Knowledge Base:
${kbDoc.content}

Available icon names by group:
${iconListText}

Generate the complete homepage mockup config JSON.`;

  // Call Claude API
  const anthropic = new Anthropic();

  let response;
  try {
    response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Claude API error:", msg);
    return NextResponse.json(
      { error: `AI generation failed: ${msg}` },
      { status: 502 }
    );
  }

  // Extract text from response
  const textBlock = response.content.find((c) => c.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json(
      { error: "No text response from Claude" },
      { status: 500 }
    );
  }

  // Parse JSON (strip markdown code block wrappers if present)
  let rawText = textBlock.text.trim();
  if (rawText.startsWith("```")) {
    rawText = rawText.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  let mockupConfig: MockupConfig;
  try {
    const parsed = JSON.parse(rawText);

    // Resolve icon_name → icon_svg for stats/benefits cards
    const cards = parsed.stats_benefits_cards ?? [];
    const resolvedCards = cards.map(
      (card: { icon_name?: string; heading: string; paragraph: string }) => {
        const iconName = card.icon_name ?? "";
        const matchedIcon = typedIcons.find((i) => i.name === iconName);
        // Fall back to first general icon if no match
        const fallbackIcon = typedIcons.find(
          (i) => i.group_name === "general"
        );
        return {
          icon_svg: matchedIcon?.svg_content ?? fallbackIcon?.svg_content ?? "",
          heading: card.heading,
          paragraph: card.paragraph,
        };
      }
    );

    // Preserve existing logo URL on regenerate
    const logoUrl = existingMockup?.logo_url ?? "";

    mockupConfig = {
      navbar: {
        ...parsed.navbar,
        logo: { src: logoUrl, alt: parsed.navbar?.logo?.alt ?? "" },
      },
      navbar_variant: parsed.navbar_variant ?? "Full Without Top",
      footer: {
        ...parsed.footer,
        logo: { src: logoUrl, alt: parsed.footer?.logo?.alt ?? "" },
      },
      footer_variant: parsed.footer_variant ?? "Minimal",
      hero_tag: parsed.hero_tag ?? "",
      hero_heading: parsed.hero_heading ?? "",
      hero_paragraph: parsed.hero_paragraph ?? "",
      hero_button_1_text: parsed.hero_button_1_text ?? "Get a Free Quote",
      hero_button_2_text: parsed.hero_button_2_text ?? "",
      hero_variant: parsed.hero_variant ?? "Auto Height Center Align",
      hero_image: "",
      stats_benefits_visibility:
        parsed.stats_benefits_visibility ?? "Benefits",
      stats_benefits_cards: resolvedCards,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to parse mockup config:", msg);
    return NextResponse.json(
      { error: `Failed to parse AI response: ${msg}` },
      { status: 500 }
    );
  }

  // Try Webflow integration (non-blocking on failure)
  const slug = slugify(
    client.business_name || `${client.first_name}-${client.last_name}`
  );
  let webflowItemId = existingMockup?.webflow_item_id ?? "";
  let webflowUrl = existingMockup?.webflow_url ?? "";

  const webflowFields: Record<string, unknown> = {
    name: client.business_name || `${client.first_name} ${client.last_name}`,
    slug,
    "navbar-config": JSON.stringify(mockupConfig.navbar),
    "navbar-variant": mockupConfig.navbar_variant,
    "footer-config": JSON.stringify(mockupConfig.footer),
    "footer-variant": mockupConfig.footer_variant,
    "hero-tag": mockupConfig.hero_tag,
    "hero-heading": mockupConfig.hero_heading,
    "hero-paragraph": mockupConfig.hero_paragraph,
    "hero-button-1-text": mockupConfig.hero_button_1_text,
    "hero-button-2-text": mockupConfig.hero_button_2_text,
    "hero-variant": mockupConfig.hero_variant,
    "hero-image": mockupConfig.hero_image,
    "statistics-benefits-visibility":
      mockupConfig.stats_benefits_visibility,
    "statistics-benefits": JSON.stringify({
      cards: mockupConfig.stats_benefits_cards,
    }),
  };

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
      webflowUrl = `https://${siteDomain}/mockup/${slug}`;
    }
  } catch (err) {
    console.error(
      "Webflow publish failed (non-blocking):",
      err instanceof Error ? err.message : err
    );
  }

  // Upsert client_mockups row
  const { data: mockupRow, error: upsertError } = await supabase
    .from("client_mockups")
    .upsert(
      {
        client_id: id,
        webflow_item_id: webflowItemId,
        webflow_url: webflowUrl,
        config: mockupConfig,
        logo_url: existingMockup?.logo_url ?? "",
        status: "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id" }
    )
    .select()
    .single();

  if (upsertError) {
    console.error("Failed to save mockup:", upsertError);
    return NextResponse.json(
      { error: "Failed to save mockup" },
      { status: 500 }
    );
  }

  // Log usage
  const usage = response.usage;
  console.log(
    `[mockup/generate] Client: ${id} | Input: ${usage.input_tokens} | Output: ${usage.output_tokens} | Total: ${usage.input_tokens + usage.output_tokens} tokens`
  );

  return NextResponse.json({
    success: true,
    mockup: mockupRow,
    usage: {
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
    },
  });
}
