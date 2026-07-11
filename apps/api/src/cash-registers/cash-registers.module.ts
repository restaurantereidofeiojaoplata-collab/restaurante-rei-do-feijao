import { Module } from "@nestjs/common";
import { CashRegistersController } from "./cash-registers.controller.js";
import { CashRegistersService } from "./cash-registers.service.js";
import { AuthModule } from "../auth/auth.module.js";

@Module({
  imports: [AuthModule],
  controllers: [CashRegistersController],
  providers: [CashRegistersService],
  exports: [CashRegistersService]
})
export class CashRegistersModule {}
