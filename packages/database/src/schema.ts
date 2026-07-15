import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  doublePrecision
} from "drizzle-orm/pg-core";

export const userStatusEnum = pgEnum("user_status", [
  "ACTIVE",
  "INVITED",
  "SUSPENDED",
  "DISABLED"
]);

export const orderOriginEnum = pgEnum("order_origin", [
  "TABLE",
  "COUNTER",
  "PICKUP",
  "DELIVERY"
]);

export const orderStatusEnum = pgEnum("order_status", [
  "OPEN",
  "SENT_TO_KITCHEN",
  "IN_PREPARATION",
  "READY",
  "DELIVERED",
  "PARTIALLY_PAID",
  "PAID",
  "CANCELLED"
]);

export const paymentProviderEnum = pgEnum("payment_provider", [
  "CASH",
  "MANUAL",
  "PAGBANK"
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "CASH",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "PIX",
  "VOUCHER"
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "DRAFT",
  "PENDING",
  "PROCESSING",
  "APPROVED",
  "SETTLED",
  "DECLINED",
  "CANCELLED",
  "EXPIRED",
  "INDETERMINATE",
  "REFUND_PENDING",
  "REFUNDED"
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
};

export const restaurants = pgTable(
  "restaurants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: varchar("slug", { length: 120 }).notNull(),
    legalName: text("legal_name"),
    taxId: varchar("tax_id", { length: 32 }),
    isActive: boolean("is_active").default(true).notNull(),
    termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
    termsAcceptedBy: uuid("terms_accepted_by"),
    termsAcceptedIp: varchar("terms_accepted_ip", { length: 45 }),
    ...timestamps
  },
  (table) => [uniqueIndex("restaurants_slug_unique").on(table.slug)]
);

export const branches = pgTable(
  "branches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "restrict" })
      .notNull(),
    name: text("name").notNull(),
    slug: varchar("slug", { length: 120 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps
  },
  (table) => [
    index("branches_restaurant_id_idx").on(table.restaurantId),
    uniqueIndex("branches_restaurant_slug_unique").on(
      table.restaurantId,
      table.slug
    )
  ]
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "restrict" })
      .notNull(),
    branchId: uuid("branch_id").references(() => branches.id, {
      onDelete: "set null"
    }),
    email: varchar("email", { length: 255 }).notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash"),
    pinHash: text("pin_hash"),
    status: userStatusEnum("status").default("INVITED").notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    twoFactorSecret: text("two_factor_secret"),
    twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
    ...timestamps
  },
  (table) => [
    index("users_restaurant_id_idx").on(table.restaurantId),
    uniqueIndex("users_restaurant_email_unique").on(
      table.restaurantId,
      table.email
    )
  ]
);


export const roles = pgTable(
  "roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "restrict" })
      .notNull(),
    name: varchar("name", { length: 80 }).notNull(),
    description: text("description"),
    isSystem: boolean("is_system").default(false).notNull(),
    ...timestamps
  },
  (table) => [
    index("roles_restaurant_id_idx").on(table.restaurantId),
    uniqueIndex("roles_restaurant_name_unique").on(
      table.restaurantId,
      table.name
    )
  ]
);

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 120 }).notNull(),
    description: text("description"),
    ...timestamps
  },
  (table) => [uniqueIndex("permissions_code_unique").on(table.code)]
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "restrict" })
      .notNull(),
    roleId: uuid("role_id")
      .references(() => roles.id, { onDelete: "cascade" })
      .notNull(),
    permissionId: uuid("permission_id")
      .references(() => permissions.id, { onDelete: "cascade" })
      .notNull(),
    ...timestamps
  },
  (table) => [
    index("role_permissions_restaurant_id_idx").on(table.restaurantId),
    uniqueIndex("role_permissions_unique").on(
      table.roleId,
      table.permissionId
    )
  ]
);

export const userRoleAssignments = pgTable(
  "user_role_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "restrict" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    roleId: uuid("role_id")
      .references(() => roles.id, { onDelete: "cascade" })
      .notNull(),
    ...timestamps
  },
  (table) => [
    index("user_role_assignments_restaurant_id_idx").on(table.restaurantId),
    uniqueIndex("user_role_assignments_unique").on(table.userId, table.roleId)
  ]
);

export const diningTables = pgTable(
  "dining_tables",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "restrict" })
      .notNull(),
    branchId: uuid("branch_id")
      .references(() => branches.id, { onDelete: "restrict" })
      .notNull(),
    number: varchar("number", { length: 40 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps
  },
  (table) => [
    index("dining_tables_restaurant_id_idx").on(table.restaurantId),
    uniqueIndex("dining_tables_restaurant_branch_number_unique").on(
      table.restaurantId,
      table.branchId,
      table.number
    )
  ]
);

