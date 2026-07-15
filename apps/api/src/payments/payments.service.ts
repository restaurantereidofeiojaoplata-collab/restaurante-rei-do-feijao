import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { db, paymentIntents, paymentTransactions, cardMachines, orders, cashMovements, tableSessions } from "@restaurante/database";
import { eq, and, ne } from "drizzle-orm";
import { z } from "zod";
import { OrdersService } from "../orders/orders.service.js";
import { CashRegistersService } from "../cash-registers/cash-registers.service.js";

export const createIntentSchema = z.object({
  orderId: z.string().uuid(),
  provider: z.enum(["PAGBANK", "CASH", "MANUAL"]),
  method: z.enum(["CREDIT_CARD", "DEBIT_CARD", "PIX", "CASH"]),
  amountInCents: z.number().int().positive()
});

@Injectable()
export class PaymentsService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly cashRegistersService: CashRegistersService
  ) {}

  async createPaymentIntent(restaurantId: string, input: unknown) {
    const parsed = createIntentSchema.parse(input);

    const order = await this.ordersService.findOrderById(restaurantId, parsed.orderId);
    if (order.status === "PAID" || order.status === "CANCELLED") {
      throw new ConflictException(`Cannot pay for order in status ${order.status}.`);
    }

    const rand = Math.floor(100000 + Math.random() * 900000);
    const idempotencyKey = `idem-${parsed.orderId}-${Date.now()}-${rand}`;
    const correlationId = `corr-${parsed.orderId}-${Date.now()}-${rand}`;

    const [intent] = await db
      .insert(paymentIntents)
      .values({
        restaurantId,
        orderId: parsed.orderId,
        provider: parsed.provider,
        method: parsed.method,
        status: "DRAFT",
        amountInCents: parsed.amountInCents,
        idempotencyKey,
        correlationId,
        metadata: {}
      })
      .returning();

    return intent;
  }

  async findIntentById(restaurantId: string, id: string) {
    const [intent] = await db
      .select()
      .from(paymentIntents)
      .where(and(eq(paymentIntents.id, id), eq(paymentIntents.restaurantId, restaurantId)))
      .limit(1);

    if (!intent) {
      throw new NotFoundException("Payment intent not found.");
    }
    return intent;
  }

  async processPaymentIntent(restaurantId: string, branchId: string, userId: string, id: string, cardMachineId?: string) {
    const intent = await this.findIntentById(restaurantId, id);

    if (intent.status !== "DRAFT" && intent.status !== "PROCESSING") {
      throw new ConflictException(`Payment intent is already in status ${intent.status}.`);
    }

    let isApproved = false;
    let rawPayload: Record<string, any> = {};

    if (intent.method === "CASH" || intent.provider === "CASH" || intent.provider === "MANUAL") {
      isApproved = true;
      rawPayload = { message: "Internal cash/manual payment approved immediately." };
    } else {
      const mode = process.env.PAYMENTS_MODE; // 'simulated' | 'live'

      if (mode === "simulated") {
        if (process.env.NODE_ENV === "production") {
          throw new ConflictException("Pagamentos simulados por cartão/Pix não são permitidos em ambiente de produção.");
        }
        
        const roll = Math.random();
        if (roll < 0.9) {
          isApproved = true;
          rawPayload = {
            provider: "PAGBANK",
            status: "APPROVED",
            transactionId: `pag-${Math.floor(1000000 + Math.random() * 9000000)}`,
            message: "Transaction authorized by issuer (Simulated)."
          };
        } else {
          isApproved = false;
          rawPayload = {
            provider: "PAGBANK",
            status: "DECLINED",
            error: "INSUFFICIENT_FUNDS",
            message: "Transaction declined by issuer. Insufficient funds (Simulated)."
          };
        }
      } else if (mode === "live") {
        // Here you would call real integration (e.g., PagBank or Stripe API client)
        throw new ConflictException("A integração de pagamentos reais via API ainda não foi habilitada para esta filial.");
      } else {
        throw new ConflictException("PAYMENTS_MODE não configurado no servidor. Transação financeira recusada por segurança.");
      }
    }

    const newStatus: "APPROVED" | "DECLINED" = isApproved ? "APPROVED" : "DECLINED";
    const providerTransactionId = rawPayload.transactionId || `fail-${Date.now()}`;

    await db.transaction(async (tx) => {
      await tx
        .update(paymentIntents)
        .set({
          status: newStatus,
          updatedAt: new Date()
        })
        .where(eq(paymentIntents.id, id));

      await tx
        .insert(paymentTransactions)
        .values({
          restaurantId,
          paymentIntentId: id,
          cardMachineId: cardMachineId || null,
          provider: intent.provider,
          providerTransactionId,
          status: newStatus,
          amountInCents: intent.amountInCents,
          rawPayload,
          occurredAt: new Date()
        });

      if (isApproved) {
        const activeRegSession = await this.cashRegistersService.getActiveSession(restaurantId, branchId);
        if (activeRegSession) {
          await tx
            .insert(cashMovements)
            .values({
              restaurantId,
              sessionId: activeRegSession.id,
              type: "PAYMENT",
              amountInCents: intent.amountInCents,
              notes: `Pagamento do Pedido ${intent.orderId} via ${intent.method}`,
              performedById: userId
            });
        }

        const order = await this.ordersService.findOrderById(restaurantId, intent.orderId);

        const approvedIntents = await tx
          .select()
          .from(paymentIntents)
          .where(
            and(
              eq(paymentIntents.orderId, intent.orderId),
              eq(paymentIntents.status, "APPROVED")
            )
          );

        const totalPaid = approvedIntents.reduce((sum: number, item: any) => sum + item.amountInCents, 0);

        if (totalPaid >= order.totalAmountInCents) {
          await tx
            .update(orders)
            .set({
              status: "PAID",
              updatedAt: new Date()
            })
            .where(eq(orders.id, intent.orderId));

          if (order.tableSessionId) {
            const otherUnpaid = await tx
              .select()
              .from(orders)
              .where(
                and(
                  eq(orders.tableSessionId, order.tableSessionId),
                  // Session stays open if any order is not yet PAID or CANCELLED
                  ne(orders.status, "PAID"),
                  ne(orders.status, "CANCELLED")
                )
              );

            if (otherUnpaid.length === 0) {
              await tx
                .update(tableSessions)
                .set({
                  isActive: false,
                  closedAt: new Date(),
                  updatedAt: new Date()
                })
                .where(eq(tableSessions.id, order.tableSessionId));
            }
          }
        }
      }
    });

  }

  async listTransactions(restaurantId: string) {
    return db
      .select({
        id: paymentTransactions.id,
        amountInCents: paymentTransactions.amountInCents,
        status: paymentTransactions.status,
        provider: paymentTransactions.provider,
        providerTransactionId: paymentTransactions.providerTransactionId,
        occurredAt: paymentTransactions.occurredAt,
        cardMachineId: paymentTransactions.cardMachineId,
        cardMachineName: cardMachines.name,
        cardMachineModel: cardMachines.model,
        cardMachineSerial: cardMachines.serialNumber,
        creditFee: cardMachines.creditFee,
        debitFee: cardMachines.debitFee,
        pixFee: cardMachines.pixFee
      })
      .from(paymentTransactions)
      .leftJoin(cardMachines, eq(paymentTransactions.cardMachineId, cardMachines.id))
      .where(eq(paymentTransactions.restaurantId, restaurantId))
      .orderBy(paymentTransactions.occurredAt);
  }
}
