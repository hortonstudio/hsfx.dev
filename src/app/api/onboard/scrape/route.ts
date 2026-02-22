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

// POST: Scrape site and return raw scraped data (no AI key required)
export async function POST(request: NextRequest) {
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
    return NextResponse.json({ error: "Invalid URL. Must be http or https." }, { status: 400 });
  }

  if (isPrivateUrl(parsedUrl.hostname)) {
    return NextResponse.json({ error: "Cannot scrape internal URLs" }, { status: 400 });
  }

  try {
    const scrapedData = await scrapeMultiPage(url);
    return NextResponse.json({ success: true, data: scrapedData });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to scrape site: ${msg}` },
      { status: 502 }
    );
  }
}
