import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

const sqlPath = path.resolve("supabase/schema.sql");
const schema = fs.readFileSync(sqlPath, "utf8");

const sql = postgres(process.env.DATABASE_URL, {
  prepare: false,
  max: 1,
  connect_timeout: 20,
});

try {
  await sql.unsafe(schema);
  const tables = await sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
    order by table_name
  `;
  console.log(
    "Schema applied. Public tables:",
    tables.map(t => t.table_name)
  );
} catch (e) {
  console.error("Schema apply failed:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
