import { Controller, Get, Inject, Param, Post, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard.js";
import { RequirePermissions } from "../auth/permissions.js";
import { CurrentSession } from "../auth/current-session.decorator.js";
import type { CurrentSession as SessionType } from "../auth/current-session.js";
import { KitchenService } from "./kitchen.service.js";

@Controller("kitchen")
@UseGuards(SessionGuard)
export class KitchenController {
  constructor(
    @Inject(KitchenService)
    private readonly kitchenService: KitchenService
  ) {}

  @Get("tickets")
  @RequirePermissions("orders:read")
  async listActiveTickets(@CurrentSession() session: SessionType) {
    return this.kitchenService.listActiveTickets(session.restaurantId);
  }

  @Get("tickets/:id")
  @RequirePermissions("orders:read")
  async getTicket(
    @CurrentSession() session: SessionType,
    @Param("id") id: string
  ) {
    return this.kitchenService.findTicketById(session.restaurantId, id);
  }

  // Moves ticket to PREPARING status (kitchen started working on it)
  @Post("tickets/:id/start")
  @RequirePermissions("orders:manage")
  async startTicket(
    @CurrentSession() session: SessionType,
    @Param("id") id: string
  ) {
    return this.kitchenService.updateTicketStatus(session.restaurantId, id, "PREPARING");
  }

  @Post("tickets/:id/ready")
  @RequirePermissions("orders:manage")
  async readyTicket(
    @CurrentSession() session: SessionType,
    @Param("id") id: string
  ) {
    return this.kitchenService.updateTicketStatus(session.restaurantId, id, "READY");
  }

  @Post("tickets/:id/delivered")
  @RequirePermissions("orders:manage")
  async deliveredTicket(
    @CurrentSession() session: SessionType,
    @Param("id") id: string
  ) {
    return this.kitchenService.updateTicketStatus(session.restaurantId, id, "DELIVERED");
  }
}
