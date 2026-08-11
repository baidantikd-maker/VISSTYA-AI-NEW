import { beforeEach, describe, expect, it, vi } from "vitest";

// Mutable ENV so tests can toggle the news API key between scenarios.
const ENV = vi.hoisted(() => ({ newsApiKey: "" }));

vi.mock("./_core/env", () => ({ ENV }));

vi.mock("axios");

vi.mock("./_core/gemini", () => ({
  analyzeMediaWithGemini: vi.fn(),
}));

import axios from "axios";
import {
  analyzeMetadata,
  analyzeVision,
  analyzeWeather,
  analyzeEvidence,
  runTrustEngine,
} from "./verification";
import { analyzeMediaWithGemini } from "./_core/gemini";
import { MODULE_WEIGHTS } from "../shared/scoring";

const mockedGet = vi.mocked(axios.get);
const mockedGemini = vi.mocked(analyzeMediaWithGemini);

type MockMediaResponse = {
  data: Buffer;
  headers?: Record<string, string>;
};

/** Single mock that handles media fetch, geocoding, weather archive, and news. */
function mockApis({
  articles = 0,
  newsFails = false,
  media = Buffer.from("not-an-image"),
}: {
  articles?: number;
  newsFails?: boolean;
  media?: Buffer;
} = {}) {
  mockedGet.mockImplementation(
    async (url: string): Promise<MockMediaResponse> => {
      const u = String(url);
      if (u.includes("newsapi.org")) {
        if (newsFails) throw new Error("news service down");
        return {
          data: {
            articles: Array.from({ length: articles }, (_, i) => ({
              source: { name: `Source ${i + 1}` },
              title: `Article ${i + 1}`,
            })),
          } as unknown as Buffer,
        };
      }
      if (u.includes("nominatim")) {
        return {
          data: [{ lat: "28.6139", lon: "77.2090" }] as unknown as Buffer,
        };
      }
      if (u.includes("archive-api.open-meteo")) {
        return {
          data: {
            hourly: {
              time: ["2026-06-15T00:00", "2026-06-15T06:00"],
              temperature_2m: [24, 30],
            },
            daily: {
              temperature_2m_max: [30],
              temperature_2m_min: [24],
              precipitation_sum: [0],
              weathercode: [0],
            },
          } as unknown as Buffer,
        };
      }
      return { data: media, headers: { "content-type": "image/jpeg" } };
    }
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  ENV.newsApiKey = "";
  mockedGemini.mockResolvedValue({
    description: "A flooded street",
    sceneType: "outdoor",
    objectsDetected: [],
    weatherCues: null,
    timeOfDay: null,
    locationClues: [],
    manipulationSigns: [],
    eventConsistency: null,
    locationConsistency: null,
  });
});

describe("analyzeMetadata", () => {
  it("returns a minimal score when media cannot be retrieved", async () => {
    mockApis();
    const result = await analyzeMetadata("not-a-valid-url", "image");
    expect(result.score).toBe(1);
    expect(result.maxScore).toBe(MODULE_WEIGHTS.metadata);
    expect(
      result.findings.some(f => f.includes("Unable to retrieve media"))
    ).toBe(true);
  });

  it("scores an image with unparseable EXIF data", async () => {
    mockApis();
    const result = await analyzeMetadata(
      "https://example.com/photo.jpg",
      "image"
    );
    expect(result.score).toBe(5);
    expect(result.findings.some(f => f.includes("Valid media URL"))).toBe(true);
    expect(
      result.findings.some(f => f.includes("EXIF parsing completed"))
    ).toBe(true);
  });

  it("scores a video from container structure checks", async () => {
    mockApis({ media: Buffer.from("video-bytes") });
    const result = await analyzeMetadata(
      "https://example.com/clip.mp4",
      "video"
    );
    expect(result.score).toBe(15);
    expect(result.findings.some(f => f.includes("Video format verified"))).toBe(
      true
    );
  });
});

describe("analyzeVision", () => {
  it("scores a clean scene analysis", async () => {
    mockedGemini.mockResolvedValue({
      description: "A calm park with a lake",
      sceneType: "outdoor",
      objectsDetected: [],
      weatherCues: null,
      timeOfDay: null,
      locationClues: [],
      manipulationSigns: [],
      eventConsistency: null,
      locationConsistency: null,
    });
    const result = await analyzeVision(
      "https://example.com/photo.jpg",
      "image"
    );
    expect(result.score).toBe(7);
    expect(result.maxScore).toBe(MODULE_WEIGHTS.vision);
  });

  it("adds consistency bonuses for matching claims", async () => {
    mockedGemini.mockResolvedValue({
      description: "Heavy rain flooding a metro station",
      sceneType: "outdoor",
      objectsDetected: ["metro", "water"],
      weatherCues: "Rain / Storm",
      timeOfDay: "day",
      locationClues: ["Mumbai"],
      manipulationSigns: [],
      eventConsistency: "consistent",
      locationConsistency: "consistent",
    });
    const result = await analyzeVision(
      "https://example.com/photo.jpg",
      "image",
      "Flooded metro station in Mumbai",
      "Mumbai"
    );
    expect(result.score).toBe(MODULE_WEIGHTS.vision);
    expect(
      result.findings.some(f =>
        f.includes("aligns consistently with visual evidence")
      )
    ).toBe(true);
  });

  it("uses fallback scoring when Gemini fails", async () => {
    mockedGemini.mockRejectedValue(new Error("gemini unavailable"));
    const result = await analyzeVision(
      "https://example.com/photo.jpg",
      "image"
    );
    expect(result.score).toBe(15);
    expect(
      result.findings.some(f => f.includes("Vision analysis fallback"))
    ).toBe(true);
  });
});

