import { ENV } from "./env";

export const GEMINI_MODEL =
  ENV.geminiModel || "gemini-flash-latest";

export interface GeminiVisionAnalysis {
  description: string;
  sceneType: string;
  objectsDetected: string[];
  weatherCues: string | null;
  timeOfDay: string | null;
  locationClues: string[];
  manipulationSigns: string[];
  eventConsistency: "consistent" | "inconsistent" | "inconclusive" | null;
  locationConsistency: "consistent" | "inconsistent" | "inconclusive" | null;
}

type GeminiPart = Record<string, unknown>;

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const UPLOAD_BASE = "https://generativelanguage.googleapis.com/upload/v1beta";

const assertApiKey = () => {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return ENV.geminiApiKey;
};

const sleep = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

const RETRY_ATTEMPTS = 3;

const isRetryableStatus = (status: number) =>
  status === 408 || status === 429 || (status >= 500 && status < 600);

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  attempts: number = RETRY_ATTEMPTS
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(url, init);
      if (!isRetryableStatus(response.status) || attempt >= attempts) {
        return response;
      }
      try {
        await response.body?.cancel();
      } catch {
        // Body already settled; nothing to clean up.
      }
      const delay = Math.min(1000 * 2 ** attempt, 8000) + Math.random() * 250;
      console.warn(
        `Gemini request retry ${attempt + 1}/${attempts} after status ${response.status}`
      );
      await sleep(delay);
    } catch (error) {
      if (attempt >= attempts) throw error;
      const delay = Math.min(1000 * 2 ** attempt, 8000);
      console.warn(
        `Gemini request retry ${attempt + 1}/${attempts} after network error`
      );
      await sleep(delay);
    }
  }
}

async function downloadMedia(url: string): Promise<{
  bytes: Buffer;
  mimeType: string;
}> {
  const response = await fetchWithRetry(url, {
    headers: { "User-Agent": "Visstya-AI-Verification/1.0" },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to download media (${response.status} ${response.statusText})`
    );
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const mimeType =
    response.headers.get("content-type")?.split(";")[0]?.trim() ||
    "application/octet-stream";

  return { bytes, mimeType };
}

async function waitForFileActive(name: string): Promise<void> {
  const key = assertApiKey();

  for (let attempt = 0; attempt < 60; attempt++) {
    const response = await fetch(
      `${API_BASE}/${name}?key=${encodeURIComponent(key)}`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to check Gemini file state (${response.status} ${response.statusText})`
      );
    }

    const data = (await response.json()) as { state?: string };
    if (data.state === "ACTIVE") return;
    if (data.state === "FAILED") {
      throw new Error("Gemini file processing failed");
    }

    await sleep(1000);
  }

  throw new Error("Timed out waiting for Gemini file processing");
}

