import { Module, Global } from "@nestjs/common";
import { EventsGateway } from "./events.gateway.js";
import { AuthModule } from "../auth/auth.module.js";

@Global()
@Module({
  imports: [AuthModule],
  providers: [EventsGateway],
  exports: [EventsGateway]
})
export class WebsocketsModule {}
