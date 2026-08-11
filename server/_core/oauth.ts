import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { hasSupabaseConfig } from "./env";
import { getSessionCookieOptions } from "./cookies";
import { getSupabaseAdmin } from "./supabase";
import * as db from "../db";

function supabaseSetupHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Supabase Auth not configured</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 42rem; margin: 3rem auto; padding: 0 1.25rem; line-height: 1.5; }
    code { background: #f3f4f6; padding: 0.15rem 0.35rem; border-radius: 0.25rem; }
    li { margin: 0.4rem 0; }
  </style>
</head>
<body>
  <h1>Supabase is not configured</h1>
  <p>Add these to <code>.env</code>:</p>
  <pre>SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=...
DATABASE_URL=postgresql://postgres:...@db.YOUR_PROJECT.supabase.co:5432/postgres</pre>
  <ol>
    <li>Authentication → Providers → enable <strong>Email</strong></li>
    <li>Run <code>supabase/schema.sql</code> in the SQL Editor</li>
    <li>Storage → create a public bucket named <code>media</code></li>
  </ol>
</body>
</html>`;
}

export function registerOAuthRoutes(app: Express) {
  // Persist access token from the browser into an httpOnly cookie
  app.post("/api/auth/session", async (req: Request, res: Response) => {
    try {
      if (!hasSupabaseConfig()) {
        res.status(503).json({ error: "Supabase is not configured" });
        return;
      }

      const accessToken =
        typeof req.body?.access_token === "string" ? req.body.access_token : "";
      const refreshToken =
        typeof req.body?.refresh_token === "string"
          ? req.body.refresh_token
          : "";

      if (!accessToken) {
        res.status(400).json({ error: "access_token is required" });
        return;
      }

      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.auth.getUser(accessToken);
      if (error || !data.user) {
        res.status(401).json({ error: "Invalid access token" });
        return;
      }

      const authUser = data.user;
      await db.upsertUser({
        openId: authUser.id,
        email: authUser.email ?? null,
        name:
          (typeof authUser.user_metadata?.full_name === "string"
            ? authUser.user_metadata.full_name
            : null) ||
          (typeof authUser.user_metadata?.name === "string"
            ? authUser.user_metadata.name
            : null) ||
          authUser.email ||
          null,
        loginMethod: String(
          authUser.app_metadata?.provider ||
            authUser.app_metadata?.providers?.[0] ||
            "email"
        ),
        lastSignedIn: new Date(),
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, accessToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      if (refreshToken) {
        res.cookie(`${COOKIE_NAME}_refresh`, refreshToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });
      } else {
        res.clearCookie(`${COOKIE_NAME}_refresh`, cookieOptions);
      }

      res.json({
        success: true,
        user: { id: authUser.id, email: authUser.email },
      });
    } catch (error) {
      console.error("[Auth] Session persist failed:", error);
      res.status(500).json({ error: "Failed to establish session" });
    }
  });

  app.delete("/api/auth/session", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.clearCookie(`${COOKIE_NAME}_refresh`, cookieOptions);
    res.status(204).end();
  });

  // Soft redirects for old Google OAuth bookmarks
  app.get("/api/auth/google", (_req: Request, res: Response) => {
    res.redirect(302, "/login");
  });
  app.get("/api/auth/google/callback", (_req: Request, res: Response) => {
    res.redirect(302, "/login");
  });
  app.get("/api/auth/callback", (_req: Request, res: Response) => {
    res.redirect(302, "/login");
  });
  app.get("/api/oauth/callback", (_req: Request, res: Response) => {
    res.redirect(302, "/login");
  });

  app.get("/api/auth/setup", (_req: Request, res: Response) => {
    if (!hasSupabaseConfig()) {
      res.status(503).type("html").send(supabaseSetupHtml());
      return;
    }
    res.redirect(302, "/login");
  });
}
