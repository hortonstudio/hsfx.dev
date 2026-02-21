import { createClient } from "@/lib/supabase/server";
import { corsPreflightResponse, withCors } from "@/lib/api/cors";
import { NextRequest, NextResponse } from "next/server";
import type {
  ButtonStyleEntry,
  ButtonStylesResponse,
  ButtonMainConfig,
  AccessoryConfig,
  FooterLinkConfig,
  ButtonAnimation,
} from "@/lib/button-styles/types";

export async function OPTIONS() {
  return corsPreflightResponse();
}

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.BUTTON_STYLES_API_KEY) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const { searchParams } = new URL(request.url);
  const component = searchParams.get("component");
  const raw = searchParams.get("raw") === "true";

  const supabase = await createClient();

  let query = supabase
    .from("button_styles")
    .select("*")
    .order("component")
    .order("sort_order");

  if (component) {
    query = query.eq("component", component);
  }

  const { data, error } = await query;

  if (error) {
    return withCors(NextResponse.json({ error: error.message }, { status: 500 }));
  }

  const entries = (data || []) as ButtonStyleEntry[];

  // Raw mode: return flat array (for the manager UI)
  if (raw) {
    return withCors(
      NextResponse.json(entries, {
        headers: { "Cache-Control": "no-cache" },
      })
    );
  }

  // Pre-parsed mode: build structured response for Webflow app
  const response = buildStructuredResponse(entries);

  return withCors(
    NextResponse.json(response, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
    })
  );
}

function buildStructuredResponse(entries: ButtonStyleEntry[]): ButtonStylesResponse {
  const byComponent = new Map<string, ButtonStyleEntry[]>();
  for (const entry of entries) {
    const existing = byComponent.get(entry.component) || [];
    existing.push(entry);
    byComponent.set(entry.component, existing);
  }

  // Button Main
  const buttonMainEntries = byComponent.get("button-main") || [];
  const buttonMainConfig = buttonMainEntries.find((e) => e.type === "config");
  const buttonMainDefaults = buttonMainEntries.find((e) => e.type === "defaults");
  const buttonMainAnimations: Record<string, ButtonAnimation> = {};
  for (const entry of buttonMainEntries.filter((e) => e.type === "animation")) {
    buttonMainAnimations[entry.name] = { name: entry.name, css: entry.css || "" };
  }

  // Accessory config
  const accessoryEntries = byComponent.get("accessory") || [];
  const accessoryConfig = accessoryEntries.find((e) => e.type === "config");
  const accessoryDefaults = accessoryEntries.find((e) => e.type === "defaults");

  // Accessory animations (arrow, close, play)
  const accessoryAnimations: Record<string, Record<string, ButtonAnimation>> = {};
  for (const comp of ["arrow", "close", "play"]) {
    const compEntries = byComponent.get(comp) || [];
    const anims: Record<string, ButtonAnimation> = {};
    for (const entry of compEntries.filter((e) => e.type === "animation")) {
      anims[entry.name] = { name: entry.name, css: entry.css || "" };
    }
    accessoryAnimations[comp] = anims;
  }

  // Footer Link
  const footerLinkEntries = byComponent.get("footer-link") || [];
  const footerLinkConfig = footerLinkEntries.find((e) => e.type === "config");
  const footerLinkDefaults = footerLinkEntries.find((e) => e.type === "defaults");

  return {
    buttonMain: {
      config: (buttonMainConfig?.config as unknown as ButtonMainConfig) || {
        sourceAttribute: "",
        targetAttribute: "",
        buttonTypes: [],
        defaultAnimations: {},
      },
      defaultsCSS: buttonMainDefaults?.css || "",
      animations: buttonMainAnimations,
    },
    accessories: {
      config: (accessoryConfig?.config as unknown as AccessoryConfig) || {
        type: "accessory",
        hasMapping: false,
        sourceAttribute: "",
        components: {},
      },
      defaultsCSS: accessoryDefaults?.css || "",
      animations: accessoryAnimations,
    },
    footerLink: {
      config: (footerLinkConfig?.config as unknown as FooterLinkConfig) || {
        type: "footer-link",
        hasMapping: false,
        description: "",
      },
      css: footerLinkDefaults?.css || "",
    },
  };
}
