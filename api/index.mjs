// Vercel serverless entry (ESM forced via .mjs extension).
// Imports the bundled Express app from dist/index.js (also ESM) and forwards
// every incoming (req, res). All URL paths (via vercel.json rewrites) hit this.

import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

// Helpers that work in both ESM (current file) AND when downstream CJS modules
// (e.g. auto-transpiled deps) do weird things with paths.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Resolve the bundled server app from dist/index.js. Because Vercel deploys
// api/index.mjs next to (a copy of) the repo root, the relative path
// `../dist/index.js` lands on the esbuild output produced by `pnpm build`.
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(PROJECT_ROOT, "dist");
const SERVER_BUNDLE = path.join(DIST_DIR, "index.js");
const PUBLIC_DIR = path.join(DIST_DIR, "public");

function diagnosticsHtml(title, bodyHtml) {
  return (
    `<!doctype html>` +
    `<html lang="en"><head><meta charset="utf-8" />` +
    `<meta name="viewport" content="width=device-width,initial-scale=1" />` +
    `<title>${title} | Visstya AI</title>` +
    `<style>` +
    `body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;` +
    `max-width:46rem;margin:2.5rem auto;padding:0 1.1rem;line-height:1.55;color:#111827}` +
    `code,pre{background:#f3f4f6;border-radius:.35rem}` +
    `code{padding:.12rem .35rem}` +
    `pre{padding:.8rem 1rem;overflow:auto;white-space:pre-wrap;word-break:break-word}` +
    `li{margin:.25rem 0}` +
    `h1{font-size:1.4rem;margin-bottom:.25rem}` +
    `h2{font-size:1.05rem;margin-top:1.4rem}` +
    `.hint{color:#374151;font-size:.92rem}` +
    `</style></head><body>` +
    bodyHtml +
    `</body></html>`
  );
}

// ---- app singleton -----------------------------------------------------------------
let appSingleton = null;
let appLoadError = null;

async function loadAppOnce() {
  if (appSingleton) return appSingleton;
  if (appLoadError) throw appLoadError;

  try {
    // Pre-flight: verify the build artifacts exist so we can produce a clear
    // error instead of a cryptic ERR_MODULE_NOT_FOUND in Vercel logs.
    const checks = [
      ["Server bundle (dist/index.js)", SERVER_BUNDLE],
      ["Client dist folder (dist/public/)", PUBLIC_DIR],
      ["Client index.html (dist/public/index.html)", path.join(PUBLIC_DIR, "index.html")],
    ];
    const missing = checks.filter(([, p]) => !fs.existsSync(p));
    if (missing.length) {
      const rows = checks
        .map(([label, p]) => {
          const ok = fs.existsSync(p);
          return `<li><code>${ok ? "✅" : "❌"} ${label}</code><br/><span class="hint"><code>${p}</code></span></li>`;
        })
        .join("");
      throw new Error(
        `Build artifacts missing. ` +
          `If the pnpm build step failed in Vercel, check the Build tab of the deploy. ` +
          `Missing: ${missing.map(([l]) => l).join(", ")}` +
          `\n__DETAIL__${rows}`
      );
    }

    // Dynamic import works because:
    //   - we're a .mjs file (native ESM)
    //   - package.json declares `"type": "module"`
    //   - esbuild produced ESM (--format=esm)
    const mod = await import(pathToFileURL(SERVER_BUNDLE).toString());
    if (typeof mod.createApp !== "function") {
      throw new Error(
        `dist/index.js did not export a \`createApp\` function. ` +
          `Got exports: ${Object.keys(mod).join(", ") || "(none)"}`
      );
    }

    // createApp() calls serveStatic() in non-dev mode; it returns { app, server }.
    const { app } = await mod.createApp();
    appSingleton = app;
    return appSingleton;
  } catch (err) {
    appLoadError = err;
    throw err;
  }
}

// ---- HTTP handler -------------------------------------------------------------------
export default async function handler(req, res) {
  let app;
  try {
    app = await loadAppOnce();
  } catch (err) {
    const stack = String(err?.stack || err || "unknown error");
    console.error("[Vercel Entry] createApp failed:", stack);

    // If the error's message embeds our HTML rows, render them.
    let extraChecks = "";
    let msg = stack;
    const pivot = stack.indexOf("__DETAIL__");
    if (pivot !== -1) {
      msg = stack.slice(0, pivot);
      extraChecks = `<h2>Build artifact checks</h2><ul>${stack.slice(pivot + "__DETAIL__".length)}</ul>`;
    }

    const body =
      `<h1>Visstya AI – server failed to start</h1>` +
      `<p class="hint">Deployed on Vercel. The application code threw during cold start.</p>` +
      `<h2>Most likely causes</h2>` +
      `<ol>` +
      `<li><strong>Build step</strong>: did <code>pnpm build</code> succeed in Vercel's Build logs? ` +
      `Look for <code>vite build</code> and <code>esbuild</code> errors.</li>` +
      `<li><strong>Environment variables</strong>: under Project Settings → Environment Variables, set ` +
      `<code>SUPABASE_URL</code>, <code>SUPABASE_ANON_KEY</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code>, ` +
      `<code>DATABASE_URL</code>, <code>GEMINI_API_KEY</code>, <code>NEWS_API_KEY</code>, ` +
      `<code>JWT_SECRET</code>, <code>OAUTH_SERVER_URL</code>, <code>VITE_SUPABASE_URL</code>, ` +
      `<code>VITE_SUPABASE_ANON_KEY</code>, <code>SUPABASE_STORAGE_BUCKET</code> for the Preview environment.</li>` +
      `<li><strong>Wrong entry module</strong>: confirm the commit you deployed exports <code>createApp</code> from <code>server/_core/index.ts</code>.</li>` +
      `</ol>` +
      extraChecks +
      `<h2>Error</h2><pre>${msg.replace(/</g, "&lt;")}</pre>`;
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(diagnosticsHtml("Server failed to start", body));
    return;
  }

  // Hand off the full request/response lifecycle to Express. Express owns:
  //   - static serving (dist/public/**, including index.html)
  //   - /api/trpc, /api/auth/*, /storage/*, /manus-storage/*, OAuth callbacks
  app(req, res);
}

// Expose config via the standard Vercel export when present (harmless if ignored).
export const config = {
  // 60s max (matches maxDuration in vercel.json) so long Gemini calls complete.
  maxDuration: 60,
  supportsResponseStreaming: true,
};
