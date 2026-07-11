-- Device access approval system
-- Creates device_sessions table with status enum for multi-device login control

CREATE TYPE "public"."device_session_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'REVOKED');

CREATE TABLE "device_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "device_fingerprint" text NOT NULL,
  "device_name" text,
  "user_agent" text,
  "ip_address" varchar(45),
  "status" "device_session_status" DEFAULT 'PENDING' NOT NULL,
  "allowed_views" jsonb DEFAULT '[]' NOT NULL,
  "requested_at" timestamp with time zone DEFAULT now() NOT NULL,
  "resolved_at" timestamp with time zone,
  "resolved_by_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "device_sessions"
  ADD CONSTRAINT "device_sessions_restaurant_id_restaurants_id_fk"
  FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "device_sessions"
  ADD CONSTRAINT "device_sessions_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "device_sessions"
  ADD CONSTRAINT "device_sessions_resolved_by_id_users_id_fk"
  FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX "device_sessions_restaurant_id_idx" ON "device_sessions" USING btree ("restaurant_id");
CREATE INDEX "device_sessions_user_id_idx" ON "device_sessions" USING btree ("user_id");
CREATE INDEX "device_sessions_status_idx" ON "device_sessions" USING btree ("status");
CREATE UNIQUE INDEX "device_sessions_user_fingerprint_unique" ON "device_sessions" USING btree ("user_id","device_fingerprint");
