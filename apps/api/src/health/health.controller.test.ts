import { describe, expect, it } from "vitest";
import { HealthController } from "./health.controller.js";
import type { HealthService } from "./health.service.js";

describe("HealthController", () => {
  it("returns liveness without touching dependencies", () => {
    const controller = new HealthController({
      live: () => ({ service: "api", status: "ok" }),
      ready: async () => ({ database: "ok", service: "api", status: "ok" })
    } as HealthService);

    expect(controller.live()).toEqual({ service: "api", status: "ok" });
  });

  it("returns readiness from the health service", async () => {
    const controller = new HealthController({
      live: () => ({ service: "api", status: "ok" }),
      ready: async () => ({ database: "ok", service: "api", status: "ok" })
    } as HealthService);

    await expect(controller.ready()).resolves.toEqual({
      database: "ok",
      service: "api",
      status: "ok"
    });
  });
});
