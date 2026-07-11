import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./passwords.js";

describe("password hashing", () => {
  it("verifies the original password and rejects a different one", async () => {
    const hash = await hashPassword("senha-forte-123");

    expect(hash).toMatch(/^scrypt:v1:/u);
    await expect(verifyPassword("senha-forte-123", hash)).resolves.toBe(true);
    await expect(verifyPassword("senha-errada", hash)).resolves.toBe(false);
  });
});
