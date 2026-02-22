import { createClient } from "@/lib/supabase/server";
import { scrapeMultiPage } from "@/lib/onboard/site-scraper";
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

/** Convert scraped data into readable markdown content. */
function formatScrapedContent(data: Awaited<ReturnType<typeof scrapeMultiPage>>): string {
  const lines: string[] = [];

  if (data.meta.title) lines.push(`# ${data.meta.title}`);
  if (data.meta.description) lines.push(`\n> ${data.meta.description}`);

  lines.push(`\n**URL:** ${data.url}`);
  if (data.pagesScraped && data.pagesScraped.length > 1) {
    lines.push(`**Pages scraped:** ${data.pagesScraped.join(", ")}`);
  }

  if (data.contact.phones.length > 0 || data.contact.emails.length > 0) {
    lines.push("\n## Contact Information");
    if (data.contact.phones.length > 0) {
      lines.push(`- **Phone:** ${data.contact.phones.join(", ")}`);
    }
    if (data.contact.emails.length > 0) {
      lines.push(`- **Email:** ${data.contact.emails.join(", ")}`);
    }
  }

  if (data.content.headings.length > 0) {
    lines.push("\n## Key Headings");
    for (const heading of data.content.headings) {
      lines.push(`- ${heading}`);
    }
  }

  if (data.content.services.length > 0) {
    lines.push("\n## Services Detected");
    for (const service of data.content.services) {
      lines.push(`- ${service}`);
    }
  }

  if (data.colors.length > 0) {
    lines.push("\n## Brand Colors");
    for (const color of data.colors.slice(0, 8)) {
      lines.push(`- \`${color.hex}\` (found ${color.count}x in: ${color.sources.join(", ")})`);
    }
  }

  if (data.logoUrl) {
    lines.push(`\n**Logo:** ${data.logoUrl}`);
  }

  return lines.join("\n");
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
    return NextResponse.json(
      { error: "Invalid URL. Must be http or https." },
      { status: 400 }
    );
  }

  if (isPrivateUrl(parsedUrl.hostname)) {
    return NextResponse.json(
      { error: "Cannot scrape internal URLs" },
      { status: 400 }
    );
  }

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

  // Convert scraped data to markdown content
  const scrapedContent = formatScrapedContent(scrapedData);

  // Create a knowledge entry
  const { data: entry, error: insertError } = await supabase
    .from("client_knowledge_entries")
    .insert({
      client_id: id,
      type: "website_scrape",
      title: `Website scrape: ${url}`,
      content: scrapedContent,
      metadata: { url, scraped_at: new Date().toISOString() },
    })
    .select()
    .single();

  if (insertError || !entry) {
    console.error("Failed to create knowledge entry:", insertError);
    return NextResponse.json(
      { error: "Failed to create knowledge entry" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, entry });
}
