import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
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
    const scriptPath = join(process.cwd(), "scripts", "mockup-populate.js");
    const source = readFileSync(scriptPath, "utf-8");

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
