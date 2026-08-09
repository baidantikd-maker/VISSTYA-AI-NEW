import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { ENV } from "./env";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

/**
 * Fixed identity used in guest mode, where no OAuth server or database is
 * available. Every request is authenticated as this user.
 */
export const GUEST_USER: User = {
  id: 1,
  openId: "guest-mode",
  name: "Guest Mode",
  email: null,
  loginMethod: "demo",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    if (ENV.isDemoMode) {
      // Authentication is optional for public procedures; in guest mode we
      // sign every request in as the guest instead.
      user = GUEST_USER;
    } else {
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
