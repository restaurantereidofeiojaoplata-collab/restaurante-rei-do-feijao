import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { db, cashRegisters, cashRegisterSessions, cashMovements } from "@restaurante/database";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

export const createRegisterSchema = z.object({
  name: z.string().min(1),
  isActive: z.boolean().default(true)
});

export const openSessionSchema = z.object({
  cashRegisterId: z.string().uuid(),
  openingBalanceInCents: z.number().int().nonnegative()
});

export const movementSchema = z.object({
  amountInCents: z.number().int().positive(),
  notes: z.string().optional().nullable()
});

export const closeSessionSchema = z.object({
  closingBalanceInCents: z.number().int().nonnegative(),
  notes: z.string().optional().nullable()
});

@Injectable()
export class CashRegistersService {
  async createRegister(restaurantId: string, branchId: string, input: unknown) {
    const parsed = createRegisterSchema.parse(input);
    const [register] = await db
      .insert(cashRegisters)
      .values({
        restaurantId,
        branchId,
        name: parsed.name,
        isActive: parsed.isActive
      })
      .returning();
    return register;
  }

  async listRegisters(restaurantId: string, branchId?: string) {
    const conditions = [eq(cashRegisters.restaurantId, restaurantId)];
    if (branchId) {
      conditions.push(eq(cashRegisters.branchId, branchId));
    }
    return db
      .select()
      .from(cashRegisters)
      .where(and(...conditions));
  }

  async getActiveSession(restaurantId: string, branchId: string, registerId?: string) {
    const conditions = [
      eq(cashRegisterSessions.restaurantId, restaurantId),
      eq(cashRegisterSessions.branchId, branchId),
      eq(cashRegisterSessions.status, "OPEN")
    ];
    if (registerId) {
      conditions.push(eq(cashRegisterSessions.cashRegisterId, registerId));
    }
    const [session] = await db
      .select()
      .from(cashRegisterSessions)
      .where(and(...conditions))
      .limit(1);
    return session || null;
  }

  async openSession(restaurantId: string, branchId: string, userId: string, input: unknown) {
    const parsed = openSessionSchema.parse(input);

    const [register] = await db
      .select()
      .from(cashRegisters)
      .where(and(eq(cashRegisters.id, parsed.cashRegisterId), eq(cashRegisters.restaurantId, restaurantId)))
      .limit(1);

    if (!register || !register.isActive) {
      throw new NotFoundException("Active cash register not found.");
    }

    const active = await this.getActiveSession(restaurantId, branchId, parsed.cashRegisterId);
    if (active) {
      throw new ConflictException("Cash register already has an active session.");
    }

    const [session] = await db.transaction(async (tx) => {
      const [newSession] = await tx
        .insert(cashRegisterSessions)
        .values({
          restaurantId,
          branchId,
          cashRegisterId: parsed.cashRegisterId,
          openedById: userId,
          openedAt: new Date(),
          openingBalanceInCents: parsed.openingBalanceInCents,
          status: "OPEN"
        })
        .returning();

      if (!newSession) {
        throw new Error("Failed to create cash register session.");
      }

      await tx
        .insert(cashMovements)
        .values({
          restaurantId,
          sessionId: newSession.id,
          type: "OPENING_BALANCE",
          amountInCents: parsed.openingBalanceInCents,
          notes: "Abertura de caixa",
          performedById: userId
        });

      return [newSession];
    });

    if (!session) {
      throw new Error("Failed to open cash register session.");
    }

    return session;
  }

  async addMovement(
    restaurantId: string,
    sessionId: string,
    userId: string,
    type: "SUPRIMENTO" | "SANGRIA",
    input: unknown
  ) {
    const parsed = movementSchema.parse(input);

    const [session] = await db
      .select()
      .from(cashRegisterSessions)
      .where(
        and(
          eq(cashRegisterSessions.id, sessionId),
          eq(cashRegisterSessions.restaurantId, restaurantId),
          eq(cashRegisterSessions.status, "OPEN")
        )
      )
      .limit(1);

    if (!session) {
      throw new NotFoundException("Active cash register session not found.");
    }

    const [movement] = await db
      .insert(cashMovements)
      .values({
        restaurantId,
        sessionId,
        type,
        amountInCents: parsed.amountInCents,
        notes: parsed.notes ?? null,
        performedById: userId
      })
      .returning();

    return movement;
  }

  async closeSession(restaurantId: string, sessionId: string, userId: string, input: unknown) {
    const parsed = closeSessionSchema.parse(input);

    const [session] = await db
      .select()
      .from(cashRegisterSessions)
      .where(
        and(
          eq(cashRegisterSessions.id, sessionId),
          eq(cashRegisterSessions.restaurantId, restaurantId),
          eq(cashRegisterSessions.status, "OPEN")
        )
      )
      .limit(1);

    if (!session) {
      throw new NotFoundException("Active cash register session not found.");
    }

    const movementsList = await db
      .select()
      .from(cashMovements)
      .where(eq(cashMovements.sessionId, sessionId));

    let expected = 0;
    for (const mov of movementsList) {
      if (["OPENING_BALANCE", "SUPRIMENTO", "PAYMENT"].includes(mov.type)) {
        expected += mov.amountInCents;
      } else if (["SANGRIA", "REFUND"].includes(mov.type)) {
        expected -= mov.amountInCents;
      }
    }

    const diff = parsed.closingBalanceInCents - expected;

    const [closedSession] = await db
      .update(cashRegisterSessions)
      .set({
        status: "CLOSED",
        closedById: userId,
        closedAt: new Date(),
        closingBalanceInCents: parsed.closingBalanceInCents,
        expectedClosingBalanceInCents: expected,
        closingDifferenceInCents: diff,
        notes: parsed.notes ?? null,
        updatedAt: new Date()
      })
      .where(eq(cashRegisterSessions.id, sessionId))
      .returning();

    return closedSession;
  }
}
