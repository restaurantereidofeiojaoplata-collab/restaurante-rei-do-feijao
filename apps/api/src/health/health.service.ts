import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { queryClient } from "@restaurante/database";

export type LiveHealth = {
  service: "api";
  status: "ok";
};

export type ReadyHealth = LiveHealth & {
  database: "ok";
};

@Injectable()
export class HealthService {
  live(): LiveHealth {
    return { service: "api", status: "ok" };
  }

  async ready(): Promise<ReadyHealth> {
    try {
      await queryClient`select 1`;
    } catch {
      throw new ServiceUnavailableException({
        database: "unavailable",
        service: "api",
        status: "degraded"
      });
    }

    return { database: "ok", service: "api", status: "ok" };
  }
}
