import { BadRequestException, Body, Controller, Get, Inject, Param, Post, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard.js";
import { RequirePermissions } from "../auth/permissions.js";
import { CurrentSession } from "../auth/current-session.decorator.js";
import type { CurrentSession as SessionType } from "../auth/current-session.js";
import { PaymentsService } from "./payments.service.js";

@Controller("payments")
@UseGuards(SessionGuard)
export class PaymentsController {
  constructor(
    @Inject(PaymentsService)
    private readonly paymentsService: PaymentsService
  ) {}

  @Get("intents")
  @RequirePermissions("payments:manage")
  async listIntents(@CurrentSession() session: SessionType) {
    // Placeholder: returns empty list until list endpoint is implemented in service
    void session;
    return [];
  }

  @Post("intents")
  @UseGuards(SessionGuard)
  @RequirePermissions("payments:manage")
  async createIntent(
    @CurrentSession() session: SessionType,
    @Body() body: unknown
  ) {
    return this.paymentsService.createPaymentIntent(session.restaurantId, body);
  }

  @Post("intents/:id/process")
  @UseGuards(SessionGuard)
  @RequirePermissions("payments:manage")
  async processIntent(
    @CurrentSession() session: SessionType,
    @Param("id") id: string
  ) {
    if (!session.branchId) {
      throw new BadRequestException("User has no branch associated.");
    }
    return this.paymentsService.processPaymentIntent(
      session.restaurantId,
      session.branchId,
      session.userId,
      id
    );
  }
}
