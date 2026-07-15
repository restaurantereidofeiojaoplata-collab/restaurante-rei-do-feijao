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
import { CardMachinesService } from "./card-machines.service.js";

@Controller("card-machines")
@UseGuards(SessionGuard)
export class CardMachinesController {
  constructor(
    @Inject(CardMachinesService)
    private readonly cardMachinesService: CardMachinesService
  ) {}

  @Get()
  @RequirePermissions("system:admin")
  async listCardMachines(@CurrentSession() session: SessionType) {
    return this.cardMachinesService.listCardMachines(session.restaurantId);
  }

  @Post()
  @RequirePermissions("system:admin")
  async createCardMachine(
    @CurrentSession() session: SessionType,
    @Body() body: unknown
  ) {
    return this.cardMachinesService.createCardMachine(session.restaurantId, body);
  }

  @Patch(":id")
  @RequirePermissions("system:admin")
  async updateCardMachine(
    @CurrentSession() session: SessionType,
    @Param("id") id: string,
    @Body() body: unknown
  ) {
    return this.cardMachinesService.updateCardMachine(session.restaurantId, id, body);
  }

  @Delete(":id")
  @RequirePermissions("system:admin")
  async deleteCardMachine(
    @CurrentSession() session: SessionType,
    @Param("id") id: string
  ) {
    return this.cardMachinesService.deleteCardMachine(session.restaurantId, id);
  }
}
