import { Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { SessionGuard } from "./session.guard.js";
import { SessionTokenService } from "./session-token.service.js";

@Module({
  controllers: [AuthController],
  exports: [AuthService, SessionGuard, SessionTokenService],
  providers: [AuthService, Reflector, SessionGuard, SessionTokenService]
})
export class AuthModule {}
