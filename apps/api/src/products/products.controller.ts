import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";
import { SessionGuard } from "../auth/session.guard.js";
import { RequirePermissions } from "../auth/permissions.js";
import { CurrentSession } from "../auth/current-session.decorator.js";
import type { CurrentSession as SessionType } from "../auth/current-session.js";
import { ProductsService } from "./products.service.js";

@Controller("products")
@UseGuards(SessionGuard)
export class ProductsController {
  constructor(
    @Inject(ProductsService)
    private readonly productsService: ProductsService
  ) {}

  @Get("categories")
  async listCategories(
    @CurrentSession() session: SessionType,
    @Query("onlyActive") onlyActive?: string,
    @Query("type") type?: string
  ) {
    const activeOnly = onlyActive !== "false";
    return this.productsService.listCategories(session.restaurantId, activeOnly, type);
  }

  @Post("categories")
  @RequirePermissions("menu:manage")
  async createCategory(
    @CurrentSession() session: SessionType,
    @Body() body: unknown
  ) {
    return this.productsService.createCategory(session.restaurantId, body);
  }

  @Patch("categories/:id")
  @RequirePermissions("menu:manage")
  async updateCategory(
    @CurrentSession() session: SessionType,
    @Param("id") id: string,
    @Body() body: unknown
  ) {
    return this.productsService.updateCategory(session.restaurantId, id, body);
  }

  @Get()
  async listProducts(
    @CurrentSession() session: SessionType,
    @Query("categoryId") categoryId?: string,
    @Query("onlyActive") onlyActive?: string
  ) {
    const activeOnly = onlyActive !== "false";
    return this.productsService.listProducts(
      session.restaurantId,
      categoryId,
      activeOnly
    );
  }

  @Post()
  @RequirePermissions("menu:manage")
  async createProduct(
    @CurrentSession() session: SessionType,
    @Body() body: unknown
  ) {
    return this.productsService.createProduct(session.restaurantId, body);
  }

  @Patch(":id")
  @RequirePermissions("menu:manage")
  async updateProduct(
    @CurrentSession() session: SessionType,
    @Param("id") id: string,
    @Body() body: unknown
  ) {
    return this.productsService.updateProduct(session.restaurantId, id, body);
  }

  @Delete("categories/:id")
  @RequirePermissions("menu:manage")
  async deleteCategory(
    @CurrentSession() session: SessionType,
    @Param("id") id: string,
    @Body() body: { adminPassword?: string }
  ) {
    return this.productsService.deleteCategory(
      session.restaurantId,
      session.userId,
      id,
      body.adminPassword
    );
  }

  @Delete(":id")
  @RequirePermissions("menu:manage")
  async deleteProduct(
    @CurrentSession() session: SessionType,
    @Param("id") id: string,
    @Body() body: { adminPassword?: string }
  ) {
    return this.productsService.deleteProduct(
      session.restaurantId,
      session.userId,
      id,
      body.adminPassword
    );
  }
}
