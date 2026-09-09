import { createClient } from "@/lib/supabase/server";
import { buildR2Key, deleteFromR2, keyFromR2Url, uploadToR2 } from "@/lib/r2";

export type MediaEntityType = "product" | "category" | "store_logo" | "store_banner";

export async function uploadImageAsset(
  folder: string,
  file: File,
  entityType: MediaEntityType,
  entityId: string | null
): Promise<{ url: string } | { error: string }> {
  try {
    const key = buildR2Key(folder, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToR2(key, buffer, file.type || "application/octet-stream");

    const supabase = await createClient();
    await supabase.from("media_assets").insert({
      r2_key: key,
      url,
      filename: file.name,
      content_type: file.type || null,
      size_bytes: file.size,
      entity_type: entityType,
      entity_id: entityId,
    });

    return { url };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function uploadImageBytesAsset(
  folder: string,
  filename: string,
  contentType: string,
  bytes: Uint8Array,
  entityType: MediaEntityType,
  entityId: string | null
): Promise<{ url: string } | { error: string }> {
  try {
    const key = buildR2Key(folder, filename);
    const url = await uploadToR2(key, bytes, contentType);

    const supabase = await createClient();
    await supabase.from("media_assets").insert({
      r2_key: key,
      url,
      filename,
      content_type: contentType,
      size_bytes: bytes.byteLength,
      entity_type: entityType,
      entity_id: entityId,
    });

    return { url };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function deleteImageAsset(url: string): Promise<void> {
  const key = keyFromR2Url(url);
  if (!key) return;

  try {
    await deleteFromR2(key);
  } catch {
    // object may already be gone; ignore
  }

  const supabase = await createClient();
  await supabase.from("media_assets").delete().eq("r2_key", key);
}
