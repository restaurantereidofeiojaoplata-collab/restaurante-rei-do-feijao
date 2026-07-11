import { ConflictException, Inject, Injectable, UnauthorizedException, Logger, BadRequestException, Optional } from "@nestjs/common";
import { queryClient } from "@restaurante/database";
import { z } from "zod";
import { hashPassword, verifyPassword } from "../security/passwords.js";
import { SessionTokenService } from "./session-token.service.js";
import { MailService } from "../mail/mail.service.js";
import { AuditService } from "../audit/audit.service.js";
import { generateTotpSecret, validateTotpCode, buildTotpUri } from "../security/totp.js";

// Lightweight interface to avoid circular import — DeviceSessionsModule provides this service
interface IDeviceSessionsService {
  resolveDeviceSession(
    restaurantId: string,
    userId: string,
    fingerprint: string,
    userAgent: string,
    ipAddress: string,
    clientLocation?: string,
    latitude?: number,
    longitude?: number
  ): Promise<{ requiresDeviceApproval: boolean; sessionId: string; allowedViews: string[] }>;
}

const loginInputSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
  restaurantSlug: z.string().min(1),
  deviceFingerprint: z.string().optional(),
  clientIp: z.string().optional(),
  clientLocation: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});


export type LoginInput = z.input<typeof loginInputSchema>;

export type LoginResult = {
  requiresTwoFactor: boolean;
  requiresDeviceApproval?: boolean;
  deviceSessionId?: string;
  restaurantId?: string;
  tempToken?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    branchId: string | null;
    email: string;
    id: string;
    name: string;
    permissions: string[];
    restaurantId: string;
    termsAccepted: boolean;
    allowedViews?: string[];
  };
};

type LoginRow = {
  branch_id: string | null;
  email: string;
  id: string;
  name: string;
  password_hash: string | null;
  permissions: string[];
  restaurant_id: string;
  two_factor_secret: string | null;
  two_factor_enabled: boolean;
  terms_accepted_at: Date | null;
};

