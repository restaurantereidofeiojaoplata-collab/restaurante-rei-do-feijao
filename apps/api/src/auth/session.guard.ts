import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  ForbiddenException
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { CurrentSession } from "./current-session.js";
import {
  assertRequiredPermissions,
  requiredPermissionsMetadataKey
} from "./permissions.js";
import { SessionTokenService } from "./session-token.service.js";
import { ALLOW_PENDING_2FA_KEY } from "./pending-2fa.decorator.js";
import { queryClient } from "@restaurante/database";


export type AuthenticatedRequest = {
  headers: {
    authorization?: string;
  };
  session?: CurrentSession;
  url?: string;
};

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject(Reflector)
    private readonly reflector: Reflector,
    @Inject(SessionTokenService)
    private readonly sessionTokens: SessionTokenService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest & { url: string }>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token.");
    }

    const token = authorization.slice("Bearer ".length).trim();

    try {
      request.session = this.sessionTokens.verify(token);
    } catch {
      throw new UnauthorizedException("Invalid bearer token.");
    }

    const sessionVal = request.session;
    if (!sessionVal) {
      throw new UnauthorizedException("Invalid session.");
    }

    // Verify active device session status from database to enforce instant revocation
    if (sessionVal.deviceSessionId) {
      const [session] = await queryClient<any[]>`
        SELECT status, allowed_views FROM public.device_sessions
        WHERE id = ${sessionVal.deviceSessionId}
        LIMIT 1
      `;
      if (!session || session.status !== "APPROVED") {
        throw new UnauthorizedException("Acesso deste dispositivo foi revogado ou não está autorizado.");
      }

      // Enforce API-level tab/resource restrictions based on the device session's allowedViews
      const allowedViews = session.allowed_views as string[];
      if (allowedViews && allowedViews.length > 0) {
        const rawUrl = request.url || "";
        const pathPart = rawUrl.replace(/^\/v1\//, "").split("?")[0] || "";
        const cleanPath = pathPart.split("/")[0] || "";



        let hasAccess = false;

        if (["auth", "health"].includes(cleanPath)) {
          hasAccess = true;
        } else {
          if (cleanPath === "device-sessions" || cleanPath === "restaurants") {
            hasAccess = allowedViews.includes("settings");
          } else if (cleanPath === "users" || cleanPath === "employees") {
            hasAccess = allowedViews.includes("employees");
          } else if (cleanPath === "products" || cleanPath === "categories") {
            hasAccess = allowedViews.includes("products");
          } else if (cleanPath === "kitchen") {
            hasAccess = allowedViews.includes("orders");
          } else if (cleanPath === "tables" || cleanPath === "dining-tables") {
            hasAccess = allowedViews.includes("tables");
          } else if (cleanPath === "cash-registers") {
            hasAccess = allowedViews.includes("pdv") || allowedViews.includes("finance");
          } else if (cleanPath === "payments") {
            hasAccess = allowedViews.includes("pdv") || allowedViews.includes("finance");
          } else if (cleanPath === "orders") {
            hasAccess = allowedViews.includes("pdv") || allowedViews.includes("tables") || allowedViews.includes("orders");
          } else {
            hasAccess = false;
          }
        }

        if (!hasAccess) {
          throw new ForbiddenException("Acesso bloqueado: Este dispositivo não tem permissão para acessar este recurso.");
        }
      }
    }


    // Block 2FA pending sessions by default unless the route opts in explicitly
    const isPending2FA = sessionVal.permissions.includes("2fa:pending");
    const allowsPending = this.reflector.getAllAndOverride<boolean>(
      ALLOW_PENDING_2FA_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (isPending2FA && !allowsPending) {
      throw new UnauthorizedException("2FA verification pending.");
    }

    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(
        requiredPermissionsMetadataKey,
        [context.getHandler(), context.getClass()]
      ) ?? [];

    assertRequiredPermissions(sessionVal, requiredPermissions);


    return true;
  }
}

