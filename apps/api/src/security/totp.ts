/**
 * TOTP (Time-based One-Time Password) - RFC 6238
 * Native implementation using only node:crypto — no third-party dependencies.
 *
 * Compatible with Google Authenticator, Authy, and any RFC 6238 compliant app.
 */
import { createHmac, randomBytes } from "node:crypto";

// Base32 alphabet (RFC 4648)
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Generates a cryptographically secure random Base32 secret.
 * Standard length is 20 bytes (160 bits) → 32-character Base32 string.
 */
export function generateTotpSecret(): string {
  const bytes = randomBytes(20);
  let result = "";
  let buffer = 0;
  let bitsLeft = 0;

  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bitsLeft += 8;
    while (bitsLeft >= 5) {
      bitsLeft -= 5;
      result += BASE32_CHARS[(buffer >> bitsLeft) & 0x1f];
    }
  }
  if (bitsLeft > 0) {
    result += BASE32_CHARS[(buffer << (5 - bitsLeft)) & 0x1f];
  }
  return result;
}

/**
 * Decodes a Base32 string to a Buffer.
 */
function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/, "");
  let buffer = 0;
  let bitsLeft = 0;
  const output: number[] = [];

  for (const char of clean) {
    const val = BASE32_CHARS.indexOf(char);
    if (val === -1) continue;
    buffer = (buffer << 5) | val;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      bitsLeft -= 8;
      output.push((buffer >> bitsLeft) & 0xff);
    }
  }
  return Buffer.from(output);
}

/**
 * Computes the TOTP code for a given secret and Unix time counter.
 * Uses HMAC-SHA1 as specified in RFC 6238.
 */
function computeTotp(secret: string, counter: number): string {
  const key = base32Decode(secret);

  // Counter as 8-byte big-endian buffer
  const counterBuf = Buffer.alloc(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    counterBuf[i] = c & 0xff;
    c >>= 8;
  }

  const hmac = createHmac("sha1", key).update(counterBuf).digest();
  const lastByte = hmac[hmac.length - 1];
  if (lastByte === undefined) {
    return "000000";
  }

  const offset = lastByte & 0x0f;
  const b0 = hmac[offset] ?? 0;
  const b1 = hmac[offset + 1] ?? 0;
  const b2 = hmac[offset + 2] ?? 0;
  const b3 = hmac[offset + 3] ?? 0;

  const code =
    ((b0 & 0x7f) << 24) |
    ((b1 & 0xff) << 16) |
    ((b2 & 0xff) << 8) |
    (b3 & 0xff);

  return String(code % 1_000_000).padStart(6, "0");
}

/**
 * Validates a 6-digit TOTP code against a Base32 secret.
 * Accepts a ±1 window (30 seconds before/after) to account for clock drift.
 */
export function validateTotpCode(secret: string, token: string): boolean {
  const now = Math.floor(Date.now() / 1000 / 30);

  // Check current window and ±1 adjacent windows for clock tolerance
  for (const delta of [-1, 0, 1]) {
    if (computeTotp(secret, now + delta) === token) {
      return true;
    }
  }
  return false;
}

/**
 * Builds the otpauth:// URI used to generate QR codes for authenticator apps.
 * Format: otpauth://totp/Label?secret=SECRET&issuer=ISSUER&algorithm=SHA1&digits=6&period=30
 */
export function buildTotpUri(params: {
  secret: string;
  accountName: string;
  issuer: string;
}): string {
  const label = encodeURIComponent(`${params.issuer}:${params.accountName}`);
  const query = new URLSearchParams({
    secret: params.secret,
    issuer: params.issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30"
  });
  return `otpauth://totp/${label}?${query.toString()}`;
}
