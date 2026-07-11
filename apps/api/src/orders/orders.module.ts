import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller.js";
import { OrdersService } from "./orders.service.js";
import { ProductsModule } from "../products/products.module.js";
import { AuthModule } from "../auth/auth.module.js";

@Module({
  imports: [AuthModule, ProductsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService]
})
export class OrdersModule {}
