import { describe, expect, it } from "vitest";
import { SessionTokenService } from "./session-token.service.js";

describe("SessionTokenService", () => {
  it("signs and verifies session claims", () => {
    const tokens = new SessionTokenService({
      now: () => new Date("2026-07-04T22:00:00.000Z"),
      secret: "test-secret-with-enough-length"
    });

    const token = tokens.sign({
      branchId: "branch-1",
      email: "admin@reidofeijao.local",
      permissions: ["system:admin", "orders:manage"],
      restaurantId: "restaurant-1",
      userId: "user-1"
    });

    expect(tokens.verify(token)).toMatchObject({
      branchId: "branch-1",
      email: "admin@reidofeijao.local",
      permissions: ["system:admin", "orders:manage"],
      restaurantId: "restaurant-1",
      userId: "user-1"
    });
  });

  it("rejects a tampered token", () => {
    const tokens = new SessionTokenService({
      now: () => new Date("2026-07-04T22:00:00.000Z"),
      secret: "test-secret-with-enough-length"
    });

    const token = tokens.sign({
      email: "admin@reidofeijao.local",
      permissions: ["system:admin"],
      restaurantId: "restaurant-1",
      userId: "user-1"
    });

    const tampered = `${token.slice(0, -2)}xx`;

    expect(() => tokens.verify(tampered)).toThrow("Invalid session token");
  });
});
