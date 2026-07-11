import { Controller, Get, Inject } from "@nestjs/common";
import { HealthService } from "./health.service.js";
import type { LiveHealth, ReadyHealth } from "./health.service.js";

@Controller("health")
export class HealthController {
  constructor(
    @Inject(HealthService) private readonly healthService: HealthService
  ) {}

  @Get("live")
  live(): LiveHealth {
    return this.healthService.live();
  }

  @Get("ready")
  ready(): Promise<ReadyHealth> {
    return this.healthService.ready();
  }
}
