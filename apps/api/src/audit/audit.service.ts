import { Injectable, OnModuleInit } from "@nestjs/common";
import { queryClient } from "@restaurante/database";

export interface LogAuditParams {
  restaurantId: string;
  userId?: string | null;
  actorUserId?: string | null;
  action: string;
  description?: string;
  payload?: any;
  ipAddress?: string;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string;
  result?: any;
  metadata?: any;
}

@Injectable()
export class AuditService implements OnModuleInit {
  async onModuleInit() {
    await this.ensureAuditTableExists();
  }
  /**
   * Automatically initializes the audit_logs table on startup if it doesn't exist.
   */
  async ensureAuditTableExists(): Promise<void> {
    try {
      await queryClient`
        create table if not exists public.audit_logs (
          id uuid primary key default gen_random_uuid(),
          restaurant_id uuid not null,
          user_id uuid,
          action varchar(100) not null,
          description text not null,
          payload jsonb,
          ip_address varchar(45),
          user_agent text,
          created_at timestamp with time zone default now() not null
        );
      `;
      // Create index for fast lookups
      await queryClient`
        create index if not exists audit_logs_restaurant_id_idx on public.audit_logs(restaurant_id);
      `;
    } catch (err) {
      console.error("[AuditService] Failed to initialize audit logs table:", err);
    }
  }

  /**
   * Logs a security or operational event to the database.
   */
  async log(params: LogAuditParams): Promise<void> {
    try {
      await queryClient`
        insert into public.audit_logs (
          restaurant_id,
          user_id,
          action,
          description,
          payload,
          ip_address,
          user_agent
        ) values (
          ${params.restaurantId},
          ${params.userId || params.actorUserId || null},
          ${params.action},
          ${params.description || ""},
          ${params.payload ? JSON.stringify(params.payload) : null},
          ${params.ipAddress || null},
          ${params.userAgent || null}
        );
      `;
    } catch (err) {
      console.error("[AuditService] Failed to insert audit log:", err);
    }
  }
}
