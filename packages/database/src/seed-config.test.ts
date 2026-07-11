import { describe, expect, it } from "vitest";
import { defaultPermissionCodes, parseSeedConfig } from "./seed-config.js";

describe("seed config", () => {
  it("uses safe defaults for the first restaurant tenant", () => {
    const config = parseSeedConfig({});

    expect(config.restaurantSlug).toBe("rei-do-feijao");
    expect(config.branchSlug).toBe("matriz");
    expect(config.adminEmail).toBe("admin@reidofeijao.local");
    expect(config.adminPassword).toBeNull();
    expect(defaultPermissionCodes).toContain("system:admin");
    expect(defaultPermissionCodes).toContain("payments:manage");
  });

  it("reads admin credentials from explicit environment", () => {
    const config = parseSeedConfig({
      SEED_ADMIN_EMAIL: "dono@reidofeijao.com",
      SEED_ADMIN_PASSWORD: "senha-segura",
      SEED_BRANCH_NAME: "Unidade Centro",
      SEED_RESTAURANT_NAME: "Restaurante Rei do Feijao"
    });

    expect(config.adminEmail).toBe("dono@reidofeijao.com");
    expect(config.adminPassword).toBe("senha-segura");
    expect(config.branchName).toBe("Unidade Centro");
    expect(config.restaurantName).toBe("Restaurante Rei do Feijao");
  });
});
