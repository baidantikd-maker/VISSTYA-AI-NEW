import { ENV } from "./_core/env";
import { getPublicStorageUrl, getSupabaseAdmin } from "./_core/supabase";
import {
  hasS3Config,
  getS3PublicUrl,
  s3Put,
  s3GetSignedUrl,
  s3CreatePresignedUploadUrl,
} from "./_core/s3";

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
 * Upload bytes to media storage and return a public URL.
 * Uses S3-compatible storage when configured, otherwise falls back to
 * Supabase Storage.
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  if (hasS3Config()) {
    return s3Put(relKey, data, contentType);
  }

  const key = appendHashSuffix(normalizeKey(relKey));
  const bucket = ENV.supabaseStorageBucket;
  const supabase = getSupabaseAdmin();

  const body = typeof data === "string" ? new TextEncoder().encode(data) : data;

  const { error } = await supabase.storage.from(bucket).upload(key, body, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw new Error(`Supabase storage upload failed: ${error.message}`);
  }

  return { key, url: getPublicStorageUrl(key) };
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  if (hasS3Config()) {
    return { key, url: getS3PublicUrl(key) };
  }
  return { key, url: getPublicStorageUrl(key) };
}

export async function storageGetSignedUrl(
  relKey: string,
  expiresInSeconds = 60 * 60
): Promise<string> {
  if (hasS3Config()) {
    return s3GetSignedUrl(relKey, expiresInSeconds);
  }

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

/**
 * Generate a presigned PUT URL so the browser can upload media directly to
 * storage. Supports S3-compatible storage and Supabase Storage.
 */
export async function storageCreatePresignedUploadUrl(
  relKey: string,
  contentType: string,
  expiresInSeconds = 60 * 60
): Promise<{ key: string; uploadUrl: string; url: string }> {
  if (hasS3Config()) {
    return s3CreatePresignedUploadUrl(relKey, contentType, expiresInSeconds);
  }

  const key = appendHashSuffix(normalizeKey(relKey));
  const bucket = ENV.supabaseStorageBucket;
  const supabase = getSupabaseAdmin();

  // This version of supabase-js does not expose an expiry option for
  // createSignedUploadUrl; the TTL is server-defined.
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(key);

  if (error || !data?.signedUrl) {
    throw new Error(
      `Supabase presigned upload failed: ${error?.message || "empty response"}`
    );
  }

  return { key, uploadUrl: data.signedUrl, url: getPublicStorageUrl(key) };
}
