import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard.js";
import { CurrentSession } from "../auth/current-session.decorator.js";
import type { CurrentSession as SessionType } from "../auth/current-session.js";
import { RestaurantsService } from "./restaurants.service.js";

@Controller("restaurants")
@UseGuards(SessionGuard)
export class RestaurantsController {
  constructor(
    @Inject(RestaurantsService)
    private readonly restaurantsService: RestaurantsService
  ) {}

  @Get("me")
  async me(@CurrentSession() session: SessionType) {
    return this.restaurantsService.findById(session.restaurantId);
  }

  @Get("branches")
  async branches(@CurrentSession() session: SessionType) {
    return this.restaurantsService.listBranches(session.restaurantId);
  }
}
