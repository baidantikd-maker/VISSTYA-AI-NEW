import ExifReader from "exifreader";

export type ParsedExifResult = {
  source: string;
  tags: Record<string, string>;
};

function formatTags(tags: ExifReader.Tags): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, tag] of Object.entries(tags)) {
    if (!tag || typeof tag !== "object") continue;
    const value =
      "description" in tag && tag.description != null
        ? String(tag.description)
        : "value" in tag && tag.value != null
          ? String(tag.value)
          : "";
    if (value) result[key] = value;
  }
  return result;
}

async function parseFromBuffer(buffer: ArrayBuffer, source: string): Promise<ParsedExifResult> {
  const tags = ExifReader.load(buffer);
  return { source, tags: formatTags(tags) };
}

export async function parseExifFromMediaUrl(url: string): Promise<ParsedExifResult> {
  if (!url) {
    throw new Error("No media URL provided.");
  }

  if (url.startsWith("data:") || url.startsWith("blob:")) {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return parseFromBuffer(buffer, "Uploaded file");
  }

  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) {
      throw new Error("Could not fetch image for EXIF parsing.");
    }
    const buffer = await response.arrayBuffer();
    return parseFromBuffer(buffer, url);
  } catch {
    return {
      source: url,
      tags: {
        Note: "EXIF preview unavailable for this URL in browser-only mode",
        Hint: "Upload a file directly to inspect full metadata",
      },
    };
  }
}
