function readEnv(name: string): string {
  return (process.env[name] ?? "").trim();
}

/** True when value is empty or still a YOUR_* / placeholder stub. */
export function isUnsetCredential(value: string): boolean {
  if (!value) return true;
  const normalized = value.toLowerCase();
  return (
    normalized.includes("your_google_") ||
    normalized.includes("your_supabase_") ||
    normalized.startsWith("your-client") ||
    normalized.startsWith("gocspx-your-") ||
    normalized === "changeme" ||
    normalized === "replace_me" ||
    normalized === "xxx"
  );
}

export const ENV = {
  appId: readEnv("VITE_APP_ID"),
  cookieSecret: readEnv("JWT_SECRET"),
  databaseUrl: readEnv("DATABASE_URL"),
  oAuthServerUrl: readEnv("OAUTH_SERVER_URL"),
  ownerOpenId: readEnv("OWNER_OPEN_ID"),
  supabaseUrl: readEnv("SUPABASE_URL") || readEnv("VITE_SUPABASE_URL"),
  supabaseAnonKey:
    readEnv("SUPABASE_ANON_KEY") || readEnv("VITE_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseStorageBucket: readEnv("SUPABASE_STORAGE_BUCKET") || "media",
  // S3-compatible storage (AWS S3, Cloudflare R2, MinIO, etc.). When
  // configured it takes precedence over Supabase Storage for media uploads.
  s3Endpoint: readEnv("S3_ENDPOINT"),
  s3Region: readEnv("S3_REGION"),
  s3AccessKeyId: readEnv("S3_ACCESS_KEY_ID"),
  s3SecretAccessKey: readEnv("S3_SECRET_ACCESS_KEY"),
  s3Bucket: readEnv("S3_BUCKET"),
  s3PublicBaseUrl: readEnv("S3_PUBLIC_BASE_URL"),
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: readEnv("BUILT_IN_FORGE_API_URL"),
  forgeApiKey: readEnv("BUILT_IN_FORGE_API_KEY"),
  geminiApiKey: readEnv("GEMINI_API_KEY"),
  geminiModel: readEnv("GEMINI_MODEL"),
  openWeatherApiKey: readEnv("OPENWEATHER_API_KEY"),
  newsApiKey: readEnv("NEWS_API_KEY"),
};

export function hasSupabaseConfig(): boolean {
  return (
    !isUnsetCredential(ENV.supabaseUrl) &&
    !isUnsetCredential(ENV.supabaseAnonKey)
  );
}

export function hasSupabaseAdmin(): boolean {
  return hasSupabaseConfig() && !isUnsetCredential(ENV.supabaseServiceRoleKey);
}

/** True when S3-compatible storage credentials are fully configured. */
export function hasS3Config(): boolean {
  return (
    !isUnsetCredential(ENV.s3AccessKeyId) &&
    !isUnsetCredential(ENV.s3SecretAccessKey) &&
    !isUnsetCredential(ENV.s3Bucket)
  );
}
