import { describe, expect, it } from "vitest";
import {
  auditLogs,
  branches,
  idempotencyKeys,
  orderItems,
  orders,
  paymentIntents,
  paymentTransactions,
  permissions,
  restaurants,
  rolePermissions,
  roles,
  users
} from "./schema.js";

describe("database schema contract", () => {
  it("exports the foundation tables required before PDV work", () => {
    expect(restaurants).toBeDefined();
    expect(branches).toBeDefined();
    expect(users).toBeDefined();
    expect(roles).toBeDefined();
    expect(permissions).toBeDefined();
    expect(rolePermissions).toBeDefined();
    expect(orders).toBeDefined();
    expect(orderItems).toBeDefined();
    expect(paymentIntents).toBeDefined();
    expect(paymentTransactions).toBeDefined();
    expect(idempotencyKeys).toBeDefined();
    expect(auditLogs).toBeDefined();
  });
});

