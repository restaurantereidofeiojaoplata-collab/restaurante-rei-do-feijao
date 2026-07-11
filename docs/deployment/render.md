# Render Deployment Setup

## Blueprint

The root `render.yaml` defines two Node services:

- `rei-do-feijao-api`
- `rei-do-feijao-web`

The API service runs database migrations during `preDeployCommand`.

## Render environment variables

Set these secrets manually in Render because `render.yaml` marks them with `sync: false`:

- `DATABASE_URL`
- `DIRECT_DATABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `SESSION_SECRET`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Keep service-role and database credentials only on backend services. Do not expose them to the web service.

For this Supabase project, use the IPv4 pooler connection string in Render:

```text
postgresql://postgres.pacxidxtaykctyqenbat:<DB_PASSWORD>@aws-1-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require
```

Set both `DATABASE_URL` and `DIRECT_DATABASE_URL` to that value unless the Supabase dashboard later shows a healthy transaction-pooler URL for this project.

## Initial seed

Do not run the seed automatically on every Render deploy because it can rotate the initial admin password when `SEED_ADMIN_PASSWORD` changes.

For first production setup, run the seed once from a trusted local machine or a one-off Render shell with:

```bash
pnpm db:seed
```

Required seed variables:

- `SEED_RESTAURANT_NAME`
- `SEED_RESTAURANT_SLUG`
- `SEED_BRANCH_NAME`
- `SEED_BRANCH_SLUG`
- `SEED_ADMIN_NAME`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

## Build and start commands

API:

```bash
pnpm --filter @restaurante/api build
pnpm --filter @restaurante/database db:migrate
pnpm --filter @restaurante/api start
```

Web:

```bash
pnpm --filter @restaurante/web build
pnpm --filter @restaurante/web start
```
