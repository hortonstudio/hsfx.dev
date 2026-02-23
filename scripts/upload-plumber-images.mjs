import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually (no dotenv dependency)
const envContent = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const BUCKET = "mockup-assets";
const CATEGORY = "plumbing";

const images = [
  // Hero/About/CTA
  { file: "plumber-img-dump/plumber-hero.jpeg", name: "Plumbing Under Sink with Wrench", category: "plumbing" },
  { file: "plumber-img-dump/plumber-about.jpeg", name: "Plumber Work Van Loaded", category: "plumbing" },
  { file: "plumber-img-dump/plumber-cta.jpeg", name: "Kitchen Sink with Toolbox", category: "plumbing" },
  // Service images
  { file: "plumber-img-dump/for-services/leak-detection-the-colony.jpg", name: "Leak Detection Spray Test", category: "plumbing" },
  { file: "plumber-img-dump/for-services/pipe-leaks-the-colony-tx.jpg", name: "Pipe Leak Repair with Wrench", category: "plumbing" },
  { file: "plumber-img-dump/for-services/plumber-using-wrench-repair-water-pipe-sink.jpg", name: "Sink Pipe Wrench Repair", category: "plumbing" },
  { file: "plumber-img-dump/for-services/sewer-line-plumbing-the-colony-tx.jpg", name: "Sewer Line Trench Work", category: "plumbing" },
  { file: "plumber-img-dump/for-services/under-slab-plumbing.jpg", name: "Under Slab Plumbing Excavation", category: "plumbing" },
  { file: "plumber-img-dump/for-services/water-heater-repair-coles-plumbing-dallas (1).jpg", name: "Water Heater Repair", category: "plumbing" },
];

let successCount = 0;

for (const img of images) {
  const filePath = resolve(process.cwd(), img.file);
  const buffer = readFileSync(filePath);
  const ext = img.file.split(".").pop();
  const contentType = ext === "jpeg" || ext === "jpg" ? "image/jpeg" : "image/png";
  const storagePath = `stock-images/${CATEGORY}/${Date.now()}-${img.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.${ext}`;

  console.log(`Uploading: ${img.name}...`);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: false });

  if (uploadError) {
    console.error(`  UPLOAD FAILED: ${uploadError.message}`);
    continue;
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  const { error: insertError } = await supabase
    .from("stock_images")
    .insert({
      name: img.name,
      category: img.category,
      image_url: publicUrl,
      sort_order: successCount,
    });

  if (insertError) {
    console.error(`  DB INSERT FAILED: ${insertError.message}`);
    continue;
  }

  console.log(`  OK: ${publicUrl}`);
  successCount++;
}

console.log(`\nDone: ${successCount}/${images.length} uploaded`);
