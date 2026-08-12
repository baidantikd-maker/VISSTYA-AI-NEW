# Visstya AI — Progress & Roadmap

A claim/misinformation verification app. Backend runs four independent
analysis modules (metadata, vision, weather, evidence) whose results
are combined by a scoring engine and turned into a human-readable
report by a display layer.

---

## Architecture

```
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
```

Stack: React 19 + Vite 7 + TypeScript (client) · Express 5 + tsx (server)
· Tailwind 4 + Radix UI (client) · Open-Meteo (weather module, live)

---

## Done

- [x] Backend skeleton: Express server, `/api/health`, `/api/verify` route
- [x] Four verification modules scaffolded with real logic where a
      provider isn't needed yet (metadata) and honest "not yet
      analyzed" states where one is (vision, evidence)
- [x] `weather.ts` fully wired to Open-Meteo (geocoding + historical
      archive) — this module is live and working end-to-end
- [x] `scoring.ts` — combines module scores into a 0–100 trust score
      and HIGH/MEDIUM/LOW band
- [x] `display.ts` — builds the final content-centric summary from
      module findings, not just the raw score
- [x] **Bug fix:** removed dead/conflicting inline `app.post("/api/verify")`
      handler in `server/index.ts` that was shadowed by `verifyRouter`
- [x] **Bug fix:** `DisplayResult.keyFindings` was declared as required
      but never returned by `buildDisplayResult` — now populated from
      `collectImportantFindings(modules).slice(0, 4)`
- [x] **Tooling fix:** split `tsconfig.json` into `tsconfig.client.json`
      (bundler resolution, for Vite) and `tsconfig.server.json`
      (NodeNext resolution, for tsx/Express) so `npm run check`
      actually type-checks the server — previously only `client/src`
      was included
- [x] **Consistency fix:** standardized all server-side relative
      imports to explicit `.js` extensions (required by NodeNext)
- [x] Backend confirmed running clean (`npm run server`, health check OK)
- [x] Confirmed via repo files: all above fixes (dead route, keyFindings,
      tsconfig split) are live in the actual codebase, not just planned
- [x] **Deployment decision:** frontend stays on Vercel (already
      configured via `vercel.json`); backend goes on **Render**
      (free tier, git-based deploy, no adapter needed for Express) —
      chosen over Railway/Fly.io for zero-cost start
- [x] `server/env.ts` added — central env var reader + `logEnvStatus()`
      startup logger; `VISION_API_KEY` / `EVIDENCE_API_KEY` /
      `ALLOWED_ORIGIN` now read from env instead of hardcoded
- [x] CORS origin now reads `env.allowedOrigin` (falls back to
      localhost:5173 in dev) instead of being hardcoded — required
      before a real Vercel domain can call the Render backend
- [x] `vision.ts` and `evidence.ts` provider stubs now follow the
      "missing key → stub mode, provider error → stub mode, never
      throw" pattern via `fetchEvidenceSources()` /
      `analyzeWithVisionProvider()` — safe to wire real keys into
      later without touching error-handling logic again
- [x] `.env.example` added at repo root

---

## Next up

- [ ] **Client API base URL** — add `VITE_API_BASE_URL` env var,
      point frontend fetch calls at it instead of a relative
      `/api/verify` path (needed once frontend/backend are on
      different domains — Vercel + Render)
- [ ] **Deploy backend to Render** — connect repo, build command
      `npm install`, start command `npm run server`, set
      `ALLOWED_ORIGIN` to the exact Vercel production domain
      (exact match required — `credentials: true` breaks with wildcards)
- [ ] **Vision provider** — connect a real vision model (e.g. Gemini)
      inside the now-scaffolded `analyzeWithVisionProvider()` in
      `vision.ts`
- [ ] **Evidence provider** — connect a real search/evidence API
      inside the now-scaffolded `fetchEvidenceSources()` in
      `evidence.ts`
- [ ] **Auth/persistence direction** — `skills-lock.json` has Supabase
      skills installed; decide whether Supabase (Postgres + real
      server-verified auth) is the actual plan before building
      anything custom — currently unresolved
- [ ] **Rate limiting** on `/api/verify` — needed before provider
      calls cost real money per request
- [ ] **Frontend ↔ backend integration** — wire the client UI to
      `POST /api/verify` and render `DisplayResult` (verdict,
      summary, keyFindings, per-module findings, limitations)
- [ ] **EXIF extraction** — `metadata.ts` currently reports EXIF as
      "not yet extracted"; add a real EXIF parser for uploaded images
- [ ] Basic tests for `scoring.ts` (pure function, easy to unit test
      first) before adding provider complexity

---

## Notes / decisions log

- Keeping fake/mocked module data out entirely — every module
  explicitly reports "not yet analyzed" / "not retrieved" instead of
  inventing findings. Keep this discipline when providers are added:
  provider failures should degrade to the same "missing" state, never
  fabricate a result.
- Server and client now have separate tsconfigs on purpose — don't
  merge them back, since they need different module resolution modes.