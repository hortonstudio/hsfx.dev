import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a business analyst compiling client information into a structured knowledge base document. You will receive text entries and may also receive screenshots (website pages, social media profiles, etc).

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
2. SCREENSHOTS: When you receive screenshots, analyze them thoroughly for:
   - Brand colors (identify specific hex codes or describe colors precisely)
   - Logo style and placement
   - Typography and fonts used
   - Layout and design style
   - Business information visible (phone, email, address, hours)
   - Social media content and branding
   - Service offerings shown
   - Any other business-relevant details
   Screenshots are a PRIMARY source of visual branding information. Extract as much as possible.
3. IMAGE SOURCE DIFFERENTIATION: Pay attention to the title/label of each screenshot to determine its source:
   - WEBSITE screenshots: These are the highest priority source for brand identity. Extract the primary brand color (hex code), whether the site uses a light or dark theme, typography choices, and overall design style.
   - FACEBOOK/SOCIAL MEDIA screenshots: Secondary source. Useful for business info, service offerings, customer engagement style, and cover photo branding. Only use for brand colors if no website screenshots are available.
   - If both website and Facebook screenshots exist, PRIORITIZE the website for brand colors, theme (light/dark), and design direction. Facebook may still provide additional business details not on the website.
   - In the Brand Identity section, clearly note: "Primary Brand Color: #XXXXXX (from website)" and "Theme: light/dark (from website)" when available.
