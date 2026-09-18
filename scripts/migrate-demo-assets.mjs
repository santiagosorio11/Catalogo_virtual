// Migra los assets demo estáticos (public/demo/organic-nails/) a Cloudflare R2 y los
// registra en la base de datos, de modo que el dashboard quede como única fuente de
// imágenes del catálogo. Es idempotente: lo que ya está migrado se salta.
//
// Uso:
//   node scripts/migrate-demo-assets.mjs --dry-run   (no escribe nada, solo reporta)
//   node scripts/migrate-demo-assets.mjs
//
// Lee las credenciales de .env.local (o del entorno). Requiere:
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL
import { readFileSync, existsSync } from "node:fs";
import { basename, join } from "node:path";
import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const DRY_RUN = process.argv.includes("--dry-run");
const ASSET_DIR = join(process.cwd(), "public", "demo", "organic-nails");

// ---- Carga de .env.local ----
function loadEnvLocal() {
  const file = join(process.cwd(), ".env.local");
  if (!existsSync(file)) return;

  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key]) continue;

    let value = rawValue.trim();
    const quoted = value.match(/^(["'])(.*)\1$/);
    if (quoted) value = quoted[2];
    process.env[key] = value;
  }
}
loadEnvLocal();

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Falta la variable de entorno ${name}.`);
    process.exit(1);
  }
  return value;
}

const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const R2_ACCOUNT_ID = requireEnv("R2_ACCOUNT_ID");
const R2_ACCESS_KEY_ID = requireEnv("R2_ACCESS_KEY_ID");
const R2_SECRET_ACCESS_KEY = requireEnv("R2_SECRET_ACCESS_KEY");
const R2_BUCKET_NAME = requireEnv("R2_BUCKET_NAME");
const R2_PUBLIC_URL = requireEnv("R2_PUBLIC_URL").replace(/\/$/, "");

if (R2_PUBLIC_URL.includes("r2.cloudflarestorage.com")) {
  console.error(
    "R2_PUBLIC_URL apunta al endpoint S3, que exige peticiones firmadas y devolverá 401 en el navegador.\n" +
      "Usa el dominio público del bucket: el subdominio pub-xxxx.r2.dev o tu dominio personalizado."
  );
  process.exit(1);
}

// ---- Mapas de assets (espejo de src/lib/demo-assets.ts) ----
const PRODUCT_IMAGES = {
  "020-midnight-blue": "020-midnight-blue.jpg",
  "028-classic-moka-028": "028-classic-moka.jpg",
  "031-classic-taupe": "031-classic-taupe.jpg",
  "055-iron-purple": "055-iron-purple.png",
  "092-love-kiss": "092-love-kiss.jpg",
  "150-pastel-aqua": "150-pastel-aqua.jpg",
  "010-ice-blue": "010-ice-blue.jpg",
  "011-ice-purple": "011-ice-purple.jpg",
  "012-ice-lilac": "012-ice-lilac.jpg",
  "013-ice-mint": "013-ice-mint.jpg",
  "014-ice-pink": "014-ice-pink.jpg",
  "015-ice-daisy": "015-ice-daisy.jpg",
};

const CATEGORY_IMAGES = {
  "color-gel": "category-color-gel.jpeg",
  "bases-top-y-tratamientos": "category-bases.webp",
  "spa-mara": "category-spa.jpg",
  "press-on": "category-press-on.jpg",
  "lamparas-y-pulidoras": "category-lamps.png",
  "tech-gel": "category-tech-gel.jpeg",
};

const STORE_IMAGES = { logo_url: "logo.jpeg", banner_url: "banner.png" };

const STORE_DESCRIPTION =
  "Centro de Capacitación y Ventas Organic Nails en Bogotá. Castellana · Quirigua · Venecia · Kennedy · 20 de Julio · Soacha";
const STORE_WHATSAPP = "573118109250";

const CONTENT_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

// ---- Clientes ----
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const stats = { uploaded: 0, skipped: 0, failed: 0 };

/** Sube un archivo local a R2 y lo registra en media_assets. Devuelve la URL pública. */
async function uploadAsset(filename, folder, entityType, entityId) {
  const path = join(ASSET_DIR, filename);
  if (!existsSync(path)) throw new Error(`No existe el archivo ${path}`);

  const ext = filename.split(".").pop().toLowerCase();
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
  const key = `${folder}/${randomUUID()}.${ext}`;
  const url = `${R2_PUBLIC_URL}/${key}`;

  if (DRY_RUN) {
    console.log(`   [dry-run] subiría ${basename(path)} -> ${key}`);
    return url;
  }

  const body = readFileSync(path);
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  const { error } = await supabase.from("media_assets").insert({
    r2_key: key,
    url,
    filename,
    content_type: contentType,
    size_bytes: body.byteLength,
    entity_type: entityType,
    entity_id: entityId,
  });
  if (error) throw new Error(`media_assets: ${error.message}`);

  return url;
}

async function migrateProducts() {
  console.log("\n== Productos ==");

  for (const [slug, filename] of Object.entries(PRODUCT_IMAGES)) {
    try {
      const { data: product, error } = await supabase
        .from("products")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw new Error(error.message);

      if (!product) {
        console.log(`-- ${slug}: no existe en la base de datos, se omite`);
        stats.skipped++;
        continue;
      }

      const { count } = await supabase
        .from("product_images")
        .select("id", { count: "exact", head: true })
        .eq("product_id", product.id);
      if ((count ?? 0) > 0) {
        console.log(`-- ${slug}: ya tiene ${count} imagen(es), se omite`);
        stats.skipped++;
        continue;
      }

      const url = await uploadAsset(filename, "products", "product", product.id);
      if (!DRY_RUN) {
        const { error: insertError } = await supabase
          .from("product_images")
          .insert({ product_id: product.id, url, sort_order: 0 });
        if (insertError) throw new Error(`product_images: ${insertError.message}`);
      }

      console.log(`OK ${slug} -> ${url}`);
      stats.uploaded++;
    } catch (err) {
      console.error(`ERROR ${slug}: ${err.message}`);
      stats.failed++;
    }
  }
}

async function migrateCategories() {
  console.log("\n== Categorías ==");

  for (const [slug, filename] of Object.entries(CATEGORY_IMAGES)) {
    try {
      const { data: category, error } = await supabase
        .from("categories")
        .select("id, image_url")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw new Error(error.message);

      if (!category) {
        console.log(`-- ${slug}: no existe en la base de datos, se omite`);
        stats.skipped++;
        continue;
      }
      if (category.image_url) {
        console.log(`-- ${slug}: ya tiene imagen, se omite`);
        stats.skipped++;
        continue;
      }

      const url = await uploadAsset(filename, "categories", "category", category.id);
      if (!DRY_RUN) {
        const { error: updateError } = await supabase
          .from("categories")
          .update({ image_url: url })
          .eq("id", category.id);
        if (updateError) throw new Error(`categories: ${updateError.message}`);
      }

      console.log(`OK ${slug} -> ${url}`);
      stats.uploaded++;
    } catch (err) {
      console.error(`ERROR ${slug}: ${err.message}`);
      stats.failed++;
    }
  }
}

async function migrateStoreSettings() {
  console.log("\n== Ajustes de la tienda ==");

  const { data: settings, error } = await supabase.from("store_settings").select("*").maybeSingle();
  if (error) {
    console.error(`ERROR store_settings: ${error.message}`);
    stats.failed++;
    return;
  }
  if (!settings) {
    console.error("ERROR: no hay fila en store_settings.");
    stats.failed++;
    return;
  }

  const patch = {};

  for (const [column, filename] of Object.entries(STORE_IMAGES)) {
    if (settings[column]) {
      console.log(`-- ${column}: ya tiene valor, se omite`);
      stats.skipped++;
      continue;
    }
    try {
      const entityType = column === "logo_url" ? "store_logo" : "store_banner";
      patch[column] = await uploadAsset(filename, "store", entityType, null);
      console.log(`OK ${column} -> ${patch[column]}`);
      stats.uploaded++;
    } catch (err) {
      console.error(`ERROR ${column}: ${err.message}`);
      stats.failed++;
    }
  }

  // Estos dos venían también del fallback demo; sin ellos el header pierde el
  // botón de WhatsApp y la descripción al eliminar demo-assets.ts.
  if (!settings.description) patch.description = STORE_DESCRIPTION;
  if (!settings.whatsapp_number) patch.whatsapp_number = STORE_WHATSAPP;

  if (Object.keys(patch).length === 0) {
    console.log("-- nada que actualizar");
    return;
  }

  if (DRY_RUN) {
    console.log(`   [dry-run] actualizaría store_settings: ${Object.keys(patch).join(", ")}`);
    return;
  }

  const { error: updateError } = await supabase
    .from("store_settings")
    .update(patch)
    .eq("id", settings.id);
  if (updateError) {
    console.error(`ERROR store_settings: ${updateError.message}`);
    stats.failed++;
  }
}

console.log(DRY_RUN ? "Modo dry-run: no se escribe nada.\n" : "Migrando assets demo a R2...\n");
console.log(`Bucket:      ${R2_BUCKET_NAME}`);
console.log(`URL pública: ${R2_PUBLIC_URL}`);

await migrateProducts();
await migrateCategories();
await migrateStoreSettings();

console.log(
  `\nResumen: ${stats.uploaded} migrados, ${stats.skipped} omitidos, ${stats.failed} con error.`
);
if (stats.failed > 0) process.exit(1);
