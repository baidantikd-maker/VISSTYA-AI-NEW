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

**Frontend note:** the client (`client/src/`) was originally built as a
100%-standalone app with a fake `mock/engine.ts` (`generateReport()`)
producing randomized reports, persisted via `mock/store.ts`
(`mockStore`, localStorage-backed, share tokens, subscribe/emit
pattern). We are **keeping `mockStore` as the real local report store**
— it's solid infra — and only replacing what feeds it: `generateReport()`
is swapped for a real backend call + adapter. Pages (`Verify.tsx`,
History/Dashboard via `useMockReports.ts`) don't need to change since
they only ever talked to `mockStore`, not to `engine.ts` directly.

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
- [x] **Frontend ↔ backend wiring (code written, not yet tested end-to-end):**
      - `client/src/lib/api.ts` — `verifyClaim()`, calls
        `${VITE_API_BASE_URL}/api/verify`, typed to match
        `DisplayResult` exactly
      - `client/src/lib/reportAdapter.ts` — `adaptVerifyResponse()`,
        converts backend `DisplayResult` → client's
        `VerificationReport` shape (band→status mapping,
        module findings→items, evidence sources→Source[], real
        limitations→Limitation[] with generic titles since backend
        only gives flat strings)
      - `client/src/pages/Processing.tsx` — rewritten: kicks off
        `verifyClaim()` immediately on mount (parallel to the visual
        step animation, not sequential), navigates to the report once
        both the animation and the real fetch are done, added an
        error state for network/backend failures (the mock version
        could never fail, so this is new)
      - `mockStore`, `Verify.tsx`, `useMockReports.ts` — untouched,
        no changes needed

- [x] **End-to-end test passed:** real upload → `POST /api/verify` (200) →
      real metadata/weather results, honest stub results for
      vision/evidence → adapted report rendered in the UI. First
      confirmed real (non-mock) verification.
      - Weather: live Open-Meteo result rendered correctly
      - Metadata: real values shown (actual MIME type of uploaded
        file, honest "EXIF not yet extracted")
      - Vision/Evidence: correctly showed "unscored" stub state,
        no fake data
      - Console noise investigated: `favicon.ico 404` (harmless,
        no favicon file yet); duplicate `/api/verify` calls
        (React 19 Strict Mode double-mounts components in dev only —
        not a production issue, not worth fixing now)
- [x] **Bug fix:** duplicate React key warning in the limitations list
      (`.map((lim) => <div key={lim.title}>`) — every real-backend
      limitation shared the same title, so keys collided. Fixed on
      the render side: `.map((lim, index) => <div key={index}>`,
      since the list is static and never reorders.
- [x] **Bug fix:** `PayloadTooLargeError` (413) on image upload —
      Express's default JSON body limit is 100kb, too small for a
      base64-encoded image. Fixed with
      `express.json({ limit: "25mb" })` in `server/index.ts`.
- [x] **Bug fix:** weather module resolved "Assam" (an Indian state)
      to an unrelated place in Mozambique due to Open-Meteo's fuzzy
      geocoding blindly trusting its first result. Fixed by scoring
      geocoding candidates (exact/prefix name match + population) and
      picking the best one, plus surfacing the actually-resolved
      location as its own "Location matched" finding (tone: `warn`
      + explicit caveat when confidence is low) so a bad match is
      visible in the report rather than silently baked into the
      score. **Known limitation:** ambiguous/large-region names still
      benefit from specifying "city, state, country" in the claim —
      confirmed working correctly with that pattern.
- [x] **Weather module: confirmed solid.** Live, tested, geocoding
      hardened. Considered done for now.

---

## Next up

- [ ] **Vision provider — Gemini (decided):** get API key from
      https://aistudio.google.com/apikey, add as `VISION_API_KEY` in
      `.env`, then wire the real call inside
      `analyzeWithVisionProvider()` in `vision.ts`
- [ ] **Evidence provider — Tavily (decided):** get API key from
      https://tavily.com dashboard, add as `EVIDENCE_API_KEY` in
      `.env`, then wire the real call inside
      `fetchEvidenceSources()` in `evidence.ts`. Chosen over Google
      Custom Search (needs a separate CSE ID, 100/day free) and
      Serper.dev (no real free tier) — Tavily's response shape
      (title/url/snippet/publishedAt) maps almost directly onto the
      existing `EvidenceSource` interface.
- [ ] **Future work (not now): reverse image search.** Clarified
      during planning — the evidence module cross-checks the
      *claimed event* via text search (Tavily); it does NOT check
      whether the *uploaded image itself* has appeared online before
      (e.g. old/unrelated-event photo being recirculated as new).
      That needs a genuinely different capability — Google Cloud
      Vision's Web Detection or TinEye's API — and would likely
      become its own module or extend `vision.ts`. Deliberately
      deferred to avoid scope creep while wiring the first two
      providers.
- [ ] **Deploy backend to Render** — connect repo, build command
      `npm install`, start command `npm run server`, set
      `ALLOWED_ORIGIN` to the exact Vercel production domain
      (exact match required — `credentials: true` breaks with wildcards)
- [ ] **Set `VITE_API_BASE_URL`** in Vercel's production env vars once
      the Render service URL is known
- [ ] **Auth/persistence direction** — `skills-lock.json` has Supabase
      skills installed; decide whether Supabase (Postgres + real
      server-verified auth) is the actual plan before building
      anything custom — currently unresolved
- [ ] **Rate limiting** on `/api/verify` — needed before provider
      calls cost real money per request
- [ ] **EXIF extraction** — `metadata.ts` currently reports EXIF as
      "not yet extracted"; add a real EXIF parser for uploaded images
- [ ] Basic tests for `scoring.ts` (pure function, easy to unit test
      first) before adding provider complexity
- [ ] (low priority) add a real favicon to `client/public/`

---

## Notes / decisions log

- Keeping fake/mocked module data out entirely — every module
  explicitly reports "not yet analyzed" / "not retrieved" instead of
  inventing findings. Keep this discipline when providers are added:
  provider failures should degrade to the same "missing" state, never
  fabricate a result.
- Server and client now have separate tsconfigs on purpose — don't
  merge them back, since they need different module resolution modes.
- **Dev workflow:** `npm run server` and `npm run dev` must run in
  **two separate terminals simultaneously** — both are long-running
  foreground processes. Running them one after another in the same
  terminal stops the first one. On Windows, `tsx` processes can
  sometimes survive `Ctrl+C`; if `ERR_CONNECTION_REFUSED` or a stale
  413 shows up after a restart, check
  `Get-NetTCPConnection -LocalPort 5000` for a leftover process before
  assuming it's a code bug.