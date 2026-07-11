import { Body, Controller, Inject, Post, Patch, UseGuards, Res, Req, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import type { LoginInput, LoginResult, RegisterInput, UpdateProfileInput } from "./auth.service.js";
import { SessionGuard } from "./session.guard.js";
import { CurrentSession } from "./current-session.decorator.js";
import type { CurrentSession as SessionType } from "./current-session.js";
import { RateLimitGuard } from "./rate-limit.guard.js";
import { SessionTokenService } from "./session-token.service.js";
import { queryClient } from "@restaurante/database";

@Controller("auth")
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(SessionTokenService) private readonly sessionTokens: SessionTokenService
  ) {}

  @Post("login")
  @UseGuards(RateLimitGuard)
  async login(
    @Body() body: LoginInput,
    @Req() request: any,
    @Res({ passthrough: true }) response: any
  ): Promise<LoginResult> {
    const ip = request.ip || (request.headers ? request.headers['x-forwarded-for'] : undefined) || 'unknown-ip';
    const userAgent = request.headers ? request.headers['user-agent'] : 'unknown-agent';
    const result = await this.authService.login(body, ip, userAgent);
    if (result.refreshToken) {
      response.cookie("gourmet_refresh_token", result.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      delete (result as any).refreshToken;
    }
    return result;
  }

  @Post("register")
  @UseGuards(RateLimitGuard)
  register(@Body() body: RegisterInput): Promise<any> {
    return this.authService.register(body);
  }

  @Patch("profile")
  @UseGuards(SessionGuard)
  updateProfile(
    @CurrentSession() session: SessionType,
    @Body() body: UpdateProfileInput
  ): Promise<any> {
    return this.authService.updateProfile(session.userId, body);
  }

  @Post("refresh")
  @UseGuards(RateLimitGuard)
  async refresh(
    @Req() request: any,
    @Res({ passthrough: true }) response: any
  ): Promise<{ accessToken: string }> {
    const cookieHeader = request.headers.cookie || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c: string) => c.trim().split("="))
    );
    const refreshToken = cookies["gourmet_refresh_token"];

    if (!refreshToken) {
      throw new UnauthorizedException("Sessão expirada. Faça login novamente.");
    }

    try {
      const payload = this.sessionTokens.verify(refreshToken);

      // Verify active device session status from database to enforce instant revocation
      if (payload.deviceSessionId) {
        const [session] = await queryClient<any[]>`
          SELECT status FROM public.device_sessions
          WHERE id = ${payload.deviceSessionId}
          LIMIT 1
        `;
        if (!session || session.status !== "APPROVED") {
          throw new UnauthorizedException("Acesso deste dispositivo foi revogado ou não está autorizado.");
        }
      }

      const newSessionPayload = {
        branchId: payload.branchId,
        email: payload.email,
        permissions: payload.permissions,
        restaurantId: payload.restaurantId,
        userId: payload.userId,
        deviceSessionId: payload.deviceSessionId
      };

      const newAccessToken = this.sessionTokens.signAccessToken(newSessionPayload);
      const newRefreshToken = this.sessionTokens.signRefreshToken(newSessionPayload);

      response.cookie("gourmet_refresh_token", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return { accessToken: newAccessToken };
    } catch (err: any) {
      throw new UnauthorizedException(err.message || "Sessão inválida.");
    }
  }

  @Post("logout")
  async logout(@Res({ passthrough: true }) response: any): Promise<{ success: boolean }> {
    response.clearCookie("gourmet_refresh_token", {
      httpOnly: true,
      secure: true,
      sameSite: "strict"
    });
    return { success: true };
  }

  @Post("verify-2fa")
  @UseGuards(RateLimitGuard)
  verifyTwoFactor(@Body() body: { tempToken: string; code: string }): Promise<LoginResult> {
    return this.authService.verifyTwoFactor(body.tempToken, body.code);
  }

  @Post("2fa/setup")
  @UseGuards(SessionGuard)
  setupTwoFactor(@CurrentSession() session: SessionType): Promise<{ secret: string; qrCodeUri: string }> {
    return this.authService.setupTwoFactor(session.userId);
  }

  @Post("2fa/activate")
  @UseGuards(SessionGuard)
  activateTwoFactor(
    @CurrentSession() session: SessionType,
    @Body() body: { code: string }
  ): Promise<{ success: boolean }> {
    return this.authService.activateTwoFactor(session.userId, body.code);
  }

  @Post("2fa/disable")
  @UseGuards(SessionGuard)
  disableTwoFactor(@CurrentSession() session: SessionType): Promise<{ success: boolean }> {
    return this.authService.disableTwoFactor(session.userId);
  }

  @Post("accept-terms")
  @UseGuards(SessionGuard)
  acceptTerms(
    @CurrentSession() session: SessionType,
    @Req() request: any
  ): Promise<{ success: boolean }> {
    const ip = request.ip || (request.headers ? request.headers['x-forwarded-for'] : undefined) || 'unknown-ip';
    return this.authService.acceptTerms(session.restaurantId, session.userId, ip);
  }

  @Post("verify-admin-password")
  @UseGuards(SessionGuard)
  async verifyAdminPassword(
    @CurrentSession() session: SessionType,
    @Body() body: { password?: string; action?: string; description?: string },
    @Req() request: any
  ): Promise<{ success: boolean }> {
    const ip = request.ip || (request.headers ? request.headers['x-forwarded-for'] : undefined) || 'unknown-ip';
    const userAgent = request.headers ? request.headers['user-agent'] : 'unknown-agent';
    
    if (!body.password) {
      throw new UnauthorizedException("A senha do administrador é obrigatória.");
    }
    
    return this.authService.verifyAdminPassword(
      session.restaurantId,
      session.userId,
      body.password,
      body.action || "admin_auth",
      body.description || "Autenticação de administrador",
      ip,
      userAgent
    );
  }
}


