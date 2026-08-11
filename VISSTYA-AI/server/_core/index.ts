import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { isUnsetCredential } from "./env";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

function validateRequiredEnv() {
  const missing: string[] = [];
  if (
    isUnsetCredential(
      process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ""
    )
  ) {
    missing.push("SUPABASE_URL");
  }
  if (
    isUnsetCredential(
      process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? ""
    )
  ) {
    missing.push("SUPABASE_ANON_KEY");
  }
  if (isUnsetCredential(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "")) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }
  if (!(process.env.DATABASE_URL ?? "").trim()) {
    missing.push("DATABASE_URL");
  }

  if (missing.length > 0) {
    console.warn(
      `[Env] Incomplete Supabase config: ${missing.join(", ")}. ` +
        `Copy values from Supabase → Project Settings → API / Database. ` +
        `Also run supabase/schema.sql and enable Email Auth.`
    );
  }
}

export async function createApp() {
  validateRequiredEnv();
  const app = express();
  const server = createServer(app);
  // Middleware to handle malformed URIs safely
  app.use((req, res, next) => {
    try {
      decodeURIComponent(req.path);
      next();
    } catch (e) {
      res.status(400).send("Bad Request: Malformed URI");
    }
  });
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite dev server middleware, all other
  // environments (production / staging / Vercel serverless default) serve
  // the pre-built client bundle from dist/public.
  const isDev = (process.env.NODE_ENV ?? "").toLowerCase() === "development";
  if (isDev) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  return { app, server };
}

async function startServer() {
  const { app: _app, server } = await createApp();
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

const isEntry =
  typeof process.argv[1] === "string" &&
  (process.argv[1] === import.meta.url?.slice(7) ||
    process.argv[1] === import.meta.filename ||
    process.argv[1].endsWith("/dist/index.js") ||
    process.argv[1].endsWith("\\dist\\index.js"));

if (isEntry) {
  startServer().catch(console.error);
}
