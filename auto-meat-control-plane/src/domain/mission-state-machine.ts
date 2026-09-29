import type { CashClawMissionState } from "./entities.js";

/** Explicit allowed CashClaw mission transitions (Phase 1). */
export const CASHCLAW_TRANSITIONS: Readonly<
  Record<CashClawMissionState, readonly CashClawMissionState[]>
> = {
  INTAKE: ["QUALIFYING"],
  QUALIFYING: ["SUPPLY_CHECK", "INTAKE"],
  SUPPLY_CHECK: ["PRICING_REVIEW", "QUALIFYING"],
  PRICING_REVIEW: ["AWAITING_APPROVAL", "SUPPLY_CHECK"],
  AWAITING_APPROVAL: ["QUOTED", "PRICING_REVIEW"],
  QUOTED: ["ACCEPTED", "AWAITING_APPROVAL"],
  ACCEPTED: ["PAID", "QUOTED"],
  PAID: ["FULFILLING"],
  FULFILLING: ["DELIVERED"],
  DELIVERED: ["FOLLOW_UP"],
  FOLLOW_UP: ["COMPLETE"],
  COMPLETE: [],
};

export function canTransitionCashClaw(
  from: CashClawMissionState,
  to: CashClawMissionState,
): boolean {
  if (from === to) return false;
  const allowed = CASHCLAW_TRANSITIONS[from];
  return allowed.includes(to);
}

export function assertTransitionCashClaw(
  from: CashClawMissionState,
  to: CashClawMissionState,
): void {
  if (!canTransitionCashClaw(from, to)) {
    throw new Error(
      `Illegal CashClaw transition: ${from} → ${to}. Allowed: ${CASHCLAW_TRANSITIONS[from].join(", ") || "(none)"}`,
    );
  }
}
