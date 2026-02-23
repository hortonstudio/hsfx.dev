import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { autoLayout } from "../src/lib/clients/sitemap-layout";

const envContent = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SECRET_KEY as string
);

async function main() {
  const { data } = await supabase
    .from("client_sitemaps")
    .select("sitemap_data")
    .eq("client_id", "460a9d2f-fba7-4144-87d5-3862b39eed30")
    .single();

  const nodes = data!.sitemap_data.nodes;
  const edges = data!.sitemap_data.edges;

  const laidOut = autoLayout(nodes, edges);

  const { error } = await supabase
    .from("client_sitemaps")
    .update({
      sitemap_data: { nodes: laidOut, edges, viewport: { x: 0, y: 0, zoom: 0.5 } },
      updated_at: new Date().toISOString(),
    })
    .eq("client_id", "460a9d2f-fba7-4144-87d5-3862b39eed30");

  if (error) console.error("FAILED:", error.message);
  else console.log("Layout applied to", laidOut.length, "nodes");
}

main();
