import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards
} from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard.js";
import { RequirePermissions } from "../auth/permissions.js";
import { CurrentSession } from "../auth/current-session.decorator.js";
import type { CurrentSession as SessionType } from "../auth/current-session.js";
import { BillsService } from "./bills.service.js";

@Controller("bills")
@UseGuards(SessionGuard)
export class BillsController {
  constructor(
    @Inject(BillsService)
    private readonly billsService: BillsService
  ) {}

  @Get()
  @RequirePermissions("cash-register:manage")
  async listBills(@CurrentSession() session: SessionType) {
    return this.billsService.listBills(session.restaurantId);
  }

  @Post()
  @RequirePermissions("cash-register:manage")
  async createBill(
    @CurrentSession() session: SessionType,
    @Body() body: unknown
  ) {
    return this.billsService.createBill(session.restaurantId, body);
  }

  @Patch(":id")
  @RequirePermissions("cash-register:manage")
  async updateBill(
    @CurrentSession() session: SessionType,
    @Param("id") id: string,
    @Body() body: unknown
  ) {
    return this.billsService.updateBill(session.restaurantId, id, body);
  }

  @Delete(":id")
  @RequirePermissions("cash-register:manage")
  async deleteBill(
    @CurrentSession() session: SessionType,
    @Param("id") id: string
  ) {
    return this.billsService.deleteBill(session.restaurantId, id);
  }
}
