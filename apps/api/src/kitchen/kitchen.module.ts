import { Module } from "@nestjs/common";
import { KitchenController } from "./kitchen.controller.js";
import { KitchenService } from "./kitchen.service.js";
import { AuthModule } from "../auth/auth.module.js";

@Module({
  imports: [AuthModule],
  controllers: [KitchenController],
  providers: [KitchenService],
  exports: [KitchenService]
})
export class KitchenModule {}
