import type { CashClawState } from './types';

/** Explicit allowed transitions for CashClaw (quote-to-cash) missions. */
export const CASHCLAW_ALLOWED_TRANSITIONS: Readonly<
  Record<CashClawState, readonly CashClawState[]>
> = {
  INTAKE: ['QUALIFYING'],
  QUALIFYING: ['SUPPLY_CHECK', 'COMPLETE'],
  SUPPLY_CHECK: ['PRICING_REVIEW', 'QUALIFYING'],
  PRICING_REVIEW: ['AWAITING_APPROVAL', 'SUPPLY_CHECK'],
  AWAITING_APPROVAL: ['QUOTED', 'PRICING_REVIEW'],
  QUOTED: ['ACCEPTED', 'FOLLOW_UP'],
  ACCEPTED: ['PAID', 'QUOTED'],
  PAID: ['FULFILLING'],
  FULFILLING: ['DELIVERED'],
  DELIVERED: ['FOLLOW_UP'],
  FOLLOW_UP: ['COMPLETE', 'QUOTED'],
  COMPLETE: [],
};

export function canTransitionCashClaw(from: CashClawState, to: CashClawState): boolean {
  return CASHCLAW_ALLOWED_TRANSITIONS[from].includes(to);
}

export const CASHCLAW_STATES: readonly CashClawState[] = [
  'INTAKE',
  'QUALIFYING',
  'SUPPLY_CHECK',
  'PRICING_REVIEW',
  'AWAITING_APPROVAL',
  'QUOTED',
  'ACCEPTED',
  'PAID',
  'FULFILLING',
  'DELIVERED',
  'FOLLOW_UP',
  'COMPLETE',
] as const;
