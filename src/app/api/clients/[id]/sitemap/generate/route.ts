import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { AISitemapNode } from "@/lib/clients/sitemap-types";
import { aiNodesToSitemapNodes, buildEdgesFromParentIds, generateSlug } from "@/lib/clients/sitemap-utils";
import { autoLayout } from "@/lib/clients/sitemap-layout";

export const maxDuration = 60;

const FALLBACK_PROMPT = `You are a web designer creating a sitemap structure for a home service business website. Output ONLY valid JSON — an array of page objects.

Each page object has these fields:
- id: unique kebab-case string (e.g. "home", "about", "service-roofing")
- label: display name (e.g. "Home", "About Us", "Roofing")
- path: URL path (e.g. "/", "/about", "/services/roofing")
- pageType: one of "home" | "static" | "collection" | "collection_item" | "utility" | "external"
- parentId: id of parent page (null for root/home page)
- description: 1-2 sentence page purpose
- sections: array of section names on the page (e.g. ["Hero", "Services Grid", "CTA"])
- seoTitle: SEO-optimized page title (50-60 chars)
- seoDescription: meta description (120-160 chars)
- collectionName: (collection/collection_item only) name of the CMS collection
- estimatedItems: (collection only) approximate number of items

Page type rules:
- "home": exactly one, the root page (parentId: null)
- "static": standalone pages like About, Contact, Gallery
- "collection": list/index pages (Services, Blog, Areas) — these are parents for collection items
- "collection_item": individual items within a collection (each service, blog post, area page)
- "utility": legal/system pages (Privacy Policy, 404, Terms)
- "external": links to external resources

Structure rules:
- Always include: Home, About, Contact, Privacy Policy
- Collection items must be children of their collection page
- Services should be a collection with individual service items
- Sections should be realistic page sections (Hero, CTA, Form, Grid, etc.)
- Do NOT fabricate services, locations, or details not present in the knowledge base
- Use the knowledge base to determine the actual services, areas, and business details

Package guidelines:
- Package 1 ($600): 3-5 static + 3-6 collection pages (~8-12 total)
- Package 2 ($1300): 7-10 static + 15-25 collection pages (~25-35 total). Include Service Areas, Blog.
- Package 3 ($3000): 10-15 static + 40+ collection pages (~55-65 total). Include extensive Service Areas, Blog, Gallery, Testimonials collections.

Return ONLY the JSON array. No markdown, no explanation, no wrapping object.`;

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
  let body: { packageTier: 1 | 2 | 3; customPrompt?: string; importJson?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { packageTier, customPrompt, importJson } = body;

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
      model: "claude-haiku-4-5-20251001",
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

  // Transform to react-flow format
  const nodes = aiNodesToSitemapNodes(aiNodes);
  const edges = buildEdgesFromParentIds(aiNodes);
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
