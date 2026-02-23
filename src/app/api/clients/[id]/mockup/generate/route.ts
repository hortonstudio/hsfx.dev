import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { MockupConfig, MasterJSON } from "@/lib/clients/types";

export const maxDuration = 60;

interface IconRow {
  name: string;
  group_name: string;
  svg_content: string;
}

// Fallback system prompt if prompts table is unavailable
const FALLBACK_PROMPT = `You are a web designer generating a homepage mockup for a home service business. Output ONLY valid JSON with two top-level keys: "master_json" and "wf_fields".

master_json contains dynamic data populated by JS:
- config: { logo: { src: "", alt: "" }, company, email, phone, address, socials: { facebook, instagram, youtube, tiktok, x, linkedin, pinterest } }
- navbar: { top_bar: { show: bool, map: { show: bool, text, href } }, nav_links: [{ text, href } or { text, dropdown: [{ text, href }] }], cta: { text } }
- footer: { footer_nav: [{ text, href }], footer_groups: [{ heading, links: [{ text, href }] }] }
- services: { cards: [{ image_url?: "", heading, paragraph }] }
- process: { steps: [{ heading, paragraph, features?: [string] }] }
- stats_benefits: { cards: [{ icon_name, heading, paragraph }] } (always 4)
- testimonials: { top_row: [{ review, name }], bottom_row: [{ review, name }] } (4 per row)
- faq: { items: [{ question, answer }] }
- contact: { form: { inputs: { name: { label, placeholder }, phone: { label, placeholder }, email: { label, placeholder }, address: { label, placeholder } }, textarea: { notes: { label, placeholder } }, checkbox_text, submit_button } }

wf_fields contains CMS-bound values:
- navbar_variant: "Full" | "Full, no top" | "Island" | "Island, no top"
- footer_variant: "Minimal" | "Full"
- hero_tag, hero_heading, hero_paragraph, hero_button_1_text, hero_button_2_text
- hero_variant: "Full Height, Left Align" | "Auto Height, Center Align" | "Text and Image 2 Grid"
- services_variant: "Three Grid" | "Sticky List"
- services_tag, services_heading, services_paragraph, services_button
- process_variant: "Sticky List" | "Card Grid"
- process_tag, process_heading, process_paragraph, process_button
- about_tag, about_heading, about_subheading, about_button_1, about_button_2
- stats_benefits_visibility: "Statistics" | "Benefits"
- testimonials_tag, testimonials_heading, testimonials_paragraph
- faq_variant: "Center" | "Two Grid"
- faq_tag, faq_heading, faq_paragraph
- cta_tag, cta_heading, cta_paragraph, cta_button_1, cta_button_2
- contact_variant: "Two Grid" | "Center"
- contact_tag, contact_heading, contact_paragraph
- css: { brand_1, brand_1_text, brand_2, brand_2_text, dark_900, dark_800, light_100, light_200, radius: "sharp"|"soft"|"rounded", theme: "light"|"dark" }

Rules:
- Logo src must be "" (uploaded separately)
- For hero_image, about_image, and service card image_url: pick appropriate stock image URLs from the provided list. Match by industry/category. If no stock images are available, use "".
- All CTA/button hrefs go to #contact
- Nav/footer hrefs are anchors: #about, #services, #contact, #service-area, #areas
- Services Three Grid → Process Sticky List (and vice versa)
- Three Grid: 3 or 6 cards. Sticky List: 3-8 cards. Card Grid: always 3 steps.
- Use "Statistics" only with real numbers from KB. Use "Benefits" otherwise. Never fabricate stats.
- For stats_benefits cards, pick icon_name from the available icons list.
- Testimonial reviews: 120-160 chars each, consistent length across all 8.
- CSS: brand_1_text must contrast against brand_1 (WCAG AA). Same for brand_2.
- Theme default: "light" unless client clearly prefers dark.
- Do NOT fabricate contact info. Use what is in the KB or leave empty.
- All heading/paragraph fields are plain text (auto-wrapped in <h2>/<p> at push time). Do NOT include HTML tags.
- Return ONLY valid JSON, no markdown, no explanation.

## COPYWRITING GUIDELINES
All text content (headings, paragraphs, CTAs, FAQs, testimonials, etc.) must follow these rules:

Writing Style:
- Write at a high school reading level. Use everyday words people actually say.
- NO em dashes or dashes of any kind. Use commas or periods instead.
- NO corporate jargon ("leverage," "utilize," "synergy," "solutions").
- Sound like a real person talking, not AI or corporate speak. Write like you're explaining to a neighbor.
- Use "we" naturally. If the KB indicates an owner-operated business, use "I" instead.
- Mix sentence lengths naturally. Use contractions (we're, you'll, it's). Don't be afraid of fragments when they work.
- Start some sentences with "And" or "But" when it feels right.

Content Integrity:
- NEVER fabricate statistics, credentials, awards, years in business, or capabilities.
- Use ONLY information from the Knowledge Base. If you don't have a fact, don't invent one.
- All claims must be verifiable against the provided KB.
- No phone number mentions in body copy. Let buttons and the contact form handle that.

Conversion Psychology:
- Lead with the customer's problem, not the service. Focus on what happens if they DON'T fix the issue.
- Explain the process, not outcomes you can't guarantee. Address the real fear behind the purchase.
- Show you understand their situation before pitching a solution.

Trust-Building:
- "We personally handle..." style language that conveys ownership.
- Use specific credentials ONLY from the KB.
- "We live here too" local messaging when the KB supports it.
- Admit what you don't do, not just what you do. Honesty builds trust.

CTA Psychology:
- "Get My Free [Service]" beats "Contact Us." Make CTAs about the customer, not the business.
- Remove friction from the ask. Tell them what happens when they click.
- hero_button_1_text and cta_button_1 should be action-oriented and specific.

Avoid These AI Giveaways:
- Three-item lists in every section. Vary list lengths (2, 4, 5, etc.).
- Starting any heading with "Welcome to..."
- Overusing transitions like "moreover" or "furthermore."
- Too many adjectives stacked together.
- Repeating the same sentence structure across sections.
- Making promises not backed by the KB.

Uniqueness:
- Every section must feel distinct. Vary opening patterns across headings and paragraphs.
- Highlight different benefits or angles in each section.
- Testimonials should each have a unique voice and focus on different aspects of the service.

The Human Test: If you wouldn't say it face-to-face to a homeowner, rewrite it. Good copy sounds like a confident local expert having a conversation.`;

