-- Device access approval system
-- Creates device_sessions table for multi-device login control with admin approval workflow

CREATE TYPE "public"."device_session_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'REVOKED');

CREATE TABLE "public"."device_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "device_fingerprint" text NOT NULL,
  "device_name" text,
  "user_agent" text,
  "ip_address" varchar(45),
  "status" "public"."device_session_status" DEFAULT 'PENDING' NOT NULL,
  "allowed_views" jsonb DEFAULT '[]' NOT NULL,
  "requested_at" timestamp with time zone DEFAULT now() NOT NULL,
  "resolved_at" timestamp with time zone,
  "resolved_by_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "device_sessions_restaurant_id_fk"
    FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade,
  CONSTRAINT "device_sessions_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade,
  CONSTRAINT "device_sessions_resolved_by_id_fk"
    FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE set null
);

CREATE INDEX "device_sessions_restaurant_id_idx" ON "public"."device_sessions" ("restaurant_id");
CREATE INDEX "device_sessions_user_id_idx" ON "public"."device_sessions" ("user_id");
CREATE INDEX "device_sessions_status_idx" ON "public"."device_sessions" ("status");
CREATE UNIQUE INDEX "device_sessions_user_fingerprint_unique"
  ON "public"."device_sessions" ("user_id", "device_fingerprint");
