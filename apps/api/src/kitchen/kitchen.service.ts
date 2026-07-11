import { EventsGateway } from "../websockets/events.gateway.js";
import { Injectable, NotFoundException } from "@nestjs/common";
import { db, kitchenTickets, kitchenTicketItems, orders } from "@restaurante/database";
import { eq, and, ne, asc } from "drizzle-orm";

@Injectable()
export class KitchenService {
  constructor(private readonly eventsGateway: EventsGateway) {}
  async listActiveTickets(restaurantId: string) {
    const tickets = await db
      .select()
      .from(kitchenTickets)
      .where(and(eq(kitchenTickets.restaurantId, restaurantId), ne(kitchenTickets.status, "DELIVERED")))
      .orderBy(asc(kitchenTickets.createdAt));

    const ticketsWithItems = [];
    for (const ticket of tickets) {
      const items = await db
        .select()
        .from(kitchenTicketItems)
        .where(and(eq(kitchenTicketItems.ticketId, ticket.id), eq(kitchenTicketItems.restaurantId, restaurantId)));

      ticketsWithItems.push({
        ...ticket,
        items
      });
    }

    return ticketsWithItems;
  }

  async findTicketById(restaurantId: string, id: string) {
    const [ticket] = await db
      .select()
      .from(kitchenTickets)
      .where(and(eq(kitchenTickets.id, id), eq(kitchenTickets.restaurantId, restaurantId)))
      .limit(1);

    if (!ticket) {
      throw new NotFoundException("Kitchen ticket not found.");
    }

    const items = await db
      .select()
      .from(kitchenTicketItems)
      .where(and(eq(kitchenTicketItems.ticketId, id), eq(kitchenTicketItems.restaurantId, restaurantId)));

    return {
      ...ticket,
      items
    };
  }

  async updateTicketStatus(
    restaurantId: string,
    id: string,
    status: "PENDING" | "PREPARING" | "READY" | "DELIVERED"
  ) {
    const ticket = await this.findTicketById(restaurantId, id);

    await db.transaction(async (tx) => {
      await tx
        .update(kitchenTickets)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(kitchenTickets.id, id));

      await tx
        .update(kitchenTicketItems)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(kitchenTicketItems.ticketId, id));

      let orderStatus: "SENT_TO_KITCHEN" | "IN_PREPARATION" | "READY" | "DELIVERED";
      if (status === "PREPARING") {
        orderStatus = "IN_PREPARATION";
      } else if (status === "READY") {
        orderStatus = "READY";
      } else if (status === "DELIVERED") {
        orderStatus = "DELIVERED";
      } else {
        orderStatus = "SENT_TO_KITCHEN";
      }

      await tx
        .update(orders)
        .set({
          status: orderStatus,
          updatedAt: new Date()
        })
        .where(eq(orders.id, ticket.orderId));
    });

    this.eventsGateway.broadcastToRestaurant(restaurantId, "kitchen_ticket_updated", { ticketId: id, status });
    return this.findTicketById(restaurantId, id);
  }
}
