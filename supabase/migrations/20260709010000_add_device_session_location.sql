-- Add location column to device_sessions table
ALTER TABLE "public"."device_sessions" ADD COLUMN "location" text;
