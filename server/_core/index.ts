import "dotenv/config";
import express, { type Express } from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { ENV, hasSupabaseConfig, isUnsetCredential } from "./env";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic } from "./vite";

/**
 * Dev-mode CORS so the standalone frontend (root `npm run dev:client`,
 * http://localhost:5173) can call this API cross-origin. Cookies are used for
 * auth, so the allowed origin is echoed back with credentials support.
 */
function registerDevCors(app: Express) {
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });
}

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
  // Dev-mode CORS must run before every route so cross-origin browser calls
  // from the standalone frontend (http://localhost:5173) get their headers.
  const isDev = (process.env.NODE_ENV ?? "").toLowerCase() === "development";
  if (isDev) {
    registerDevCors(app);
  }
  // The Supabase project URL and publishable/anon key are intentionally safe
  // for a browser. Serving them at runtime avoids coupling Vercel's build-time
  // VITE_* values to authentication configuration. Secret/service-role keys
  // are never returned from this endpoint.
  app.get("/api/config/supabase", (_req, res) => {
    if (!hasSupabaseConfig()) {
      res.status(503).json({
        error:
          "Supabase is not configured on the server. Set SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_PUBLISHABLE_KEY) in Vercel.",
      });
      return;
    }
    res.set("Cache-Control", "public, max-age=300, s-maxage=300");
    res.json({ url: ENV.supabaseUrl, anonKey: ENV.supabaseAnonKey });
  });
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
  // Development mode: serve the API only. The frontend runs on its own Vite
  // dev server (root `npm run dev:client`), which proxies /api, /storage and
  // /manus-storage to this backend. All other environments (production /
  // staging / Vercel serverless) serve a pre-built client bundle when present.
  if (!isDev) {
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
