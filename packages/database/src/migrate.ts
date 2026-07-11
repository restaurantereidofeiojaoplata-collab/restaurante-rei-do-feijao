import { readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { parseDatabaseEnv, redactConnectionString } from "./env.js";

const workspaceRoot = path.resolve(import.meta.dirname, "../../..");
const migrationsDirectory = path.join(workspaceRoot, "supabase", "migrations");

async function main(): Promise<void> {
  const env = parseDatabaseEnv();
  const connectionString = env.DIRECT_DATABASE_URL ?? env.DATABASE_URL;
  const sql = postgres(connectionString, {
    max: 1,
    prepare: false
  });

  console.log(`Running migrations against ${redactConnectionString(connectionString)}`);

  try {
    await sql`
      create table if not exists public.app_migrations (
        name text primary key,
        applied_at timestamptz not null default now()
      )
    `;

    const migrationFiles = readdirSync(migrationsDirectory)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of migrationFiles) {
      const alreadyApplied = await sql`
        select name from public.app_migrations where name = ${file} limit 1
      `;

      if (alreadyApplied.length > 0) {
        console.log(`Skipping ${file}`);
        continue;
      }

      const migrationSql = await readFile(
        path.join(migrationsDirectory, file),
        "utf8"
      );

      await sql.begin(async (transaction) => {
        await transaction.unsafe(migrationSql);
        await transaction`
          insert into public.app_migrations (name) values (${file})
        `;
      });

      console.log(`Applied ${file}`);
    }
  } finally {
    await sql.end();
  }
}

await main();

