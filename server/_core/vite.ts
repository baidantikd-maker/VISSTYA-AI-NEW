import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const candidates = [
    path.resolve(import.meta.dirname, "public"),
    path.resolve(import.meta.dirname, "..", "public"),
    path.resolve(import.meta.dirname, "../..", "dist", "public"),
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "public"),
  ];
  const distPath = candidates.find((p) => {
    try {
      return fs.existsSync(p) && fs.statSync(p).isDirectory();
    } catch {
      return false;
    }
  });

  if (!distPath) {
    const msg =
      `[serveStatic] Could not find the client build directory. ` +
      `Searched: ${candidates.join(", ")}. Make sure you ran the build step (vite build) ` +
      `so dist/public/index.html exists.`;
    console.error(msg);
    app.use("*", (_req, res) => {
      res
        .status(500)
        .type("html")
        .send(
          `<h1>Build not found</h1><pre>${msg.replace(/</g, "&lt;")}</pre>`
        );
    });
    return;
  }

  console.log(`[serveStatic] Serving client from: ${distPath}`);
  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist (SPA routing)
  app.use("*", (_req, res) => {
    const indexHtml = path.resolve(distPath, "index.html");
    if (!fs.existsSync(indexHtml)) {
      res.status(500).send(`index.html not found at ${indexHtml}`);
      return;
    }
    res.sendFile(indexHtml);
  });
}
