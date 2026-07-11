# Seed Auth Permissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first operational backend foundation: initial tenant seed, admin login, signed session token and permission lookup.

**Architecture:** Database seed lives in `packages/database` because it owns schema and migrations. Runtime auth lives in `apps/api` and uses the database package through explicit services. Password hashing and token signing use Node built-ins to avoid adding security-critical dependencies before the project needs them.

**Tech Stack:** TypeScript, NestJS, Drizzle ORM, Postgres/Supabase, Vitest, Node `crypto`.

---

### Task 1: Seed Contract

**Files:**
- Create: `packages/database/src/seed-config.ts`
- Create: `packages/database/src/seed-config.test.ts`
- Create: `packages/database/src/seed.ts`
- Modify: `packages/database/package.json`
- Modify: `.env.example`

- [ ] Write a failing test that expects seed defaults for restaurant, branch, admin email and required permissions.
- [ ] Implement seed config parsing with safe defaults and env overrides.
- [ ] Implement idempotent seed script that upserts restaurant, branch, permissions, admin role, role permissions and admin user.
- [ ] Add `db:seed` scripts at package and root level.

### Task 2: Password Hashing

**Files:**
- Create: `apps/api/src/security/passwords.ts`
- Create: `apps/api/src/security/passwords.test.ts`

- [ ] Write a failing test proving a password hash verifies and wrong password fails.
- [ ] Implement `hashPassword` and `verifyPassword` with `crypto.scrypt`.
- [ ] Store hashes as versioned strings: `scrypt:v1:<salt>:<hash>`.

### Task 3: Session Tokens

**Files:**
- Create: `apps/api/src/auth/session-token.service.ts`
- Create: `apps/api/src/auth/session-token.service.test.ts`
- Modify: `.env.example`

- [ ] Write a failing test that signs and verifies a token with restaurant, user and permission claims.
- [ ] Implement HMAC SHA-256 JWT-compatible tokens with `JWT_SECRET`.
- [ ] Reject malformed, expired or tampered tokens.

### Task 4: Login API

**Files:**
- Create: `apps/api/src/auth/auth.service.ts`
- Create: `apps/api/src/auth/auth.controller.ts`
- Create: `apps/api/src/auth/auth.controller.test.ts`
- Create: `apps/api/src/auth/auth.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] Write a failing controller test for successful login response shape.
- [ ] Implement login validation with restaurant slug, email and password.
- [ ] Load user permissions through role assignments.
- [ ] Return access token and a safe user payload.

### Task 5: Permission Foundation

**Files:**
- Create: `apps/api/src/auth/current-session.ts`
- Create: `apps/api/src/auth/permissions.decorator.ts`
- Create: `apps/api/src/auth/session.guard.ts`
- Create: `apps/api/src/auth/session.guard.test.ts`

- [ ] Write a failing test proving the guard allows required permission and rejects missing permission.
- [ ] Implement Bearer token parsing and permission metadata.
- [ ] Attach verified session to request for future controllers.

### Task 6: Verification

**Files:**
- Modify: `docs/database/supabase.md`
- Modify: `docs/deployment/render.md`

- [ ] Run `pnpm test`.
- [ ] Run `pnpm typecheck`.
- [ ] Run `pnpm build`.
- [ ] Run `pnpm db:seed`.
- [ ] Verify login against the local API.
