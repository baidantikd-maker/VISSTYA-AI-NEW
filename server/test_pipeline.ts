import { runTrustEngine } from "./verification";

async function testPipeline() {
  console.log("Starting verification pipeline test run...");

  const sampleInput = {
    mediaUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    mediaType: "image" as const,
    claimEvent: "Major landscape landmark observation",
    claimLocation: "Yosemite National Park, California",
    claimDate: new Date("2026-06-15"),
  };

  try {
    const result = await runTrustEngine(sampleInput);
    console.log("Verification Pipeline Test Result:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Pipeline test failed:", error);
  }
}

testPipeline();
