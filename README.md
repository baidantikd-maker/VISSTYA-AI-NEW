# Visstya AI

**AI-powered claim verification — check what you see before you believe it.**

🔗 Live app: [visstya-ai-new.vercel.app](https://visstya-ai-new.vercel.app)
🔗 Backend API: [visstya-ai.onrender.com](https://visstya-ai.onrender.com)

---

## Problem Statement

Misinformation spreads fastest through **media stripped of context** — a real photo from an old, unrelated event recirculated as breaking news; a claim about a disaster or incident with no independent reporting behind it; visuals that don't match the story being told around them.

Most people have no fast way to check any of this. Reverse-searching a photo, cross-referencing weather records, checking if a claim has independent news coverage, and inspecting an image's actual capture metadata are all things a skilled fact-checker *can* do — but they take time, tools, and expertise most people don't have in the moment they're deciding whether to believe or share something.

**Visstya AI exists to close that gap**: upload a piece of media, state the claim being made about it, and get a transparent, evidence-based trust assessment in under a minute.

---

## Our Solution

Visstya AI runs **four independent verification checks** on every submission and combines them into a single, explainable trust score — not a black-box "true/false" verdict, but a breakdown you can actually inspect and reason about yourself.

| Module | What it checks | Weight |
|---|---|---|
| **Metadata** | EXIF capture date, camera info, GPS — and whether the capture date actually matches the claimed date (catches recycled old media) | 15 pts |
| **Vision** | AI-driven visual analysis of the image against the claim — scene consistency, signs of digital manipulation, signs of AI generation | 25 pts |
| **Weather** | Real historical weather for the claimed location and date, cross-checked against what the claim describes | 25 pts |
| **Evidence** | Independent web sources related to the claimed event, each classified as supporting, contradicting, or inconclusive | 35 pts |

The four scores combine into a 0–100 trust score and a **HIGH / MEDIUM / LOW** trust band.

### Our core design principle: never fabricate confidence

Every module is built to report **what it doesn't know** as explicitly as what it does. If a provider is unavailable, if EXIF data was stripped, if evidence is genuinely mixed — the system says so plainly, rather than smoothing it into a falsely confident answer. A verification tool that fakes certainty is worse than one that's honestly uncertain.

---

## How It Works (Approach)

```
User uploads media + states a claim (event, location, date)
        ↓
┌───────────────────────────────────────────────────────┐
│  Four modules run in parallel:                        │
│                                                         │
│  Metadata  → EXIF extraction, capture-date vs.         │
│              claimed-date mismatch detection            │
│  Vision    → Gemini analyzes the image against          │
│              the claim (consistency, manipulation,       │
│              AI-generation indicators)                   │
│  Weather   → Open-Meteo historical weather for the      │
│              claimed location + date                     │
│  Evidence  → Tavily searches for independent coverage,  │
│              Gemini classifies each source's stance      │
│              (supporting / contradicting / inconclusive) │
└───────────────────────────────────────────────────────┘
        ↓
Scoring engine combines module scores → trust score + band
        ↓
Report generator builds a human-readable, evidence-first
summary — explaining WHAT the evidence shows, not just
displaying a number
        ↓
User sees: trust score, per-module breakdown, real sources,
weather data, EXIF findings, and explicit limitations
```

---

## Tech Stack

**Frontend**
- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4 + Radix UI
- Framer Motion (animations)
- Deployed on **Vercel**

**Backend**
- Express 5 + TypeScript, run via `tsx`
- Deployed on **Render**

**AI / External APIs**
- **Google Gemini** (`gemini-3.6-flash`) — visual claim-consistency analysis + evidence stance classification
- **Tavily Search API** — independent evidence/source retrieval
- **Open-Meteo** — historical weather geocoding + archive data (free, no key required)
- **exifreader** — real EXIF metadata extraction from uploaded images

---

## Key Features

- 📊 **Transparent 0–100 trust score** with a HIGH/MEDIUM/LOW verdict, broken down by module
- 🕵️ **Recycled-media detection** — flags when an image's real capture date doesn't match the claimed date
- 🌦️ **Historical weather cross-referencing** for any claimed location and date
- 📰 **Real evidence sources**, each independently classified as supporting, contradicting, or inconclusive — not just a list of search results
- 🖼️ **AI visual analysis** for manipulation and AI-generation indicators
- 📁 **Verification history**, stored locally per device
- 🔗 **Shareable reports** via unique link
- 🌗 Dark "cyber" and light minimalist themes

---

## Getting Started (Local Development)

```bash
# Install dependencies
npm install

# Environment variables (create a .env file at the repo root)
VISION_API_KEY=<your Gemini API key>
EVIDENCE_API_KEY=<your Tavily API key>
ALLOWED_ORIGIN=http://localhost:5173
PORT=5000
VITE_API_BASE_URL=http://localhost:5000

# Run the backend (separate terminal)
npm run server

# Run the frontend (separate terminal)
npm run dev
```

Both `npm run server` and `npm run dev` are long-running processes — run them in two separate terminal windows simultaneously.

---

## Architecture Notes

- **Frontend/backend split**: React frontend on Vercel talks to an independent Express API on Render via `VITE_API_BASE_URL` — chosen because Vercel's serverless model doesn't suit a long-running Express server well.
- **Graceful degradation**: every AI-provider call (Gemini, Tavily) is wrapped so a missing key, rate limit, or outage degrades to an honest "unavailable" state rather than crashing the request or fabricating a result.
- **Local-first history**: verification reports are stored client-side (no user database yet) — kept intentionally simple for this stage of the project.

---

## Future Work

- Reverse image search — detect when uploaded media has appeared online before, independent of the claim's text
- Real user accounts with server-verified authentication and persistent history
- Rate limiting on the verification endpoint
- Expanded evidence sources beyond web search (official government/NGO statement feeds, fact-checking databases)

---

## Team

RADIANS

-**MEMBERS**
ANUPAM MISHRA-BAIDANTIK DAS-DEBLINA DUTTA-RIYA BHARATI