/**
 * Inicialização de segurança client-side.
 * Nota: Proteções client-side (bloqueio de DevTools, atalhos) foram removidas —
 * são trivialmente bypassáveis e prejudicam debugging legítimo.
 * A segurança real do sistema reside inteiramente no backend (JWT, rate-limit, RBAC).
 */
export function initializeClientSecurity() {
  // Segurança gerenciada pelo backend. Nenhuma ação necessária no cliente.
}
