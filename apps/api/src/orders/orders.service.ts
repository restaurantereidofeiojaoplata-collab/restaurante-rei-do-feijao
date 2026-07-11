import { EventsGateway } from "../websockets/events.gateway.js";
import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { db, orders, orderItems, tableSessions, kitchenTickets, kitchenTicketItems } from "@restaurante/database";
import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";
import { ProductsService } from "../products/products.service.js";
import { AuditService } from "../audit/audit.service.js";

export const createOrderSchema = z.object({
  tableSessionId: z.string().uuid().optional().nullable(),
  origin: z.enum(["TABLE", "COUNTER", "PICKUP", "DELIVERY"]),
  discountAmountInCents: z.number().int().nonnegative().default(0),
  serviceFeeAmountInCents: z.number().int().nonnegative().default(0)
});

export const addItemsSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
      notes: z.string().optional().nullable()
    })
  )
});

export const updateItemSchema = z.object({
  quantity: z.number().int().positive(),
  notes: z.string().optional().nullable()
});

@Injectable()
export class OrdersService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly auditService: AuditService,
    private readonly eventsGateway: EventsGateway
  ) {}

  async createOrder(restaurantId: string, branchId: string, userId: string, input: unknown) {
    const parsed = createOrderSchema.parse(input);

    if (parsed.origin === "TABLE" && !parsed.tableSessionId) {
      throw new BadRequestException("tableSessionId is required for TABLE orders.");
    }

    if (parsed.tableSessionId) {
      // Verify table session exists and is active
      const [session] = await db
        .select()
        .from(tableSessions)
        .where(
          and(
            eq(tableSessions.id, parsed.tableSessionId),
            eq(tableSessions.restaurantId, restaurantId),
            eq(tableSessions.isActive, true)
          )
        )
        .limit(1);

      if (!session) {
        throw new NotFoundException("Active table session not found.");
      }
    }

    // Generate unique order number: PED-date-random
    const rand = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const orderNumber = `PED-${dateStr}-${rand}`;

    const [order] = await db
      .insert(orders)
      .values({
        restaurantId,
        branchId,
        orderNumber,
        origin: parsed.origin,
        status: "OPEN",
        subtotalAmountInCents: 0,
        discountAmountInCents: parsed.discountAmountInCents,
        serviceFeeAmountInCents: parsed.serviceFeeAmountInCents,
        totalAmountInCents: 0,
        tableSessionId: parsed.tableSessionId ?? null,
        createdBy: userId
      })
      .returning();

    return order;
  }

  async listOrders(restaurantId: string, branchId?: string) {
    const conditions = [eq(orders.restaurantId, restaurantId)];
    if (branchId) {
      conditions.push(eq(orders.branchId, branchId));
    }
    
    const ordersList = await db
      .select()
      .from(orders)
      .where(and(...conditions))
      .orderBy(asc(orders.createdAt));

    const result = [];
    for (const order of ordersList) {
      const items = await db
        .select()
        .from(orderItems)
        .where(and(eq(orderItems.orderId, order.id), eq(orderItems.restaurantId, restaurantId)));

      result.push({
        ...order,
        items
      });
    }
    return result;
  }

  async findOrderById(restaurantId: string, id: string) {
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.restaurantId, restaurantId)))
      .limit(1);

    if (!order) {
      throw new NotFoundException("Order not found.");
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(and(eq(orderItems.orderId, id), eq(orderItems.restaurantId, restaurantId)));

    return {
      ...order,
      items
    };
  }

  async addItems(restaurantId: string, id: string, userId: string, input: unknown) {
    const parsed = addItemsSchema.parse(input);
    const order = await this.findOrderById(restaurantId, id);

    if (order.status === "PAID" || order.status === "CANCELLED") {
      throw new ConflictException(`Order cannot be modified because its status is ${order.status}.`);
    }

    await db.transaction(async (tx) => {
      for (const item of parsed.items) {
        // Fetch product snapshot from db
        const product = await this.productsService.findProductById(restaurantId, item.productId);

        const unitAmount = product.unitAmountInCents;
        const totalAmount = unitAmount * item.quantity;

        await tx
          .insert(orderItems)
          .values({
            restaurantId,
            orderId: id,
            nameSnapshot: product.name,
            quantity: item.quantity,
            unitAmountInCents: unitAmount,
            totalAmountInCents: totalAmount,
            notes: item.notes ?? null
          });
      }

      // Recalculate totals
      await this.recalculateTotalsTx(tx, restaurantId, id);
    });

    this.eventsGateway.broadcastToRestaurant(restaurantId, "order_updated", { orderId: id });
    return this.findOrderById(restaurantId, id);
  }

  async updateItem(restaurantId: string, orderId: string, itemId: string, userId: string, input: unknown) {
    const parsed = updateItemSchema.parse(input);
    const order = await this.findOrderById(restaurantId, orderId);

    if (order.status === "PAID" || order.status === "CANCELLED") {
      throw new ConflictException(`Order cannot be modified because its status is ${order.status}.`);
    }

    await db.transaction(async (tx) => {
      const [existingItem] = await tx
        .select()
        .from(orderItems)
        .where(and(eq(orderItems.id, itemId), eq(orderItems.orderId, orderId)))
        .limit(1);

      if (!existingItem) {
        throw new NotFoundException("Order item not found.");
      }

      const totalAmount = existingItem.unitAmountInCents * parsed.quantity;

      await tx
        .update(orderItems)
        .set({
          quantity: parsed.quantity,
          totalAmountInCents: totalAmount,
          notes: parsed.notes ?? null,
          updatedAt: new Date()
        })
        .where(eq(orderItems.id, itemId));

      await this.recalculateTotalsTx(tx, restaurantId, orderId);
    });

    this.eventsGateway.broadcastToRestaurant(restaurantId, "order_updated", { orderId });
    return this.findOrderById(restaurantId, orderId);
  }

  async deleteItem(restaurantId: string, orderId: string, itemId: string, userId: string) {
    const order = await this.findOrderById(restaurantId, orderId);

    if (order.status === "PAID" || order.status === "CANCELLED") {
      throw new ConflictException(`Order cannot be modified because its status is ${order.status}.`);
    }

    // Risk action: if order has been sent to kitchen, log audit log
    if (order.status === "SENT_TO_KITCHEN" || order.status === "IN_PREPARATION") {
      await this.auditService.log({
        restaurantId,
        actorUserId: userId,
        action: "ORDER_ITEM_DELETE_AFTER_KITCHEN",
        resourceType: "order_items",
        resourceId: itemId,
        result: "SUCCESS",
        metadata: { orderId }
      });
    }

    await db.transaction(async (tx) => {
      const result = await tx
        .delete(orderItems)
        .where(and(eq(orderItems.id, itemId), eq(orderItems.orderId, orderId)))
        .returning();

      if (result.length === 0) {
        throw new NotFoundException("Order item not found.");
      }

      await this.recalculateTotalsTx(tx, restaurantId, orderId);
    });

    this.eventsGateway.broadcastToRestaurant(restaurantId, "order_updated", { orderId });
    return this.findOrderById(restaurantId, orderId);
  }

  async sendToKitchen(restaurantId: string, id: string, userId: string) {
    const order = await this.findOrderById(restaurantId, id);

    if (order.status !== "OPEN") {
      throw new ConflictException(`Order cannot be sent to kitchen because its status is ${order.status}.`);
    }

    if (order.items.length === 0) {
      throw new BadRequestException("Order has no items to prepare.");
    }

    await db.transaction(async (tx) => {
      // 1. Update order status
      await tx
        .update(orders)
        .set({
          status: "SENT_TO_KITCHEN",
          updatedAt: new Date()
        })
        .where(eq(orders.id, id));

      // 2. Create kitchen ticket
      const [ticket] = await tx
        .insert(kitchenTickets)
        .values({
          restaurantId,
          orderId: id,
          status: "PENDING"
        })
        .returning();

      if (!ticket) {
        throw new Error("Failed to create kitchen ticket.");
      }

      // 3. Create ticket items
      for (const item of order.items) {
        await tx
          .insert(kitchenTicketItems)
          .values({
            restaurantId,
            ticketId: ticket.id,
            orderItemId: item.id,
            quantity: item.quantity,
            status: "PENDING"
          });
      }
    });

    this.eventsGateway.broadcastToRestaurant(restaurantId, "order_updated", { orderId: id });
    this.eventsGateway.broadcastToRestaurant(restaurantId, "kitchen_ticket_created", { orderId: id });
    return this.findOrderById(restaurantId, id);
  }

  async cancelOrder(restaurantId: string, id: string, userId: string) {
    const order = await this.findOrderById(restaurantId, id);

    if (order.status === "PAID" || order.status === "CANCELLED") {
      throw new ConflictException(`Order is already ${order.status}.`);
    }

    // Audit log if cancelled after kitchen
    if (order.status === "SENT_TO_KITCHEN" || order.status === "IN_PREPARATION" || order.status === "READY") {
      await this.auditService.log({
        restaurantId,
        actorUserId: userId,
        action: "ORDER_CANCEL_AFTER_KITCHEN",
        resourceType: "orders",
        resourceId: id,
        result: "SUCCESS",
        metadata: { previousStatus: order.status }
      });
    }

    const [updated] = await db
      .update(orders)
      .set({
        status: "CANCELLED",
        updatedAt: new Date()
      })
      .where(and(eq(orders.id, id), eq(orders.restaurantId, restaurantId)))
      .returning();

    this.eventsGateway.broadcastToRestaurant(restaurantId, "order_cancelled", { orderId: id });
    return updated;
  }

  // Private helper to recalculate subtotal and total (within a transaction)
  private async recalculateTotalsTx(tx: any, restaurantId: string, orderId: string) {
    const items = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const subtotal = items.reduce((sum: number, item: any) => sum + item.totalAmountInCents, 0);

    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    const discount = order.discountAmountInCents;
    const fee = order.serviceFeeAmountInCents;
    const total = Math.max(0, subtotal - discount + fee);

    await tx
      .update(orders)
      .set({
        subtotalAmountInCents: subtotal,
        totalAmountInCents: total,
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId));
  }
}
