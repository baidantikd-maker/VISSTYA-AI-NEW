import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { getSupabaseAdmin } from "./supabase";

export type AuthenticatedUser = User & {
  taskUid?: string;
  isCron?: boolean;
};

function extractAccessToken(req: Request): string | null {
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = parseCookieHeader(cookieHeader);
    const fromCookie = cookies[COOKIE_NAME];
    if (typeof fromCookie === "string" && fromCookie.length > 0) {
      return fromCookie;
    }
  }

  const authHeader = req.headers.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }

  return null;
}

/**
 * Validate Supabase JWT and sync the app `users` row.
 */
export async function authenticateRequest(req: Request): Promise<AuthenticatedUser> {
  const accessToken = extractAccessToken(req);
  if (!accessToken) {
    throw new Error("Missing session");
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new Error(error?.message || "Invalid Supabase session");
  }

  const authUser = data.user;
  const openId = authUser.id;
  const email = authUser.email ?? null;
  const name =
    (typeof authUser.user_metadata?.full_name === "string"
      ? authUser.user_metadata.full_name
      : null) ||
    (typeof authUser.user_metadata?.name === "string"
      ? authUser.user_metadata.name
      : null) ||
    email;
  const provider =
    authUser.app_metadata?.provider ||
    authUser.app_metadata?.providers?.[0] ||
    "supabase";

  const signedInAt = new Date();
  await db.upsertUser({
    openId,
    email,
    name,
    loginMethod: String(provider),
    lastSignedIn: signedInAt,
  });

  const user = await db.getUserByOpenId(openId);
  if (!user) {
    throw new Error("Failed to sync authenticated user");
  }

  return user;
}
