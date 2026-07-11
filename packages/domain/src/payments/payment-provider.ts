export type PaymentProvider = "CASH" | "MANUAL" | "PAGBANK";

export type PaymentMethod =
  | "CASH"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "PIX"
  | "VOUCHER";

export interface PaymentIntentDraft {
  readonly orderId: string;
  readonly restaurantId: string;
  readonly amountInCents: number;
  readonly currency: "BRL";
  readonly provider: PaymentProvider;
  readonly method: PaymentMethod;
  readonly idempotencyKey: string;
}