4. Be thorough but concise. Use bullet points for lists.
5. Preserve specific details like exact color codes, phone numbers, addresses, etc.
6. If notes say the client wants to change something (e.g., move away from a color), document BOTH the current state AND the desired change clearly.`;

interface KnowledgeEntry {
  id: string;
  type: string;
  title: string;
  content: string | null;
  file_url: string | null;
  file_type: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface KnowledgeDocument {
  id: string;
  client_id: string;
  content: string;
  last_compiled_at: string;
  entry_ids_included: string[];
  metadata: Record<string, unknown> | null;
}

function isImageFile(entry: KnowledgeEntry): boolean {
  if (!entry.file_url) return false;
  if (entry.type === "screenshot") return true;
  const imageTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/avif"];
  return imageTypes.includes(entry.file_type ?? "");
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

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Claude API not configured. Add ANTHROPIC_API_KEY to environment." },
      { status: 503 }
    );
  }

  // Fetch client record
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (clientError || !client) {
    return NextResponse.json(
      { error: "Client not found" },
      { status: 404 }
    );
  }

  // Fetch all knowledge entries for this client
  const { data: entries, error: entriesError } = await supabase
    .from("client_knowledge_entries")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: true });

  if (entriesError) {
    return NextResponse.json(
      { error: "Failed to fetch knowledge entries" },
      { status: 500 }
    );
  }

  const typedEntries = (entries ?? []) as KnowledgeEntry[];

  if (typedEntries.length === 0) {
    return NextResponse.json(
      { error: "No knowledge entries to compile" },
      { status: 400 }
    );
  }

  // Fetch existing knowledge document (may not exist)
  const { data: existingDoc } = await supabase
    .from("client_knowledge_documents")
    .select("*")
    .eq("client_id", id)
    .single();

  const typedDoc = existingDoc as KnowledgeDocument | null;

  // Determine which entries to process
  let entriesToProcess = typedEntries;
  let existingContent: string | null = null;

  if (typedDoc) {
    const includedIds = new Set(typedDoc.entry_ids_included ?? []);
    const newEntries = typedEntries.filter((e) => !includedIds.has(e.id));

    if (newEntries.length === 0) {
      return NextResponse.json({
        success: true,
        document: typedDoc.content,
        entry_count: typedEntries.length,
        new_entries: 0,
      });
    }

    entriesToProcess = newEntries;
    existingContent = typedDoc.content;
  }

  // Separate entries: notes (priority) → text → images
  const noteEntries = entriesToProcess.filter((e) => e.type === "meeting_notes");
  const imageEntries = entriesToProcess.filter((e) => isImageFile(e));
  const otherEntries = entriesToProcess.filter(
    (e) => e.type !== "meeting_notes" && !isImageFile(e)
  );

  const businessName = client.business_name || `${client.first_name} ${client.last_name}`;

  // Build multimodal content blocks
  const contentBlocks: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

  // Text message — notes FIRST as priority
  let textMessage = "";

  if (existingContent) {
    textMessage += `Here is the existing knowledge base document:\n\n${existingContent}\n\n---\n\nPlease merge/update the document with these ${entriesToProcess.length} new entries:\n\n`;
  } else {
    textMessage += `Compile the following ${entriesToProcess.length} knowledge entries into a structured knowledge base document for "${businessName}":\n\n`;
  }

  if (noteEntries.length > 0) {
    textMessage += `=== PRIORITY: DESIGNER/ADMIN NOTES ===\nThese notes contain specific client preferences and direction that OVERRIDE other data.\n\n`;
    for (const entry of noteEntries) {
      textMessage += `[PRIORITY NOTE] ${entry.title || "Notes"}\n${entry.content ?? ""}\n\n---\n\n`;
    }
  }

  for (const entry of otherEntries) {
    if (!entry.content) {
      textMessage += `[Type: ${entry.type}] [File: ${entry.title}]\n\n---\n\n`;
    } else {
      textMessage += `[Type: ${entry.type}] ${entry.title}\n${entry.content}\n\n---\n\n`;
    }
  }

  if (imageEntries.length > 0) {
    textMessage += `\n${imageEntries.length} screenshot(s) attached below. Analyze each for brand colors, logos, typography, layout, contact info, social media details, and service offerings.\n`;
  }

  contentBlocks.push({ type: "text", text: textMessage });

  // Add screenshots as image content blocks so Claude can actually SEE them
  for (const entry of imageEntries) {
    if (!entry.file_url) continue;

    contentBlocks.push({
      type: "image",
      source: { type: "url", url: entry.file_url },
    } as Anthropic.ImageBlockParam);

    contentBlocks.push({
      type: "text",
      text: `[Screenshot: "${entry.title}"]`,
    });
  }

  // Call Claude API
  const anthropic = new Anthropic();

  let response;
  try {
    response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: contentBlocks }],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Claude API error:", msg);
    return NextResponse.json(
      { error: `AI compilation failed: ${msg}` },
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

  const compiledMarkdown = textBlock.text.trim();

  // Upsert into client_knowledge_documents
  const allEntryIds = typedEntries.map((e) => e.id);
  const usage = response.usage;

  const { error: upsertError } = await supabase
    .from("client_knowledge_documents")
    .upsert(
      {
        client_id: id,
        content: compiledMarkdown,
        last_compiled_at: new Date().toISOString(),
        entry_ids_included: allEntryIds,
        metadata: {
          model: "claude-sonnet-4-5-20250929",
          entry_count: typedEntries.length,
          input_tokens: usage.input_tokens,
          output_tokens: usage.output_tokens,
        },
      },
      { onConflict: "client_id" }
    );

  if (upsertError) {
    console.error("Failed to save compiled document:", upsertError);
    return NextResponse.json(
      { error: "Failed to save compiled document" },
      { status: 500 }
    );
  }

  // Calculate cost (Sonnet 4.5: $3.00/MTok input, $15.00/MTok output)
  const inputCost = (usage.input_tokens / 1_000_000) * 3.0;
  const outputCost = (usage.output_tokens / 1_000_000) * 15.0;
  const totalCost = inputCost + outputCost;

  console.log(
    `[knowledge/compile] Client: ${id} | Entries: ${typedEntries.length} (${imageEntries.length} images) | Input: ${usage.input_tokens} | Output: ${usage.output_tokens} | Cost: $${totalCost.toFixed(4)}`
  );

  return NextResponse.json({
    success: true,
    document: compiledMarkdown,
    entry_count: typedEntries.length,
    usage: {
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      total_cost: `$${totalCost.toFixed(4)}`,
    },
  });
}

// PATCH /api/clients/[id]/knowledge/compile — manual override of compiled doc
export async function PATCH(
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

  let body: { content: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("client_knowledge_documents")
    .upsert(
      {
        client_id: id,
        content: body.content.trim(),
        last_compiled_at: new Date().toISOString(),
        metadata: { source: "manual" },
      },
      { onConflict: "client_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, document: data });
}
