import { createHmac, timingSafeEqual } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { loadDatabaseEnvFiles } from "@restaurante/database";
import type { CurrentSession } from "./current-session.js";

type SessionTokenOptions = {
  expiresInSeconds?: number;
  now?: () => Date;
  secret?: string;
};

type TokenPayload = CurrentSession & {
  exp: number;
  iat: number;
};

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function base64UrlJson(value: unknown): string {
  return base64UrlEncode(JSON.stringify(value));
}

function parseBase64UrlJson<T>(value: string): T {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

@Injectable()
export class SessionTokenService {
  private readonly expiresInSeconds: number;
  private readonly now: () => Date;
  private readonly secret: string;

  constructor(options: SessionTokenOptions = {}) {
    loadDatabaseEnvFiles();

    this.expiresInSeconds = options.expiresInSeconds ?? 60 * 60 * 8;
    this.now = options.now ?? (() => new Date());
    this.secret = options.secret ?? process.env.JWT_SECRET ?? "";

    if (this.secret.length < 16) {
      throw new Error("JWT_SECRET must be at least 16 characters.");
    }
  }

  sign(session: CurrentSession): string {
    const issuedAt = Math.floor(this.now().getTime() / 1000);
    const payload: TokenPayload = {
      ...session,
      exp: issuedAt + this.expiresInSeconds,
      iat: issuedAt
    };
    const encodedHeader = base64UrlJson({ alg: "HS256", typ: "JWT" });
    const encodedPayload = base64UrlJson(payload);
    const signature = this.signParts(encodedHeader, encodedPayload);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  signAccessToken(session: CurrentSession): string {
    const issuedAt = Math.floor(this.now().getTime() / 1000);
    const payload: TokenPayload = {
      ...session,
      exp: issuedAt + (15 * 60), // 15 minutes
      iat: issuedAt
    };
    const encodedHeader = base64UrlJson({ alg: "HS256", typ: "JWT" });
    const encodedPayload = base64UrlJson(payload);
    const signature = this.signParts(encodedHeader, encodedPayload);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  signRefreshToken(session: CurrentSession): string {
    const issuedAt = Math.floor(this.now().getTime() / 1000);
    const payload: TokenPayload = {
      ...session,
      exp: issuedAt + (7 * 24 * 60 * 60), // 7 days
      iat: issuedAt
    };
    const encodedHeader = base64UrlJson({ alg: "HS256", typ: "JWT" });
    const encodedPayload = base64UrlJson(payload);
    const signature = this.signParts(encodedHeader, encodedPayload);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  verify(token: string): TokenPayload {
    const [encodedHeader, encodedPayload, signature] = token.split(".");

    if (!encodedHeader || !encodedPayload || !signature) {
      throw new Error("Invalid session token");
    }

    const expectedSignature = this.signParts(encodedHeader, encodedPayload);
    const expected = Buffer.from(expectedSignature);
    const actual = Buffer.from(signature);

    if (expected.length !== actual.length || !timingSafeEqual(actual, expected)) {
      throw new Error("Invalid session token");
    }

    const payload = parseBase64UrlJson<TokenPayload>(encodedPayload);
    const now = Math.floor(this.now().getTime() / 1000);

    if (!payload.exp || payload.exp < now) {
      throw new Error("Invalid session token");
    }

    return payload;
  }

  private signParts(encodedHeader: string, encodedPayload: string): string {
    return createHmac("sha256", this.secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64url");
  }
}
