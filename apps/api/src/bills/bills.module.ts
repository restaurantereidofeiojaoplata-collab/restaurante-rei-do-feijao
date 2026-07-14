import { Module } from "@nestjs/common";
import { BillsController } from "./bills.controller.js";
import { BillsService } from "./bills.service.js";
import { AuthModule } from "../auth/auth.module.js";

@Module({
  imports: [AuthModule],
  controllers: [BillsController],
  providers: [BillsService],
  exports: [BillsService]
})
export class BillsModule {}
