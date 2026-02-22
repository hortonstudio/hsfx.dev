import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a business analyst compiling client information into a structured knowledge base document. Organize the following information into a clean, well-formatted markdown document with these sections (omit sections with no data):

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

Be thorough but concise. Extract and organize all relevant details. Use bullet points for lists. Preserve specific details like exact color codes, phone numbers, addresses, etc.`;

interface KnowledgeEntry {
  id: string;
  type: string;
  title: string;
  content: string | null;
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

  // Build user message for Claude
  let userMessage: string;

  if (!typedDoc) {
    // No existing doc — compile all entries from scratch
    const entryTexts = typedEntries.map((entry) => {
      if (entry.type === "screenshot") {
        return `[Type: ${entry.type}] [Screenshot uploaded: ${entry.title}]`;
      }
      if (!entry.content) {
        return `[Type: ${entry.type}] [File: ${entry.title}]`;
      }
      return `[Type: ${entry.type}] ${entry.title}\n${entry.content}`;
    });

    userMessage = `Compile the following ${typedEntries.length} knowledge entries into a structured knowledge base document for "${client.business_name || client.name}":\n\n${entryTexts.join("\n\n---\n\n")}`;
  } else {
    // Existing doc exists — only send new entries
    const includedIds = new Set(typedDoc.entry_ids_included ?? []);
    const newEntries = typedEntries.filter((e) => !includedIds.has(e.id));

    if (newEntries.length === 0) {
      // No new entries — return existing document as-is
      return NextResponse.json({
        success: true,
        document: typedDoc.content,
        entry_count: typedEntries.length,
        new_entries: 0,
      });
    }

    const newEntryTexts = newEntries.map((entry) => {
      if (entry.type === "screenshot") {
        return `[Type: ${entry.type}] [Screenshot uploaded: ${entry.title}]`;
      }
      if (!entry.content) {
        return `[Type: ${entry.type}] [File: ${entry.title}]`;
      }
      return `[Type: ${entry.type}] ${entry.title}\n${entry.content}`;
    });

    userMessage = `Here is the existing knowledge base document:\n\n${typedDoc.content}\n\n---\n\nPlease merge/update the document with these ${newEntries.length} new entries:\n\n${newEntryTexts.join("\n\n---\n\n")}`;
  }

  // Call Claude API
  const anthropic = new Anthropic();

  let response;
  try {
    response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
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
  const { error: upsertError } = await supabase
    .from("client_knowledge_documents")
    .upsert(
      {
        client_id: id,
        content: compiledMarkdown,
        last_compiled_at: new Date().toISOString(),
        entry_ids_included: allEntryIds,
        metadata: {
          model: "claude-haiku-4-5-20251001",
          entry_count: typedEntries.length,
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

  // Log usage
  const usage = response.usage;
  console.log(
    `[knowledge/compile] Client: ${id} | Entries: ${typedEntries.length} | Input: ${usage.input_tokens} | Output: ${usage.output_tokens} | Total: ${usage.input_tokens + usage.output_tokens} tokens`
  );

  return NextResponse.json({
    success: true,
    document: compiledMarkdown,
    entry_count: typedEntries.length,
    usage: {
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
    },
  });
}
