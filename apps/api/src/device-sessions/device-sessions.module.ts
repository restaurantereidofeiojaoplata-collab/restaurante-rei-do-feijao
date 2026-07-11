import { Module } from "@nestjs/common";
import { DeviceSessionsController } from "./device-sessions.controller.js";
import { DeviceSessionsService } from "./device-sessions.service.js";
import { AuditModule } from "../audit/audit.module.js";
import { WebsocketsModule } from "../websockets/websockets.module.js";
import { AuthModule } from "../auth/auth.module.js";

@Module({
  imports: [AuditModule, WebsocketsModule, AuthModule],
  controllers: [DeviceSessionsController],
  providers: [
    DeviceSessionsService,
    // Provide under the string token that AuthService uses via @Optional() @Inject("DeviceSessionsService")
    // This allows AuthService to receive the service without a hard circular import
    {
      provide: "DeviceSessionsService",
      useExisting: DeviceSessionsService
    }
  ],
  exports: [DeviceSessionsService, "DeviceSessionsService"]
})
export class DeviceSessionsModule {}
