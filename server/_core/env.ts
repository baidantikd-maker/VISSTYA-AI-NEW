// Demo mode lets the app run locally without the Manus OAuth server or MySQL.
// It auto-authenticates every request in guest mode and stores verification
// reports in memory. Enabled explicitly via DEMO_MODE=true, or implicitly in
// development when the OAuth server and database are not configured.
const autoDemoMode =
  process.env.NODE_ENV !== "production" &&
  !process.env.DATABASE_URL &&
  !process.env.OAUTH_SERVER_URL;

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  isDemoMode: process.env.DEMO_MODE === "true" || autoDemoMode,
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "",
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY ?? "",
};
