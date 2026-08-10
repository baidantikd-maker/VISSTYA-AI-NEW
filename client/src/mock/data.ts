import type { VerificationReport } from "./types";

const img = (seed: string, w = 1200, h = 800) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const VID = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";

export const SAMPLE_REPORT_84: VerificationReport = {
  id: 1001,
  shareToken: "sample-84-trustable",
  media: { url: img("jalpaiguri-flood", 1400, 900), kind: "image", fileName: "IMG_4821.jpeg", mime: "image/jpeg" },
  claim: {
    event: "Flooding in low-lying areas of Jalpaiguri district after continuous monsoon rainfall",
    location: "Jalpaiguri, West Bengal",
    date: "1 August 2026",
  },
  totalScore: 84,
  statusBand: "TRUSTABLE",
  summary:
    "Multiple independent, dated sources corroborate that low-lying areas of Jalpaiguri district experienced flooding after several days of continuous monsoon rainfall. Weather records, river-gauge readings and on-the-ground reporting are consistent with the media and the stated claim. No contradicting evidence was found.",
  modules: {
    metadata: {
      score: 13,
      max: 15,
      summary:
        "The file carries intact capture metadata that is internally consistent and matches the claimed time and location.",
      items: [
        { label: "File type", value: "JPEG · 8.2 MB", tone: "neutral" },
        { label: "Camera", value: "Sony ILCE-7M3", tone: "neutral" },
        { label: "Capture time", value: "2026-08-01 · 14:20 IST", tone: "good" },
        { label: "GPS", value: "26.52° N, 88.71° E — Jalpaiguri", tone: "good" },
        { label: "Editing history", value: "Crop + exposure, no cloning", tone: "good" },
      ],
      redFlags: ["None detected"],
    },
    vision: {
      score: 21,
      max: 25,
      summary:
        "Object, scene and lighting analysis found the imagery consistent with a single contiguous capture of flood water on rural roads.",
      items: [
        { label: "Scene", value: "Flooded rural roads, submerged fields", tone: "neutral" },
        { label: "Weather cues", value: "Overcast sky, heavy standing water", tone: "good" },
        { label: "Perspective", value: "Consistent with one camera position", tone: "good" },
        { label: "Generation artifacts", value: "None found at 8× zoom", tone: "good" },
        { label: "Anomalies", value: "1 region of heavy JPEG compression", tone: "warn" },
      ],
      redFlags: ["Compression artifacts in one frame region — likely re-encoded on WhatsApp"],
    },
    weather: {
      score: 23,
      max: 25,
      summary:
        "IMD observations and river-gauge data confirm extreme rainfall and flood conditions in the district on the claimed date.",
      items: [
        { label: "3-day rainfall", value: "284 mm vs 95 mm normal", tone: "good" },
        { label: "Advisory", value: "IMD Orange alert for North Bengal", tone: "good" },
        { label: "River gauge", value: "Teesta: 0.8 m above danger level", tone: "good" },
        { label: "Lightning density", value: "High, consistent with monsoon", tone: "good" },
      ],
      redFlags: ["Gauge reading came from a single automated station"],
    },
    evidence: {
      score: 27,
      max: 35,
      summary:
        "Five independent dated reports corroborate the claim. Zero sources contradict it. One wire report covers an adjacent district.",
      items: [
        { label: "Independent sources", value: "5 corroborate · 0 contradict", tone: "good" },
        { label: "First corroboration", value: "Within 5 hours of media share", tone: "good" },
        { label: "Temporal consistency", value: "All reports dated 1–2 August 2026", tone: "good" },
        { label: "Out-of-scope", value: "1 report from adjacent district", tone: "warn" },
      ],
      redFlags: ["Media went viral before the first wire report was published"],
    },
  },
  sources: [
    {
      id: "s1",
      name: "Press Trust of India",
      domain: "ptinews.com",
      headline: "Heavy rain triggers flooding in Jalpaiguri, roads submerged",
      publishedAt: "2026-08-01T18:45:00Z",
      label: "Supporting",
      snippet:
        "District administration said several low-lying areas in Jalpaiguri were waterlogged after the Teesta crossed the danger mark, with over 250 mm of rain in 48 hours.",
      url: "https://www.ptinews.com/west-bengal/jalpaiguri-flooding-august-2026",
    },
    {
      id: "s2",
      name: "The Hindu",
      domain: "thehindu.com",
      headline: "Jalpaiguri floods: NDRF teams deployed in two blocks",
      publishedAt: "2026-08-01T22:10:00Z",
      label: "Supporting",
      snippet:
        "Teams have been deployed after water entered several villages near the Teesta. District magistrate confirmed relief camps were opened for affected families.",
      url: "https://www.thehindu.com/news/national/jalpaiguri-floods-ndrf",
    },
    {
      id: "s3",
      name: "India Meteorological Department",
      domain: "mausam.imd.gov.in",
      headline: "Orange alert: very heavy rainfall over North Bengal",
      publishedAt: "2026-08-01T11:00:00Z",
      label: "Supporting",
      snippet:
        "Very heavy to extremely heavy rainfall likely over sub-Himalayan West Bengal on 1–2 August 2026. Total precipitation recorded at Jalpaiguri: 284 mm.",
      url: "https://mausam.imd.gov.in/responsive/bulletin",
    },
    {
      id: "s4",
      name: "Al Jazeera",
      domain: "aljazeera.com",
      headline: "Monsoon floods swamp villages in India's northeast",
      publishedAt: "2026-08-02T06:30:00Z",
      label: "Supporting",
      snippet:
        "Villagers waded through waist-deep water in Jalpaiguri district as the annual monsoon submerged roads and damaged crops across the region.",
      url: "https://www.aljazeera.com/gallery/2026/8/2/monsoon-floods-india-northeast",
    },
    {
      id: "s5",
      name: "Reuters",
      domain: "reuters.com",
      headline: "Rescuers reach villages cut off by monsoon floods in West Bengal",
      publishedAt: "2026-08-02T09:15:00Z",
      label: "Supporting",
      snippet:
        "Boats ferried residents to safety in Jalpaiguri district where the Teesta river rose above the danger level after days of relentless rain.",
      url: "https://www.reuters.com/world/india/monsoon-floods-west-bengal-2026-08-02",
    },
  ],
  timeline: [
    { at: "2026-08-01T11:00:00Z", label: "IMD issues Orange alert", detail: "Very heavy rainfall warning for sub-Himalayan West Bengal" },
    { at: "2026-08-01T13:50:00Z", label: "Media first shared on WhatsApp", detail: "Undated image begins circulating in Jalpaiguri groups" },
    { at: "2026-08-01T18:45:00Z", label: "PTI publishes first report", detail: "First independent corroboration of flooding" },
    { at: "2026-08-02T06:30:00Z", label: "International outlets report", detail: "Al Jazeera and Reuters cover the floods" },
    { at: "2026-08-02T14:20:00Z", label: "Report generated", detail: "Trust engine completes analysis of 5 sources" },
  ],
  limitations: [
    {
      title: "Single photo, single angle",
      detail: "Conclusion is based on one image. A second independent photo or video would strengthen confidence.",
    },
    {
      title: "River gauge data",
      detail: "Gauge reading relied on one automated station; manual verification was not available to Visstya.",
    },
    {
      title: "Forwarded media",
      detail: "The image had been re-encoded, so byte-level provenance (original uploader) could not be established.",
    },
    {
      title: "Not a judgment of truth",
      detail: "This report rates how well evidence supports the claim. New evidence can change the assessment.",
    },
  ],
  createdAt: "2026-08-02T14:20:00Z",
};

