// One-off helper to run a .sql file against the project's Postgres database.
// Usage: PGHOST=... PGPASSWORD=... node scripts/apply-migration.mjs supabase/migrations/0001_init.sql
import { readFileSync } from "node:fs";
import { Client } from "pg";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/apply-migration.mjs <path-to-sql-file>");
  process.exit(1);
}

const sql = readFileSync(file, "utf8");

const client = new Client({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || "postgres",
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log(`Applied ${file} successfully.`);
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
