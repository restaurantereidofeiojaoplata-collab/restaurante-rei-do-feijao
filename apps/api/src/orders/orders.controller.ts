import {
  BadRequestException,
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
import { OrdersService } from "./orders.service.js";

@Controller("orders")
@UseGuards(SessionGuard)
export class OrdersController {
  constructor(
    @Inject(OrdersService)
    private readonly ordersService: OrdersService
  ) {}

  @Get()
  @RequirePermissions("orders:read")
  async listOrders(@CurrentSession() session: SessionType) {
    return this.ordersService.listOrders(
      session.restaurantId,
      session.branchId ?? undefined
    );
  }

  @Post()
  @RequirePermissions("orders:manage")
  async createOrder(
    @CurrentSession() session: SessionType,
    @Body() body: unknown
  ) {
    if (!session.branchId) {
      throw new BadRequestException("User has no branch associated.");
    }
    return this.ordersService.createOrder(
      session.restaurantId,
      session.branchId,
      session.userId,
      body
    );
  }

  @Get(":id")
  @RequirePermissions("orders:read")
  async getOrder(
    @CurrentSession() session: SessionType,
    @Param("id") id: string
  ) {
    return this.ordersService.findOrderById(session.restaurantId, id);
  }

  @Post(":id/items")
  @RequirePermissions("orders:manage")
  async addItems(
    @CurrentSession() session: SessionType,
    @Param("id") id: string,
    @Body() body: unknown
  ) {
    return this.ordersService.addItems(
      session.restaurantId,
      id,
      session.userId,
      body
    );
  }

  @Patch(":id/items/:itemId")
  @RequirePermissions("orders:manage")
  async updateItem(
    @CurrentSession() session: SessionType,
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @Body() body: unknown
  ) {
    return this.ordersService.updateItem(
      session.restaurantId,
      id,
      itemId,
      session.userId,
      body
    );
  }

  @Delete(":id/items/:itemId")
  @RequirePermissions("orders:manage")
  async deleteItem(
    @CurrentSession() session: SessionType,
    @Param("id") id: string,
    @Param("itemId") itemId: string
  ) {
    return this.ordersService.deleteItem(
      session.restaurantId,
      id,
      itemId,
      session.userId
    );
  }

  @Post(":id/send-to-kitchen")
  @RequirePermissions("orders:manage")
  async sendToKitchen(
    @CurrentSession() session: SessionType,
    @Param("id") id: string
  ) {
    return this.ordersService.sendToKitchen(
      session.restaurantId,
      id,
      session.userId
    );
  }

  @Post(":id/cancel-request")
  @RequirePermissions("orders:manage")
  async cancelOrder(
    @CurrentSession() session: SessionType,
    @Param("id") id: string
  ) {
    return this.ordersService.cancelOrder(
      session.restaurantId,
      id,
      session.userId
    );
  }
}
