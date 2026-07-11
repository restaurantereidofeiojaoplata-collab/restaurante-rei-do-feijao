import { queryClient } from "./client.js";
import { loadDatabaseEnvFiles } from "./env.js";

async function main(): Promise<void> {
  loadDatabaseEnvFiles();

  console.log("Iniciando limpeza completa das contas e dados operacionais...");

  await queryClient.begin(async (transaction) => {
    // Truncate all operational and user account tables cascade style, preserving only permissions table structure
    await transaction`
      truncate table 
        public.audit_logs,
        public.idempotency_keys,
        public.cash_movements,
        public.cash_register_sessions,
        public.cash_registers,
        public.kitchen_ticket_items,
        public.kitchen_tickets,
        public.payment_transactions,
        public.payment_intents,
        public.order_items,
        public.orders,
        public.table_sessions,
        public.dining_tables,
        public.user_role_assignments,
        public.role_permissions,
        public.users,
        public.roles,
        public.branches,
        public.restaurants
        cascade;
    `;
  });

  console.log("Limpeza de banco de dados concluída com sucesso! Todas as contas e relatórios operacionais foram removidos.");
}

try {
  await main();
} catch (err) {
  console.error("Erro ao limpar banco de dados:", err);
} finally {
  await queryClient.end();
}
