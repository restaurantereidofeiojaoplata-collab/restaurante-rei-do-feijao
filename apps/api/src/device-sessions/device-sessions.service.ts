import {
  Injectable,
  Inject,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  Logger,
  ForbiddenException
} from "@nestjs/common";
import { queryClient } from "@restaurante/database";
import { verifyPassword } from "../security/passwords.js";
import { AuditService } from "../audit/audit.service.js";
import { EventsGateway } from "../websockets/events.gateway.js";

async function resolveLocation(ip: string): Promise<string> {
  const cleanIp = ip ? ip.trim() : "";
  if (!cleanIp || cleanIp === "127.0.0.1" || cleanIp === "::1" || cleanIp === "localhost" || cleanIp === "::ffff:127.0.0.1") {
    return "Localhost (Desenvolvimento)";
  }
  if (cleanIp.startsWith("192.168.") || cleanIp.startsWith("10.") || cleanIp.startsWith("172.16.")) {
    return "Rede Local (LAN)";
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${cleanIp}?fields=status,message,country,regionName,city`);
    if (res.ok) {
      const data = await res.json();
      if (data.status === "success") {
        return `${data.city}, ${data.regionName} - ${data.country}`;
      }
    }
  } catch (err) {
    // Ignore geolocation failure
  }
  return "Localização desconhecida";
}

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
      headers: {
        'User-Agent': 'RestauranteReiDoFeijao/1.0'
      }
    });
    if (res.ok) {
      const data = await res.json();
      const address = data.address;
      if (address) {
        const city = address.city || address.town || address.village || address.municipality || '';
        const state = address.state || '';
        const country = address.country || '';
        return `${city}, ${state} - ${country}`.replace(/^,\s*/, '');
      }
    }
  } catch (err) {
    // Ignore reverse geocoding failure
  }
  return null;
}

export type DeviceSessionStatus = "PENDING" | "APPROVED" | "REJECTED" | "REVOKED";

export interface DeviceSessionRow {
  id: string;
  restaurant_id: string;
  user_id: string;
  device_fingerprint: string;
  device_name: string | null;
  user_agent: string | null;
  ip_address: string | null;
  location: string | null;
  status: DeviceSessionStatus;
  allowed_views: string[];
  requested_at: Date;
  resolved_at: Date | null;
  resolved_by_id: string | null;
  created_at: Date;
  updated_at: Date;
  // joined from users
  user_name?: string;
  user_email?: string;
}

@Injectable()
export class DeviceSessionsService {
  private readonly logger = new Logger(DeviceSessionsService.name);

  constructor(
    @Inject(AuditService)
    private readonly auditService: AuditService,
    @Inject(EventsGateway)
    private readonly eventsGateway: EventsGateway
  ) {}

  /**
   * Called right after a successful credential check.
   * Returns the existing APPROVED session (if any) or creates a new PENDING one.
   * Admin's first-ever login from any device is auto-approved.
   */
  async resolveDeviceSession(
    restaurantId: string,
    userId: string,
    fingerprint: string,
    userAgent: string,
    ipAddress: string,
    clientLocation?: string,
    latitude?: number,
    longitude?: number
  ): Promise<{
    requiresDeviceApproval: boolean;
    sessionId: string;
    allowedViews: string[];
  }> {
    // 1. Check if this fingerprint already has an existing session for this user
    const [existing] = await queryClient<DeviceSessionRow[]>`
      SELECT id, status, allowed_views
      FROM public.device_sessions
      WHERE user_id = ${userId}
        AND device_fingerprint = ${fingerprint}
      LIMIT 1
    `;

    if (existing) {
      if (existing.status === "APPROVED") {
        return {
          requiresDeviceApproval: false,
          sessionId: existing.id,
          allowedViews: existing.allowed_views || []
        };
      }
      if (existing.status === "PENDING") {
        return {
          requiresDeviceApproval: true,
          sessionId: existing.id,
          allowedViews: []
        };
      }
      if (existing.status === "REJECTED" || existing.status === "REVOKED") {
        throw new ForbiddenException(
          "O acesso deste dispositivo foi negado. Entre em contato com o administrador."
        );
      }
    }

    // 2. Check if this is the very first session for this user (first login ever)
    const [hasAnySession] = await queryClient<any[]>`
      SELECT id FROM public.device_sessions
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    // Auto-approve ONLY if it is the very first session ever for this user.
    // All subsequent devices (including for administrators) require admin approval.
    const autoApprove = !hasAnySession;

    const status: DeviceSessionStatus = autoApprove ? "APPROVED" : "PENDING";

    
    // Resolve precise location using GPS coordinates first, then fallback to IP
    let location = "";
    if (latitude !== undefined && longitude !== undefined) {
      const gpsLocation = await reverseGeocode(latitude, longitude);
      if (gpsLocation) {
        location = gpsLocation;
      }
    }

    if (!location) {
      location = await resolveLocation(ipAddress);
      if ((location === "Localhost (Desenvolvimento)" || location === "Localização desconhecida") && clientLocation) {
        location = clientLocation;
      }
    }

    const [created] = await queryClient<DeviceSessionRow[]>`
      INSERT INTO public.device_sessions
        (restaurant_id, user_id, device_fingerprint, user_agent, ip_address, location, status, allowed_views)
      VALUES
        (${restaurantId}, ${userId}, ${fingerprint}, ${userAgent}, ${ipAddress}, ${location}, ${status}, '[]')
      RETURNING id, status, allowed_views
    `;

    if (!created) throw new Error("Falha ao criar sessão de dispositivo.");

    if (status === "PENDING") {
      // Broadcast access request to all connected admins in this restaurant
      await this.notifyPendingRequest(restaurantId, created.id, userId, userAgent, ipAddress, location);
    }

    return {
      requiresDeviceApproval: status === "PENDING",
      sessionId: created.id,
      allowedViews: created.allowed_views || []
    };
  }

  /** Broadcast a pending device request to the restaurant's admin clients */
  private async notifyPendingRequest(
    restaurantId: string,
    sessionId: string,
    userId: string,
    userAgent: string,
    ipAddress: string,
    location: string
  ): Promise<void> {
    const [user] = await queryClient<any[]>`
      SELECT name, email FROM public.users WHERE id = ${userId} LIMIT 1
    `;

    this.eventsGateway.broadcastToRestaurant(restaurantId, "device:access_request", {
      sessionId,
      userId,
      userName: user?.name ?? "Desconhecido",
      userEmail: user?.email ?? "",
      userAgent,
      ipAddress,
      location,
      requestedAt: new Date().toISOString()
    });

    this.logger.log(
      `Device access request created — sessionId=${sessionId} userId=${userId} ip=${ipAddress} location=${location}`
    );
  }

  /** List all PENDING requests for the admin panel */
  async listPending(restaurantId: string): Promise<DeviceSessionRow[]> {
    return queryClient<DeviceSessionRow[]>`
      SELECT
        ds.id,
        ds.restaurant_id,
        ds.user_id,
        ds.device_fingerprint,
        ds.device_name,
        ds.user_agent,
        ds.ip_address,
        ds.location,
        ds.status,
        ds.allowed_views,
        ds.requested_at,
        ds.resolved_at,
        ds.resolved_by_id,
        ds.created_at,
        ds.updated_at,
        u.name  AS user_name,
        u.email AS user_email
      FROM public.device_sessions ds
      INNER JOIN public.users u ON u.id = ds.user_id
      WHERE ds.restaurant_id = ${restaurantId}
        AND ds.status = 'PENDING'
      ORDER BY ds.requested_at DESC
    `;
  }

  /** List all sessions (all statuses) for the device management page */
  async listAll(restaurantId: string): Promise<DeviceSessionRow[]> {
    return queryClient<DeviceSessionRow[]>`
      SELECT
        ds.id,
        ds.restaurant_id,
        ds.user_id,
        ds.device_fingerprint,
        ds.device_name,
        ds.user_agent,
        ds.ip_address,
        ds.location,
        ds.status,
        ds.allowed_views,
        ds.requested_at,
        ds.resolved_at,
        ds.resolved_by_id,
        ds.created_at,
        ds.updated_at,
        u.name  AS user_name,
        u.email AS user_email
      FROM public.device_sessions ds
      INNER JOIN public.users u ON u.id = ds.user_id
      WHERE ds.restaurant_id = ${restaurantId}
      ORDER BY ds.requested_at DESC
    `;
  }

  /** Admin approves a pending device, optionally naming it and setting view restrictions */
  async approveDevice(
    sessionId: string,
    restaurantId: string,
    resolvedById: string,
    adminPassword: string,
    deviceName: string | null,
    allowedViews: string[]
  ): Promise<{ success: boolean }> {
    await this.verifyAdminPassword(restaurantId, adminPassword);

    const [session] = await queryClient<DeviceSessionRow[]>`
      SELECT id, status, user_id FROM public.device_sessions
      WHERE id = ${sessionId} AND restaurant_id = ${restaurantId}
      LIMIT 1
    `;

    if (!session) throw new NotFoundException("Sessão de dispositivo não encontrada.");
    if (session.status !== "PENDING") {
      throw new ConflictException("Apenas sessões pendentes podem ser aprovadas.");
    }

    await queryClient`
      UPDATE public.device_sessions
      SET
        status         = 'APPROVED',
        device_name    = COALESCE(${deviceName}, device_name),
        allowed_views  = ${JSON.stringify(allowedViews)}::jsonb,
        resolved_at    = NOW(),
        resolved_by_id = ${resolvedById},
        updated_at     = NOW()
      WHERE id = ${sessionId}
    `;

    // Notify the waiting device via its own WS room
    this.eventsGateway.broadcastToRestaurant(restaurantId, "device:approved", {
      sessionId,
      allowedViews,
      deviceName
    });

    await this.auditService.log({
      restaurantId,
      userId: resolvedById,
      action: "device.approved",
      description: `Acesso de dispositivo aprovado (sessão ${sessionId}${deviceName ? ` — ${deviceName}` : ""}).`,
      payload: { sessionId, deviceName, allowedViews }
    });

    return { success: true };
  }

  /** Admin rejects a pending device request */
  async rejectDevice(
    sessionId: string,
    restaurantId: string,
    resolvedById: string,
    adminPassword: string
  ): Promise<{ success: boolean }> {
    await this.verifyAdminPassword(restaurantId, adminPassword);

    const [session] = await queryClient<DeviceSessionRow[]>`
      SELECT id, status FROM public.device_sessions
      WHERE id = ${sessionId} AND restaurant_id = ${restaurantId}
      LIMIT 1
    `;

    if (!session) throw new NotFoundException("Sessão de dispositivo não encontrada.");
    if (session.status !== "PENDING") {
      throw new ConflictException("Apenas sessões pendentes podem ser rejeitadas.");
    }

    await queryClient`
      UPDATE public.device_sessions
      SET
        status         = 'REJECTED',
        resolved_at    = NOW(),
        resolved_by_id = ${resolvedById},
        updated_at     = NOW()
      WHERE id = ${sessionId}
    `;

    this.eventsGateway.broadcastToRestaurant(restaurantId, "device:rejected", { sessionId });

    await this.auditService.log({
      restaurantId,
      userId: resolvedById,
      action: "device.rejected",
      description: `Acesso de dispositivo rejeitado (sessão ${sessionId}).`,
      payload: { sessionId }
    });

    return { success: true };
  }

  /** Admin revokes a previously approved device */
  async revokeDevice(
    sessionId: string,
    restaurantId: string,
    resolvedById: string
  ): Promise<{ success: boolean }> {
    const [session] = await queryClient<DeviceSessionRow[]>`
      SELECT id, status FROM public.device_sessions
      WHERE id = ${sessionId} AND restaurant_id = ${restaurantId}
      LIMIT 1
    `;

    if (!session) throw new NotFoundException("Sessão de dispositivo não encontrada.");
    if (session.status !== "APPROVED") {
      throw new ConflictException("Apenas sessões aprovadas podem ser revogadas.");
    }

    await queryClient`
      UPDATE public.device_sessions
      SET
        status         = 'REVOKED',
        resolved_at    = NOW(),
        resolved_by_id = ${resolvedById},
        updated_at     = NOW()
      WHERE id = ${sessionId}
    `;

    this.eventsGateway.broadcastToRestaurant(restaurantId, "device:revoked", { sessionId });

    await this.auditService.log({
      restaurantId,
      userId: resolvedById,
      action: "device.revoked",
      description: `Acesso de dispositivo revogado (sessão ${sessionId}).`,
      payload: { sessionId }
    });

    return { success: true };
  }

  /** Admin updates the name or allowed views of an approved device */
  async updateDevice(
    sessionId: string,
    restaurantId: string,
    deviceName?: string,
    allowedViews?: string[]
  ): Promise<{ success: boolean }> {
    const [session] = await queryClient<any[]>`
      SELECT id FROM public.device_sessions
      WHERE id = ${sessionId} AND restaurant_id = ${restaurantId}
      LIMIT 1
    `;
    if (!session) throw new NotFoundException("Sessão de dispositivo não encontrada.");

    await queryClient`
      UPDATE public.device_sessions
      SET
        device_name   = COALESCE(${deviceName ?? null}, device_name),
        allowed_views = COALESCE(${allowedViews ? JSON.stringify(allowedViews) + '::jsonb' : null}, allowed_views),
        updated_at    = NOW()
      WHERE id = ${sessionId}
    `;

    return { success: true };
  }

  /** Internal: verify admin password against any admin of the restaurant */
  private async verifyAdminPassword(restaurantId: string, adminPassword: string): Promise<void> {
    const admins = await queryClient<any[]>`
      SELECT u.password_hash
      FROM public.users u
      INNER JOIN public.user_role_assignments ura ON u.id = ura.user_id
      INNER JOIN public.roles r ON ura.role_id = r.id
      WHERE u.restaurant_id = ${restaurantId}
        AND r.name = 'Administrador'
    `;

    let valid = false;
    for (const admin of admins) {
      if (admin.password_hash && (await verifyPassword(adminPassword, admin.password_hash))) {
        valid = true;
        break;
      }
    }

    if (!valid) throw new UnauthorizedException("Senha de administrador incorreta.");
  }

  /**
   * Get full audit history, user details, and active time for a specific device.
   * Admin only.
   */
  async getDeviceHistory(id: string, restaurantId: string): Promise<any> {
    const [session] = await queryClient<DeviceSessionRow[]>`
      SELECT
        ds.id,
        ds.restaurant_id,
        ds.user_id,
        ds.device_fingerprint,
        ds.device_name,
        ds.user_agent,
        ds.ip_address,
        ds.location,
        ds.status,
        ds.allowed_views,
        ds.requested_at,
        ds.resolved_at,
        ds.resolved_by_id,
        ds.created_at,
        ds.updated_at,
        u.name  AS user_name,
        u.email AS user_email
      FROM public.device_sessions ds
      INNER JOIN public.users u ON u.id = ds.user_id
      WHERE ds.id = ${id}
        AND ds.restaurant_id = ${restaurantId}
      LIMIT 1
    `;

    if (!session) {
      throw new NotFoundException("Sessão de dispositivo não encontrada.");
    }

    // Fetch audit logs matching user and (ip or user agent)
    const logs = await queryClient<any[]>`
      SELECT
        id,
        action,
        description,
        ip_address,
        user_agent,
        created_at
      FROM public.audit_logs
      WHERE user_id = ${session.user_id}
        AND (ip_address = ${session.ip_address} OR user_agent = ${session.user_agent})
      ORDER BY created_at DESC
      LIMIT 150
    `;

    // Compute active hours/duration based on audit log time range
    let durationMinutes = 0;
    if (logs.length > 0) {
      const firstLogTime = new Date(logs[logs.length - 1].created_at).getTime();
      const lastLogTime = new Date(logs[0].created_at).getTime();
      durationMinutes = Math.max(0, Math.floor((lastLogTime - firstLogTime) / 60000));
    }

    return {
      session,
      logs,
      durationMinutes
    };
  }
}
