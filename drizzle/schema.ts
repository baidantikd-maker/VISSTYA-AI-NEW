import {
  pgTable,
  pgEnum,
  serial,
  text,
  timestamp,
  varchar,
  jsonb,
  numeric,
  integer,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const mediaTypeEnum = pgEnum("media_type", ["image", "video"]);
export const statusBandEnum = pgEnum("status_band", ["FALSE", "AVERAGE", "TRUSTABLE"]);
export const isPublicEnum = pgEnum("is_public", ["true", "false"]);

/**
 * App users synced from Supabase Auth (openId = auth.users.id).
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  /** Supabase Auth user UUID */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Verification reports stored in Supabase Postgres.
 */
export const verificationReports = pgTable("verification_reports", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  mediaType: mediaTypeEnum("mediaType").notNull(),
  claimEvent: text("claimEvent"),
  claimLocation: text("claimLocation"),
  claimDate: timestamp("claimDate", { withTimezone: true }),
  metadataScore: numeric("metadataScore", { precision: 5, scale: 2 }).default("0"),
  visionScore: numeric("visionScore", { precision: 5, scale: 2 }).default("0"),
  weatherScore: numeric("weatherScore", { precision: 5, scale: 2 }).default("0"),
  evidenceScore: numeric("evidenceScore", { precision: 5, scale: 2 }).default("0"),
  totalScore: numeric("totalScore", { precision: 5, scale: 2 }).default("0"),
  statusBand: statusBandEnum("statusBand").notNull(),
  metadataFindings: jsonb("metadataFindings"),
  visionFindings: jsonb("visionFindings"),
  weatherFindings: jsonb("weatherFindings"),
  evidenceFindings: jsonb("evidenceFindings"),
  summary: text("summary"),
  shareToken: varchar("shareToken", { length: 64 }).unique(),
  isPublic: isPublicEnum("isPublic").default("false").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type VerificationReport = typeof verificationReports.$inferSelect;
export type InsertVerificationReport = typeof verificationReports.$inferInsert;