export const SEED_REPORTS: VerificationReport[] = [
  SAMPLE_REPORT_84,
  {
    id: 1002,
    shareToken: "seed-cyclone-sagar",
    media: { url: img("cyclone-sagar", 1400, 900), kind: "image", fileName: "CYC_2248.png", mime: "image/png" },
    claim: {
      event: "A cyclone made landfall near Sagar Island, West Bengal with winds over 110 km/h",
      location: "Sagar Island, South 24 Parganas",
      date: "26 May 2026",
    },
    totalScore: 91,
    statusBand: "TRUSTABLE",
    summary:
      "The cyclone's landfall near Sagar Island is corroborated by IMD bulletins, satellite wind estimates, government advisories and wire reporting. The claim is consistent across every independent source examined.",
    modules: {
      metadata: {
        score: 14,
        max: 15,
        summary: "Metadata is complete and consistent with a coastal weather event captured on the claimed date.",
        items: [
          { label: "File type", value: "PNG · 4.1 MB", tone: "neutral" },
          { label: "Capture time", value: "2026-05-26 · 11:05 IST", tone: "good" },
          { label: "GPS", value: "21.64° N, 88.07° E — Sagar Island", tone: "good" },
          { label: "Editing history", value: "None detected", tone: "good" },
        ],
        redFlags: ["None detected"],
      },
      vision: {
        score: 23,
        max: 25,
        summary: "Imagery shows storm surf, uprooted trees and overcast coastal conditions consistent with landfall.",
        items: [
          { label: "Scene", value: "Coastline with heavy surf, damaged vegetation", tone: "neutral" },
          { label: "Weather cues", value: "Closed cloud cover, strong surf", tone: "good" },
          { label: "Generation artifacts", value: "None found", tone: "good" },
        ],
        redFlags: ["None detected"],
      },
      weather: {
        score: 24,
        max: 25,
        summary: "IMD landfall bulletins and satellite estimates match the claimed intensity and location.",
        items: [
          { label: "Peak wind", value: "115 km/h at landfall", tone: "good" },
          { label: "Advisory", value: "Cyclone alert issued 72 hours prior", tone: "good" },
          { label: "Storm surge", value: "1.2 m above astronomical tide", tone: "good" },
        ],
        redFlags: ["None detected"],
      },
      evidence: {
        score: 30,
        max: 35,
        summary: "Four independent sources corroborate landfall timing, location and intensity.",
        items: [
          { label: "Independent sources", value: "4 corroborate · 0 contradict", tone: "good" },
          { label: "Official confirmation", value: "NDMA and IMD bulletins", tone: "good" },
          { label: "Temporal consistency", value: "All reports dated 26–27 May 2026", tone: "good" },
        ],
        redFlags: ["Wind speed figures vary 8% between agencies"],
      },
    },
    sources: [
      {
        id: "s1",
        name: "India Meteorological Department",
        domain: "mausam.imd.gov.in",
        headline: "Landfall completed near Sagar Island; winds weaken gradually",
        publishedAt: "2026-05-26T12:30:00Z",
        label: "Supporting",
        snippet: "The system crossed the coast near Sagar Island with sustained winds of 110–120 km/h.",
        url: "https://mausam.imd.gov.in/responsive/cyclone-bulletin-2026-05-26",
      },
      {
        id: "s2",
        name: "NDMA",
        domain: "ndma.gov.in",
        headline: "Pre-positioned NDRF teams respond across South 24 Parganas",
        publishedAt: "2026-05-26T14:05:00Z",
        label: "Supporting",
        snippet: "Fifteen teams were pre-positioned before landfall; evacuations covered 1.2 lakh people.",
        url: "https://ndma.gov.in/press/cyclone-landfall-south-24-parganas",
      },
      {
        id: "s3",
        name: "Reuters",
        domain: "reuters.com",
        headline: "Cyclone hits Indian coast, lakhs evacuated in West Bengal",
        publishedAt: "2026-05-26T15:40:00Z",
        label: "Supporting",
        snippet: "The cyclone made landfall near Sagar Island, bringing heavy rain and gusty winds to coastal districts.",
        url: "https://www.reuters.com/world/india/cyclone-west-bengal-landfall-2026-05-26",
      },
      {
        id: "s4",
        name: "The Weather Channel",
        domain: "weather.com",
        headline: "Satellite wind estimates confirm landfall intensity",
        publishedAt: "2026-05-26T17:20:00Z",
        label: "Supporting",
        snippet: "Independent satellite-based intensity estimates were within 10 km/h of IMD's surface observations.",
        url: "https://weather.com/en-IN/india/news/cyclone-satellite-estimates",
      },
    ],
    timeline: [
      { at: "2026-05-24T09:00:00Z", label: "Cyclone alert issued", detail: "IMD warns coastal districts 72 hours ahead" },
      { at: "2026-05-25T21:00:00Z", label: "Evacuations complete", detail: "1.2 lakh moved to cyclone shelters" },
      { at: "2026-05-26T09:30:00Z", label: "Landfall near Sagar Island", detail: "Sustained winds 110–120 km/h" },
      { at: "2026-05-26T15:40:00Z", label: "First wire reports", detail: "Reuters confirms landfall" },
      { at: "2026-05-27T10:00:00Z", label: "Report generated", detail: "Trust engine completes analysis of 4 sources" },
    ],
    limitations: [
      { title: "Weather intensity", detail: "Wind estimates vary slightly between agencies; intensity is approximate." },
      { title: "No eyewitness verification", detail: "Visstya did not independently interview residents on Sagar Island." },
      { title: "Not a judgment of truth", detail: "This rates how well evidence supports the claim at the time of analysis." },
    ],
    createdAt: "2026-05-27T10:00:00Z",
  },
  {
    id: 1003,
    shareToken: "seed-chennai-tsunami",
    media: { url: VID, kind: "video", fileName: "marina_waves.mp4", mime: "video/mp4" },
    claim: {
      event: "A tsunami hit Chennai's Marina Beach in July 2026",
      location: "Marina Beach, Chennai",
      date: "15 July 2026",
    },
    totalScore: 22,
    statusBand: "FALSE",
    summary:
      "The circulating video was first published on 12 March 2024 and shows rough surf during an earlier storm — not a tsunami. No earthquake, tsunami advisory or coastal alert was issued for Chennai on the claimed date. The claim is contradicted by official records and by the footage's own publication history.",
    modules: {
      metadata: {
        score: 3,
        max: 15,
        summary: "The video's provenance contradicts the claimed date. Earliest known copy predates the claim by more than two years.",
        items: [
          { label: "File type", value: "MP4 · H.264 · 720p", tone: "neutral" },
          { label: "First seen online", value: "12 March 2024", tone: "bad" },
          { label: "Claimed date", value: "15 July 2026", tone: "bad" },
          { label: "EXIF", value: "Stripped during re-encoding", tone: "warn" },
        ],
        redFlags: ["First known copy predates the claimed event by 28 months"],
      },
      vision: {
        score: 6,
        max: 25,
        summary: "The footage shows heavy surf but no signs consistent with a tsunami wave (no bore, no receding water).",
        items: [
          { label: "Scene", value: "Rough sea against a seawall", tone: "neutral" },
          { label: "Wave signature", value: "Wind-driven surf, not a tsunami bore", tone: "bad" },
          { label: "Crowd reaction", value: "Bystanders filming, no alarm", tone: "warn" },
        ],
        redFlags: ["Wave dynamics are inconsistent with tsunami behavior"],
      },
      weather: {
        score: 4,
        max: 25,
        summary: "No seismic event or tsunami advisory was recorded for the claimed date or location.",
        items: [
          { label: "Seismic activity", value: "None in Bay of Bengal, 15 Jul 2026", tone: "bad" },
          { label: "Tsunami advisory", value: "None issued", tone: "bad" },
          { label: "Sea state", value: "Normal monsoon swell, 2.1 m", tone: "good" },
        ],
        redFlags: ["No INCOIS bulletin for the claimed event"],
      },
      evidence: {
        score: 9,
        max: 35,
        summary: "No credible source corroborates a tsunami. Official agencies, news archives and the footage's own history contradict the claim.",
        items: [
          { label: "Independent sources", value: "0 corroborate · 3 contradict", tone: "bad" },
          { label: "Official advisory", value: "None issued", tone: "bad" },
          { label: "Viral history", value: "Recirculated in 2025 and 2026", tone: "bad" },
        ],
        redFlags: ["Same footage resurfaces in every monsoon season"],
      },
    },
    sources: [
      {
        id: "s1",
        name: "INCOIS",
        domain: "incois.gov.in",
        headline: "No tsunami advisory issued for the Bay of Bengal on 15 July 2026",
        publishedAt: "2026-07-15T12:00:00Z",
        label: "Contradicting",
        snippet: "No seismic activity of magnitude 6.5+ was recorded in the region. No tsunami warning was in effect.",
        url: "https://incois.gov.in/tsunami-bulletin/2026-07-15",
      },
      {
        id: "s2",
        name: "The Hindu (archive)",
        domain: "thehindu.com",
        headline: "Rough seas flood Marina promenade during cyclonic storm — March 2024",
        publishedAt: "2024-03-12T10:00:00Z",
        label: "Contradicting",
        snippet: "Footage matching the circulating video appears in this report from 12 March 2024, during a prior storm.",
        url: "https://www.thehindu.com/news/cities/chennai/rough-seas-marina-march-2024",
      },
      {
        id: "s3",
        name: "PTI Fact Check",
        domain: "ptinews.com",
        headline: "Old storm video shared as 'Chennai tsunami' goes viral again",
        publishedAt: "2026-07-16T08:30:00Z",
        label: "Contradicting",
        snippet: "A fact-check by the wire agency traced the clip to March 2024. No tsunami occurred.",
        url: "https://www.ptinews.com/factcheck/chennai-tsunami-old-video-2026-07-16",
      },
    ],
    timeline: [
      { at: "2024-03-12T10:00:00Z", label: "Footage first published", detail: "The Hindu report during an earlier storm" },
      { at: "2026-07-14T18:00:00Z", label: "Video recirculated", detail: "Forwarded in Chennai WhatsApp groups" },
      { at: "2026-07-15T12:00:00Z", label: "No advisory issued", detail: "INCOIS confirms no tsunami event" },
      { at: "2026-07-16T08:30:00Z", label: "Fact-check published", detail: "PTI traces clip to March 2024" },
      { at: "2026-07-16T11:00:00Z", label: "Report generated", detail: "Trust engine completes analysis" },
    ],
    limitations: [
      { title: "Compressed video", detail: "The clip was re-encoded multiple times; original uploader could not be identified." },
      { title: "Audio analysis", detail: "No reliable ambient audio remained in the circulating copy." },
      { title: "Not a judgment of truth", detail: "This rates evidence support at analysis time; the video itself is real footage, just misdated." },
    ],
    createdAt: "2026-07-16T11:00:00Z",
  },
  {
    id: 1004,
    shareToken: "seed-delhi-airport",
    media: { url: img("delhi-airport", 1400, 900), kind: "image", fileName: "DEL_flood.jpg", mime: "image/jpeg" },
    claim: {
      event: "Delhi's Indira Gandhi International Airport terminal flooded during July 2026 rains",
      location: "IGI Airport, New Delhi",
      date: "23 July 2026",
    },
    totalScore: 31,
    statusBand: "FALSE",
    summary:
      "The image is an undated photograph of airport-adjacent waterlogging that has circulated since at least 2022. Delhi's 2026 monsoon rains caused localized waterlogging in some city areas, but no credible report shows flooding inside IGI Airport terminals on the claimed date.",
    modules: {
      metadata: {
        score: 5,
        max: 15,
        summary: "No capture metadata survives. The image predates the claim based on earliest known circulation.",
        items: [
          { label: "File type", value: "JPEG · 1.9 MB", tone: "neutral" },
          { label: "First seen online", value: "September 2022", tone: "bad" },
          { label: "EXIF", value: "Stripped", tone: "warn" },
        ],
        redFlags: ["Earliest circulation predates claimed date by 4 years"],
      },
      vision: {
        score: 8,
        max: 25,
        summary: "Image shows a terminal-like interior with standing water. No date-verifying cues are visible.",
        items: [
          { label: "Scene", value: "Airport concourse with standing water", tone: "neutral" },
          { label: "Verifiable cues", value: "No readable signage or screens", tone: "warn" },
          { label: "Consistency", value: "Matches known 2022 flooding photos", tone: "bad" },
        ],
        redFlags: ["Layout matches archived 2022 photographs"],
      },
      weather: {
        score: 12,
        max: 25,
        summary: "Delhi did receive heavy rain on 22–23 July 2026, but not of a volume that flooded airport terminals.",
        items: [
          { label: "Rainfall 23 Jul", value: "61 mm in 24 hours", tone: "neutral" },
          { label: "City waterlogging", value: "Reported in several colonies", tone: "warn" },
          { label: "Airport ops", value: "Operations normal, no closure", tone: "bad" },
        ],
        redFlags: ["Rainfall was notable but not terminal-flooding intensity"],
      },
      evidence: {
        score: 6,
        max: 35,
        summary: "No source corroborates terminal flooding. Official statements and news coverage from the date contradict it.",
        items: [
          { label: "Independent sources", value: "0 corroborate · 2 contradict", tone: "bad" },
          { label: "Official statement", value: "DIAL denies any terminal flooding", tone: "bad" },
          { label: "Archival match", value: "Image published in 2022 reports", tone: "bad" },
        ],
        redFlags: ["Same photo used in viral posts in 2022, 2023 and 2024"],
      },
    },
    sources: [
      {
        id: "s1",
        name: "Delhi International Airport (DIAL)",
        domain: "newdelhiairport.in",
        headline: "Operations normal; no flooding inside terminals",
        publishedAt: "2026-07-23T14:00:00Z",
        label: "Contradicting",
        snippet: "All runways operational. Standing water was reported only in access roads outside the terminal.",
        url: "https://www.newdelhiairport.in/press/operations-normal-23-july-2026",
      },
      {
        id: "s2",
        name: "Indian Express (archive)",
        domain: "indianexpress.com",
        headline: "Waterlogging inside IGI terminal after 2022 downpour — photo",
        publishedAt: "2022-09-14T09:00:00Z",
        label: "Contradicting",
        snippet: "The circulating photograph matches this 2022 report of water entering a terminal building.",
        url: "https://indianexpress.com/article/cities/delhi/igi-terminal-waterlogging-2022",
      },
    ],
    timeline: [
      { at: "2022-09-14T09:00:00Z", label: "Photo first published", detail: "Indian Express report on 2022 terminal waterlogging" },
      { at: "2026-07-23T10:00:00Z", label: "Old photo recirculated", detail: "Shared as 'current' during Delhi rains" },
      { at: "2026-07-23T14:00:00Z", label: "DIAL issues statement", detail: "Denies terminal flooding, confirms normal ops" },
      { at: "2026-07-23T17:00:00Z", label: "Report generated", detail: "Trust engine completes analysis" },
    ],
    limitations: [
      { title: "Reverse-image coverage", detail: "Reverse search indexed a limited set of archives; earlier usage may exist." },
      { title: "City-wide flooding", detail: "Visstya cannot rule out waterlogging near, but outside, the terminal." },
      { title: "Not a judgment of truth", detail: "Rates evidence support; the photo is real but not from the claimed event." },
    ],
    createdAt: "2026-07-23T17:00:00Z",
  },
  {
    id: 1005,
    shareToken: "seed-darjeeling-snow",
    media: { url: img("darjeeling-snow", 1400, 900), kind: "image", fileName: "DBZ_snow.jpg", mime: "image/jpeg" },
    claim: {
      event: "Snowfall in Darjeeling town in late March 2026",
      location: "Darjeeling, West Bengal",
      date: "28 March 2026",
    },
    totalScore: 63,
    statusBand: "AVERAGE",
    summary:
      "Weather records confirm an unusual cold spell with light snowfall on the ridges above Darjeeling in late March 2026. However, the specific photograph circulating appears to show an older, heavier snowfall event and is likely misattributed. The claim is broadly consistent with the regional weather, but the attached media does not fully match.",
    modules: {
      metadata: {
        score: 8,
        max: 15,
        summary: "Metadata is present but capture time does not align with the claimed snowfall window.",
        items: [
          { label: "Capture time", value: "2023-01-17 · 09:10 IST", tone: "bad" },
          { label: "Camera", value: "Nikon D5600", tone: "neutral" },
          { label: "GPS", value: "27.04° N, 88.26° E — Darjeeling", tone: "good" },
        ],
        redFlags: ["EXIF date is 2023, not 2026"],
      },
      vision: {
        score: 15,
        max: 25,
        summary: "Snow depth in the image is heavy and consistent with a January event, not the thin dusting recorded in March 2026.",
        items: [
          { label: "Scene", value: "Hill town under heavy snow", tone: "neutral" },
          { label: "Snow depth", value: "20–30 cm visible", tone: "warn" },
          { label: "Vegetation", value: "Wintry, consistent with January", tone: "warn" },
        ],
        redFlags: ["Imagery shows a heavier snowfall than March 2026 records"],
      },
      weather: {
        score: 21,
        max: 25,
        summary: "IMD recorded light snow (trace) on upper ridges on 28 March 2026; town temperatures dipped to 2.1°C.",
        items: [
          { label: "Town snowfall", value: "Trace on upper ridges only", tone: "warn" },
          { label: "Min temp 28 Mar", value: "2.1°C at Observatory Hill", tone: "good" },
          { label: "Cold spell", value: "Unusual for late March", tone: "good" },
        ],
        redFlags: ["Snowfall amount was negligible in town"],
      },
      evidence: {
        score: 19,
        max: 35,
        summary: "Two local reports confirm the cold spell and ridge snow; none show a heavy town snowfall matching the image.",
        items: [
          { label: "Independent sources", value: "2 corroborate · 1 contradicts image", tone: "warn" },
          { label: "Local reporting", value: "Ridge snow confirmed, town clear", tone: "warn" },
          { label: "Image match", value: "Fails to match any 2026 report", tone: "bad" },
        ],
        redFlags: ["Text of claim is plausible; attached media is not from the event"],
      },
    },
    sources: [
      {
        id: "s1",
        name: "India Meteorological Department",
        domain: "mausam.imd.gov.in",
        headline: "Trace snowfall over upper ridges of Darjeeling, 28 March 2026",
        publishedAt: "2026-03-28T12:30:00Z",
        label: "Supporting",
        snippet: "Snowfall reported on high ridges; town experienced light rain with minimum temperature 2.1°C.",
        url: "https://mausam.imd.gov.in/responsive/wb-bulletin-2026-03-28",
      },
      {
        id: "s2",
        name: "The Telegraph (Kolkata)",
        domain: "telegraphindia.com",
        headline: "Unseasonal cold spell dusts Darjeeling ridges with snow",
        publishedAt: "2026-03-28T16:00:00Z",
        label: "Supporting",
        snippet: "Residents woke to a thin layer of snow on upper slopes, an unusually late event for late March.",
        url: "https://www.telegraphindia.com/darjeeling-snow-march-2026",
      },
      {
        id: "s3",
        name: "Darjeeling Chronicle",
        domain: "darjeelingchronicle.in",
        headline: "Viral 'heavy snowfall' photo is from 2023, say locals",
        publishedAt: "2026-03-29T08:00:00Z",
        label: "Contradicting",
        snippet: "Residents identified the circulating photo as a January 2023 snowfall, not the light dusting of 28 March.",
        url: "https://www.darjeelingchronicle.in/viral-snowfall-photo-2023",
      },
    ],
    timeline: [
      { at: "2023-01-17T09:10:00Z", label: "Photo captured", detail: "EXIF indicates capture during Jan 2023 snowfall" },
      { at: "2026-03-28T07:00:00Z", label: "Light snow on ridges", detail: "IMD records trace snowfall, 2.1°C minimum" },
      { at: "2026-03-28T11:00:00Z", label: "Old photo recirculated", detail: "Shared as 'heavy snowfall in Darjeeling'" },
      { at: "2026-03-29T08:00:00Z", label: "Local correction", detail: "Darjeeling Chronicle identifies 2023 photo" },
      { at: "2026-03-29T11:00:00Z", label: "Report generated", detail: "Trust engine completes analysis" },
    ],
    limitations: [
      { title: "Partial corroboration", detail: "The claim's core (ridge snow) is supported; the media is not from the event." },
      { title: "Local identification", detail: "Photo attribution relied partly on community identification." },
      { title: "Not a judgment of truth", detail: "Rates evidence support; verdict is mixed by design." },
    ],
    createdAt: "2026-03-29T11:00:00Z",
  },
  {
    id: 1006,
    shareToken: "seed-bengaluru-protest",
    media: { url: VID, kind: "video", fileName: "blr_protest.mp4", mime: "video/mp4" },
    claim: {
      event: "Large-scale protests broke out on Bengaluru's MG Road in August 2026",
      location: "MG Road, Bengaluru",
      date: "3 August 2026",
    },
    totalScore: 57,
    statusBand: "AVERAGE",
    summary:
      "A small demonstration did take place on MG Road on 3 August 2026, but the circulating video shows a larger gathering that local news reports date to 2025. The claim is partially supported: an event occurred, but the scale implied by the video is not.",
    modules: {
      metadata: {
        score: 9,
        max: 15,
        summary: "Video metadata stripped during forwarding. Earliest circulating copy predates the claimed date.",
        items: [
          { label: "File type", value: "MP4 · H.264 · 1080p", tone: "neutral" },
          { label: "First seen online", value: "July 2025", tone: "warn" },
          { label: "EXIF", value: "Stripped", tone: "warn" },
        ],
        redFlags: ["Earliest copy predates claim by a year"],
      },
      vision: {
        score: 16,
        max: 25,
        summary: "The crowd size in the video is significantly larger than any reported gathering on the claimed date.",
        items: [
          { label: "Crowd estimate", value: "~2,000–3,000 visible", tone: "warn" },
          { label: "Location cues", value: "MG Road signage visible", tone: "neutral" },
          { label: "Signage text", value: "Unreadable at available resolution", tone: "warn" },
        ],
        redFlags: ["Crowd size exceeds reported turnout"],
      },
      weather: {
        score: 15,
        max: 25,
        summary: "Weather consistent between dates and does not help date the video.",
        items: [
          { label: "Conditions 3 Aug 2026", value: "Partly cloudy, 27°C", tone: "neutral" },
          { label: "Conditions Jul 2025", value: "Comparable", tone: "neutral" },
        ],
        redFlags: ["Weather provides no dating signal"],
      },
      evidence: {
        score: 17,
        max: 35,
        summary: "One source confirms a small demonstration; two indicate the video shows an older, larger event.",
        items: [
          { label: "Independent sources", value: "1 corroborates · 2 contradict video", tone: "warn" },
          { label: "Local reporting", value: "Small gathering (≈200) on 3 Aug", tone: "warn" },
          { label: "Video match", value: "Matches July 2025 footage", tone: "bad" },
        ],
        redFlags: ["Scale mismatch between claim and evidence"],
      },
    },
    sources: [
      {
        id: "s1",
        name: "The Hindu (Bengaluru)",
        domain: "thehindu.com",
        headline: "Small demonstration held on MG Road; traffic diverted briefly",
        publishedAt: "2026-08-03T15:00:00Z",
        label: "Supporting",
        snippet: "Around 200 demonstrators gathered on MG Road for two hours. Police diverted traffic as a precaution.",
        url: "https://www.thehindu.com/news/cities/bengaluru/mg-road-demonstration-aug-2026",
      },
      {
        id: "s2",
        name: "Times of India (archive)",
        domain: "timesofindia.indiatimes.com",
        headline: "Thousands rally on MG Road over reservation row — July 2025",
        publishedAt: "2025-07-19T12:00:00Z",
        label: "Contradicting",
        snippet: "Footage from the July 2025 rally matches the circulating video, including banners and vantage point.",
        url: "https://timesofindia.indiatimes.com/city/bengaluru/rally-mg-road-july-2025",
      },
      {
        id: "s3",
        name: "Bangalore Mirror",
        domain: "bangaloremirror.com",
        headline: "Old rally video shared as fresh Bengaluru protest",
        publishedAt: "2026-08-04T09:00:00Z",
        label: "Contradicting",
        snippet: "The viral video is from a July 2025 rally, not the small protest held this week.",
        url: "https://bangaloremirror.com/old-rally-video-aug-2026",
      },
    ],
    timeline: [
      { at: "2025-07-19T12:00:00Z", label: "Rally footage captured", detail: "Video matches July 2025 MG Road rally" },
      { at: "2026-08-03T10:00:00Z", label: "Small protest held", detail: "≈200 demonstrators, MG Road" },
      { at: "2026-08-03T16:00:00Z", label: "Old video recirculated", detail: "Shared as 'large protest today'" },
      { at: "2026-08-04T09:00:00Z", label: "Correction published", detail: "Bangalore Mirror traces footage to 2025" },
      { at: "2026-08-04T12:00:00Z", label: "Report generated", detail: "Trust engine completes analysis" },
    ],
    limitations: [
      { title: "Crowd estimate", detail: "Crowd numbers are model estimates, not official counts." },
      { title: "Video provenance", detail: "Forwarded copy prevented byte-level tracing to the original uploader." },
      { title: "Not a judgment of truth", detail: "An event occurred; the video does not depict that event accurately." },
    ],
    createdAt: "2026-08-04T12:00:00Z",
  },
];

export function getSeedReport(id: number | string): VerificationReport | undefined {
  const num = Number(id);
  return SEED_REPORTS.find((r) => r.id === num);
}