// Table Sessions
export const tableSessions = pgTable(
  "table_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "restrict" })
      .notNull(),
    branchId: uuid("branch_id")
      .references(() => branches.id, { onDelete: "restrict" })
      .notNull(),
    tableId: uuid("table_id")
      .references(() => diningTables.id, { onDelete: "restrict" })
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    openedAt: timestamp("opened_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    ...timestamps
  },
  (table) => [
    index("table_sessions_restaurant_id_idx").on(table.restaurantId),
    index("table_sessions_table_active_idx").on(table.tableId, table.isActive)
  ]
);

// Kitchen Tickets (KDS)
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "restrict" })
      .notNull(),
    branchId: uuid("branch_id")
      .references(() => branches.id, { onDelete: "restrict" })
      .notNull(),
    orderNumber: varchar("order_number", { length: 40 }).notNull(),
    origin: orderOriginEnum("origin").notNull(),
    status: orderStatusEnum("status").default("OPEN").notNull(),
    subtotalAmountInCents: integer("subtotal_amount_in_cents")
      .default(0)
      .notNull(),
    discountAmountInCents: integer("discount_amount_in_cents")
      .default(0)
      .notNull(),
    serviceFeeAmountInCents: integer("service_fee_amount_in_cents")
      .default(0)
      .notNull(),
    totalAmountInCents: integer("total_amount_in_cents").default(0).notNull(),
    currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null"
    }),
    tableSessionId: uuid("table_session_id").references(() => tableSessions.id, {
      onDelete: "restrict"
    }),
    version: integer("version").default(1).notNull(),
    ...timestamps
  },
  (table) => [
    index("orders_restaurant_id_idx").on(table.restaurantId),
    index("orders_branch_status_idx").on(table.branchId, table.status),
    uniqueIndex("orders_restaurant_order_number_unique").on(
      table.restaurantId,
      table.orderNumber
    )
  ]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "restrict" })
      .notNull(),
    orderId: uuid("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    nameSnapshot: text("name_snapshot").notNull(),
    quantity: integer("quantity").notNull(),
    unitAmountInCents: integer("unit_amount_in_cents").notNull(),
    totalAmountInCents: integer("total_amount_in_cents").notNull(),
    notes: text("notes"),
    ...timestamps
  },
  (table) => [
    index("order_items_restaurant_id_idx").on(table.restaurantId),
    index("order_items_order_id_idx").on(table.orderId)
  ]
);

export const paymentIntents = pgTable(
  "payment_intents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "restrict" })
      .notNull(),
    orderId: uuid("order_id")
      .references(() => orders.id, { onDelete: "restrict" })
      .notNull(),
    provider: paymentProviderEnum("provider").notNull(),
    method: paymentMethodEnum("method").notNull(),
    status: paymentStatusEnum("status").default("DRAFT").notNull(),
    amountInCents: integer("amount_in_cents").notNull(),
    currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 180 }).notNull(),
    correlationId: varchar("correlation_id", { length: 180 }).notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ...timestamps
  },
  (table) => [
    index("payment_intents_restaurant_id_idx").on(table.restaurantId),
    index("payment_intents_order_id_idx").on(table.orderId),
    uniqueIndex("payment_intents_restaurant_idempotency_unique").on(
      table.restaurantId,
      table.idempotencyKey
    )
  ]
);

// Card Machines / POS Terminals
export const cardMachines = pgTable(
  "card_machines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "restrict" })
      .notNull(),
    name: text("name").notNull(),
    model: text("model").notNull(),
    serialNumber: varchar("serial_number", { length: 120 }).notNull(),
    creditFee: doublePrecision("credit_fee").default(2.5).notNull(),
    debitFee: doublePrecision("debit_fee").default(1.5).notNull(),
    pixFee: doublePrecision("pix_fee").default(0.0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index("card_machines_restaurant_id_idx").on(table.restaurantId),
    uniqueIndex("card_machines_serial_number_unique").on(table.serialNumber)
  ]
);

export const paymentTransactions = pgTable(
  "payment_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "restrict" })
      .notNull(),
    paymentIntentId: uuid("payment_intent_id")
      .references(() => paymentIntents.id, { onDelete: "restrict" })
      .notNull(),
    cardMachineId: uuid("card_machine_id")
      .references(() => cardMachines.id, { onDelete: "set null" }),
    provider: paymentProviderEnum("provider").notNull(),
    providerTransactionId: varchar("provider_transaction_id", { length: 180 }),
    status: paymentStatusEnum("status").notNull(),
    amountInCents: integer("amount_in_cents").notNull(),
    rawPayload: jsonb("raw_payload").$type<Record<string, unknown>>(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }),
    ...timestamps
  },
  (table) => [
    index("payment_transactions_restaurant_id_idx").on(table.restaurantId),
    index("payment_transactions_intent_id_idx").on(table.paymentIntentId),
    index("payment_transactions_card_machine_id_idx").on(table.cardMachineId),
    uniqueIndex("payment_transactions_provider_reference_unique").on(
      table.provider,
      table.providerTransactionId
    )
  ]
);


