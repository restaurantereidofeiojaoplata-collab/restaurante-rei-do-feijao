import { describe, expect, it } from "vitest";
import { parseDatabaseEnv, redactConnectionString } from "./env.js";

describe("database environment", () => {
  it("parses Supabase and Render database settings", () => {
    const env = parseDatabaseEnv({
      DATABASE_URL:
        "postgresql://postgres.example:secret-password@aws-0-us-west-2.pooler.supabase.com:6543/postgres",
      DIRECT_DATABASE_URL:
        "postgresql://postgres:secret-password@db.example.supabase.co:5432/postgres",
      SUPABASE_DB_HOST: "db.example.supabase.co",
      SUPABASE_DIRECT_DB_HOST: "db.example.supabase.co",
      SUPABASE_POOLER_HOST: "aws-1-us-west-2.pooler.supabase.com",
      SUPABASE_PROJECT_REF: "example"
    });

    expect(env.SUPABASE_PROJECT_REF).toBe("example");
    expect(env.SUPABASE_DB_HOST).toBe("db.example.supabase.co");
    expect(env.SUPABASE_DIRECT_DB_HOST).toBe("db.example.supabase.co");
    expect(env.SUPABASE_POOLER_HOST).toBe(
      "aws-1-us-west-2.pooler.supabase.com"
    );
  });

  it("redacts passwords from connection strings before logging", () => {
    const redacted = redactConnectionString(
      "postgresql://postgres.example:secret-password@aws-0-us-west-2.pooler.supabase.com:6543/postgres"
    );

    expect(redacted).toContain("postgres.example:***@");
    expect(redacted).not.toContain("secret-password");
  });
});
