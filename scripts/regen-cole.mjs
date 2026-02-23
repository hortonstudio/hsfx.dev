import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local
const envContent = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);
const anthropic = new Anthropic();

const CLIENT_ID = "460a9d2f-fba7-4144-87d5-3862b39eed30";
const MODEL = "claude-sonnet-4-5-20250929";

// ──────────────────────────────────────────────────
// 1. MOCKUP GENERATION
// ──────────────────────────────────────────────────
async function regenerateMockup() {
  console.log("\n=== REGENERATING MOCKUP CONFIG ===\n");

  // Fetch KB
  const { data: kbDoc } = await supabase
    .from("client_knowledge_documents")
    .select("content")
    .eq("client_id", CLIENT_ID)
    .single();

  if (!kbDoc?.content) throw new Error("No compiled KB found");

  // Fetch existing mockup for logo_url preservation
  const { data: existingMockup } = await supabase
    .from("client_mockups")
    .select("logo_url, webflow_item_id, webflow_url")
    .eq("client_id", CLIENT_ID)
    .maybeSingle();

  // Fetch icons
  const { data: icons } = await supabase
    .from("icons")
    .select("name, group_name")
    .order("group_name")
    .order("name");

  const iconsByGroup = {};
  for (const icon of icons ?? []) {
    if (!iconsByGroup[icon.group_name]) iconsByGroup[icon.group_name] = [];
    iconsByGroup[icon.group_name].push(icon.name);
  }
  const iconListText = Object.entries(iconsByGroup)
    .map(([group, names]) => `  ${group}: ${names.join(", ")}`)
    .join("\n");

  // Fetch stock images
  const { data: stockImages } = await supabase
    .from("stock_images")
    .select("name, category, image_url")
    .order("category")
    .order("name");

  const imagesByCategory = {};
  for (const img of stockImages ?? []) {
    if (!imagesByCategory[img.category]) imagesByCategory[img.category] = [];
    imagesByCategory[img.category].push({ name: img.name, url: img.image_url });
  }
  const stockImageListText = Object.entries(imagesByCategory)
    .map(([cat, imgs]) => `  ${cat}: ${imgs.map((i) => `${i.name} (${i.url})`).join(", ")}`)
    .join("\n");

  // Fetch system prompt
  let systemPrompt;
  try {
    const { data: promptRow } = await supabase
      .from("prompts")
      .select("content")
      .eq("id", "mockup-generator")
      .single();
    systemPrompt = promptRow?.content;
  } catch {}

  if (!systemPrompt) {
    // Use fallback from the route file (read it)
    console.log("  Using fallback prompt (no prompts table row)");
    systemPrompt = readFileSync(
      resolve(process.cwd(), "src/app/api/clients/[id]/mockup/generate/route.ts"),
      "utf8"
    ).match(/const FALLBACK_PROMPT = `([\s\S]*?)`;/)?.[1];
  }

  const userMessage = `Client: Cole's Plumbing

Knowledge Base:
${kbDoc.content}

Available icon names by group:
${iconListText}

Available stock images by category (pick appropriate ones for hero_image, about_image, and service card image_url fields):
${stockImageListText}

Generate the complete homepage mockup config JSON.`;

  console.log("  Calling Claude Sonnet 4.5...");
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((c) => c.type === "text");
  let rawText = textBlock.text.trim();
  if (rawText.startsWith("```")) {
    rawText = rawText.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  const config = JSON.parse(rawText);
  console.log(`  Parsed config: ${Object.keys(config).length} top-level keys`);
  console.log(`  Usage: ${response.usage.input_tokens} in / ${response.usage.output_tokens} out`);

  // Preserve logo
  if (existingMockup?.logo_url && config.master_json?.config?.logo) {
    config.master_json.config.logo.src = existingMockup.logo_url;
  }

  // Upsert
  const { error } = await supabase
    .from("client_mockups")
    .upsert(
      {
        client_id: CLIENT_ID,
        config,
        status: "draft",
        logo_url: existingMockup?.logo_url ?? null,
        webflow_item_id: existingMockup?.webflow_item_id ?? null,
        webflow_url: existingMockup?.webflow_url ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id" }
    );

  if (error) throw new Error(`DB save failed: ${error.message}`);
  console.log("  Mockup config saved as draft!\n");
}

// ──────────────────────────────────────────────────
// 2. SITEMAP GENERATION
// ──────────────────────────────────────────────────
async function regenerateSitemap() {
  console.log("\n=== REGENERATING SITEMAP ===\n");

  // Fetch KB
  const { data: kbDoc } = await supabase
    .from("client_knowledge_documents")
    .select("content")
    .eq("client_id", CLIENT_ID)
    .single();

  if (!kbDoc?.content) throw new Error("No compiled KB found");

  // Read proposal doc for additional context
  const proposalDoc = readFileSync(
    resolve(process.cwd(), "zdemo-info-drop/WHATIMPROPOSING.md"),
    "utf8"
  );

  // Fetch system prompt
  let systemPrompt;
  try {
    const { data: promptRow } = await supabase
      .from("prompts")
      .select("content")
      .eq("id", "sitemap-generator")
      .single();
    systemPrompt = promptRow?.content;
  } catch {}

  if (!systemPrompt) {
    console.log("  Using fallback prompt");
    systemPrompt = readFileSync(
      resolve(process.cwd(), "src/app/api/clients/[id]/sitemap/generate/route.ts"),
      "utf8"
    ).match(/const FALLBACK_PROMPT = `([\s\S]*?)`;/)?.[1];
  }

  const userMessage = `Client: Cole's Plumbing
Package Tier: 3

Knowledge Base:
${kbDoc.content}

Additional context — this is the proposal document showing exactly what pages and services have been agreed on with the client:
${proposalDoc}

Generate the complete sitemap as a JSON array of page objects for Package 3.
Make sure to include ALL 14 service pages listed in the proposal, ALL 5 service area pages (Carrollton, The Colony, Lewisville, Coppell, Grapevine), Gallery, About, FAQ, Testimonials, Contact, and Privacy Policy.`;

  console.log("  Calling Claude Sonnet 4.5...");
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((c) => c.type === "text");
  let rawText = textBlock.text.trim();
  if (rawText.startsWith("```")) {
    rawText = rawText.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  const parsed = JSON.parse(rawText);
  const aiNodes = Array.isArray(parsed) ? parsed : (parsed.nodes ?? parsed);
  console.log(`  Parsed ${aiNodes.length} sitemap nodes`);
  console.log(`  Usage: ${response.usage.input_tokens} in / ${response.usage.output_tokens} out`);

  // We need the layout utilities — import them dynamically via tsx
  // For now, save raw AI nodes and let the UI handle layout
  // Actually, let's save as-is and call the layout from a tsx script

  // Get existing slug
  const { data: existingSitemap } = await supabase
    .from("client_sitemaps")
    .select("slug")
    .eq("client_id", CLIENT_ID)
    .maybeSingle();

  const slug = existingSitemap?.slug ?? "coles-plumbing";

  // Transform nodes to react-flow format (simplified — matches aiNodesToSitemapNodes)
  const nodes = aiNodes.map((n, i) => ({
    id: n.id,
    type: "sitemap",
    position: { x: 0, y: i * 100 },
    data: {
      label: n.label,
      path: n.path,
      pageType: n.pageType,
      parentId: n.parentId,
      description: n.description || "",
      sections: n.sections || [],
      seoTitle: n.seoTitle || "",
      seoDescription: n.seoDescription || "",
      collectionName: n.collectionName || null,
      estimatedItems: n.estimatedItems || null,
    },
  }));

  // Build edges from parent IDs
  const edges = aiNodes
    .filter((n) => n.parentId)
    .map((n) => ({
      id: `e-${n.parentId}-${n.id}`,
      source: n.parentId,
      target: n.id,
      type: "smoothstep",
    }));

  // Simple auto-layout (hierarchy-based)
  const childrenMap = {};
  for (const n of aiNodes) {
    const parent = n.parentId || "__root__";
    if (!childrenMap[parent]) childrenMap[parent] = [];
    childrenMap[parent].push(n.id);
  }

  const NODE_W = 240;
  const NODE_H = 80;
  const GAP_X = 60;
  const GAP_Y = 120;

  function layoutLevel(parentId, startX, y) {
    const children = childrenMap[parentId] || [];
    let totalWidth = children.length * (NODE_W + GAP_X) - GAP_X;
    let x = startX - totalWidth / 2;

    for (const childId of children) {
      const node = nodes.find((n) => n.id === childId);
      if (node) {
        node.position = { x: x + NODE_W / 2, y };
        const subChildren = childrenMap[childId] || [];
        if (subChildren.length > 0) {
          layoutLevel(childId, x + NODE_W / 2, y + NODE_H + GAP_Y);
        }
        x += NODE_W + GAP_X;
      }
    }
  }

  // Root node
  const rootNode = nodes.find((n) => n.data.pageType === "home");
  if (rootNode) {
    rootNode.position = { x: 600, y: 0 };
    layoutLevel(rootNode.id, 600, NODE_H + GAP_Y);
  }

  const sitemapData = {
    nodes,
    edges,
    viewport: { x: 0, y: 0, zoom: 0.5 },
  };

  const { error } = await supabase
    .from("client_sitemaps")
    .upsert(
      {
        client_id: CLIENT_ID,
        slug,
        title: "Site Map",
        package_tier: 3,
        sitemap_data: sitemapData,
        status: "draft",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id" }
    );

  if (error) throw new Error(`DB save failed: ${error.message}`);
  console.log(`  Sitemap saved (${aiNodes.length} pages, ${edges.length} edges)!\n`);
}

// ──────────────────────────────────────────────────
// RUN BOTH
// ──────────────────────────────────────────────────
try {
  await regenerateMockup();
  await regenerateSitemap();
  console.log("=== ALL DONE ===");
} catch (err) {
  console.error("FATAL:", err.message);
  process.exit(1);
}
