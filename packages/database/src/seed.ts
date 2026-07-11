import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { queryClient } from "./client.js";
import { loadDatabaseEnvFiles } from "./env.js";
import {
  defaultPermissionCodes,
  parseSeedConfig,
  permissionDescription
} from "./seed-config.js";

const scrypt = promisify(scryptCallback);

function requiredRow<T>(rows: T[], label: string): T {
  const [row] = rows;

  if (!row) {
    throw new Error(`Seed failed to create ${label}.`);
  }

  return row;
}

async function hashSeedPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

  return `scrypt:v1:${salt}:${derivedKey.toString("base64url")}`;
}

async function main(): Promise<void> {
  loadDatabaseEnvFiles();

  const config = parseSeedConfig();

  if (!config.adminPassword) {
    throw new Error("SEED_ADMIN_PASSWORD is required to create the admin user.");
  }

  const passwordHash = await hashSeedPassword(config.adminPassword);

  await queryClient.begin(async (transaction) => {
    const restaurant = requiredRow(await transaction`
      insert into public.restaurants (name, slug, is_active)
      values (${config.restaurantName}, ${config.restaurantSlug}, true)
      on conflict (slug) do update set
        name = excluded.name,
        is_active = true,
        updated_at = now()
      returning id
    `, "restaurant");

    const branch = requiredRow(await transaction`
      insert into public.branches (restaurant_id, name, slug, is_active)
      values (${restaurant.id}, ${config.branchName}, ${config.branchSlug}, true)
      on conflict (restaurant_id, slug) do update set
        name = excluded.name,
        is_active = true,
        updated_at = now()
      returning id
    `, "branch");

    for (const code of defaultPermissionCodes) {
      await transaction`
        insert into public.permissions (code, description)
        values (${code}, ${permissionDescription(code)})
        on conflict (code) do update set
          description = excluded.description,
          updated_at = now()
      `;
    }

    const adminRole = requiredRow(await transaction`
      insert into public.roles (restaurant_id, name, description, is_system)
      values (${restaurant.id}, 'Administrador', 'Acesso completo ao sistema.', true)
      on conflict (restaurant_id, name) do update set
        description = excluded.description,
        is_system = true,
        updated_at = now()
      returning id
    `, "admin role");

    await transaction`
      insert into public.role_permissions (restaurant_id, role_id, permission_id)
      select ${restaurant.id}, ${adminRole.id}, p.id
      from public.permissions p
      where p.code = any(${defaultPermissionCodes})
      on conflict (role_id, permission_id) do nothing
    `;

    const adminUser = requiredRow(await transaction`
      insert into public.users (
        restaurant_id,
        branch_id,
        email,
        name,
        password_hash,
        status
      )
      values (
        ${restaurant.id},
        ${branch.id},
        ${config.adminEmail},
        ${config.adminName},
        ${passwordHash},
        'ACTIVE'
      )
      on conflict (restaurant_id, email) do update set
        branch_id = excluded.branch_id,
        name = excluded.name,
        password_hash = excluded.password_hash,
        status = 'ACTIVE',
        updated_at = now()
      returning id
    `, "admin user");

    await transaction`
      insert into public.user_role_assignments (restaurant_id, user_id, role_id)
      values (${restaurant.id}, ${adminUser.id}, ${adminRole.id})
      on conflict (user_id, role_id) do nothing
    `;
  });

  console.log(`Seed applied for ${config.restaurantSlug}.`);
}

try {
  await main();
} finally {
  await queryClient.end();
}
