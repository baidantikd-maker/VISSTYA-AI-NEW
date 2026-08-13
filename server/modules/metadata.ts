import ExifReader from "exifreader";
import type {
  ClaimInput,
  MediaInput,
  ModuleResult,
} from "../types.js";

/**
 * Extract EXIF tags from a data: URL image.
 * Returns null if there's no data to read, or extraction fails —
 * never throws.
 */
async function extractExif(
  media: MediaInput
): Promise<Record<string, string> | null> {
  if (!media.url || !media.url.startsWith("data:")) {
    return null;
  }

  const match = media.url.match(/^data:([^;,]+)(?:;[^,]*)?,(.*)$/s);
  if (!match) return null;

  try {
    const buffer = Buffer.from(match[2], "base64");
    const tags = ExifReader.load(buffer);

    const relevant: Record<string, string> = {};

    if (tags.DateTimeOriginal?.description) {
      relevant["Capture date"] = tags.DateTimeOriginal.description;
    }
    if (tags.Make?.description || tags.Model?.description) {
      relevant["Camera"] = [tags.Make?.description, tags.Model?.description]
        .filter(Boolean)
        .join(" ");
    }
    if (tags.GPSLatitude?.description && tags.GPSLongitude?.description) {
      relevant["GPS coordinates"] =
        `${tags.GPSLatitude.description}, ${tags.GPSLongitude.description}`;
    }
    if (tags.Software?.description) {
      relevant["Editing software"] = tags.Software.description;
    }

    return Object.keys(relevant).length > 0 ? relevant : null;
  } catch (error) {
    console.error("EXIF extraction failed:", error);
    return null;
  }
}

function parseExifDate(value: string): Date | null {
  const match = value.match(
    /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/
  );
  if (match) {
    const [, y, mo, d, h, mi, s] = match;
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}`);
  }
  const fallback = new Date(value);
  return isNaN(fallback.getTime()) ? null : fallback;
}
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
  [key: string]: unknown;
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
  claim: ClaimInput
): Promise<ModuleResult> {
  const missing: string[] = [];
  const warnings: string[] = [];
  const findings: ModuleResult["findings"] = [];

  const urlType = getUrlType(media.url);

  let metadataAvailable = false;
  let detectedMimeType = media.mimeType;
  let dateMismatch = false;

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
   * EXIF extraction — real, via exifreader.
   */
  const exifData = await extractExif(media);

if (exifData) {
  findings.push({
    label: "EXIF metadata",
    value: Object.entries(exifData)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" · "),
    tone: "good",
  });

  const captureDateStr = exifData["Capture date"];
  if (captureDateStr && claim.date) {
    const captureDate = parseExifDate(captureDateStr);
    const claimedDate = new Date(claim.date);

    if (captureDate && !isNaN(claimedDate.getTime())) {
      const diffDays =
        Math.abs(captureDate.getTime() - claimedDate.getTime()) /
        (1000 * 60 * 60 * 24);

      if (diffDays > 3) {
        findings.push({
          label: "Capture date vs claimed date",
          value: `Image captured ${captureDateStr}, but claim states ${claim.date} (${Math.round(diffDays)} days apart)`,
          tone: "bad",
        });

        warnings.push(
          `The image's capture date does not match the claimed date, which may indicate the media is being reused from a different event.`
        );

        dateMismatch = true;
      } else {
        findings.push({
          label: "Capture date vs claimed date",
          value: "Consistent with claimed date",
          tone: "good",
        });
      }
    }
  }
} else {
  findings.push({
    label: "EXIF metadata",
    value: "None found (stripped, unsupported format, or not a data URL)",
    tone: "warn",
  });

  missing.push(
    "Camera metadata, capture timestamp and GPS coordinates were not present or could not be extracted"
  );
}
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

  if (exifData) {
    score += 2;
  }

  if (dateMismatch) {
    score -= 5;
  }

  score = Math.max(0, Math.min(score, 15));

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