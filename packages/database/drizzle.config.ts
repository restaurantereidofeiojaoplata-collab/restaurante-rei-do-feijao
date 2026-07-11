import { defineConfig } from "drizzle-kit";
import { loadDatabaseEnvFiles } from "./src/env.js";

loadDatabaseEnvFiles();

const databaseUrl = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or DIRECT_DATABASE_URL is required.");
}

export default defineConfig({
  dbCredentials: {
    url: databaseUrl
  },
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./src/schema.ts"
});
