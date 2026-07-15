import { Injectable, NotFoundException } from "@nestjs/common";
import { db, cardMachines } from "@restaurante/database";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

export const createCardMachineSchema = z.object({
  name: z.string().min(1),
  model: z.string().min(1),
  serialNumber: z.string().min(1),
  creditFee: z.number().min(0).max(100),
  debitFee: z.number().min(0).max(100),
  pixFee: z.number().min(0).max(100),
  isActive: z.boolean().optional()
});

export const updateCardMachineSchema = createCardMachineSchema.partial();

@Injectable()
export class CardMachinesService {
  async listCardMachines(restaurantId: string) {
    return db
      .select()
      .from(cardMachines)
      .where(eq(cardMachines.restaurantId, restaurantId))
      .orderBy(cardMachines.name);
  }

  async createCardMachine(restaurantId: string, input: unknown) {
    const parsed = createCardMachineSchema.parse(input);

    const [machine] = await db
      .insert(cardMachines)
      .values({
        restaurantId,
        name: parsed.name.trim(),
        model: parsed.model.trim(),
        serialNumber: parsed.serialNumber.trim(),
        creditFee: parsed.creditFee,
        debitFee: parsed.debitFee,
        pixFee: parsed.pixFee,
        isActive: parsed.isActive ?? true
      })
      .returning();

    return machine;
  }

  async updateCardMachine(restaurantId: string, id: string, input: unknown) {
    const parsed = updateCardMachineSchema.parse(input);

    const [existing] = await db
      .select()
      .from(cardMachines)
      .where(and(eq(cardMachines.id, id), eq(cardMachines.restaurantId, restaurantId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException("Card machine not found.");
    }

    const updates: Partial<typeof cardMachines.$inferInsert> = {
      updatedAt: new Date()
    };
    if (parsed.name !== undefined) updates.name = parsed.name.trim();
    if (parsed.model !== undefined) updates.model = parsed.model.trim();
    if (parsed.serialNumber !== undefined) updates.serialNumber = parsed.serialNumber.trim();
    if (parsed.creditFee !== undefined) updates.creditFee = parsed.creditFee;
    if (parsed.debitFee !== undefined) updates.debitFee = parsed.debitFee;
    if (parsed.pixFee !== undefined) updates.pixFee = parsed.pixFee;
    if (parsed.isActive !== undefined) updates.isActive = parsed.isActive;

    const [updatedMachine] = await db
      .update(cardMachines)
      .set(updates)
      .where(eq(cardMachines.id, id))
      .returning();

    return updatedMachine;
  }

  async deleteCardMachine(restaurantId: string, id: string) {
    const [existing] = await db
      .select()
      .from(cardMachines)
      .where(and(eq(cardMachines.id, id), eq(cardMachines.restaurantId, restaurantId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException("Card machine not found.");
    }

    await db
      .delete(cardMachines)
      .where(eq(cardMachines.id, id));

    return { success: true };
  }
}
