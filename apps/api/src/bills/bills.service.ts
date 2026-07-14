import { Injectable, NotFoundException } from "@nestjs/common";
import { db, bills } from "@restaurante/database";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

export const createBillSchema = z.object({
  title: z.string().min(1),
  amountInCents: z.number().int().positive(),
  dueDate: z.string().datetime().or(z.string().date()).or(z.string()),
  type: z.enum(["payable", "receivable"]),
  category: z.string().min(1)
});

export const updateBillSchema = z.object({
  title: z.string().min(1).optional(),
  amountInCents: z.number().int().positive().optional(),
  dueDate: z.string().datetime().or(z.string().date()).or(z.string()).optional(),
  status: z.enum(["pending", "paid"]).optional(),
  category: z.string().min(1).optional()
});

export type CreateBillInput = z.infer<typeof createBillSchema>;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;

@Injectable()
export class BillsService {
  async listBills(restaurantId: string) {
    return db
      .select()
      .from(bills)
      .where(eq(bills.restaurantId, restaurantId))
      .orderBy(bills.dueDate);
  }

  async createBill(restaurantId: string, input: unknown) {
    const parsed = createBillSchema.parse(input);

    const [bill] = await db
      .insert(bills)
      .values({
        restaurantId,
        title: parsed.title,
        amountInCents: parsed.amountInCents,
        dueDate: new Date(parsed.dueDate),
        type: parsed.type,
        category: parsed.category,
        status: "pending"
      })
      .returning();

    return bill;
  }

  async updateBill(restaurantId: string, id: string, input: unknown) {
    const parsed = updateBillSchema.parse(input);

    const [existing] = await db
      .select()
      .from(bills)
      .where(and(eq(bills.id, id), eq(bills.restaurantId, restaurantId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException("Bill not found.");
    }

    const updates: Partial<typeof bills.$inferInsert> = {
      updatedAt: new Date()
    };
    if (parsed.title !== undefined) updates.title = parsed.title;
    if (parsed.amountInCents !== undefined) updates.amountInCents = parsed.amountInCents;
    if (parsed.dueDate !== undefined) updates.dueDate = new Date(parsed.dueDate);
    if (parsed.status !== undefined) updates.status = parsed.status;
    if (parsed.category !== undefined) updates.category = parsed.category;

    const [updatedBill] = await db
      .update(bills)
      .set(updates)
      .where(eq(bills.id, id))
      .returning();

    return updatedBill;
  }

  async deleteBill(restaurantId: string, id: string) {
    const [existing] = await db
      .select()
      .from(bills)
      .where(and(eq(bills.id, id), eq(bills.restaurantId, restaurantId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException("Bill not found.");
    }

    await db
      .delete(bills)
      .where(eq(bills.id, id));

    return { success: true };
  }
}
