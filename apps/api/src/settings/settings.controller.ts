import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  UseGuards
} from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard.js";
import { CurrentSession } from "../auth/current-session.decorator.js";
import type { CurrentSession as SessionType } from "../auth/current-session.js";
import { SettingsService } from "./settings.service.js";

@Controller("settings")
@UseGuards(SessionGuard)
export class SettingsController {
  constructor(
    @Inject(SettingsService)
    private readonly settingsService: SettingsService
  ) {}

  @Get()
  async getSettings(@CurrentSession() session: SessionType) {
    return this.settingsService.getSettings(session.restaurantId);
  }

  @Post()
  async saveSettings(
    @CurrentSession() session: SessionType,
    @Body() body: Record<string, string>
  ) {
    return this.settingsService.saveSettings(session.restaurantId, body);
  }
}
