import { describe, expect, it } from "vitest";
import { assertRequiredPermissions } from "./permissions.js";

describe("permission checks", () => {
  it("allows sessions with all required permissions", () => {
    expect(() =>
      assertRequiredPermissions(
        {
          email: "admin@reidofeijao.local",
          permissions: ["system:admin", "orders:manage"],
          restaurantId: "restaurant-1",
          userId: "user-1"
        },
        ["orders:manage"]
      )
    ).not.toThrow();
  });

  it("rejects sessions missing a required permission", () => {
    expect(() =>
      assertRequiredPermissions(
        {
          email: "operador@reidofeijao.local",
          permissions: ["orders:read"],
          restaurantId: "restaurant-1",
          userId: "user-2"
        },
        ["payments:manage"]
      )
    ).toThrow("Missing permission: payments:manage");
  });
});
