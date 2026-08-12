/**
 * env.ts
 *
 * Validates required environment variables at startup.
 * Missing vars produce a clear warning (not a crash) and
 * mark the dependent module as "unavailable" rather than
 * letting it fail unpredictably mid-request.
 */

interface EnvStatus {
  visionProviderKey: string | undefined;
  evidenceProviderKey: string | undefined;
  allowedOrigin: string | undefined;
}

export const env: EnvStatus = {
  visionProviderKey: process.env.VISION_API_KEY,
  evidenceProviderKey: process.env.EVIDENCE_API_KEY,
  allowedOrigin: process.env.ALLOWED_ORIGIN,
};

export function logEnvStatus(): void {
  console.log("\n🔑 Environment check:");
  console.log(
    `   Vision provider:   ${env.visionProviderKey ? "configured" : "MISSING — vision module will run in stub mode"}`
  );
  console.log(
    `   Evidence provider: ${env.evidenceProviderKey ? "configured" : "MISSING — evidence module will run in stub mode"}`
  );
  console.log(
    `   Allowed origin:    ${env.allowedOrigin ?? "not set — defaulting to http://localhost:5173"}`
  );
  console.log("");
}