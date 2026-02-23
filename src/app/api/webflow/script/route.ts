import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { minify } from "terser";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const adminClient = createAdminClient();
    const { data: row } = await adminClient
      .from("prompts")
      .select("content")
      .eq("id", "mockup-populate-script")
      .single();

    if (!row?.content) {
      return NextResponse.json(
        { error: "Script not found in prompts table (id: mockup-populate-script)" },
        { status: 404 }
      );
    }

    const source = row.content;

    const result = await minify(source, {
      compress: true,
      mangle: true,
    });

    const minified = result.code ?? source;
    const wrapped = `<script>\n${minified}\n</script>`;

    return NextResponse.json({ script: wrapped });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Script minification failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
