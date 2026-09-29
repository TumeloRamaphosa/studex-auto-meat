import type { PaymentMethod } from './types';

/** Phase 1: bank EFT and Shopify checkout only — no crypto/wallet/stablecoin paths. */
export const PAYMENT_METHODS = ['shopify', 'bank'] as const satisfies readonly PaymentMethod[];

export const DEFAULT_PAYMENT_METHOD: PaymentMethod = 'bank';

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === 'shopify' || value === 'bank';
}

export function parsePaymentMethod(value: unknown): PaymentMethod {
  if (isPaymentMethod(value)) {
    return value;
  }
  throw new InvalidPaymentMethodError(String(value));
}

export class InvalidPaymentMethodError extends Error {
  readonly code = 'INVALID_PAYMENT_METHOD' as const;
  constructor(public readonly attempted: string) {
    super(
      `Payment method "${attempted}" is not allowed in Phase 1 (only shopify or bank; no crypto/wallet/stablecoin)`,
    );
    this.name = 'InvalidPaymentMethodError';
  }
}

export class MissingPaymentProofError extends Error {
  readonly code = 'MISSING_PAYMENT_PROOF' as const;
  constructor(public readonly missionId: string) {
    super(`Mission ${missionId} cannot move to PAID without payment proof evidence`);
    this.name = 'MissingPaymentProofError';
  }
}

export class PaymentProofMismatchError extends Error {
  readonly code = 'PAYMENT_PROOF_MISMATCH' as const;
  constructor(
    public readonly missionId: string,
    public readonly paymentMethod: PaymentMethod,
  ) {
    super(
      `Payment proof for mission ${missionId} must match payment_method "${paymentMethod}"`,
    );
    this.name = 'PaymentProofMismatchError';
  }
}
