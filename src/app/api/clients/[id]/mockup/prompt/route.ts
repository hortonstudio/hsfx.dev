import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch client
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Fetch system prompt
  let systemPrompt = "(No prompt found — check prompts table)";
  try {
    const { data: promptRow } = await adminClient
      .from("prompts")
      .select("content")
      .eq("id", "mockup-generator")
      .single();
    if (promptRow?.content) {
      systemPrompt = promptRow.content;
    }
  } catch {
    // Table may not exist
  }

  // Fetch compiled KB
  const { data: kbDoc } = await supabase
    .from("client_knowledge_documents")
    .select("content")
    .eq("client_id", id)
    .single();

  // Fetch available icons
  const { data: icons } = await adminClient
    .from("icons")
    .select("name, group_name")
    .order("group_name")
    .order("name");

  const iconsByGroup: Record<string, string[]> = {};
  for (const icon of icons ?? []) {
    const row = icon as { name: string; group_name: string };
    if (!iconsByGroup[row.group_name]) iconsByGroup[row.group_name] = [];
    iconsByGroup[row.group_name].push(row.name);
  }
  const iconListText = Object.entries(iconsByGroup)
    .map(([group, names]) => `  ${group}: ${names.join(", ")}`)
    .join("\n");

  const businessName =
    client.business_name || `${client.first_name} ${client.last_name}`;

  return NextResponse.json({
    systemPrompt,
    knowledgeBase: kbDoc?.content ?? "(No compiled KB found)",
    iconList: iconListText || "(No icons found)",
    businessName,
  });
}