async function uploadToFilesApi(
  bytes: Buffer,
  mimeType: string,
  displayName: string
): Promise<{ name: string; uri: string }> {
  const key = assertApiKey();

  const startResponse = await fetch(
    `${UPLOAD_BASE}/files?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(bytes.length),
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file: { display_name: displayName, mime_type: mimeType },
      }),
    }
  );

  if (!startResponse.ok) {
    const detail = await startResponse.text().catch(() => "");
    throw new Error(
      `Gemini file upload init failed (${startResponse.status}): ${detail}`
    );
  }

  const uploadUrl = startResponse.headers.get("x-goog-upload-url");
  if (!uploadUrl) throw new Error("Gemini file upload init missing upload URL");

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Length": String(bytes.length),
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: new Uint8Array(bytes),
  });

  if (!uploadResponse.ok) {
    const detail = await uploadResponse.text().catch(() => "");
    throw new Error(
      `Gemini file upload failed (${uploadResponse.status}): ${detail}`
    );
  }

  const result = (await uploadResponse.json()) as {
    file?: { name?: string; uri?: string };
  };
  const file = result.file ?? {};
  if (!file.name || !file.uri) {
    throw new Error("Gemini file upload returned no file URI");
  }

  await waitForFileActive(file.name);

  return { name: file.name, uri: file.uri };
}

const INLINE_LIMIT = 19 * 1024 * 1024;

async function buildMediaPart(
  bytes: Buffer,
  mimeType: string,
  mediaType: "image" | "video"
): Promise<GeminiPart> {
  const isImage = mediaType === "image" || mimeType.startsWith("image/");

  if (isImage && bytes.length <= INLINE_LIMIT) {
    return {
      inline_data: { mime_type: mimeType, data: bytes.toString("base64") },
    };
  }

  const file = await uploadToFilesApi(bytes, mimeType, "visstya-media");
  return { file_data: { mime_type: mimeType, file_uri: file.uri } };
}

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    description: { type: "STRING" },
    sceneType: { type: "STRING" },
    objectsDetected: { type: "ARRAY", items: { type: "STRING" } },
    weatherCues: { type: "STRING" },
    timeOfDay: { type: "STRING" },
    locationClues: { type: "ARRAY", items: { type: "STRING" } },
    manipulationSigns: { type: "ARRAY", items: { type: "STRING" } },
    eventConsistency: { type: "STRING" },
    locationConsistency: { type: "STRING" },
  },
  required: [
    "description",
    "sceneType",
    "objectsDetected",
    "weatherCues",
    "timeOfDay",
    "locationClues",
    "manipulationSigns",
  ],
};

const SYSTEM_PROMPT = `You are a forensic media analyst for Visstya AI, an AI-powered fact-checking service.
Analyze the provided media critically and honestly. Describe the scene, list the objects you can see, note visible weather conditions and time of day, and identify any location clues (landmarks, signage, vegetation, language, architecture).
Flag any signs of AI generation, editing, or manipulation (inconsistent shadows, artifacts, warped text, unnatural faces or limbs, seams).
Compare what you actually observe with the claimed event and claimed location provided by the user, and report each as "consistent", "inconsistent", or "inconclusive". If a claim detail is not provided, set its consistency to null.
Always respond with valid JSON matching the requested schema.`;

const normalizeConsistency = (
  value: unknown
): "consistent" | "inconsistent" | "inconclusive" | null => {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "consistent" || normalized === "inconclusive") {
    return normalized;
  }
  if (normalized === "inconsistent") {
    return normalized;
  }
  return null;
};

const parseAnalysis = (text: string): GeminiVisionAnalysis => {
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text) as Record<string, unknown>;
  } catch {
    raw = { description: text };
  }

  const asStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value
        .map(item => String(item ?? "").trim())
        .filter(item => item.length > 0);
    }
    if (typeof value === "string" && value.trim().length > 0) {
      return [value.trim()];
    }
    return [];
  };

  const asNullableString = (value: unknown): string | null => {
    if (Array.isArray(value)) {
      const joined = value
        .map(item => String(item ?? "").trim())
        .filter(Boolean)
        .join(", ");
      return joined.length > 0 ? joined : null;
    }

    const textValue = String(value ?? "").trim();
    if (textValue.length === 0 || textValue === "null") return null;
    if (/^(none|n\/a|not applicable|not visible|not available|unknown|unavailable|indeterminate|indeterminable)/i.test(textValue)) {
      return null;
    }
    return textValue;
  };

  return {
    description: asNullableString(raw.description) ?? "No description returned",
    sceneType: asNullableString(raw.sceneType) ?? "unknown",
    objectsDetected: asStringArray(raw.objectsDetected),
    weatherCues: asNullableString(raw.weatherCues),
    timeOfDay: asNullableString(raw.timeOfDay),
    locationClues: asStringArray(raw.locationClues),
    manipulationSigns: asStringArray(raw.manipulationSigns),
    eventConsistency: normalizeConsistency(raw.eventConsistency),
    locationConsistency: normalizeConsistency(raw.locationConsistency),
  };
};

export interface AnalyzeMediaParams {
  mediaUrl: string;
  mediaType: "image" | "video";
  claimEvent?: string;
  claimLocation?: string;
}

export async function analyzeMediaWithGemini(
  params: AnalyzeMediaParams
): Promise<GeminiVisionAnalysis> {
  const key = assertApiKey();
  const { mediaUrl, mediaType, claimEvent, claimLocation } = params;

  const { bytes, mimeType } = await downloadMedia(mediaUrl);
  const mediaPart = await buildMediaPart(bytes, mimeType, mediaType);

  const claimParts: string[] = [];
  claimParts.push(`Claimed event: ${claimEvent?.trim() || "not provided"}`);
  claimParts.push(`Claimed location: ${claimLocation?.trim() || "not provided"}`);

  const response = await fetchWithRetry(
    `${API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [
              mediaPart,
              {
                text: `Analyze this ${mediaType} and return structured findings.\n${claimParts.join(
                  "\n"
                )}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Gemini generateContent failed (${response.status} ${response.statusText}): ${detail}`
    );
  }

  const result = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
    promptFeedback?: { blockReason?: string };
  };

  if (result.promptFeedback?.blockReason) {
    throw new Error(
      `Gemini request blocked: ${result.promptFeedback.blockReason}`
    );
  }

  const text = result.candidates?.[0]?.content?.parts
    ?.map(part => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return parseAnalysis(text);
}
