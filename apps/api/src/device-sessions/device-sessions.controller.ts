import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  UseGuards
} from "@nestjs/common";
import { DeviceSessionsService } from "./device-sessions.service.js";
import { SessionGuard } from "../auth/session.guard.js";
import { RequirePermissions } from "../auth/permissions.js";
import { CurrentSession } from "../auth/current-session.decorator.js";
import type { CurrentSession as SessionType } from "../auth/current-session.js";

@Controller("device-sessions")
export class DeviceSessionsController {
  constructor(
    @Inject(DeviceSessionsService)
    private readonly deviceSessionsService: DeviceSessionsService
  ) {}

  /**
   * Called by the frontend immediately after a successful credential login
   * when the backend returns requiresDeviceApproval = true.
   * Body: { fingerprint, userAgent }
   * This endpoint does NOT require a session — it uses the one-time device data.
   */
  @Post("resolve")
  @UseGuards(SessionGuard)
  async resolveSession(
    @CurrentSession() session: SessionType,
    @Body() body: { fingerprint: string; userAgent?: string; clientLocation?: string; latitude?: number; longitude?: number },
    @Req() request: any
  ) {
    const ip =
      request.ip ||
      (request.headers ? request.headers["x-forwarded-for"] : undefined) ||
      "unknown";
    const ua =
      body.userAgent ||
      (request.headers ? request.headers["user-agent"] : "unknown-agent") ||
      "unknown";

    return this.deviceSessionsService.resolveDeviceSession(
      session.restaurantId,
      session.userId,
      body.fingerprint,
      ua,
      ip,
      body.clientLocation,
      body.latitude,
      body.longitude
    );
  }

  /** List all PENDING device requests — admin only */
  @Get("pending")
  @UseGuards(SessionGuard)
  @RequirePermissions("system:admin")
  listPending(@CurrentSession() session: SessionType) {
    return this.deviceSessionsService.listPending(session.restaurantId);
  }

  /** List all device sessions — admin only */
  @Get()
  @UseGuards(SessionGuard)
  @RequirePermissions("system:admin")
  listAll(@CurrentSession() session: SessionType) {
    return this.deviceSessionsService.listAll(session.restaurantId);
  }

  /** Approve a pending device — requires admin password in body */
  @Post(":id/approve")
  @UseGuards(SessionGuard)
  @RequirePermissions("system:admin")
  approve(
    @CurrentSession() session: SessionType,
    @Param("id") id: string,
    @Body() body: { adminPassword: string; deviceName?: string; allowedViews?: string[] }
  ) {
    return this.deviceSessionsService.approveDevice(
      id,
      session.restaurantId,
      session.userId,
      body.adminPassword,
      body.deviceName ?? null,
      body.allowedViews ?? []
    );
  }

  /** Reject a pending device — requires admin password in body */
  @Post(":id/reject")
  @UseGuards(SessionGuard)
  @RequirePermissions("system:admin")
  reject(
    @CurrentSession() session: SessionType,
    @Param("id") id: string,
    @Body() body: { adminPassword: string }
  ) {
    return this.deviceSessionsService.rejectDevice(
      id,
      session.restaurantId,
      session.userId,
      body.adminPassword
    );
  }

  /** Revoke an approved device */
  @Delete(":id")
  @UseGuards(SessionGuard)
  @RequirePermissions("system:admin")
  revoke(@CurrentSession() session: SessionType, @Param("id") id: string) {
    return this.deviceSessionsService.revokeDevice(id, session.restaurantId, session.userId);
  }

  /** Update device name or allowed views */
  @Patch(":id")
  @UseGuards(SessionGuard)
  @RequirePermissions("system:admin")
  update(
    @CurrentSession() session: SessionType,
    @Param("id") id: string,
    @Body() body: { deviceName?: string; allowedViews?: string[] }
  ) {
    return this.deviceSessionsService.updateDevice(
      id,
      session.restaurantId,
      body.deviceName,
      body.allowedViews
    );
  }

  /** Get device history and audit logs — admin only */
  @Get(":id/history")
  @UseGuards(SessionGuard)
  @RequirePermissions("system:admin")
  getHistory(@CurrentSession() session: SessionType, @Param("id") id: string) {
    return this.deviceSessionsService.getDeviceHistory(id, session.restaurantId);
  }
}
