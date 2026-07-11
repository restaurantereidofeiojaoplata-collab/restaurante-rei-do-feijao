import { Module } from "@nestjs/common";
import { TablesController } from "./tables.controller.js";
import { TablesService } from "./tables.service.js";
import { AuthModule } from "../auth/auth.module.js";

@Module({
  imports: [AuthModule],
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TablesService]
})
export class TablesModule {}
