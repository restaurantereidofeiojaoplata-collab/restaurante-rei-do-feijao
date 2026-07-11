import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

interface RateLimitData {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  // Map containing IP-based limits for strict routes (Key: IP)
  private static strictLimits = new Map<string, RateLimitData>();
  // Map containing IP-based limits for general routes (Key: IP)
  private static generalLimits = new Map<string, RateLimitData>();

  // Map of banned IPs and their unban timestamps (Key: IP -> timestamp)
  private static bannedIps = new Map<string, number>();
  // Map of rate limit violations count (Key: IP -> count)
  private static violationsCount = new Map<string, number>();

  // Configuration for lockout
  private readonly BANNED_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours lockout

  // Limits configuration
  private readonly STRICT_LIMIT = 5;
  private readonly STRICT_WINDOW_MS = 60000; // 1 minute

  private readonly GENERAL_LIMIT = 120;
  private readonly GENERAL_WINDOW_MS = 60000; // 1 minute

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<any>();
    const ip = request.ip || (request.headers ? request.headers['x-forwarded-for'] : undefined) || 'unknown-ip';
    const path = request.url || '';

    const now = Date.now();

    // Check if IP is currently banned
    const banExpiration = RateLimitGuard.bannedIps.get(ip);
    if (banExpiration) {
      if (now < banExpiration) {
        const hoursLeft = ((banExpiration - now) / (60 * 60 * 1000)).toFixed(1);
        throw new HttpException(
          `Acesso bloqueado temporariamente por comportamento suspeito detectado. O bloqueio de segurança expira em ${hoursLeft} horas.`,
          HttpStatus.FORBIDDEN
        );
      } else {
        // Ban expired, remove IP from ban list and reset violations
        RateLimitGuard.bannedIps.delete(ip);
        RateLimitGuard.violationsCount.delete(ip);
      }
    }

    // Check if the route is a sensitive auth route (strict protection)
    const isStrictRoute = path.includes('/auth/login') || path.includes('/auth/register') || path.includes('/auth/verify-2fa');

    const limitsMap = isStrictRoute ? RateLimitGuard.strictLimits : RateLimitGuard.generalLimits;
    const limit = isStrictRoute ? this.STRICT_LIMIT : this.GENERAL_LIMIT;
    const windowMs = isStrictRoute ? this.STRICT_WINDOW_MS : this.GENERAL_WINDOW_MS;

    const limitData = limitsMap.get(ip);

    if (!limitData) {
      limitsMap.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (now > limitData.resetTime) {
      // Window expired, reset counter
      limitData.count = 1;
      limitData.resetTime = now + windowMs;
      limitsMap.set(ip, limitData);
      return true;
    }

    if (limitData.count >= limit) {
      // Increment violations
      const currentViolations = (RateLimitGuard.violationsCount.get(ip) || 0) + 1;
      RateLimitGuard.violationsCount.set(ip, currentViolations);

      if (currentViolations >= 3) {
        // Ban IP for 24 hours
        RateLimitGuard.bannedIps.set(ip, now + this.BANNED_DURATION_MS);
        throw new HttpException(
          `Comportamento suspeito de tentativa de invasão detectado. Seu IP foi bloqueado em todas as rotas por 24 horas.`,
          HttpStatus.FORBIDDEN
        );
      }

      const remainingSeconds = Math.ceil((limitData.resetTime - now) / 1000);
      throw new HttpException(
        isStrictRoute 
          ? `Muitas tentativas de login. Tentativas abusivas causarão bloqueio total de IP (Alerta de Invasão: ${currentViolations}/3). Aguarde ${remainingSeconds} segundos.`
          : `Bloqueio contra abusos (Rate Limit) (Alerta de Invasão: ${currentViolations}/3). Aguarde ${remainingSeconds} segundos.`,
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    limitData.count += 1;
    limitsMap.set(ip, limitData);
    return true;
  }
}
