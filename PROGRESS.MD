# Visstya AI — Development Progress & Final Status

A claim/misinformation verification app. Backend runs four independent analysis modules (metadata, vision, weather, evidence) whose results are combined by a scoring engine and turned into a human-readable report by a display layer.

## Architecture

POST /api/verify
   ↓
metadata.ts   → media provenance / EXIF-readiness signals   (max 15 pts)
vision.ts     → visual scene vs. claim consistency           (max 25 pts)
weather.ts    → historical weather for claimed location/date (max 25 pts)
evidence.ts   → independent supporting/contradicting sources (max 35 pts)
   ↓
scoring.ts    → combines module scores → trust band (HIGH/MEDIUM/LOW)
   ↓
display.ts    → builds the final human-readable report
   ↓
Response: { ok, report }


## Stack: React 19 + Vite 7 + TypeScript (client) · Express 5 + tsx (server) · Tailwind 4 + Radix UI (client) · Open-Meteo (weather module, live)

Frontend note: the client (client/src/) was originally built as a 100%-standalone app with a fake mock/engine.ts (generateReport()) producing randomized reports, persisted via mock/store.ts (mockStore, localStorage-backed, share tokens, subscribe/emit pattern). We are keeping mockStore as the real local report store — it's solid infra — and only replacing what feeds it: generateReport() is swapped for a real backend call + adapter. Pages (Verify.tsx, History/Dashboard via useMockReports.ts) don't need to change since they only ever talked to mockStore, not to engine.ts directly.

## Done

Backend skeleton: Express server, /api/health, /api/verify route

Four verification modules scaffolded with real logic where a provider isn't needed yet (metadata) and honest "not yet analyzed" states where one is (vision, evidence)

weather.ts fully wired to Open-Meteo (geocoding + historical archive) — this module is live and working end-to-end

scoring.ts — combines module scores into a 0–100 trust score and HIGH/MEDIUM/LOW band

display.ts — builds the final content-centric summary from module findings, not just the raw score

Bug fix: removed dead/conflicting inline app.post("/api/verify") handler in server/index.ts that was shadowed by verifyRouter

Bug fix: DisplayResult.keyFindings was declared as required but never returned by buildDisplayResult — now populated from collectImportantFindings(modules).slice(0, 4)

Tooling fix: split tsconfig.json into tsconfig.client.json (bundler resolution, for Vite) and tsconfig.server.json (NodeNext resolution, for tsx/Express) so npm run check actually type-checks the server — previously only client/src was included

Consistency fix: standardized all server-side relative imports to explicit .js extensions (required by NodeNext)

Backend confirmed running clean (npm run server, health check OK)

Confirmed via repo files: all above fixes (dead route, keyFindings, tsconfig split) are live in the actual codebase, not just planned

Deployment decision: frontend stays on Vercel (already configured via vercel.json); backend goes on Render (free tier, git-based deploy, no adapter needed for Express) — chosen over Railway/Fly.io for zero-cost start

server/env.ts added — central env var reader + logEnvStatus() startup logger; VISION_API_KEY / EVIDENCE_API_KEY / ALLOWED_ORIGIN now read from env instead of hardcoded

CORS origin now reads env.allowedOrigin (falls back to localhost:5173 in dev) instead of being hardcoded — required before a real Vercel domain can call the Render backend

vision.ts and evidence.ts provider stubs now follow the "missing key → stub mode, provider error → stub mode, never throw" pattern via fetchEvidenceSources() / analyzeWithVisionProvider() — safe to wire real keys into later without touching error-handling logic again

.env.example added at repo root

Frontend ↔ backend wiring (code written, not yet tested end-to-end): - client/src/lib/api.ts — verifyClaim(), calls ${VITE_API_BASE_URL}/api/verify, typed to match DisplayResult exactly - client/src/lib/reportAdapter.ts — adaptVerifyResponse(), converts backend DisplayResult → client's VerificationReport shape (band→status mapping, module findings→items, evidence sources→Source[], real limitations→Limitation[] with generic titles since backend only gives flat strings) - client/src/pages/Processing.tsx — rewritten: kicks off verifyClaim() immediately on mount (parallel to the visual step animation, not sequential), navigates to the report once both the animation and the real fetch are done, added an error state for network/backend failures (the mock version could never fail, so this is new) - mockStore, Verify.tsx, useMockReports.ts — untouched, no changes needed

