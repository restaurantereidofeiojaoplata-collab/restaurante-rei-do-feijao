import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { describe, expect, it } from "vitest";
import { SessionGuard } from "./session.guard.js";
import type { SessionTokenService } from "./session-token.service.js";

function createContext(requiredPermissions: string[] = []): {
  context: ExecutionContext;
  request: { headers: { authorization?: string }; session?: unknown };
} {
  const request = {
    headers: {
      authorization: "Bearer valid-token"
    }
  };

  return {
    context: {
      getClass: () => function TestController() {},
      getHandler: () => function testHandler() {},
      switchToHttp: () => ({
        getRequest: () => request
      })
    } as unknown as ExecutionContext,
    request
  };
}

describe("SessionGuard", () => {
  it("attaches verified session and allows required permission", async () => {
    const { context, request } = createContext();
    const reflector = {
      getAllAndOverride: () => ["orders:manage"]
    } as unknown as Reflector;
    const sessionTokens = {
      verify: () => ({
        email: "admin@reidofeijao.local",
        permissions: ["orders:manage"],
        restaurantId: "restaurant-1",
        userId: "user-1"
      })
    } as unknown as SessionTokenService;

    const guard = new SessionGuard(reflector, sessionTokens);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.session).toMatchObject({
      email: "admin@reidofeijao.local",
      restaurantId: "restaurant-1"
    });
  });

  it("rejects missing bearer tokens", async () => {
    const { context, request } = createContext();
    request.headers.authorization = undefined;
    const reflector = {
      getAllAndOverride: () => []
    } as unknown as Reflector;
    const sessionTokens = {
      verify: () => {
        throw new Error("should not be called");
      }
    } as unknown as SessionTokenService;

    const guard = new SessionGuard(reflector, sessionTokens);

    await expect(guard.canActivate(context)).rejects.toThrow("Missing bearer token.");
  });
});

