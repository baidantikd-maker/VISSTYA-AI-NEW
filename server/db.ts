import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser,
  users,
  verificationReports,
  VerificationReport,
  InsertVerificationReport,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

type Db = ReturnType<typeof drizzle>;

let _client: ReturnType<typeof postgres> | null = null;
let _db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (_db) return _db;

  if (!ENV.databaseUrl) {
    throw new Error(
      "DATABASE_URL is required. Use your Supabase Postgres connection string (Project Settings → Database)."
    );
  }

  _client = postgres(ENV.databaseUrl, {
    prepare: false, // required for Supabase transaction pooler
    max: 10,
  });
  _db = drizzle(_client);
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 1) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createVerificationReport(
  report: InsertVerificationReport
): Promise<VerificationReport> {
  const db = await getDb();
  const created = await db
    .insert(verificationReports)
    .values(report)
    .returning();
  if (!created[0]) throw new Error("Failed to create verification report");
  return created[0];
}

export async function getVerificationReportById(
  id: number
): Promise<VerificationReport | undefined> {
  const db = await getDb();
  const result = await db
    .select()
    .from(verificationReports)
    .where(eq(verificationReports.id, id))
    .limit(1);
  return result[0];
}

export async function getVerificationReportByShareToken(
  shareToken: string
): Promise<VerificationReport | undefined> {
  const db = await getDb();
  const result = await db
    .select()
    .from(verificationReports)
    .where(eq(verificationReports.shareToken, shareToken))
    .limit(1);
  return result[0];
}

export async function getUserVerificationReports(
  userId: number,
  limit = 50
): Promise<VerificationReport[]> {
  const db = await getDb();
  return await db
    .select()
    .from(verificationReports)
    .where(eq(verificationReports.userId, userId))
    .orderBy(desc(verificationReports.createdAt))
    .limit(limit);
}

export async function updateVerificationReport(
  id: number,
  updates: Partial<VerificationReport>
): Promise<VerificationReport | undefined> {
  const db = await getDb();
  await db
    .update(verificationReports)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(verificationReports.id, id));
  return await getVerificationReportById(id);
}
