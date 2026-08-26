import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Pool } = pg;

const requiredVariables = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
}

const port = Number(process.env.DB_PORT);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("DB_PORT must be a valid TCP port");
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 1,
});

const migrationsDirectory = path.join(process.cwd(), "db", "migrations");
const lockName = "citenest_ems_schema_migrations";

function checksum(content) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query("SELECT pg_advisory_lock(hashtext($1))", [lockName]);

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        checksum CHAR(64) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const files = (await readdir(migrationsDirectory))
      .filter((file) => /^\d+_[a-z0-9_]+\.sql$/.test(file))
      .sort();

    for (const file of files) {
      const filePath = path.join(migrationsDirectory, file);
      const sql = await readFile(filePath, "utf8");
      const fileChecksum = checksum(sql);

      const existing = await client.query(
        `
          SELECT checksum
          FROM schema_migrations
          WHERE version = $1
        `,
        [file],
      );

      if (existing.rowCount === 1) {
        if (existing.rows[0].checksum !== fileChecksum) {
          throw new Error(`Applied migration was modified: ${file}`);
        }

        console.log(`Already applied: ${file}`);
        continue;
      }

      await client.query("BEGIN");

      try {
        await client.query(sql);
        await client.query(
          `
            INSERT INTO schema_migrations (version, checksum)
            VALUES ($1, $2)
          `,
          [file, fileChecksum],
        );
        await client.query("COMMIT");
        console.log(`Applied: ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock(hashtext($1))", [lockName]);
    } finally {
      client.release();
    }
  }
}

try {
  await migrate();
} catch (error) {
  console.error(
    "Migration failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}