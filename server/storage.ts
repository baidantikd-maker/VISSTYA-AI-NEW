import { ENV } from "./_core/env";
import { getPublicStorageUrl, getSupabaseAdmin } from "./_core/supabase";

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

/**
 * Upload bytes to the Supabase Storage bucket and return a public URL.
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  const bucket = ENV.supabaseStorageBucket;
  const supabase = getSupabaseAdmin();

  const body =
    typeof data === "string" ? new TextEncoder().encode(data) : data;

  const { error } = await supabase.storage.from(bucket).upload(key, body, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw new Error(`Supabase storage upload failed: ${error.message}`);
  }

  return { key, url: getPublicStorageUrl(key) };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: getPublicStorageUrl(key) };
}

export async function storageGetSignedUrl(
  relKey: string,
  expiresInSeconds = 60 * 60
): Promise<string> {
  const key = normalizeKey(relKey);
  const bucket = ENV.supabaseStorageBucket;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(key, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(
      `Supabase signed URL failed: ${error?.message || "empty response"}`
    );
  }

  return data.signedUrl;
}
