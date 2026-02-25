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
- "home": EXACTLY ONE root page. parentId: null.
- "static": Standalone pages AND hub/overview pages for CMS collections. Examples: About, Contact, FAQ, Services (hub), Blog (hub), Case Studies (hub).
- "collection": CMS page templates that define the layout of dynamic/repeating pages. Always paired with a static hub page — parentId MUST reference the hub. Examples: "Service Template", "Blog Post Template", "Case Study Template".
- "collection_item": Individual CMS items created from a collection template. parentId MUST reference a collection page. Examples: each service, blog post, case study, city page.
- "utility": Legal/system pages (Privacy Policy, Terms, 404). Minimal sections.
- "external": External links (rarely used). No sections needed.

## Hub + Template Pattern (CRITICAL)

Every CMS-driven section of the site uses a Hub + Template pair:

1. **Hub Page** (pageType: "static") — The listing/overview page users see. Shows grids, filters, cards linking to individual items. parentId: "home".
2. **Template Page** (pageType: "collection") — Defines the layout for each individual item page. parentId: the hub page's id. Has collectionName and sections for the detail view.
3. **Items** (pageType: "collection_item") — Individual entries. parentId: the template page's id. Has matching collectionName.

### Example — Services (with items):
  { "id": "services", "pageType": "static", "parentId": "home", "label": "Services", "sections": ["Hero", "Services Grid", "CTA"] }
  { "id": "service-template", "pageType": "collection", "parentId": "services", "label": "Service Template", "collectionName": "Services", "sections": ["Hero", "Service Details", "Process Steps", "FAQ Accordion", "CTA"] }
  { "id": "roof-repair", "pageType": "collection_item", "parentId": "service-template", "label": "Roof Repair", "collectionName": "Services" }

### Example — Blog (template-only, no individual items):
  { "id": "blog", "pageType": "static", "parentId": "home", "label": "Blog", "sections": ["Hero", "Blog Grid", "Categories", "CTA"] }
  { "id": "blog-post-template", "pageType": "collection", "parentId": "blog", "label": "Blog Post Template", "collectionName": "Blog", "estimatedItems": 5, "sections": ["Hero", "Blog Content", "Related Posts", "CTA"] }

### Example — Case Studies (template-only OR with items depending on KB detail):
  { "id": "case-studies", "pageType": "static", "parentId": "home", "label": "Case Studies", "sections": ["Hero", "Portfolio Grid", "Filters", "CTA"] }
  { "id": "case-study-template", "pageType": "collection", "parentId": "case-studies", "label": "Case Study Template", "collectionName": "Case Studies", "estimatedItems": 6, "sections": ["Hero", "Case Study", "Stats/Numbers", "Testimonials", "Related Posts", "CTA"] }

## Path Rules
- Always lowercase, kebab-case
- Always start with /
- No trailing slashes (except "/" for home)
- No special characters
- Hub pages: /services, /blog, /case-studies
- Template items nest under hub: /services/roof-repair, /blog/spring-tips, /areas/dallas

## Section Catalog — ONLY use sections from this list:
Hero, Content, Services Overview, Services Grid, Service Details, Process Steps, Stats/Numbers, Testimonials, Testimonial Grid, FAQ Accordion, CTA, Contact Form, Map, Team Grid, Team Member, Story/History, Values, Credentials, Gallery Grid, Before/After Gallery, Blog Grid, Blog Content, Related Posts, Categories, Pricing Table, Pricing Cards, Feature List, Feature Grid, Comparison Table, Video, Image Banner, Logo Bar, Partners, Portfolio Grid, Case Study, Download/Resources, Newsletter Signup, Social Proof, Breadcrumbs, Sidebar, Search, Filters, Area Map, Area Services

## Required Sections by Page Type:
- Home: Hero + at least 3 of [Services Overview, Testimonials, Stats/Numbers, FAQ Accordion, CTA, Logo Bar, Case Study]
- About: Hero + Story/History + at least 1 of [Team Grid, Values, Credentials, CTA]
- Contact: Hero + Contact Form + at least 1 of [Map, Stats/Numbers, CTA]
- Services hub (static): Hero + Services Grid + CTA
- Service Template (collection): Hero + Service Details + at least 2 of [Gallery Grid, Before/After Gallery, Process Steps, FAQ Accordion, Testimonials, Pricing Table, CTA]
- Service Item (collection_item): Hero + Service Details + CTA (shorter than template)
- Blog hub (static): Hero + Blog Grid + CTA
- Blog Post Template (collection): Hero + Blog Content + Related Posts + CTA
- Case Studies hub (static): Hero + Portfolio Grid + Filters + CTA
- Case Study Template (collection): Hero + Case Study + Stats/Numbers + Testimonials + CTA
- Service Areas hub (static): Hero + Area Map + Services Grid + CTA
- Service Area Template (collection): Hero + Area Services + at least 2 of [Testimonials, FAQ Accordion, Map, CTA]
- Gallery/Portfolio hub (static): Hero + Gallery Grid or Portfolio Grid + CTA
- Gallery Template (collection): Hero + Gallery Grid + Content + CTA
- FAQ (static, no template needed): Hero + FAQ Accordion + CTA
- Testimonials (static, no template needed): Hero + Testimonial Grid + CTA
- Privacy/Terms (utility): Content

## Hierarchy Rules
- Home is the root (parentId: null). All top-level pages have parentId: "home".
- Every CMS-driven section MUST use the Hub + Template pattern: static hub page + collection template page.
- collection template pages have parentId pointing to their static hub page.
- collection_items have parentId pointing to their collection template page.
- collection_items MUST have a collectionName matching their parent collection's collectionName.
- Static sub-pages may have parentId pointing to another static page (e.g., service category sub-pages under a Services hub).

## Template-Only Collections (Hub + Template, NO collection_items)
These get a static hub page AND a collection template page, but NO individual collection_item children:
- Gallery / Portfolio / Projects → hub + template with estimatedItems
- Blog → hub + template with estimatedItems (e.g. 5). No individual blog post items.
- Case Studies → hub + template with estimatedItems (unless KB has specific case study details)
- FAQ → static page only (no template needed). Sections: Hero, FAQ Accordion, CTA
- Testimonials → static page only (no template needed). Sections: Hero, Testimonial Grid, CTA

## Itemized Collections (Hub + Template + collection_items)
Only these collections get individual collection_item children:
- Services → hub + template + one collection_item per actual service from KB
- Service Areas → hub + template + one collection_item per service area from KB

## Content Rules
- Always prefer real data from the knowledge base (services, locations, team members, specialties).
- If the KB mentions specific services, create a collection_item for each one with accurate names.
- If the KB mentions specific cities/areas, create a Service Area collection_item for each.
- When the KB lacks detail for a required page (e.g. no FAQ content), still create the page but use the business name and industry context to write realistic placeholder descriptions and SEO fields.
- NEVER invent services or locations not mentioned in or reasonably implied by the KB.
- If the KB describes a few major service categories with rich detail, create them as static sub-pages under the Services hub instead of collection_items. Use collection_items for many similar/repeating items that share the same template.

## Package Tier Guidelines
- Package 1 (~10-18 pages): Home, About, Services hub + template + 3-4 items, Contact, Privacy Policy.
- Package 2 (~18-30 pages): Package 1 + Service Areas hub + template (5-8 items), Gallery hub + template, FAQ, Blog hub + template, Testimonials.
- Package 3 (~30-50 pages): Package 2 + Case Studies hub + template, more area/service items (up to 15), Terms of Service.
Hub + template pairs count as 2 pages. Template-only collections (Gallery, Blog) have hub + template but no individual items.

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
