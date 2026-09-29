import { describe, expect, it } from "vitest";
import {
  CASHCLAW_TRANSITIONS,
  canTransitionCashClaw,
  assertTransitionCashClaw,
} from "../src/domain/mission-state-machine.js";

describe("CashClaw mission state machine", () => {
  it("allows the happy-path forward chain", () => {
    const chain = [
      "INTAKE",
      "QUALIFYING",
      "SUPPLY_CHECK",
      "PRICING_REVIEW",
      "AWAITING_APPROVAL",
      "QUOTED",
      "ACCEPTED",
      "PAID",
      "FULFILLING",
      "DELIVERED",
      "FOLLOW_UP",
      "COMPLETE",
    ] as const;
    for (let i = 0; i < chain.length - 1; i++) {
      expect(canTransitionCashClaw(chain[i], chain[i + 1])).toBe(true);
    }
  });

  it("rejects illegal jumps (e.g. INTAKE → PAID)", () => {
    expect(canTransitionCashClaw("INTAKE", "PAID")).toBe(false);
    expect(() => assertTransitionCashClaw("INTAKE", "PAID")).toThrow(
      /Illegal CashClaw transition/,
    );
  });

  it("rejects transitions from COMPLETE", () => {
    expect(CASHCLAW_TRANSITIONS.COMPLETE).toEqual([]);
    expect(canTransitionCashClaw("COMPLETE", "FOLLOW_UP")).toBe(false);
  });

  it("allows defined rollback edges", () => {
    expect(canTransitionCashClaw("QUALIFYING", "INTAKE")).toBe(true);
    expect(canTransitionCashClaw("PRICING_REVIEW", "SUPPLY_CHECK")).toBe(true);
    expect(canTransitionCashClaw("QUOTED", "AWAITING_APPROVAL")).toBe(true);
  });
});