End-to-end test passed: real upload → POST /api/verify (200) → real metadata/weather results, honest stub results for vision/evidence → adapted report rendered in the UI. First confirmed real (non-mock) verification. - Weather: live Open-Meteo result rendered correctly - Metadata: real values shown (actual MIME type of uploaded file, honest "EXIF not yet extracted") - Vision/Evidence: correctly showed "unscored" stub state, no fake data - Console noise investigated: favicon.ico 404 (harmless, no favicon file yet); duplicate /api/verify calls (React 19 Strict Mode double-mounts components in dev only — not a production issue, not worth fixing now)

Bug fix: duplicate React key warning in the limitations list (.map((lim) => <div key={lim.title}>) — every real-backend limitation shared the same title, so keys collided. Fixed on the render side: .map((lim, index) => <div key={index}>, since the list is static and never reorders.

Bug fix: PayloadTooLargeError (413) on image upload — Express's default JSON body limit is 100kb, too small for a base64-encoded image. Fixed with express.json({ limit: "25mb" }) in server/index.ts.

Bug fix: weather module resolved "Assam" (an Indian state) to an unrelated place in Mozambique due to Open-Meteo's fuzzy geocoding blindly trusting its first result. Fixed by scoring geocoding candidates (exact/prefix name match + population) and picking the best one, plus surfacing the actually-resolved location as its own "Location matched" finding (tone: warn + explicit caveat when confidence is low) so a bad match is visible in the report rather than silently baked into the score. Known limitation: ambiguous/large-region names still benefit from specifying "city, state, country" in the claim — confirmed working correctly with that pattern.

Weather module: confirmed solid. Live, tested, geocoding hardened. Considered done for now.

Vision provider — Gemini wired and confirmed working end-to-end. gemini-3.6-flash via generateContent, image + claim context, JSON-mode output validated against VisionObservation shape.

Evidence provider — Tavily wired and confirmed working end-to-end. Real test returned 6 real sources ("Independent sources: 6 retrieved"). Confirmed the intentional "all inconclusive" placeholder behaving as designed — now being upgraded to real classification (see below).

Enhancement: real evidence stance classification. evidence.ts now sends the claim + all Tavily source snippets to Gemini in one call (classifyStances()), gets back a real supporting/contradicting/inconclusive verdict per source instead of defaulting everything to inconclusive. Falls back to all-inconclusive on any failure (missing key, bad response shape, parse error) — never fabricates a stance it can't justify. Reuses VISION_API_KEY (Gemini) rather than needing a separate key, since this is a text-only classification call.

EXIF extraction. metadata.ts now uses exifreader (already a project dependency, previously only used client-side) to read real EXIF tags server-side from the uploaded image's data: URL — capture date, camera make/model, GPS coordinates, editing software. Missing/stripped EXIF (common for web-sourced/screenshotted images) still reports honestly as "None found" rather than failing. Adds +2 to the metadata score when real EXIF data is present.

## Final Status

Visstya AI is complete and deployed.

Backend deployed on Render

Frontend deployed on Vercel

Frontend ↔ backend production integration

Metadata / EXIF analysis

Gemini vision analysis

Historical weather verification via Open-Meteo

Tavily evidence retrieval

Gemini evidence stance classification

Supporting / contradicting / inconclusive source classification

Trust scoring and HIGH / MEDIUM / LOW classification

Human-readable verification reports

Verification history

Shareable reports

Production CORS configuration

Production environment configuration

End-to-end verification testing

Graceful provider-failure handling without fabricated findings

## Future Improvements

These are optional extensions beyond the completed core system:

Reverse image search — detect when uploaded media has appeared online before, independent of the claim's text

Real user accounts with server-verified authentication and persistent history

Rate limiting on the verification endpoint

Expanded evidence sources beyond web search (official government/NGO statement feeds, fact-checking databases)

Basic automated tests for scoring.ts

Real favicon for client/public/

## Notes / decisions log

Keeping fake/mocked module data out entirely — every module explicitly reports "not yet analyzed" / "not retrieved" instead of inventing findings. Keep this discipline when providers are added: provider failures should degrade to the same "missing" state, never fabricate a result.

Server and client now have separate tsconfigs on purpose — don't merge them back, since they need different module resolution modes.

Local dev workflow: npm run server and npm run dev must run in two separate terminals simultaneously — both are long-running foreground processes. Running them one after another in the same terminal stops the first one. On Windows, tsx processes can sometimes survive Ctrl+C; if ERR_CONNECTION_REFUSED or a stale 413 shows up after a restart, check Get-NetTCPConnection -LocalPort 5000 for a leftover process before assuming it's a code bug.