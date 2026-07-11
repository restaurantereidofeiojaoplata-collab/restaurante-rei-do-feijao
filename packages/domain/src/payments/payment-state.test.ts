import { describe, expect, it } from "vitest";
import { canTransitionPaymentStatus } from "./payment-state";

describe("payment state machine", () => {
  it("allows the normal approved payment path", () => {
    expect(canTransitionPaymentStatus("DRAFT", "PENDING")).toBe(true);
    expect(canTransitionPaymentStatus("PENDING", "PROCESSING")).toBe(true);
    expect(canTransitionPaymentStatus("PROCESSING", "APPROVED")).toBe(true);
    expect(canTransitionPaymentStatus("APPROVED", "SETTLED")).toBe(true);
  });

  it("blocks direct finalization without provider confirmation", () => {
    expect(canTransitionPaymentStatus("DRAFT", "APPROVED")).toBe(false);
    expect(canTransitionPaymentStatus("PENDING", "SETTLED")).toBe(false);
  });

  it("keeps uncertain terminal results reviewable instead of retrying blindly", () => {
    expect(canTransitionPaymentStatus("PROCESSING", "INDETERMINATE")).toBe(true);
    expect(canTransitionPaymentStatus("INDETERMINATE", "PROCESSING")).toBe(false);
    expect(canTransitionPaymentStatus("INDETERMINATE", "APPROVED")).toBe(true);
    expect(canTransitionPaymentStatus("INDETERMINATE", "DECLINED")).toBe(true);
  });
});