const DEFAULT_CONTACT_FORM = {
  inputs: {
    name: { label: "Name *", placeholder: "Full Name" },
    phone: { label: "Phone *", placeholder: "000-000-0000" },
    email: { label: "Email *", placeholder: "email@email.com" },
    address: { label: "Service Address *", placeholder: "1001 Main St." },
  },
  textarea: {
    notes: { label: "Notes", placeholder: "Tell us about your project..." },
  },
  checkbox_text: "",
  submit_button: "Get a Free Estimate",
};

const DEFAULT_CSS = {
  brand_1: "#2563eb",
  brand_1_text: "#ffffff",
  brand_2: "#f97316",
  brand_2_text: "#ffffff",
  dark_900: "#000007",
  dark_800: "#141414",
  light_100: "#fafbfc",
  light_200: "#ebebeb",
  radius: "rounded" as const,
  theme: "light" as const,
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const adminClient = createAdminClient();

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

  // Fetch client
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Fetch compiled KB
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

  // Fetch existing mockup (preserve logo_url and WF IDs on regenerate)
  const { data: existingMockup } = await supabase
    .from("client_mockups")
    .select("*")
    .eq("client_id", id)
    .maybeSingle();

  // Fetch system prompt from prompts table (fallback to hardcoded)
  let systemPrompt = FALLBACK_PROMPT;
  try {
    const { data: promptRow } = await adminClient
      .from("prompts")
      .select("content")
      .eq("id", "mockup-generator")
      .single();
    if (promptRow?.content) {
      systemPrompt = promptRow.content;
    }
  } catch {
    // Table may not exist yet — use fallback
  }

  // Fetch available icons
  const { data: icons } = await adminClient
    .from("icons")
    .select("name, group_name, svg_content")
    .order("group_name")
    .order("name");

  const typedIcons = (icons ?? []) as IconRow[];

  // Build icon list for prompt
  const iconsByGroup: Record<string, string[]> = {};
  for (const icon of typedIcons) {
    if (!iconsByGroup[icon.group_name]) iconsByGroup[icon.group_name] = [];
    iconsByGroup[icon.group_name].push(icon.name);
  }
  const iconListText = Object.entries(iconsByGroup)
    .map(([group, names]) => `  ${group}: ${names.join(", ")}`)
    .join("\n");

  // Fetch stock images for AI to pick from
  const { data: stockImages } = await adminClient
    .from("stock_images")
    .select("name, category, image_url")
    .order("category")
    .order("name");

  const typedStockImages = (stockImages ?? []) as { name: string; category: string; image_url: string }[];

  // Build stock image list for prompt
  const imagesByCategory: Record<string, { name: string; url: string }[]> = {};
  for (const img of typedStockImages) {
    if (!imagesByCategory[img.category]) imagesByCategory[img.category] = [];
    imagesByCategory[img.category].push({ name: img.name, url: img.image_url });
  }
  const stockImageListText = Object.entries(imagesByCategory)
    .map(([cat, imgs]) => `  ${cat}: ${imgs.map((i) => `${i.name} (${i.url})`).join(", ")}`)
    .join("\n");

  // Build user message
  const businessName =
    client.business_name || `${client.first_name} ${client.last_name}`;

  const userMessage = `Client: ${businessName}

Knowledge Base:
${kbDoc.content}

Available icon names by group:
${iconListText}

Available stock images by category (pick appropriate ones for hero_image, about_image, and service card image_url fields):
${stockImageListText || "  (no stock images available — leave image fields as empty strings)"}

Generate the complete homepage mockup config JSON.`;

  // Call Claude
  const anthropic = new Anthropic();
  let response;
  try {
    response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8192,
      system: systemPrompt,
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

  // Extract text
  const textBlock = response.content.find((c) => c.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json(
      { error: "No text response from Claude" },
      { status: 500 }
    );
  }

  // Parse JSON (strip markdown code fences if present)
  let rawText = textBlock.text.trim();
  if (rawText.startsWith("```")) {
    rawText = rawText.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  let mockupConfig: MockupConfig;
  try {
    const parsed = JSON.parse(rawText);
    const mj = parsed.master_json ?? parsed;
    const wf = parsed.wf_fields ?? parsed;

    // Resolve icon_name → icon_svg for stats/benefits
    const rawCards = mj?.stats_benefits?.cards ?? [];
    const resolvedCards = rawCards.map(
      (card: { icon_name?: string; heading: string; paragraph: string }) => {
        const matched = typedIcons.find((i) => i.name === (card.icon_name ?? ""));
        const fallback = typedIcons.find((i) => i.group_name === "general");
        return {
          icon_svg: matched?.svg_content ?? fallback?.svg_content ?? "",
          heading: card.heading,
          paragraph: card.paragraph,
        };
      }
    );

    // Preserve existing logo URL on regenerate
    const logoUrl = existingMockup?.logo_url ?? "";

    const fullMasterJson: MasterJSON = {
      config: {
        logo: { src: logoUrl, alt: mj.config?.logo?.alt ?? businessName },
        company: mj.config?.company ?? businessName,
        email: mj.config?.email ?? "",
        phone: mj.config?.phone ?? "",
        address: mj.config?.address ?? "",
        socials: {
          facebook: mj.config?.socials?.facebook ?? "",
          instagram: mj.config?.socials?.instagram ?? "",
          youtube: mj.config?.socials?.youtube ?? "",
          tiktok: mj.config?.socials?.tiktok ?? "",
          x: mj.config?.socials?.x ?? "",
          linkedin: mj.config?.socials?.linkedin ?? "",
          pinterest: mj.config?.socials?.pinterest ?? "",
        },
      },
      navbar: {
        top_bar: mj.navbar?.top_bar ?? { show: false, map: { show: false, text: "", href: "#service-area" } },
        nav_links: mj.navbar?.nav_links ?? [],
        cta: mj.navbar?.cta ?? { text: "Get a Free Quote" },
      },
      footer: {
        footer_nav: mj.footer?.footer_nav ?? [],
        footer_groups: mj.footer?.footer_groups ?? [],
      },
      services: { cards: mj.services?.cards ?? [] },
      process: { steps: mj.process?.steps ?? [] },
      stats_benefits: { cards: resolvedCards },
      testimonials: {
        top_row: mj.testimonials?.top_row ?? [],
        bottom_row: mj.testimonials?.bottom_row ?? [],
      },
      faq: { items: mj.faq?.items ?? [] },
      contact: { form: mj.contact?.form ?? DEFAULT_CONTACT_FORM },
    };

    mockupConfig = {
      master_json: fullMasterJson,
      navbar_variant: wf.navbar_variant ?? "Full, no top",
      footer_variant: wf.footer_variant ?? "Minimal",
      hero_tag: wf.hero_tag ?? "",
      hero_heading: wf.hero_heading ?? "",
      hero_paragraph: wf.hero_paragraph ?? "",
      hero_button_1_text: wf.hero_button_1_text ?? "Get a Free Quote",
      hero_button_2_text: wf.hero_button_2_text ?? "",
      hero_variant: wf.hero_variant ?? "Auto Height, Center Align",
      hero_image: wf.hero_image ?? "",
      services_variant: wf.services_variant ?? "Three Grid",
      services_tag: wf.services_tag ?? "",
      services_heading: wf.services_heading ?? "",
      services_paragraph: wf.services_paragraph ?? "",
      services_button: wf.services_button ?? "",
      process_variant: wf.process_variant ?? "Sticky List",
      process_tag: wf.process_tag ?? "",
      process_heading: wf.process_heading ?? "",
      process_paragraph: wf.process_paragraph ?? "",
      process_button: wf.process_button ?? "",
      about_tag: wf.about_tag ?? "",
      about_heading: wf.about_heading ?? "",
      about_subheading: wf.about_subheading ?? "",
      about_button_1: wf.about_button_1 ?? "",
      about_button_2: wf.about_button_2 ?? "",
      about_image: wf.about_image ?? "",
      stats_benefits_visibility: wf.stats_benefits_visibility ?? "Benefits",
      testimonials_tag: wf.testimonials_tag ?? "",
      testimonials_heading: wf.testimonials_heading ?? "",
      testimonials_paragraph: wf.testimonials_paragraph ?? "",
      faq_variant: wf.faq_variant ?? "Center",
      faq_tag: wf.faq_tag ?? "",
      faq_heading: wf.faq_heading ?? "",
      faq_paragraph: wf.faq_paragraph ?? "",
      cta_tag: wf.cta_tag ?? "",
      cta_heading: wf.cta_heading ?? "",
      cta_paragraph: wf.cta_paragraph ?? "",
      cta_button_1: wf.cta_button_1 ?? "",
      cta_button_2: wf.cta_button_2 ?? "",
      contact_variant: wf.contact_variant ?? "Two Grid",
      contact_tag: wf.contact_tag ?? "",
      contact_heading: wf.contact_heading ?? "",
      contact_paragraph: wf.contact_paragraph ?? "",
      css: wf.css ?? DEFAULT_CSS,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to parse mockup config:", msg);
    return NextResponse.json(
      { error: `Failed to parse AI response: ${msg}` },
      { status: 500 }
    );
  }

  // Save to DB as draft — Webflow push is a separate step
  const { data: mockupRow, error: upsertError } = await supabase
    .from("client_mockups")
    .upsert(
      {
        client_id: id,
        webflow_item_id: existingMockup?.webflow_item_id ?? "",
        webflow_url: existingMockup?.webflow_url ?? "",
        config: mockupConfig,
        logo_url: existingMockup?.logo_url ?? "",
        status: "draft",
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
