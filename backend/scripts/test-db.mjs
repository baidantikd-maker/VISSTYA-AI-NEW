import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, {
  prepare: false,
  max: 1,
  connect_timeout: 20,
});

try {
  const rows =
    await sql`select current_database() as db, current_user as "user"`;
  console.log("Connected OK:", rows[0]);
} catch (e) {
  console.error("Connection failed:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
