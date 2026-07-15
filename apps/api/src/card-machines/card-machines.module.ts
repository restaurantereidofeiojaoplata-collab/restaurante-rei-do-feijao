import { Module } from "@nestjs/common";
import { CardMachinesController } from "./card-machines.controller.js";
import { CardMachinesService } from "./card-machines.service.js";
import { AuthModule } from "../auth/auth.module.js";

@Module({
  imports: [AuthModule],
  controllers: [CardMachinesController],
  providers: [CardMachinesService],
  exports: [CardMachinesService]
})
export class CardMachinesModule {}