export const registerInputSchema = z.object({
  restaurantName: z.string().min(1),
  restaurantSlug: z.string().min(1).transform((val) => val.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
  cnpj: z.string().min(14),
  niche: z.string().min(1),
  addressCep: z.string().min(8),
  addressStreet: z.string().min(1),
  addressNumber: z.string().min(1),
  addressComplement: z.string().optional(),
  addressNeighborhood: z.string().min(1),
  addressCity: z.string().min(1),
  addressState: z.string().min(2).max(2),
  branchName: z.string().min(1).default("Matriz"),
  adminName: z.string().min(1),
  adminEmail: z.string().email().transform((val) => val.toLowerCase()),
  adminPassword: z.string()
    .min(8, { message: "A senha deve ter pelo menos 8 caracteres." })
    .refine((val) => /[A-Z]/.test(val), { message: "A senha deve conter pelo menos uma letra maiúscula." })
    .refine((val) => /[a-z]/.test(val), { message: "A senha deve conter pelo menos uma letra minúscula." })
    .refine((val) => /[0-9]/.test(val), { message: "A senha deve conter pelo menos um número." })
    .refine((val) => /[^A-Za-z0-9]/.test(val), { message: "A senha deve conter pelo menos um caractere especial." })
});

export type RegisterInput = z.input<typeof registerInputSchema>;

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().transform((val) => val.toLowerCase()).optional(),
  password: z.string()
    .min(8, { message: "A senha deve ter pelo menos 8 caracteres." })
    .refine((val) => /[A-Z]/.test(val), { message: "A senha deve conter pelo menos uma letra maiúscula." })
    .refine((val) => /[a-z]/.test(val), { message: "A senha deve conter pelo menos uma letra minúscula." })
    .refine((val) => /[0-9]/.test(val), { message: "A senha deve conter pelo menos um número." })
    .refine((val) => /[^A-Za-z0-9]/.test(val), { message: "A senha deve conter pelo menos um caractere especial." })
    .optional()
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(SessionTokenService)
    private readonly sessionTokens: SessionTokenService,
    @Inject(MailService)
    private readonly mailService: MailService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
    // Injected optionally to avoid circular dependency — set externally by DeviceSessionsModule
    @Optional() @Inject("DeviceSessionsService")
    private readonly deviceSessionsService: IDeviceSessionsService | null
  ) {}

  private validateSchema<T>(schema: z.Schema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (err: any) {
      if (err instanceof z.ZodError || (err && err.name === "ZodError")) {
        const issues = err.issues || err.errors || [];
        const messages = issues.map((e: any) => e.message).join(", ");
        throw new BadRequestException(messages);
      }
      throw err;
    }
  }

  async login(input: LoginInput, ipAddress?: string, userAgent?: string): Promise<LoginResult> {
    const parsed = this.validateSchema(loginInputSchema, input);
    const [user] = await queryClient<LoginRow[]>`
      select
        u.id,
        u.email,
        u.name,
        u.password_hash,
        u.restaurant_id,
        u.branch_id,
        u.two_factor_secret,
        u.two_factor_enabled,
        r.terms_accepted_at,
        coalesce(
          array_agg(distinct p.code) filter (where p.code is not null),
          array[]::varchar[]
        ) as permissions
      from public.users u
      inner join public.restaurants r on r.id = u.restaurant_id
      left join public.user_role_assignments ura on ura.user_id = u.id
      left join public.role_permissions rp on rp.role_id = ura.role_id
      left join public.permissions p on p.id = rp.permission_id
      where r.slug = ${parsed.restaurantSlug}
        and lower(u.email) = lower(${parsed.email})
        and u.status = 'ACTIVE'
      group by u.id, r.terms_accepted_at
      limit 1
    `;

    if (!user || !(await verifyPassword(parsed.password, user.password_hash))) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    if (user.two_factor_enabled) {
      const tempToken = this.sessionTokens.sign({
        branchId: user.branch_id,
        email: user.email,
        permissions: ["2fa:pending"],
        restaurantId: user.restaurant_id,
        userId: user.id
      });

      return {
        requiresTwoFactor: true,
        tempToken
      };
    }

    await queryClient`
      update public.users set last_login_at = now(), updated_at = now()
      where id = ${user.id}
    `;

    // Verificar dispositivo suspeito (novo user-agent para este usuário)
    let isNewDevice = false;
    if (userAgent) {
      try {
        const [previousLogins] = await queryClient<any[]>`
          select id from public.audit_logs
          where user_id = ${user.id}
            and action = 'auth.login'
          limit 1
        `;
        if (previousLogins) {
          const [knownDevice] = await queryClient<any[]>`
            select id from public.audit_logs
            where user_id = ${user.id}
              and action = 'auth.login'
              and user_agent = ${userAgent}
            limit 1
          `;
          if (!knownDevice) {
            isNewDevice = true;
          }
        }
      } catch {
        // audit_logs pode não existir ainda — ignora silenciosamente
      }
    }


    if (isNewDevice) {
      await this.auditService.log({
        restaurantId: user.restaurant_id,
        userId: user.id,
        action: "auth.suspicious_login",
        description: `Alerta: Login suspeito detectado em novo dispositivo para o operador ${user.name}.`,
        payload: { userAgent, ipAddress },
        ipAddress,
        userAgent
      });

      try {
        await this.mailService.sendSecurityAlertMail(
          user.email,
          "🔐 Alerta de Segurança: Acesso em Novo Dispositivo",
          `Olá ${user.name},\n\nDetectamos um novo acesso à sua conta Gourmet no seguinte dispositivo:\n\n- Navegador/OS: ${userAgent}\n- IP: ${ipAddress}\n\nSe foi você, nenhuma ação é necessária. Se você não reconhece este acesso, por favor altere sua senha imediatamente nas configurações do sistema.`
        );
      } catch (err) {
        this.logger.error("Failed to send suspicious login email alert", err);
      }
    } else {
      await this.auditService.log({
        restaurantId: user.restaurant_id,
        userId: user.id,
        action: "auth.login",
        description: `Operador ${user.name} realizou login com sucesso.`,
        payload: { email: user.email },
        ipAddress,
        userAgent
      });
    }

    // ── Device Session Check ────────────────────────────────────────────
    if (this.deviceSessionsService && parsed.deviceFingerprint) {
      const resolvedIp = parsed.clientIp || ipAddress || "unknown";
      const deviceResult = await this.deviceSessionsService.resolveDeviceSession(
        user.restaurant_id,
        user.id,
        parsed.deviceFingerprint,
        userAgent ?? "unknown",
        resolvedIp,
        parsed.clientLocation,
        parsed.latitude,
        parsed.longitude
      );

      if (deviceResult.requiresDeviceApproval) {
        // Return minimal info so the frontend can show the waiting screen.
        // No access token is issued yet.
        return {
          requiresTwoFactor: false,
          requiresDeviceApproval: true,
          deviceSessionId: deviceResult.sessionId,
          restaurantId: user.restaurant_id
        };
      }

      // Device is approved — issue tokens with allowedViews embedded
      const sessionPayload = {
        branchId: user.branch_id,
        email: user.email,
        permissions: user.permissions,
        restaurantId: user.restaurant_id,
        userId: user.id,
        deviceSessionId: deviceResult.sessionId
      };

      const accessToken = this.sessionTokens.signAccessToken(sessionPayload);
      const refreshToken = this.sessionTokens.signRefreshToken(sessionPayload);

      return {
        requiresTwoFactor: false,
        requiresDeviceApproval: false,
        accessToken,
        refreshToken,
        user: {
          branchId: user.branch_id,
          email: user.email,
          id: user.id,
          name: user.name,
          permissions: user.permissions,
          restaurantId: user.restaurant_id,
          termsAccepted: !!user.terms_accepted_at,
          allowedViews: deviceResult.allowedViews
        }
      };
    }
    // ── No fingerprint provided — legacy flow (backward compatible) ──────
    const sessionPayload = {
      branchId: user.branch_id,
      email: user.email,
      permissions: user.permissions,
      restaurantId: user.restaurant_id,
      userId: user.id
    };

    const accessToken = this.sessionTokens.signAccessToken(sessionPayload);
    const refreshToken = this.sessionTokens.signRefreshToken(sessionPayload);

    return {
      requiresTwoFactor: false,
      accessToken,
      refreshToken,
      user: {
        branchId: user.branch_id,
        email: user.email,
        id: user.id,
        name: user.name,
        permissions: user.permissions,
        restaurantId: user.restaurant_id,
        termsAccepted: !!user.terms_accepted_at
      }
    };
  }

  async register(input: RegisterInput): Promise<any> {
    const parsed = this.validateSchema(registerInputSchema, input);

    // 1. Verify if slug is already in use
    const [existingRestaurant] = await queryClient`
      select id from public.restaurants where slug = ${parsed.restaurantSlug} limit 1
    `;
    if (existingRestaurant) {
      throw new ConflictException("Slug do restaurante já está em uso.");
    }

    // 2. Hash the admin password using scrypt
    const passwordHash = await hashPassword(parsed.adminPassword);

    let createdRestId: string = "";

    await queryClient.begin(async (transaction) => {
      // a. Create restaurant with CNPJ and serialized address/niche metadata
      const metadata = JSON.stringify({
        niche: parsed.niche,
        address: {
          cep: parsed.addressCep,
          street: parsed.addressStreet,
          number: parsed.addressNumber,
          complement: parsed.addressComplement || "",
          neighborhood: parsed.addressNeighborhood,
          city: parsed.addressCity,
          state: parsed.addressState
        }
      });

      const restaurantResult = await transaction<any[]>`
        insert into public.restaurants (name, slug, tax_id, legal_name, is_active)
        values (${parsed.restaurantName}, ${parsed.restaurantSlug}, ${parsed.cnpj}, ${metadata}, true)
        returning id
      `;
      const restaurant = restaurantResult[0];
      if (!restaurant) throw new Error("Failed to create restaurant");
      createdRestId = restaurant.id;

      // b. Create branch
      const branchResult = await transaction<any[]>`
        insert into public.branches (restaurant_id, name, slug, is_active)
        values (${restaurant.id}, ${parsed.branchName}, 'matriz', true)
        returning id
      `;
      const branch = branchResult[0];
      if (!branch) throw new Error("Failed to create branch");

      // c. Insert default permissions
      const permissions = [
        "menu:manage",
        "orders:manage",
        "kitchen:manage",
        "cash-register:manage",
        "payments:manage",
        "employees:manage",
        "system:admin"
      ];
      for (const code of permissions) {
        await transaction`
          insert into public.permissions (code, description)
          values (${code}, ${code})
          on conflict (code) do nothing
        `;
      }

      // d. Create Admin role
      const adminRoleResult = await transaction<any[]>`
        insert into public.roles (restaurant_id, name, description, is_system)
        values (${restaurant.id}, 'Administrador', 'Acesso completo ao sistema.', true)
        returning id
      `;
      const adminRole = adminRoleResult[0];
      if (!adminRole) throw new Error("Failed to create admin role");

      // e. Link permissions to role
      await transaction`
        insert into public.role_permissions (restaurant_id, role_id, permission_id)
        select ${restaurant.id}, ${adminRole.id}, p.id
        from public.permissions p
        where p.code = any(${permissions})
        on conflict (role_id, permission_id) do nothing
      `;

      // f. Create admin user
      const adminUserResult = await transaction<any[]>`
        insert into public.users (restaurant_id, branch_id, email, name, password_hash, status)
        values (${restaurant.id}, ${branch.id}, ${parsed.adminEmail}, ${parsed.adminName}, ${passwordHash}, 'ACTIVE')
        returning id
      `;
      const adminUser = adminUserResult[0];
      if (!adminUser) throw new Error("Failed to create admin user");

      // g. Assign role to user
      await transaction`
        insert into public.user_role_assignments (restaurant_id, user_id, role_id)
        values (${restaurant.id}, ${adminUser.id}, ${adminRole.id})
      `;
    });

    // Fire-and-forget: Send the onboarding email asynchronously
    void this.mailService
      .sendWelcomeMail({
        toEmail: parsed.adminEmail,
        adminName: parsed.adminName,
        restaurantName: parsed.restaurantName,
        restaurantSlug: parsed.restaurantSlug
      })
      .catch((err) => {
        this.logger.error(
          `Failed to send welcome email to ${parsed.adminEmail}:`,
          err
        );
      });

    return {
      success: true,
      restaurantId: createdRestId,
      slug: parsed.restaurantSlug
    };
  }

  async verifyTwoFactor(tempToken: string, code: string): Promise<LoginResult> {
    try {
      const payload = this.sessionTokens.verify(tempToken);

      // Verify this is indeed a temporary 2FA pending token
      if (!payload.permissions.includes("2fa:pending")) {
        throw new UnauthorizedException("Invalid token type for 2FA verification.");
      }

      // Fetch full user details now that we have verified the token
      const [user] = await queryClient<LoginRow[]>`
        select
          u.id,
          u.email,
          u.name,
          u.password_hash,
          u.restaurant_id,
          u.branch_id,
          u.two_factor_secret,
          u.two_factor_enabled,
          r.terms_accepted_at,
          coalesce(
            array_agg(distinct p.code) filter (where p.code is not null),
            array[]::varchar[]
          ) as permissions
        from public.users u
        inner join public.restaurants r on r.id = u.restaurant_id
        left join public.user_role_assignments ura on ura.user_id = u.id
        left join public.role_permissions rp on rp.role_id = ura.role_id
        left join public.permissions p on p.id = rp.permission_id
        where u.id = ${payload.userId}
        group by u.id, r.terms_accepted_at
        limit 1
      `;

      if (!user || !user.two_factor_secret || !user.two_factor_enabled) {
        throw new UnauthorizedException("Two-factor authentication is not active.");
      }

      const isValid = validateTotpCode(user.two_factor_secret, code);
      if (!isValid) {
        throw new UnauthorizedException("Código do autenticador inválido ou expirado.");
      }

      // Log successful login
      await queryClient`
        update public.users set last_login_at = now(), updated_at = now()
        where id = ${user.id}
      `;

      return {
        requiresTwoFactor: false,
        accessToken: this.sessionTokens.sign({
          branchId: user.branch_id,
          email: user.email,
          permissions: user.permissions,
          restaurantId: user.restaurant_id,
          userId: user.id
        }),
        user: {
          branchId: user.branch_id,
          email: user.email,
          id: user.id,
          name: user.name,
          permissions: user.permissions,
          restaurantId: user.restaurant_id,
          termsAccepted: !!user.terms_accepted_at
        }
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Sessão temporária expirada ou inválida.");
    }
  }

  async setupTwoFactor(userId: string): Promise<{ secret: string; qrCodeUri: string }> {
    const [user] = await queryClient<any[]>`
      select email from public.users where id = ${userId} limit 1
    `;
    if (!user) {
      throw new BadRequestException("User not found.");
    }

    const secret = generateTotpSecret();
    const qrCodeUri = buildTotpUri({
      secret,
      accountName: user.email,
      issuer: "GourmetOS"
    });

    // Save the temporary secret. Enabled state remains false until activation check succeeds.
    await queryClient`
      update public.users
      set two_factor_secret = ${secret}, two_factor_enabled = false, updated_at = now()
      where id = ${userId}
    `;

    return {
      secret,
      qrCodeUri
    };
  }

  async activateTwoFactor(userId: string, code: string): Promise<{ success: boolean }> {
    const [user] = await queryClient<any[]>`
      select two_factor_secret from public.users where id = ${userId} limit 1
    `;
    if (!user || !user.two_factor_secret) {
      throw new BadRequestException("Configuração do 2FA não iniciada.");
    }

    const isValid = validateTotpCode(user.two_factor_secret, code);
    if (!isValid) {
      throw new BadRequestException("Código de verificação incorreto ou expirado. Tente novamente.");
    }

    await queryClient`
      update public.users
      set two_factor_enabled = true, updated_at = now()
      where id = ${userId}
    `;

    return {
      success: true
    };
  }

  async disableTwoFactor(userId: string): Promise<{ success: boolean }> {
    await queryClient`
      update public.users
      set two_factor_secret = null, two_factor_enabled = false, updated_at = now()
      where id = ${userId}
    `;

    return {
      success: true
    };
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<any> {
    const parsed = this.validateSchema(updateProfileSchema, input);

    const [user] = await queryClient`
      select id, restaurant_id from public.users where id = ${userId} limit 1
    `;
    if (!user) {
      throw new UnauthorizedException("Usuário não encontrado.");
    }

    if (parsed.email) {
      const [existingEmail] = await queryClient`
        select id from public.users 
        where lower(email) = lower(${parsed.email}) 
          and id != ${userId} 
          and restaurant_id = ${user.restaurant_id}
        limit 1
      `;
      if (existingEmail) {
        throw new ConflictException("E-mail já está em uso.");
      }
    }

    const updates: Record<string, any> = {};
    if (parsed.name) updates.name = parsed.name;
    if (parsed.email) updates.email = parsed.email;
    if (parsed.password) {
      updates.password_hash = await hashPassword(parsed.password);
    }

    if (Object.keys(updates).length === 0) {
      return { success: true };
    }

    await queryClient`
      update public.users
      set
        name = coalesce(${updates.name}, name),
        email = coalesce(${updates.email}, email),
        password_hash = coalesce(${updates.password_hash}, password_hash),
        updated_at = now()
      where id = ${userId}
    `;

    const [updatedUser] = await queryClient<any[]>`
      select id, name, email from public.users where id = ${userId} limit 1
    `;

    if (!updatedUser) {
      throw new UnauthorizedException("Erro ao obter dados do usuário atualizado.");
    }

    return {
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email
      }
    };
  }

  async acceptTerms(restaurantId: string, userId: string, ipAddress: string): Promise<{ success: boolean }> {
    await queryClient`
      update public.restaurants
      set terms_accepted_at = now(),
          terms_accepted_by = ${userId},
          terms_accepted_ip = ${ipAddress},
          updated_at = now()
      where id = ${restaurantId}
    `;
    return { success: true };
  }

  async verifyAdminPassword(
    restaurantId: string,
    userId: string,
    adminPassword: string,
    action: string,
    description: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ success: boolean }> {
    // Find all users of this restaurant with role name 'Administrador'
    const admins = await queryClient<any[]>`
      select u.id, u.name, u.password_hash
      from public.users u
      inner join public.user_role_assignments ura on u.id = ura.user_id
      inner join public.roles r on ura.role_id = r.id
      where u.restaurant_id = ${restaurantId} and r.name = 'Administrador'
    `;

    let isValid = false;
    for (const admin of admins) {
      if (admin.password_hash && (await verifyPassword(adminPassword, admin.password_hash))) {
        isValid = true;
        break;
      }
    }

    if (!isValid) {
      throw new UnauthorizedException("Senha de administrador incorreta.");
    }

    // Log this action to the audit logs
    await this.auditService.log({
      restaurantId,
      userId,
      action,
      description,
      ipAddress,
      userAgent
    });

    return { success: true };
  }
}


