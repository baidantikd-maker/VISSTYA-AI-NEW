/**
 * S3-compatible storage layer (AWS S3, Cloudflare R2, MinIO, Supabase Storage
 * S3 gateway, etc.). Used for media uploads in verification workflows.
 */
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV, hasS3Config } from "./env";

export { hasS3Config } from "./env";

let s3Client: S3Client | null = null;

function getClient(): S3Client {
  if (s3Client) return s3Client;

  const config: S3ClientConfig = {
    region: ENV.s3Region || "auto",
    credentials: {
      accessKeyId: ENV.s3AccessKeyId,
      secretAccessKey: ENV.s3SecretAccessKey,
    },
  };

  if (ENV.s3Endpoint) {
    config.endpoint = ENV.s3Endpoint;
    // Path-style addressing is required for R2 / MinIO / Supabase S3 gateway.
    config.forcePathStyle = true;
  }

  s3Client = new S3Client(config);
  return s3Client;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

/** Public URL for an object (requires a public bucket or CDN base URL). */
export function getS3PublicUrl(relKey: string): string {
  const key = normalizeKey(relKey);
  if (ENV.s3PublicBaseUrl) {
    return `${ENV.s3PublicBaseUrl.replace(/\/+$/, "")}/${key}`;
  }
  if (ENV.s3Endpoint) {
    return `${ENV.s3Endpoint.replace(/\/+$/, "")}/${ENV.s3Bucket}/${key}`;
  }
  // Default AWS virtual-hosted style: https://<bucket>.s3.<region>.amazonaws.com/<key>
  const region = ENV.s3Region || "us-east-1";
  return `https://${ENV.s3Bucket}.s3.${region}.amazonaws.com/${key}`;
}

export async function s3Put(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  if (!hasS3Config()) {
    throw new Error(
      "S3 storage is not configured. Set S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, and S3_BUCKET."
    );
  }

  const key = appendHashSuffix(normalizeKey(relKey));
  const body = typeof data === "string" ? new TextEncoder().encode(data) : data;

  await getClient().send(
    new PutObjectCommand({
      Bucket: ENV.s3Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return { key, url: getS3PublicUrl(key) };
}

export async function s3GetSignedUrl(
  relKey: string,
  expiresInSeconds = 60 * 60
): Promise<string> {
  if (!hasS3Config()) {
    throw new Error(
      "S3 storage is not configured. Set S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, and S3_BUCKET."
    );
  }

  const key = normalizeKey(relKey);
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: ENV.s3Bucket, Key: key }),
    { expiresIn: expiresInSeconds }
  );
}

/**
 * Generate a presigned PUT URL so the browser can upload media directly to the
 * bucket without proxying bytes through the API server.
 */
export async function s3CreatePresignedUploadUrl(
  relKey: string,
  contentType: string,
  expiresInSeconds = 60 * 60
): Promise<{ key: string; uploadUrl: string; url: string }> {
  if (!hasS3Config()) {
    throw new Error(
      "S3 storage is not configured. Set S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, and S3_BUCKET."
    );
  }

  const key = appendHashSuffix(normalizeKey(relKey));
  const uploadUrl = await getSignedUrl(
    getClient(),
    new PutObjectCommand({
      Bucket: ENV.s3Bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: expiresInSeconds }
  );

  return { key, uploadUrl, url: getS3PublicUrl(key) };
}
