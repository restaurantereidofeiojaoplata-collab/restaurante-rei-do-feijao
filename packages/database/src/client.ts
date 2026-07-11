import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { parseDatabaseEnv } from "./env.js";
import * as schema from "./schema.js";

const env = parseDatabaseEnv();

export const queryClient = postgres(env.DATABASE_URL, {
  max: 10,
  prepare: false
});

export const db = drizzle(queryClient, { schema });

export async function closeDatabase(): Promise<void> {
  await queryClient.end();
}