describe("analyzeWeather", () => {
  it("bypasses weather verification for indoor scenes", async () => {
    const result = await analyzeWeather(
      "Film Studio, Mumbai",
      new Date("2026-06-15"),
      { sceneType: "indoor", weatherCues: "none" }
    );
    expect(result.isNotRequired).toBe(true);
    expect(result.score).toBe(MODULE_WEIGHTS.weather);
  });

  it("returns a partial score without location or date", async () => {
    const result = await analyzeWeather(undefined, undefined, {
      sceneType: "outdoor",
    });
    expect(result.score).toBe(15);
    expect(result.details).toMatchObject({
      status: "insufficient_specific_data",
    });
  });

  it("scores full historical weather analysis with matching cues", async () => {
    mockApis();
    const result = await analyzeWeather("Mumbai", new Date("2026-06-15"), {
      sceneType: "outdoor",
      weatherCues: "Clear / Sunny",
    });
    expect(result.score).toBe(MODULE_WEIGHTS.weather);
    expect(
      result.findings.some(f =>
        f.includes("Visual weather cues align with historical")
      )
    ).toBe(true);
  });
});

describe("analyzeEvidence", () => {
  it("returns a general assessment when no claim is provided", async () => {
    const result = await analyzeEvidence();
    expect(result.score).toBe(20);
    expect(result.details).toMatchObject({ verdict: "Plausible" });
  });

  it("flags misleading claims when the news API is unconfigured", async () => {
    ENV.newsApiKey = "";
    const result = await analyzeEvidence("This is a fake claim about a hoax");
    expect(result.score).toBe(21);
    expect(result.details).toMatchObject({
      verdict: "Flagged as Unverified / Misleading",
      veracityScore: 35,
    });
  });

  it("corroborates claims when news articles are found", async () => {
    ENV.newsApiKey = "test-news-key";
    mockApis({ articles: 3 });
    const result = await analyzeEvidence(
      "Flood in Mumbai",
      "Mumbai",
      new Date("2026-06-15")
    );
    expect(result.score).toBe(33);
    expect(result.details).toMatchObject({
      verdict: "Corroborated",
      publishedMatches: 3,
    });
  });

  it("falls back to heuristic scoring when the news search fails", async () => {
    ENV.newsApiKey = "test-news-key";
    mockApis({ newsFails: true });
    const result = await analyzeEvidence("Flood in Mumbai");
    expect(result.score).toBe(23);
    expect(result.details).toMatchObject({
      verdict: "Unverified",
      veracityScore: 55,
    });
  });
});

describe("runTrustEngine", () => {
  it("runs all modules and aggregates a bounded total score", async () => {
    ENV.newsApiKey = "test-news-key";
    mockApis({ articles: 3 });
    mockedGemini.mockResolvedValue({
      description: "A flooded street with clear sky",
      sceneType: "outdoor",
      objectsDetected: [],
      weatherCues: "Clear / Sunny",
      timeOfDay: null,
      locationClues: [],
      manipulationSigns: [],
      eventConsistency: "consistent",
      locationConsistency: "consistent",
    });

    const result = await runTrustEngine({
      mediaUrl: "https://example.com/photo.jpg",
      mediaType: "image",
      claimEvent: "Street flooding in Mumbai",
      claimLocation: "Mumbai",
      claimDate: new Date("2026-06-15"),
    });

    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(100);
    expect(["FALSE", "AVERAGE", "TRUSTABLE"]).toContain(result.statusBand);
    expect(result.summary.length).toBeGreaterThan(0);
    expect(result.metadata.score).toBeLessThanOrEqual(MODULE_WEIGHTS.metadata);
    expect(result.vision.score).toBeLessThanOrEqual(MODULE_WEIGHTS.vision);
    expect(result.weather.score).toBeLessThanOrEqual(MODULE_WEIGHTS.weather);
    expect(result.evidence.score).toBeLessThanOrEqual(MODULE_WEIGHTS.evidence);
  });

  it("produces a TRUSTABLE band for fully corroborated input", async () => {
    ENV.newsApiKey = "test-news-key";
    mockApis({ articles: 3 });
    mockedGemini.mockResolvedValue({
      description: "A busy city street during the day",
      sceneType: "outdoor",
      objectsDetected: ["cars", "buildings"],
      weatherCues: "Clear / Sunny",
      timeOfDay: "day",
      locationClues: ["Mumbai"],
      manipulationSigns: [],
      eventConsistency: "consistent",
      locationConsistency: "consistent",
    });

    const result = await runTrustEngine({
      mediaUrl: "https://example.com/photo.jpg",
      mediaType: "image",
      claimEvent: "Rush hour traffic in Mumbai",
      claimLocation: "Mumbai",
      claimDate: new Date("2026-06-15"),
    });

    expect(result.totalScore).toBe(88);
    expect(result.statusBand).toBe("TRUSTABLE");
  });
});
