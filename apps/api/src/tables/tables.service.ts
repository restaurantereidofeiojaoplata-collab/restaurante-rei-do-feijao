import { EventsGateway } from "../websockets/events.gateway.js";
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { db, diningTables, tableSessions, orders } from "@restaurante/database";
import { eq, and, asc, ne } from "drizzle-orm";
import { z } from "zod";

export const createTableSchema = z.object({
  number: z.string().min(1),
  isActive: z.boolean().default(true)
});

export const updateTableSchema = createTableSchema.partial();

@Injectable()
export class TablesService {
  constructor(private readonly eventsGateway: EventsGateway) {}
  async createTable(restaurantId: string, branchId: string, input: unknown) {
    const parsed = createTableSchema.parse(input);
    const [table] = await db
      .insert(diningTables)
      .values({
        restaurantId,
        branchId,
        number: parsed.number,
        isActive: parsed.isActive
      })
      .returning();
    return table;
  }

  async updateTable(restaurantId: string, id: string, input: unknown) {
    const parsed = updateTableSchema.parse(input);
    const [table] = await db
      .update(diningTables)
      .set({
        ...parsed,
        updatedAt: new Date()
      })
      .where(and(eq(diningTables.id, id), eq(diningTables.restaurantId, restaurantId)))
      .returning();

    if (!table) {
      throw new NotFoundException("Table not found.");
    }
    return table;
  }

  async listTables(restaurantId: string, branchId?: string) {
    const conditions = [eq(diningTables.restaurantId, restaurantId)];
    if (branchId) {
      conditions.push(eq(diningTables.branchId, branchId));
    }
    
    const tablesList = await db
      .select()
      .from(diningTables)
      .where(and(...conditions))
      .orderBy(asc(diningTables.number));

    const result = [];
    for (const table of tablesList) {
      const activeSession = await this.findActiveSession(restaurantId, table.id);
      let totalBill = 0;
      let orderId = undefined;
      
      if (activeSession) {
        // Find total bill for active orders in this session
        const activeOrders = await db
          .select()
          .from(orders)
          .where(and(
            eq(orders.tableSessionId, activeSession.id),
            ne(orders.status, "CANCELLED"),
            ne(orders.status, "PAID")
          ));
          
        totalBill = activeOrders.reduce((sum, o) => sum + o.totalAmountInCents, 0);
        const firstOrder = activeOrders[0];
        if (firstOrder) {
          orderId = firstOrder.id;
        }
      }

      result.push({
        ...table,
        activeSession: activeSession ? {
          id: activeSession.id,
          openedAt: activeSession.openedAt
        } : null,
        totalBillInCents: totalBill,
        currentOrderId: orderId
      });
    }
    return result;
  }

  async findTableById(restaurantId: string, id: string) {
    const [table] = await db
      .select()
      .from(diningTables)
      .where(and(eq(diningTables.id, id), eq(diningTables.restaurantId, restaurantId)))
      .limit(1);

    if (!table) {
      throw new NotFoundException("Table not found.");
    }
    return table;
  }

  async openSession(restaurantId: string, branchId: string, tableId: string) {
    // 1. Verify table exists
    const table = await this.findTableById(restaurantId, tableId);
    if (!table.isActive) {
      throw new ConflictException("Table is not active.");
    }

    // 2. Verify no active session exists
    const active = await this.findActiveSession(restaurantId, tableId);
    if (active) {
      throw new ConflictException("Table already has an active session.");
    }

    // 3. Open session
    const [session] = await db
      .insert(tableSessions)
      .values({
        restaurantId,
        branchId,
        tableId,
        isActive: true,
        openedAt: new Date()
      })
      .returning();

    if (!session) {
      throw new Error("Failed to open table session.");
    }

    this.eventsGateway.broadcastToRestaurant(restaurantId, "table_session_opened", { tableId, sessionId: session.id });
    return session;
  }

  async findActiveSession(restaurantId: string, tableId: string) {
    const [session] = await db
      .select()
      .from(tableSessions)
      .where(
        and(
          eq(tableSessions.restaurantId, restaurantId),
          eq(tableSessions.tableId, tableId),
          eq(tableSessions.isActive, true)
        )
      )
      .limit(1);
    return session || null;
  }

  async closeSession(restaurantId: string, id: string) {
    const [session] = await db
      .update(tableSessions)
      .set({
        isActive: false,
        closedAt: new Date(),
        updatedAt: new Date()
      })
      .where(
        and(
          eq(tableSessions.id, id),
          eq(tableSessions.restaurantId, restaurantId),
          eq(tableSessions.isActive, true)
        )
      )
      .returning();

    if (!session) {
      throw new NotFoundException("Active table session not found.");
    }
    this.eventsGateway.broadcastToRestaurant(restaurantId, "table_session_closed", { sessionId: id });
    return session;
  }
}
