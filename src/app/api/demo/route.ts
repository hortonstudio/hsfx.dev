import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_MINUTE = 10;

const API_KEY_MAP: Record<string, string> = {
  css: "CSS_API_KEY",
  icons: "ICONS_API_KEY",
  "button-styles": "BUTTON_STYLES_API_KEY",
  "gsap-presets": "GSAP_PRESETS_API_KEY",
};

export async function POST(request: NextRequest) {
  // Verify user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting
  const now = Date.now();
  const userLimit = RATE_LIMIT.get(user.id);

  if (userLimit) {
    if (userLimit.resetAt < now) {
      RATE_LIMIT.set(user.id, { count: 1, resetAt: now + 60_000 });
    } else if (userLimit.count >= MAX_REQUESTS_PER_MINUTE) {
      return NextResponse.json(
        { error: "Rate limited. Try again in a minute." },
        { status: 429 }
      );
    } else {
      userLimit.count++;
    }
  } else {
    RATE_LIMIT.set(user.id, { count: 1, resetAt: now + 60_000 });
  }

  // Parse request
  let body: { api?: string; params?: Record<string, string> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { api, params } = body;

  if (!api || !API_KEY_MAP[api]) {
    return NextResponse.json(
      { error: "Invalid API. Use 'css', 'icons', 'button-styles', or 'gsap-presets'." },
      { status: 400 }
    );
  }

  // Build internal URL
  const origin = new URL(request.url).origin;
  const url = new URL(`/api/${api}`, origin);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) url.searchParams.set(key, value);
    }
  }

  // Forward request with server-side API key
  const apiKey = process.env[API_KEY_MAP[api]];

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const proxyResponse = await fetch(url.toString(), {
      headers: { "x-api-key": apiKey },
    });

    const contentType =
      proxyResponse.headers.get("content-type") || "application/json";
    const responseBody = await proxyResponse.text();

    return new NextResponse(responseBody, {
      status: proxyResponse.status,
      headers: { "Content-Type": contentType },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to proxy request" },
      { status: 502 }
    );
  }
}
