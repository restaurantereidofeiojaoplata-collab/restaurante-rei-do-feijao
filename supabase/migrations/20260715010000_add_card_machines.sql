-- Create card_machines table and link card_machine_id to payment_transactions
CREATE TABLE IF NOT EXISTS "card_machines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurant_id" uuid NOT NULL REFERENCES "restaurants"("id") ON DELETE RESTRICT,
  "name" text NOT NULL,
  "model" text NOT NULL,
  "serial_number" varchar(120) NOT NULL,
  "credit_fee" double precision DEFAULT 2.5 NOT NULL,
  "debit_fee" double precision DEFAULT 1.5 NOT NULL,
  "pix_fee" double precision DEFAULT 0.0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "card_machines_restaurant_id_idx" ON "card_machines"("restaurant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "card_machines_serial_number_unique" ON "card_machines"("serial_number");

-- Alter payment_transactions to include card_machine_id column referencing card_machines table
ALTER TABLE "payment_transactions" ADD COLUMN IF NOT EXISTS "card_machine_id" uuid REFERENCES "card_machines"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "payment_transactions_card_machine_id_idx" ON "payment_transactions"("card_machine_id");
