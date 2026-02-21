import { createClient } from "@/lib/supabase/server";
import { corsPreflightResponse, withCors } from "@/lib/api/cors";
import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS() {
  return corsPreflightResponse();
}

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.CSS_API_KEY) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format"); // "raw" returns plain markdown, default is JSON

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attr_docs")
    .select("content, updated_at")
    .eq("id", "main")
    .single();

  if (error) {
    return withCors(NextResponse.json({ error: error.message }, { status: 500 }));
  }

  if (!data) {
    return withCors(NextResponse.json({ error: "No content found" }, { status: 404 }));
  }

  if (format === "raw") {
    return withCors(
      new NextResponse(data.content, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Cache-Control": "public, max-age=60, s-maxage=300",
        },
      })
    );
  }

  // Parse markdown into sections for easy consumption
  const sections = parseSections(data.content);

  return withCors(
    NextResponse.json({
      content: data.content,
      sections,
      updated_at: data.updated_at,
    })
  );
}

/** Parse markdown into a section map keyed by heading */
function parseSections(markdown: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = markdown.split("\n");
  let currentKey = "_intro";
  let currentLines: string[] = [];

  for (const line of lines) {
    const h2Match = line.match(/^## (.+)/);
    const h3Match = line.match(/^### (.+)/);

    if (h2Match || h3Match) {
      // Save previous section
      if (currentLines.length > 0) {
        sections[currentKey] = currentLines.join("\n").trim();
      }
      currentKey = (h2Match?.[1] || h3Match?.[1] || "").trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  // Save last section
  if (currentLines.length > 0) {
    sections[currentKey] = currentLines.join("\n").trim();
  }

  return sections;
}
