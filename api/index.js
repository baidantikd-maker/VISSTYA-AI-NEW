// Vercel serverless entry: imports the built Express app from dist/index.js
// and forwards (req, res) to it. All URL paths (via vercel.json rewrites) hit
// this function so Express controls routing, static serving, tRPC, OAuth, etc.

let appPromise;

async function getApp() {
  if (!appPromise) {
    // Lazy-import so cold starts don't re-create on every call.
    appPromise = import("../dist/index.js")
      .then((mod) => mod.createApp())
      .then(({ app }) => app);
  }
  return appPromise;
}

export default async function handler(req, res) {
  try {
    const app = await getApp();
    app(req, res);
  } catch (err) {
    console.error("[Vercel Entry] createApp failed:", err);
    res.status(500).type("html").send(
      `<h1>Server failed to start</h1>` +
        `<p><strong>Build & deploy verification checklist:</strong></p>` +
        `<ol>` +
        `<li>Did <code>pnpm build</code> complete before deploying? Check the Vercel build logs for an <code>esbuild</code> or <code>vite build</code> error.</li>` +
        `<li>Are all <code>dist/**</code> files present? (vite client build + esbuild server bundle)</li>` +
        `<li>Have you set the required env vars (<code>SUPABASE_URL</code>, <code>SUPABASE_ANON_KEY</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code>, <code>DATABASE_URL</code>, etc.) inside <em>Project Settings → Environment Variables</em> on Vercel?</li>` +
        `</ol>` +
        `<pre style="background:#f3f4f6;padding:12px;overflow:auto">${String(
          err?.stack || err
        ).replace(/</g, "&lt;")}</pre>`
    );
  }
}
