export const defaultPermissionCodes = [
  "system:admin",
  "users:manage",
  "menu:manage",
  "orders:read",
  "orders:manage",
  "payments:read",
  "payments:manage",
  "cash-register:manage",
  "reports:read",
  "settings:manage"
] as const;

export type SeedConfig = {
  adminEmail: string;
  adminName: string;
  adminPassword: string | null;
  branchName: string;
  branchSlug: string;
  restaurantName: string;
  restaurantSlug: string;
};

export function parseSeedConfig(
  source: Record<string, string | undefined> = process.env
): SeedConfig {
  return {
    adminEmail:
      source.SEED_ADMIN_EMAIL?.trim().toLowerCase() ??
      "admin@reidofeijao.local",
    adminName: source.SEED_ADMIN_NAME?.trim() ?? "Administrador",
    adminPassword: source.SEED_ADMIN_PASSWORD?.trim() || null,
    branchName: source.SEED_BRANCH_NAME?.trim() ?? "Matriz",
    branchSlug: source.SEED_BRANCH_SLUG?.trim() ?? "matriz",
    restaurantName:
      source.SEED_RESTAURANT_NAME?.trim() ?? "Restaurante Rei do Feijao",
    restaurantSlug: source.SEED_RESTAURANT_SLUG?.trim() ?? "rei-do-feijao"
  };
}

export function permissionDescription(code: string): string {
  const descriptions: Record<string, string> = {
    "cash-register:manage": "Abrir, fechar e operar caixa.",
    "menu:manage": "Criar e editar produtos, categorias e precos.",
    "orders:manage": "Criar, alterar, cancelar e concluir pedidos.",
    "orders:read": "Visualizar pedidos e comandas.",
    "payments:manage": "Registrar, cancelar e conciliar pagamentos.",
    "payments:read": "Visualizar pagamentos e conciliacao.",
    "reports:read": "Visualizar relatorios gerenciais.",
    "settings:manage": "Alterar configuracoes do restaurante.",
    "system:admin": "Acesso administrativo completo.",
    "users:manage": "Criar usuarios, cargos e permissoes."
  };

  return descriptions[code] ?? code;
}
