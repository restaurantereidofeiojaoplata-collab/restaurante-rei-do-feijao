# Supabase Database Setup

## Project detected

- Project name: Sistema REI DO FEIJAO
- Project ref: `pacxidxtaykctyqenbat`
- Region: `us-west-2`
- Direct database host: `db.pacxidxtaykctyqenbat.supabase.co`
- IPv4 pooler host: `aws-1-us-west-2.pooler.supabase.com`
- Postgres: `17`

The Supabase access token was used only to identify the project and confirm API key availability. Do not store the access token in the app environment.

## Required secrets

Fill these values in `.env.local` for local work and in Render dashboard for production:

- `DATABASE_URL`
- `DIRECT_DATABASE_URL`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `SESSION_SECRET`

Supabase's Drizzle guide recommends using the connection pooler and disabling prepared statements for transaction pool mode. The database client in `packages/database/src/client.ts` uses `prepare: false` for that reason.

The direct database host currently resolves only over IPv6 from this machine. For local development and Render, use the IPv4 pooler URL:

```text
postgresql://postgres.pacxidxtaykctyqenbat:<DB_PASSWORD>@aws-1-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require
```

Use the same URL for `DATABASE_URL` and `DIRECT_DATABASE_URL` until the transaction pooler is confirmed healthy for this project.

## Apply migrations

After the database password and connection strings are filled:

```powershell
pnpm db:migrate
```

The migration runner applies SQL files from `supabase/migrations` and tracks them in `public.app_migrations`.

## Apply initial seed

Set these local values before seeding:

```powershell
SEED_ADMIN_EMAIL=admin@reidofeijao.local
SEED_ADMIN_PASSWORD=<strong-password>
```

Then run:

```powershell
pnpm db:seed
```

The seed is idempotent. It creates or updates the first restaurant tenant, branch, permissions, admin role and admin user.

## Security model

The initial migration creates tenant-scoped tables and enables RLS on business tables. Runtime code must still filter explicitly by `restaurant_id`; RLS is a second line of defense.

For transaction-scoped tenant context, use:

```sql
set local app.restaurant_id = '<restaurant_uuid>';
```

Never set this as global connection state in a pooled connection.