export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "restrict" })
      .notNull(),
    scope: varchar("scope", { length: 120 }).notNull(),
    key: varchar("key", { length: 180 }).notNull(),
    requestHash: text("request_hash").notNull(),
    responseBody: jsonb("response_body").$type<Record<string, unknown>>(),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    ...timestamps
  },
  (table) => [
    index("idempotency_keys_restaurant_id_idx").on(table.restaurantId),
    uniqueIndex("idempotency_keys_scope_key_unique").on(
      table.restaurantId,
      table.scope,
      table.key
    )
  ]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "restrict" })
      .notNull(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null"
    }),
    action: varchar("action", { length: 160 }).notNull(),
    resourceType: varchar("resource_type", { length: 120 }).notNull(),
    resourceId: uuid("resource_id"),
    result: varchar("result", { length: 40 }).notNull(),
    requestId: varchar("request_id", { length: 120 }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index("audit_logs_restaurant_id_idx").on(table.restaurantId),
    index("audit_logs_resource_idx").on(table.resourceType, table.resourceId)
  ]
);

// --- NEW OPERATIONAL ENUMS AND TABLES ---

export const kitchenTicketStatusEnum = pgEnum("kitchen_ticket_status", [
  "PENDING",
  "PREPARING",
  "READY",
  "DELIVERED"
]);

export const kitchenTicketItemStatusEnum = pgEnum("kitchen_ticket_item_status", [
  "PENDING",
  "PREPARING",
  "READY",
  "DELIVERED"
]);

export const cashRegisterSessionStatusEnum = pgEnum("cash_register_session_status", [
  "OPEN",
  "CLOSED"
]);

export const cashMovementTypeEnum = pgEnum("cash_movement_type", [
  "OPENING_BALANCE",
  "SUPRIMENTO",
  "SANGRIA",
  "PAYMENT",
  "REFUND"
]);

// Categories
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "restrict" })
      .notNull(),
    name: text("name").notNull(),
    slug: varchar("slug", { length: 120 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    type: varchar("type", { length: 40 }).default("product").notNull(),
    ...timestamps
  },
  (table) => [
    index("categories_restaurant_id_idx").on(table.restaurantId),
    uniqueIndex("categories_restaurant_slug_unique").on(
      table.restaurantId,
      table.slug
    )
  ]
);

// Products
export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "restrict" })
      .notNull(),
    categoryId: uuid("category_id")
      .references(() => categories.id, { onDelete: "restrict" })
      .notNull(),
    name: text("name").notNull(),
    description: text("description"),
    slug: varchar("slug", { length: 120 }).notNull(),
    sku: varchar("sku", { length: 80 }),
    unitAmountInCents: integer("unit_amount_in_cents").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps
  },
  (table) => [
    index("products_restaurant_id_idx").on(table.restaurantId),
    index("products_category_id_idx").on(table.categoryId),
    uniqueIndex("products_restaurant_slug_unique").on(
      table.restaurantId,
      table.slug
    )
  ]
);

// Dining Tables
export const kitchenTickets = pgTable(
  "kitchen_tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "restrict" })
      .notNull(),
    orderId: uuid("order_id")
      .references(() => orders.id, { onDelete: "restrict" })
      .notNull(),
    status: kitchenTicketStatusEnum("status").default("PENDING").notNull(),
    ...timestamps
  },
  (table) => [
    index("kitchen_tickets_restaurant_id_idx").on(table.restaurantId),
    index("kitchen_tickets_order_id_idx").on(table.orderId)
  ]
);

export const kitchenTicketItems = pgTable(
  "kitchen_ticket_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "restrict" })
      .notNull(),
    ticketId: uuid("ticket_id")
      .references(() => kitchenTickets.id, { onDelete: "cascade" })
      .notNull(),
    orderItemId: uuid("order_item_id")
      .references(() => orderItems.id, { onDelete: "cascade" })
      .notNull(),
    quantity: integer("quantity").notNull(),
    status: kitchenTicketItemStatusEnum("status").default("PENDING").notNull(),
    ...timestamps
  },
  (table) => [
    index("kitchen_ticket_items_restaurant_id_idx").on(table.restaurantId),
    index("kitchen_ticket_items_ticket_id_idx").on(table.ticketId)
  ]
);

