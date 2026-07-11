import { describe, expect, it } from "vitest";
import { AuthController } from "./auth.controller.js";
import type { AuthService } from "./auth.service.js";

describe("AuthController", () => {
  it("returns a session token and safe user payload", async () => {
    const controller = new AuthController(
      {
        login: async () => ({
          accessToken: "signed-token",
          user: {
            branchId: "branch-1",
            email: "admin@reidofeijao.local",
            id: "user-1",
            name: "Administrador",
            permissions: ["system:admin"],
            restaurantId: "restaurant-1"
          }
        })
      } as unknown as AuthService,
      {} as any
    );

    await expect(
      controller.login(
        {
          email: "admin@reidofeijao.local",
          password: "senha-forte-123",
          restaurantSlug: "rei-do-feijao",
          latitude: 0,
          longitude: 0
        },
        { ip: "127.0.0.1", headers: {} } as any,
        { cookie: () => {} } as any
      )
    ).resolves.toEqual({
      accessToken: "signed-token",
      user: {
        branchId: "branch-1",
        email: "admin@reidofeijao.local",
        id: "user-1",
        name: "Administrador",
        permissions: ["system:admin"],
        restaurantId: "restaurant-1"
      }
    });
  });
});
