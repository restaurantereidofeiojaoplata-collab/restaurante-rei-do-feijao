import { BadRequestException, Body, Controller, Get, Inject, Param, Post, Query, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard.js";
import { RequirePermissions } from "../auth/permissions.js";
import { CurrentSession } from "../auth/current-session.decorator.js";
import type { CurrentSession as SessionType } from "../auth/current-session.js";
import { CashRegistersService } from "./cash-registers.service.js";

@Controller("cash-registers")
@UseGuards(SessionGuard)
export class CashRegistersController {
  constructor(
    @Inject(CashRegistersService)
    private readonly cashRegistersService: CashRegistersService
  ) {}

  @Post()
  @RequirePermissions("settings:manage")
  async createRegister(
    @CurrentSession() session: SessionType,
    @Body() body: unknown
  ) {
    if (!session.branchId) {
      throw new BadRequestException("User has no branch associated.");
    }
    return this.cashRegistersService.createRegister(session.restaurantId, session.branchId, body);
  }

  @Get()
  @RequirePermissions("cash-register:manage")
  async listRegisters(@CurrentSession() session: SessionType) {
    return this.cashRegistersService.listRegisters(session.restaurantId, session.branchId ?? undefined);
  }

  @Get("sessions/active")
  @RequirePermissions("cash-register:manage")
  async getActiveSession(
    @CurrentSession() session: SessionType,
    @Query("registerId") registerId?: string
  ) {
    if (!session.branchId) {
      throw new BadRequestException("User has no branch associated.");
    }
    return this.cashRegistersService.getActiveSession(
      session.restaurantId,
      session.branchId,
      registerId
    );
  }

  @Post("sessions/open")
  @RequirePermissions("cash-register:manage")
  async openSession(
    @CurrentSession() session: SessionType,
    @Body() body: unknown
  ) {
    if (!session.branchId) {
      throw new BadRequestException("User has no branch associated.");
    }
    return this.cashRegistersService.openSession(
      session.restaurantId,
      session.branchId,
      session.userId,
      body
    );
  }

  @Post("sessions/:id/sangria")
  @RequirePermissions("cash-register:manage")
  async registerSangria(
    @CurrentSession() session: SessionType,
    @Param("id") id: string,
    @Body() body: unknown
  ) {
    return this.cashRegistersService.addMovement(
      session.restaurantId,
      id,
      session.userId,
      "SANGRIA",
      body
    );
  }

  @Post("sessions/:id/suprimento")
  @RequirePermissions("cash-register:manage")
  async registerSuprimento(
    @CurrentSession() session: SessionType,
    @Param("id") id: string,
    @Body() body: unknown
  ) {
    return this.cashRegistersService.addMovement(
      session.restaurantId,
      id,
      session.userId,
      "SUPRIMENTO",
      body
    );
  }

  @Post("sessions/:id/close")
  @RequirePermissions("cash-register:manage")
  async closeSession(
    @CurrentSession() session: SessionType,
    @Param("id") id: string,
    @Body() body: unknown
  ) {
    return this.cashRegistersService.closeSession(
      session.restaurantId,
      id,
      session.userId,
      body
    );
  }

  @Get("sessions/:id/movements")
  @RequirePermissions("cash-register:manage")
  async getSessionMovements(
    @CurrentSession() session: SessionType,
    @Param("id") id: string
  ) {
    return this.cashRegistersService.getSessionMovements(session.restaurantId, id);
  }
}

