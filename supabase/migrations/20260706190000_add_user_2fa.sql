-- Migration: Add Two-Factor Authentication (TOTP) columns to public.users
-- Compatible with Google Authenticator (RFC 6238)

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS two_factor_secret text,
  ADD COLUMN IF NOT EXISTS two_factor_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.users.two_factor_secret IS 'Base32-encoded TOTP secret for Google Authenticator. NULL if 2FA not configured.';
COMMENT ON COLUMN public.users.two_factor_enabled IS 'Whether TOTP two-factor authentication is active for this user.';
