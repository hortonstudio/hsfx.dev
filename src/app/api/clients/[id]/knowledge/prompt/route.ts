import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/clients/[id]/knowledge/prompt — returns system prompt + formatted entries for manual compilation
export async function GET(
  _request: NextRequest,
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

  // Fetch client
  const { data: client } = await supabase
    .from("clients")
    .select("business_name, first_name, last_name")
    .eq("id", id)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Fetch all knowledge entries
  const { data: entries } = await supabase
    .from("client_knowledge_entries")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  const typedEntries = (entries ?? []) as Array<{
    id: string;
    type: string;
    title: string;
    content: string | null;
    file_url: string | null;
    file_type: string | null;
  }>;

  const businessName =
    client.business_name || `${client.first_name} ${client.last_name}`;

  // System prompt (same as compile route)
  const systemPrompt = `You are a business analyst compiling client information into a structured knowledge base document. You will receive text entries and may also receive screenshots (website pages, social media profiles, etc).

Organize everything into a clean, well-formatted markdown document with these sections (omit sections with no data):

# {Business Name} — Client Knowledge Base

## Business Overview
## Services / Products
## Contact Information
## Brand Identity (colors, logos, tone, style preferences)
## Target Audience
## Competitive Landscape
## Client Preferences & Notes
## Technical Requirements
## Media Assets

IMPORTANT RULES:
1. PRIORITY NOTES: Entries marked as [PRIORITY NOTE] are from the designer/admin and represent specific client preferences, decisions, and direction. These OVERRIDE any conflicting information from other sources. Always include these in the "Client Preferences & Notes" section and let them influence all other sections.
2. SCREENSHOTS: When you receive screenshots, analyze them thoroughly for brand colors (identify specific hex codes or describe colors precisely), logo style and placement, typography and fonts used, layout and design style, business information visible (phone, email, address, hours), social media content and branding, service offerings shown, and any other business-relevant details. Screenshots are a PRIMARY source of visual branding information. Extract as much as possible.
3. IMAGE SOURCE DIFFERENTIATION: Pay attention to the title/label of each screenshot to determine its source:
   - WEBSITE screenshots: Highest priority source for brand identity. Extract primary brand color (hex code), whether the site uses a light or dark theme, typography choices, and overall design style.
   - FACEBOOK/SOCIAL MEDIA screenshots: Secondary source. Useful for business info, service offerings, customer engagement style, and cover photo branding. Only use for brand colors if no website screenshots are available.
   - If both website and Facebook screenshots exist, PRIORITIZE the website for brand colors, theme (light/dark), and design direction. Facebook may still provide additional business details not on the website.
   - In the Brand Identity section, clearly note: "Primary Brand Color: #XXXXXX (from website)" and "Theme: light/dark (from website)" when available.
4. Be thorough but concise. Use bullet points for lists.
5. Preserve specific details like exact color codes, phone numbers, addresses, etc.
6. If notes say the client wants to change something (e.g., move away from a color), document BOTH the current state AND the desired change clearly.`;

  // Format entries the same way the compile route does
  const noteEntries = typedEntries.filter((e) => e.type === "meeting_notes");
  const otherEntries = typedEntries.filter((e) => e.type !== "meeting_notes");
  const imageEntries = typedEntries.filter(
    (e) => e.type === "screenshot" || (e.file_url && /\.(jpg|jpeg|png|gif|webp|avif)/i.test(e.file_url))
  );

  const parts: string[] = [];

  if (noteEntries.length > 0) {
    parts.push("=== PRIORITY NOTES (from designer/admin) ===");
    for (const entry of noteEntries) {
      parts.push(`[PRIORITY NOTE] ${entry.title}\n${entry.content ?? ""}`);
    }
  }

  if (otherEntries.length > 0) {
    parts.push("\n=== KNOWLEDGE ENTRIES ===");
    for (const entry of otherEntries) {
      if (entry.content) {
        parts.push(`[Type: ${entry.type}] ${entry.title}\n${entry.content}`);
      } else if (entry.file_url) {
        parts.push(`[Type: ${entry.type}] ${entry.title}\nFile: ${entry.file_url}`);
      }
    }
  }

  if (imageEntries.length > 0) {
    parts.push("\n=== SCREENSHOTS/IMAGES ===");
    parts.push("(Paste these image URLs into the chat so the AI can analyze them)");
    for (const entry of imageEntries) {
      if (entry.file_url) {
        parts.push(`- ${entry.title}: ${entry.file_url}`);
      }
    }
  }

  const entriesText = parts.join("\n\n");

  return NextResponse.json({
    systemPrompt,
    entriesText,
    businessName,
  });
}