// Cash Registers
export const cashRegisters = pgTable(
  "cash_registers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "restrict" })
      .notNull(),
    branchId: uuid("branch_id")
      .references(() => branches.id, { onDelete: "restrict" })
      .notNull(),
    name: text("name").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps
  },
  (table) => [
    index("cash_registers_restaurant_id_idx").on(table.restaurantId),
    uniqueIndex("cash_registers_restaurant_branch_name_unique").on(
      table.restaurantId,
      table.branchId,
      table.name
    )
  ]
);

// Cash Register Sessions
export const cashRegisterSessions = pgTable(
  "cash_register_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "restrict" })
      .notNull(),
    branchId: uuid("branch_id")
      .references(() => branches.id, { onDelete: "restrict" })
      .notNull(),
    cashRegisterId: uuid("cash_register_id")
      .references(() => cashRegisters.id, { onDelete: "restrict" })
      .notNull(),
    openedById: uuid("opened_by_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    closedById: uuid("closed_by_id").references(() => users.id, {
      onDelete: "restrict"
    }),
    openedAt: timestamp("opened_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    openingBalanceInCents: integer("opening_balance_in_cents").notNull(),
    closingBalanceInCents: integer("closing_balance_in_cents"),
    expectedClosingBalanceInCents: integer("expected_closing_balance_in_cents"),
    closingDifferenceInCents: integer("closing_difference_in_cents"),
    status: cashRegisterSessionStatusEnum("status").default("OPEN").notNull(),
    notes: text("notes"),
    ...timestamps
  },
  (table) => [
    index("cash_register_sessions_restaurant_id_idx").on(table.restaurantId),
    index("cash_register_sessions_register_status_idx").on(
      table.cashRegisterId,
      table.status
    )
  ]
);

// Cash Movements
export const cashMovements = pgTable(
  "cash_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "restrict" })
      .notNull(),
    sessionId: uuid("session_id")
      .references(() => cashRegisterSessions.id, { onDelete: "restrict" })
      .notNull(),
    type: cashMovementTypeEnum("type").notNull(),
    amountInCents: integer("amount_in_cents").notNull(),
    notes: text("notes"),
    performedById: uuid("performed_by_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    ...timestamps
  },
  (table) => [
    index("cash_movements_restaurant_id_idx").on(table.restaurantId),
    index("cash_movements_session_id_idx").on(table.sessionId)
  ]
);

// ─── Device Sessions (multi-device access approval) ────────────────────────

export const deviceSessionStatusEnum = pgEnum("device_session_status", [
  "PENDING",    // waiting for admin approval
  "APPROVED",   // admin approved
  "REJECTED",   // admin rejected
  "REVOKED"     // admin revoked after approval
]);

export const deviceSessions = pgTable(
  "device_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    // sha256 hash of userAgent+screenSize+timezone — identifies the device
    deviceFingerprint: text("device_fingerprint").notNull(),
    // human-readable name set by admin (e.g. "Celular do João")
    deviceName: text("device_name"),
    // raw user-agent string for display
    userAgent: text("user_agent"),
    // IP address at time of request
    ipAddress: varchar("ip_address", { length: 45 }),
    // resolved city/region/country
    location: text("location"),
    status: deviceSessionStatusEnum("status").default("PENDING").notNull(),
    // JSON array of view codes admin allows, empty = full access
    allowedViews: jsonb("allowed_views").default([]).notNull(),
    // when the request was created (same as created_at but explicit)
    requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedById: uuid("resolved_by_id").references(() => users.id, { onDelete: "set null" }),
    ...timestamps
  },
  (table) => [
    index("device_sessions_restaurant_id_idx").on(table.restaurantId),
    index("device_sessions_user_id_idx").on(table.userId),
    index("device_sessions_status_idx").on(table.status),
    // one APPROVED/PENDING session per user+fingerprint pair
    uniqueIndex("device_sessions_user_fingerprint_unique")
      .on(table.userId, table.deviceFingerprint)
  ]
);

// Bills Payable & Receivable (Contas a Pagar/Receber)
export const bills = pgTable(
  "bills",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "restrict" })
      .notNull(),
    title: text("title").notNull(),
    amountInCents: integer("amount_in_cents").notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    status: text("status").default("pending").notNull(), // 'pending', 'paid'
    type: text("type").notNull(), // 'payable' (a pagar), 'receivable' (a receber)
    category: text("category").notNull(), // 'Fornecedor', 'Aluguel', etc.
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index("bills_restaurant_id_idx").on(table.restaurantId)
  ]
);

// System Settings Configurations
export const settings = pgTable(
  "settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "cascade" })
      .notNull(),
    key: varchar("key", { length: 120 }).notNull(),
    value: text("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index("settings_restaurant_id_idx").on(table.restaurantId),
    uniqueIndex("settings_restaurant_key_unique").on(table.restaurantId, table.key)
  ]
);


