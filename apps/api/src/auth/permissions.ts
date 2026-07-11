import { ForbiddenException, SetMetadata } from "@nestjs/common";
import type { CurrentSession } from "./current-session.js";

export const requiredPermissionsMetadataKey = "requiredPermissions";

export function RequirePermissions(...permissions: string[]) {
  return SetMetadata(requiredPermissionsMetadataKey, permissions);
}

export function assertRequiredPermissions(
  session: CurrentSession,
  requiredPermissions: string[]
): void {
  if (requiredPermissions.length === 0) {
    return;
  }

  const sessionPermissions = new Set(session.permissions);

  if (sessionPermissions.has("system:admin")) {
    return;
  }

  for (const permission of requiredPermissions) {
    if (!sessionPermissions.has(permission)) {
      throw new ForbiddenException(`Missing permission: ${permission}`);
    }
  }
}
