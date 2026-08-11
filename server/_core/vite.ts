import express, { type Express } from "express";
import fs from "fs";
import path from "path";

/**
 * Backend-only static serving.
 *
 * The Visstya backend is a standalone API service. In development the frontend
 * is served by its own Vite dev server (see the root `npm run dev:client` and
 * the `/api` proxy in the root vite.config.ts), so this backend never mounts
 * the Vite middleware.
 *
 * In production it optionally serves a pre-built client bundle (root `dist/`,
 * or `dist/public` next to this backend) so a single Node process can host
 * both the API and the SPA. When no client build exists, non-API routes fall
 * back to a JSON 404 and the backend keeps serving `/api`, `/storage`, etc.
 */
export function serveStatic(app: Express) {
  const candidates = [
    path.resolve(import.meta.dirname, "..", "..", "dist", "public"),
    path.resolve(import.meta.dirname, "..", "..", "..", "dist"),
    path.resolve(import.meta.dirname, "..", "..", "..", "client", "dist"),
    path.resolve(process.cwd(), "dist"),
    path.resolve(process.cwd(), "dist", "public"),
  ];
  const distPath = candidates.find(p => {
    try {
      return fs.existsSync(p) && fs.statSync(p).isDirectory();
    } catch {
      return false;
    }
  });

  if (!distPath) {
    console.warn(
      "[serveStatic] No client build found; serving API only. " +
        `Searched: ${candidates.join(", ")}.`
    );
    app.use("*", (_req, res) => {
      res.status(404).json({ error: "Not found", path: _req.originalUrl });
    });
    return;
  }

  console.log(`[serveStatic] Serving client from: ${distPath}`);
  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist (SPA routing)
  app.use("*", (_req, res) => {
    const indexHtml = path.resolve(distPath, "index.html");
    if (!fs.existsSync(indexHtml)) {
      res.status(404).json({ error: "Not found", path: _req.originalUrl });
      return;
    }
    res.sendFile(indexHtml);
  });
}
