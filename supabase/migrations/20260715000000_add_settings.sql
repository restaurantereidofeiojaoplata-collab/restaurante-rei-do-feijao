-- Create settings table for database-persisted configuration parameters
CREATE TABLE IF NOT EXISTS "settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurant_id" uuid NOT NULL REFERENCES "restaurants"("id") ON DELETE CASCADE,
  "key" varchar(120) NOT NULL,
  "value" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "settings_restaurant_id_idx" ON "settings"("restaurant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "settings_restaurant_key_unique" ON "settings"("restaurant_id", "key");
