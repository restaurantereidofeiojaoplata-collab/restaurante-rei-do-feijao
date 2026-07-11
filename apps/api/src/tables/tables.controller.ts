import {
  BadRequestException,
  Body,
  Controller,
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
import { TablesService } from "./tables.service.js";

@Controller("tables")
@UseGuards(SessionGuard)
export class TablesController {
  constructor(
    @Inject(TablesService)
    private readonly tablesService: TablesService
  ) {}

  @Get()
  async listTables(@CurrentSession() session: SessionType) {
    return this.tablesService.listTables(session.restaurantId, session.branchId ?? undefined);
  }

  @Post()
  @RequirePermissions("settings:manage")
  async createTable(
    @CurrentSession() session: SessionType,
    @Body() body: unknown
  ) {
    if (!session.branchId) {
      throw new BadRequestException("User has no branch associated.");
    }
    return this.tablesService.createTable(session.restaurantId, session.branchId, body);
  }

  @Patch(":id")
  @RequirePermissions("settings:manage")
  async updateTable(
    @CurrentSession() session: SessionType,
    @Param("id") id: string,
    @Body() body: unknown
  ) {
    return this.tablesService.updateTable(session.restaurantId, id, body);
  }

  @Post(":id/session")
  async openSession(
    @CurrentSession() session: SessionType,
    @Param("id") id: string
  ) {
    if (!session.branchId) {
      throw new BadRequestException("User has no branch associated.");
    }
    return this.tablesService.openSession(session.restaurantId, session.branchId, id);
  }

  @Post("session/:id/close")
  async closeSession(
    @CurrentSession() session: SessionType,
    @Param("id") id: string
  ) {
    return this.tablesService.closeSession(session.restaurantId, id);
  }
}
