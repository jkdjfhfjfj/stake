/**
 * Production-safe migration runner for Render deploys.
 *
 * Problem: the database was bootstrapped via `drizzle-kit push`, which creates
 * tables directly without recording any migration history.  When we later switch
 * to `drizzle-kit migrate`, it tries to re-run migration 0000 and fails with
 * "relation already exists".
 *
 * Solution: before running the programmatic migrator we check whether the DB
 * already has the schema (users table exists).  If it does and the
 * __drizzle_migrations history table is empty, we stamp every existing
 * migration as already applied so the migrator skips them.  New migrations
 * added after the baseline will be applied normally.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "./migrations");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function tableExists(client: pg.PoolClient, tableName: string): Promise<boolean> {
  const { rows } = await client.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [tableName],
  );
  return rows[0].exists;
}

async function baseline(client: pg.PoolClient) {
  // Ensure the drizzle migrations table exists (migrate() creates it too, but
  // we need it before we can insert the baseline rows).
  await client.query(`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id        SERIAL PRIMARY KEY,
      hash      TEXT NOT NULL,
      created_at BIGINT
    )
  `);

  const { rows } = await client.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM "__drizzle_migrations"`,
  );
  if (Number(rows[0].count) > 0) {
    // Already has history — nothing to baseline.
    return;
  }

  // Read every SQL file listed in the journal and stamp it as already applied.
  const journal = JSON.parse(
    fs.readFileSync(path.join(MIGRATIONS_DIR, "meta/_journal.json"), "utf8"),
  ) as { entries: Array<{ tag: string; when: number }> };

  for (const entry of journal.entries) {
    const sqlPath = path.join(MIGRATIONS_DIR, `${entry.tag}.sql`);
    if (!fs.existsSync(sqlPath)) continue;

    const sql = fs.readFileSync(sqlPath, "utf8");
    // drizzle-orm/node-postgres/migrator hashes the raw SQL content with SHA256
    const hash = crypto.createHash("sha256").update(sql).digest("hex");

    await client.query(
      `INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [hash, entry.when],
    );
    console.log(`  Stamped as applied: ${entry.tag}`);
  }
}

async function main() {
  const client = await pool.connect();
  try {
    const alreadyBootstrapped = await tableExists(client, "users");

    if (alreadyBootstrapped) {
      console.log("==> Existing schema detected — baselining migration history...");
      await baseline(client);
    } else {
      console.log("==> Fresh database — will apply all migrations from scratch.");
    }
  } finally {
    client.release();
  }

  console.log("==> Running drizzle migrate...");
  await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  console.log("==> Migrations complete.");

  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
