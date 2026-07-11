import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_DATABASE_URL: z.string().min(1).optional(),
  SUPABASE_DB_HOST: z.string().min(1),
  SUPABASE_DIRECT_DB_HOST: z.string().min(1).optional(),
  SUPABASE_POOLER_HOST: z.string().min(1).optional(),
  SUPABASE_PROJECT_REF: z.string().min(1)
});

export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;

function findWorkspaceRoot(startDirectory = process.cwd()): string {
  let currentDirectory = path.resolve(startDirectory);

  while (true) {
    if (existsSync(path.join(currentDirectory, "pnpm-workspace.yaml"))) {
      return currentDirectory;
    }

    const parentDirectory = path.dirname(currentDirectory);

    if (parentDirectory === currentDirectory) {
      return path.resolve(startDirectory);
    }

    currentDirectory = parentDirectory;
  }
}

function parseEnvLine(line: string): [string, string] | null {
  const trimmedLine = line.trim();

  if (!trimmedLine || trimmedLine.startsWith("#")) {
    return null;
  }

  const separatorIndex = trimmedLine.indexOf("=");

  if (separatorIndex === -1) {
    return null;
  }

  const key = trimmedLine.slice(0, separatorIndex).trim();
  let value = trimmedLine.slice(separatorIndex + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return [key, value];
}

export function loadDatabaseEnvFiles(startDirectory = process.cwd()): void {
  const workspaceRoot = findWorkspaceRoot(startDirectory);

  for (const fileName of [".env.local", ".env"]) {
    const filePath = path.join(workspaceRoot, fileName);

    if (!existsSync(filePath)) {
      continue;
    }

    const lines = readFileSync(filePath, "utf8").split(/\r?\n/u);

    for (const line of lines) {
      const entry = parseEnvLine(line);

      if (!entry) {
        continue;
      }

      const [key, value] = entry;

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

export function parseDatabaseEnv(
  source: Record<string, string | undefined> = process.env
): DatabaseEnv {
  if (source === process.env) {
    loadDatabaseEnvFiles();
  }

  return databaseEnvSchema.parse(source);
}

export function redactConnectionString(connectionString: string): string {
  try {
    const url = new URL(connectionString);

    if (url.password) {
      url.password = "***";
    }

    return url.toString();
  } catch {
    return connectionString.replace(/:([^:@/]+)@/u, ":***@");
  }
}
