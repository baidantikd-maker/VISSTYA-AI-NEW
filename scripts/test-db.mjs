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

  const protections = await sql`
    select c.relname as table_name, c.relrowsecurity as rls_enabled
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('users', 'verification_reports')
    order by c.relname
  `;

  if (protections.length !== 2 || protections.some(row => !row.rls_enabled)) {
    throw new Error(
      "Expected RLS to be enabled on public.users and public.verification_reports"
    );
  }

  console.log("RLS verified:", protections.map(row => row.table_name).join(", "));

  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "media";
  const buckets = await sql`
    select id, public, file_size_limit
    from storage.buckets
    where id = ${bucketName}
  `;
  if (!buckets[0]) {
    throw new Error(`Storage bucket "${bucketName}" is missing`);
  }
  console.log("Storage verified:", buckets[0]);
} catch (e) {
  console.error("Connection failed:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
