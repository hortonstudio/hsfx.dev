import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { scrapeMultiPage } from "@/lib/onboard/site-scraper";
import { buildSystemPrompt, type BusinessNiche } from "@/lib/onboard/niche-prompts";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

// SSRF protection: block private/internal IPs
function isPrivateUrl(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname.startsWith("10.") ||
    hostname.startsWith("172.16.") ||
    hostname.startsWith("172.17.") ||
    hostname.startsWith("172.18.") ||
    hostname.startsWith("172.19.") ||
    hostname.startsWith("172.2") ||
    hostname.startsWith("172.30.") ||
    hostname.startsWith("172.31.") ||
    hostname.startsWith("192.168.") ||
    hostname.endsWith(".local") ||
    hostname === "[::1]"
  );
}

// GET: Check if analyze is available (has API key)
export async function GET() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ available: false }, { status: 503 });
  }
  return NextResponse.json({ available: true });
}

interface AnalyzeBody {
  url: string;
  notes?: string;
  niche?: BusinessNiche;
  screenshots?: string[];
  knowledgeBase?: string;
  manualResponse?: string;
  returnPromptOnly?: boolean;
}

// POST: Scrape site + generate config via Claude
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: AnalyzeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { url, notes, niche, screenshots, knowledgeBase, manualResponse, returnPromptOnly } = body;
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Invalid protocol");
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL. Must be http or https." }, { status: 400 });
  }

  if (isPrivateUrl(parsedUrl.hostname)) {
    return NextResponse.json({ error: "Cannot analyze internal URLs" }, { status: 400 });
  }

  // Validate screenshots
  const validScreenshots = (screenshots ?? [])
    .filter((s) => typeof s === "string" && s.startsWith("data:image/"))
    .slice(0, 5);

  // Fetch AI prompt template from Supabase
  const adminClient = createAdminClient();
  const { data: promptData } = await adminClient
    .from("onboard_settings")
    .select("value")
    .eq("key", "ai_prompt_template")
    .single();

  if (!promptData?.value) {
    return NextResponse.json(
      { error: "AI prompt template not configured in Supabase" },
      { status: 500 }
    );
  }

  let userMessage: string;

  if (knowledgeBase) {
    // Use knowledge base content instead of scraping
    const screenshotNote = validScreenshots.length > 0
      ? `\n\n${validScreenshots.length} screenshot(s) of the website are attached above. Use these for visual context about the site's design, layout, and branding.`
      : "";

    userMessage = `
Website URL: ${url}

== CLIENT KNOWLEDGE BASE ==

${knowledgeBase}

== END KNOWLEDGE BASE ==${notes ? `

== NOTES FROM THE DESIGNER ==
These notes are from the designer who spoke with the client. They take PRIORITY over anything found in the knowledge base. If notes contradict knowledge base data, follow the notes.

${notes}

== END NOTES ==` : ""}

Using the knowledge base above${notes ? " and the designer's notes" : ""}, generate a complete onboarding config JSON following the schema in your instructions. Use the real colors, contact info, and services found. IMPORTANT: Do NOT fabricate or guess any contact info (emails, phones, addresses). If a field is not present in the knowledge base, leave it out or ask the client for it. Only pre-fill values that were actually provided. Return ONLY the JSON, no explanation or markdown formatting.${screenshotNote}
`.trim();
  } else {
    // Scrape the site
    let scrapedData;
    try {
      scrapedData = await scrapeMultiPage(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json(
        { error: `Failed to scrape site: ${msg}` },
        { status: 502 }
      );
    }

    // Build the user message with scraped data
    const colorsText = scrapedData.colors.length > 0
      ? scrapedData.colors.slice(0, 8).map((c) =>
          `  - ${c.hex} (found ${c.count}x in: ${c.sources.join(", ")})`
        ).join("\n")
      : "  No colors detected";

    const screenshotNote = validScreenshots.length > 0
      ? `\n\n${validScreenshots.length} screenshot(s) of the website are attached above. Use these for visual context about the site's design, layout, and branding.`
      : "";

    userMessage = `
Website URL: ${url}

== SCRAPED DATA FROM THE WEBSITE ==

COLORS FOUND (ranked by frequency):
${colorsText}

META:
  Title: ${scrapedData.meta.title ?? "N/A"}
  Description: ${scrapedData.meta.description ?? "N/A"}
  OG Title: ${scrapedData.meta.ogTitle ?? "N/A"}
  OG Description: ${scrapedData.meta.ogDescription ?? "N/A"}

CONTACT:
  Phones: ${scrapedData.contact.phones.join(", ") || "N/A"}
  Emails: ${scrapedData.contact.emails.join(", ") || "N/A"}

HEADINGS:
${scrapedData.content.headings.length > 0
      ? scrapedData.content.headings.map((h) => `  - ${h}`).join("\n")
      : "  None found"}

SERVICES DETECTED:
${scrapedData.content.services.length > 0
      ? scrapedData.content.services.map((s) => `  - ${s}`).join("\n")
      : "  None found"}

LOGO: ${scrapedData.logoUrl ?? "Not found"}

PAGES SCRAPED: ${scrapedData.pagesScraped?.join(", ") ?? url}

== END SCRAPED DATA ==${notes ? `

== NOTES FROM THE DESIGNER ==
These notes are from the designer who spoke with the client. They take PRIORITY over anything found on the website. If notes contradict scraped data, follow the notes.

${notes}

== END NOTES ==` : ""}

Using the scraped data above${notes ? " and the designer's notes" : ""}, generate a complete onboarding config JSON following the schema in your instructions. Use the real colors, contact info, and services found. IMPORTANT: Do NOT fabricate or guess any contact info (emails, phones, addresses). If a field shows "N/A" above, leave it out or ask the client for it. Only pre-fill values that were actually scraped. Return ONLY the JSON, no explanation or markdown formatting.${screenshotNote}
`.trim();
  }

  // Build multi-modal content for Claude
  const userContent: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

  // Add screenshot images first (vision)
  for (const dataUrl of validScreenshots) {
    const match = dataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
    if (match) {
      userContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: match[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
          data: match[2],
        },
      });
    }
  }

  // Add text message
  userContent.push({ type: "text", text: userMessage });

  // Build system prompt with niche addendum
  const systemPrompt = buildSystemPrompt(promptData.value, niche ?? "other");

  // Return prompt only (for copy-to-clipboard manual flow)
  if (returnPromptOnly) {
    return NextResponse.json({
      prompt: `=== SYSTEM PROMPT ===\n${systemPrompt}\n\n=== USER MESSAGE ===\n${userMessage}`,
    });
  }

  let jsonText: string;
  let usage = { input_tokens: 0, output_tokens: 0 };

  if (manualResponse) {
    // Manual mode — use pasted AI response, skip Claude API call
    jsonText = manualResponse.trim();
  } else {
    // API mode — call Claude
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Claude API not configured. Use manual mode (Copy Prompt → Paste Response) or add ANTHROPIC_API_KEY." },
        { status: 503 }
      );
    }

    const anthropic = new Anthropic();

    let response;
    try {
      response = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
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

    usage = response.usage;
    jsonText = textBlock.text.trim();

    console.log(
      `[onboard/analyze] URL: ${url} | Niche: ${niche ?? "other"} | Screenshots: ${validScreenshots.length} | Input: ${usage.input_tokens} | Output: ${usage.output_tokens} | Total: ${usage.input_tokens + usage.output_tokens} tokens`
    );
  }

  // Parse JSON (handle optional code block wrapping)
  const codeBlockMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    jsonText = codeBlockMatch[1].trim();
  }

  let generatedConfig;
  try {
    generatedConfig = JSON.parse(jsonText);
  } catch {
    console.error("Failed to parse response:", jsonText.slice(0, 500));
    return NextResponse.json(
      { error: "Invalid JSON in response. Check the AI output and try again." },
      { status: 500 }
    );
  }

  // Validate required fields
  if (
    !generatedConfig.client_slug ||
    !generatedConfig.client_name ||
    !generatedConfig.business_name ||
    !generatedConfig.config?.questions?.length
  ) {
    return NextResponse.json(
      { error: "Response missing required fields (client_slug, client_name, business_name, config.questions)." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    config: generatedConfig,
    usage: {
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
    },
  });
}
