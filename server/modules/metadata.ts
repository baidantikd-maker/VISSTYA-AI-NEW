import type {
  ClaimInput,
  MediaInput,
  ModuleResult,
} from "../types.js";

/**
 * Metadata verification module.
 *
 * Responsibility:
 * - Inspect media metadata/provenance signals.
 * - Report available information.
 * - Report missing information.
 * - Produce a metadata-specific score.
 *
 * This module does NOT decide whether the overall claim is true.
 * The final decision belongs to scoring.ts + display.ts.
 */

interface MetadataData {
  mediaKind: MediaInput["kind"];
  hasUrl: boolean;
  urlType: "http" | "data" | "blob" | "none";
  fileName?: string;
  mimeType?: string;
  metadataAvailable: boolean;
  metadataFields: Record<string, unknown>;
}

function getUrlType(
  url?: string
): MetadataData["urlType"] {
  if (!url) return "none";

  if (url.startsWith("data:")) {
    return "data";
  }

  if (url.startsWith("blob:")) {
    return "blob";
  }

  if (/^https?:\/\//i.test(url)) {
    return "http";
  }

  return "none";
}

/**
 * Extract basic information from a data URL.
 *
 * Example:
 * data:image/jpeg;base64,...
 */
function inspectDataUrl(url: string): {
  mimeType?: string;
  hasPayload: boolean;
} {
  const match = url.match(
    /^data:([^;,]+)(?:;[^,]*)?,(.*)$/s
  );

  if (!match) {
    return {
      hasPayload: false,
    };
  }

  return {
    mimeType: match[1],
    hasPayload: match[2].length > 0,
  };
}

/**
 * Main metadata analysis function.
 */
export async function analyzeMetadata(
  media: MediaInput,
  _claim: ClaimInput
): Promise<ModuleResult> {
  const missing: string[] = [];
  const warnings: string[] = [];
  const findings: ModuleResult["findings"] = [];

  const urlType = getUrlType(media.url);

  let metadataAvailable = false;
  let detectedMimeType = media.mimeType;

  /**
   * Basic media information.
   */
  const hasUrl = Boolean(media.url);

  if (!media.url) {
    missing.push("Original media URL or file payload");
  }

  if (!media.name) {
    missing.push("Original filename");
  }

  if (!media.mimeType) {
    missing.push("MIME type");
  }

  /**
   * Data URL inspection.
   *
   * This does NOT yet parse EXIF.
   * It only confirms that the data URL contains
   * a recognizable media payload.
   */
  if (urlType === "data" && media.url) {
    const inspected = inspectDataUrl(media.url);

    if (inspected.mimeType) {
      detectedMimeType = inspected.mimeType;
    }

    if (inspected.hasPayload) {
      metadataAvailable = true;
    } else {
      warnings.push("Data URL contains no usable payload");
    }
  }

  /**
   * Blob URLs are browser-local references.
   * The backend cannot reliably inspect their original
   * metadata because the blob belongs to the browser.
   */
  if (urlType === "blob") {
    missing.push(
      "Server-accessible original media; browser blob URL cannot be inspected directly"
    );

    warnings.push(
      "Media was supplied as a browser-local blob URL"
    );
  }

  /**
   * HTTP URLs can potentially be inspected later.
   *
   * We deliberately do not fetch arbitrary URLs here yet.
   * That will be implemented safely once the media-ingestion
   * layer is established.
   */
  if (urlType === "http") {
    metadataAvailable = true;

    findings.push({
      label: "Media source",
      value: "Publicly accessible URL provided",
      tone: "good",
    });
  }

  /**
   * Media type.
   */
  findings.push({
    label: "Media type",
    value: media.kind,
    tone: media.kind === "image" ? "good" : "neutral",
  });

  /**
   * Filename.
   */
  if (media.name) {
    findings.push({
      label: "Filename",
      value: media.name,
      tone: "good",
    });
  } else {
    findings.push({
      label: "Filename",
      value: "Not provided",
      tone: "warn",
    });
  }

  /**
   * MIME type.
   */
  if (detectedMimeType) {
    findings.push({
      label: "MIME type",
      value: detectedMimeType,
      tone: "good",
    });
  } else {
    findings.push({
      label: "MIME type",
      value: "Not available",
      tone: "warn",
    });
  }

  /**
   * EXIF status.
   *
   * We are intentionally NOT claiming EXIF has been extracted yet.
   * That will be added using a proper EXIF parser/ingestion path.
   */
  findings.push({
    label: "EXIF metadata",
    value: "Not yet extracted",
    tone: "warn",
  });

  missing.push(
    "Camera metadata, capture timestamp and GPS coordinates require EXIF extraction from the original image"
  );

  /**
   * Re-encoding/provenance.
   *
   * We cannot determine this reliably from the current
   * browser URL alone, so it remains an unresolved signal.
   */
  missing.push(
    "Original encoding/provenance history"
  );

  /**
   * Score calculation.
   *
   * Maximum metadata contribution = 15.
   *
   * This is intentionally conservative:
   * available metadata earns points,
   * but missing metadata does not automatically mean
   * the content is false.
   */
  let score = 0;

  if (hasUrl) {
    score += 3;
  }

  if (media.name) {
    score += 2;
  }

  if (detectedMimeType) {
    score += 2;
  }

  if (metadataAvailable) {
    score += 3;
  }

  if (urlType === "http") {
    score += 2;
  }

  /**
   * Having an actual media payload is useful,
   * but we cap the module at 15.
   */
  if (media.kind === "image") {
    score += 1;
  }

  score = Math.min(score, 15);

  /**
   * Determine module-level summary.
   */
  let summary: string;

  if (score >= 12) {
    summary =
      "Basic media metadata is available, but original EXIF and provenance still need to be verified.";
  } else if (score >= 7) {
    summary =
      "Some metadata signals are available, but important provenance and capture information is missing.";
  } else {
    summary =
      "Metadata is limited. Important information about the original capture and provenance could not be verified.";
  }

  const data: MetadataData = {
    mediaKind: media.kind,
    hasUrl,
    urlType,
    fileName: media.name,
    mimeType: detectedMimeType,
    metadataAvailable,
    metadataFields: {},
  };

  return {
    score,
    maxScore: 15,
    summary,
    findings,
    missing,
    warnings,
    data,
  };
}