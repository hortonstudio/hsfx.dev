import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { AISitemapNode } from "@/lib/clients/sitemap-types";
import { aiNodesToSitemapNodes, buildEdgesFromParentIds, generateSlug, validateAndCleanAINodes } from "@/lib/clients/sitemap-utils";
import { autoLayout } from "@/lib/clients/sitemap-layout";
import { buildSitemapPrompt } from "@/lib/clients/sitemap-niche-prompts";

export const maxDuration = 60;

const FALLBACK_PROMPT = `You are an expert web architect designing a professional sitemap for a business website. Output ONLY a valid JSON array of page objects. No markdown, no explanation, no wrapping object.

## Output Format

Each page object MUST have ALL of these fields:
{
  "id": "kebab-case-unique-id",
  "label": "Display Name",
  "path": "/url/path",
  "pageType": "home|static|collection|collection_item|utility|external",
  "parentId": "parent-id-or-null",
  "description": "1-2 sentences explaining the page purpose and primary conversion goal.",
  "sections": ["Hero", "Content", "CTA"],
  "seoTitle": "SEO Title — Brand Name (50-60 chars)",
  "seoDescription": "Compelling meta description with call-to-action. (120-160 chars)",
  "collectionName": "Collection Name (collection/collection_item only, else omit)",
  "estimatedItems": 10
}

## STRICT RULES — Every page MUST have:
- description: 1-2 sentences. Never empty. Describe purpose AND conversion goal.
- seoTitle: 50-60 characters. Include primary keyword + brand name. Never empty.
- seoDescription: 120-160 characters. Include a call to action. Never empty.
- sections: At least 2 sections from the catalog below. Never empty array.

## Page Types
- "home": EXACTLY ONE. The root page. parentId: null.
- "static": Standalone pages (About, Contact, FAQ, Testimonials, Gallery).
- "collection": Index/listing pages that are parents for collection_item pages. Examples: Services, Blog, Service Areas, Projects.
- "collection_item": Individual items WITHIN a collection. parentId MUST be a collection page. Examples: each service, blog post, city page, project.
- "utility": Legal/system pages (Privacy Policy, Terms, 404). Minimal sections.
- "external": External links (rarely used). No sections needed.

## Path Rules
- Always lowercase, kebab-case
- Always start with /
- No trailing slashes (except "/" for home)
- No special characters
- Collection items nest under parent: /services/roof-repair, /areas/dallas, /blog/spring-tips

## Section Catalog — ONLY use sections from this list:
Hero, Content, Services Overview, Services Grid, Service Details, Process Steps, Stats/Numbers, Testimonials, Testimonial Grid, FAQ Accordion, CTA, Contact Form, Map, Team Grid, Team Member, Story/History, Values, Credentials, Gallery Grid, Before/After Gallery, Blog Grid, Blog Content, Related Posts, Categories, Pricing Table, Pricing Cards, Feature List, Feature Grid, Comparison Table, Video, Image Banner, Logo Bar, Partners, Portfolio Grid, Case Study, Download/Resources, Newsletter Signup, Social Proof, Breadcrumbs, Sidebar, Search, Filters, Area Map, Area Services

## Required Sections by Page Type:
- Home: Hero + at least 3 of [Services Overview, Testimonials, Stats/Numbers, FAQ Accordion, CTA]
- About: Hero + Story/History + at least 1 of [Team Grid, Values, Credentials, CTA]
- Contact: Hero + Contact Form + at least 1 of [Map, Stats/Numbers, CTA]
- Service (collection): Hero + Services Grid + CTA
- Service Item (collection_item): Hero + Service Details + at least 2 of [Gallery Grid, Before/After Gallery, Process Steps, FAQ Accordion, Testimonials, Pricing Table, CTA]
- Blog (collection): Hero + Blog Grid + CTA
- Blog Post (collection_item): Hero + Blog Content + Related Posts + CTA
- Service Area (collection_item): Hero + Area Services + at least 2 of [Testimonials, FAQ Accordion, Map, CTA]
- Gallery/Portfolio (collection): Hero + Gallery Grid or Portfolio Grid
- FAQ: Hero + FAQ Accordion + CTA
- Testimonials: Hero + Testimonial Grid + CTA
- Privacy/Terms (utility): Content

## Hierarchy Rules
- Home is the root. All top-level pages are children of Home.
- Services MUST be a collection page with individual service collection_items as children.
- If the business serves multiple areas, create a Service Areas collection with city/town collection_items.
- collection_items MUST have a collectionName matching their parent collection's collectionName.

## Template-Only Collections (NO collection_items generated)
The following are TEMPLATE-ONLY. Generate ONLY the parent page with an estimatedItems count. Do NOT generate any collection_item children for these:
- Gallery / Portfolio / Projects → collection page with estimatedItems. Sections: Hero, Gallery Grid, CTA
- FAQ → static page. Sections: Hero, FAQ Accordion, CTA
- Blog → collection page with estimatedItems (e.g. 5). Do NOT generate individual blog post items.
- Testimonials → static page. Sections: Hero, Testimonial Grid, CTA

## Itemized Collections (DO generate collection_items)
Only these collections get individual collection_item children:
- Services → one collection_item per actual service from the KB
- Service Areas → one collection_item per service area from the KB

## Content Rules
- Always prefer real data from the knowledge base (services, locations, team members, specialties).
- If the KB mentions specific services, create a collection_item for each one with accurate names.
- If the KB mentions specific cities/areas, create a Service Area collection_item for each.
- When the KB lacks detail for a required page (e.g. no FAQ content), still create the page but use the business name and industry context to write realistic placeholder descriptions and SEO fields.
- NEVER invent services or locations not mentioned in or reasonably implied by the KB.

## Package Tier Guidelines
- Package 1 (~8-15 pages): Home, About, Services collection + 3-4 service items, Contact, Privacy Policy.
- Package 2 (~15-25 pages): Everything in Package 1 + Service Areas collection (5-8 area items), Gallery template, FAQ, Blog template, Testimonials.
- Package 3 (~25-40 pages): Everything in Package 2 + more area items (up to 15), more service items, Terms of Service.
These counts are lower because template-only collections (Gallery, Blog, FAQ, Testimonials) do NOT generate individual items.

Return ONLY the JSON array.`;

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

  // Parse request body
  let body: { packageTier: 1 | 2 | 3; customPrompt?: string; importJson?: string; niche?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { packageTier, customPrompt, importJson, niche } = body;

  if (![1, 2, 3].includes(packageTier)) {
    return NextResponse.json({ error: "Invalid package tier" }, { status: 400 });
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

  // Fetch system prompt from prompts table (fallback to hardcoded)
  let systemPrompt = FALLBACK_PROMPT;
  try {
    const { data: promptRow } = await adminClient
      .from("prompts")
      .select("content")
      .eq("id", "sitemap-generator")
      .single();
    if (promptRow?.content) {
      systemPrompt = promptRow.content;
    }
  } catch {
    // Table may not exist yet — use fallback
  }

  // Apply niche-specific prompt addenda
  if (niche) {
    systemPrompt = buildSitemapPrompt(systemPrompt, niche);
  }

  // Build user message
  const businessName =
    client.business_name || `${client.first_name} ${client.last_name}`;

  let userMessage = `Client: ${businessName}
Package Tier: ${packageTier}

Knowledge Base:
${kbDoc.content}`;

  if (importJson) {
    userMessage += `\n\nThe user has provided an existing sitemap structure as JSON. Use this as a starting point, enhance it with proper sections, SEO fields, and descriptions based on the knowledge base:\n${importJson}`;
  }

  if (customPrompt) {
    userMessage += `\n\nAdditional instructions from the user:\n${customPrompt}`;
  }

  userMessage += `\n\nGenerate the complete sitemap as a JSON array of page objects for Package ${packageTier}.`;

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
    console.error("[sitemap/generate] Claude API error:", msg);
    return NextResponse.json(
      { error: `AI generation failed: ${msg}` },
      { status: 502 }
    );
  }

  // Log usage
  const usage = response.usage;
  console.log(
    `[sitemap/generate] Client: ${id} | Pkg: ${packageTier} | Input: ${usage.input_tokens} | Output: ${usage.output_tokens} | Total: ${usage.input_tokens + usage.output_tokens} tokens`
  );

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

  let aiNodes: AISitemapNode[];
  try {
    const parsed = JSON.parse(rawText);
    // Handle both array and { nodes: [] } wrapper
    aiNodes = Array.isArray(parsed) ? parsed : (parsed.nodes ?? parsed);
    if (!Array.isArray(aiNodes)) {
      throw new Error("Expected an array of page objects");
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Parse error";
    console.error("[sitemap/generate] JSON parse error:", msg, rawText.slice(0, 200));
    return NextResponse.json(
      { error: `Failed to parse AI response: ${msg}` },
      { status: 500 }
    );
  }

  // Validate and clean AI output, then transform to react-flow format
  const cleanedNodes = validateAndCleanAINodes(aiNodes, businessName);
  const nodes = aiNodesToSitemapNodes(cleanedNodes);
  const edges = buildEdgesFromParentIds(cleanedNodes);
  const laidOutNodes = autoLayout(nodes, edges);

  const sitemapData = {
    nodes: laidOutNodes,
    edges,
    viewport: { x: 0, y: 0, zoom: 1 },
  };

  // Generate slug from business name
  const { data: existingSitemap } = await supabase
    .from("client_sitemaps")
    .select("slug")
    .eq("client_id", id)
    .maybeSingle();

  const slug = existingSitemap?.slug ?? generateSlug(businessName);

  // Upsert sitemap
  const { data, error } = await supabase
    .from("client_sitemaps")
    .upsert(
      {
        client_id: id,
        slug,
        title: "Site Map",
        package_tier: packageTier,
        sitemap_data: sitemapData,
        status: "draft",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("[sitemap/generate] DB save error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ...data,
    usage: {
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
    },
  });
}
