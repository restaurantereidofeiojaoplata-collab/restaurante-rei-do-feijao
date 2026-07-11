export const paymentStatuses = [
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
] as const;

export type PaymentStatus = (typeof paymentStatuses)[number];

const allowedTransitions: Record<PaymentStatus, readonly PaymentStatus[]> = {
  APPROVED: ["SETTLED", "REFUND_PENDING"],
  CANCELLED: [],
  DECLINED: [],
  DRAFT: ["PENDING", "CANCELLED"],
  EXPIRED: [],
  INDETERMINATE: ["APPROVED", "DECLINED", "CANCELLED"],
  PENDING: ["PROCESSING", "APPROVED", "DECLINED", "CANCELLED", "EXPIRED"],
  PROCESSING: ["APPROVED", "DECLINED", "CANCELLED", "INDETERMINATE"],
  REFUNDED: [],
  REFUND_PENDING: ["REFUNDED", "APPROVED"],
  SETTLED: ["REFUND_PENDING"]
};

export function canTransitionPaymentStatus(
  from: PaymentStatus,
  to: PaymentStatus
): boolean {
  return allowedTransitions[from].includes(to);
}
