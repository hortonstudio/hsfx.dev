import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { scrapeSite } from "@/lib/onboard/site-scraper";
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

// POST: Scrape site + generate config via Claude
export async function POST(request: NextRequest) {
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

  let body: { url: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { url } = body;
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

  // Scrape the site
  let scrapedData;
  try {
    scrapedData = await scrapeSite(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to scrape site: ${msg}` },
      { status: 502 }
    );
  }

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

  // Build the user message with scraped data
  const colorsText = scrapedData.colors.length > 0
    ? scrapedData.colors.slice(0, 8).map((c) =>
        `  - ${c.hex} (found ${c.count}x in: ${c.sources.join(", ")})`
      ).join("\n")
    : "  No colors detected";

  const userMessage = `
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

== END SCRAPED DATA ==

Using the scraped data above, generate a complete onboarding config JSON following the schema in your instructions. Use the real colors, contact info, and services found. Return ONLY the JSON — no explanation or markdown formatting.
`.trim();

  // Call Claude Haiku 4.5
  const anthropic = new Anthropic();

  let response;
  try {
    response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: promptData.value,
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

  // Parse JSON (handle optional code block wrapping)
  let jsonText = textBlock.text.trim();
  const codeBlockMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    jsonText = codeBlockMatch[1].trim();
  }

  let generatedConfig;
  try {
    generatedConfig = JSON.parse(jsonText);
  } catch {
    console.error("Failed to parse Claude response:", jsonText.slice(0, 500));
    return NextResponse.json(
      { error: "AI returned invalid JSON. Try again or use manual flow." },
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
      { error: "AI response missing required fields. Try again or use manual flow." },
      { status: 500 }
    );
  }

  // Log usage for cost monitoring
  const usage = response.usage;
  console.log(
    `[onboard/analyze] URL: ${url} | Input: ${usage.input_tokens} tokens | Output: ${usage.output_tokens} tokens | Total: ${usage.input_tokens + usage.output_tokens} tokens`
  );

  return NextResponse.json({
    success: true,
    config: generatedConfig,
    usage: {
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
    },
  });
}
