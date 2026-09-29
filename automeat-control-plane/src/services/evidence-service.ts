import type Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import { getMission, insertEvidence, listEvidence } from '@/db/store';
import {
  MissingPaymentProofError,
  PaymentProofMismatchError,
} from '@/domain/payment';
import type {
  Evidence,
  MissionId,
  PaymentMethod,
  PaymentProofSource,
} from '@/domain/types';

const PROOF_BY_METHOD: Record<PaymentMethod, PaymentProofSource> = {
  shopify: 'shopify_order',
  bank: 'bank_confirmation',
};

export function requiredProofSourceForMethod(paymentMethod: PaymentMethod): PaymentProofSource {
  return PROOF_BY_METHOD[paymentMethod];
}

export function findPaymentProofEvidence(
  db: Database.Database,
  missionId: MissionId,
  paymentMethod: PaymentMethod,
): Evidence | undefined {
  const requiredSource = requiredProofSourceForMethod(paymentMethod);
  return listEvidence(db, missionId).find(
    (ev) =>
      ev.kind === 'PAYMENT_PROOF' &&
      ev.paymentProofSource === requiredSource &&
      Boolean(ev.paymentReference?.trim()),
  );
}

export function assertPaymentProofForPaidTransition(
  db: Database.Database,
  missionId: MissionId,
  paymentMethod: PaymentMethod,
): Evidence {
  const proof = findPaymentProofEvidence(db, missionId, paymentMethod);
  if (!proof) {
    const anyProof = listEvidence(db, missionId).some((ev) => ev.kind === 'PAYMENT_PROOF');
    if (anyProof) {
      throw new PaymentProofMismatchError(missionId, paymentMethod);
    }
    throw new MissingPaymentProofError(missionId);
  }
  return proof;
}

export function attachPaymentProof(
  db: Database.Database,
  params: {
    missionId: MissionId;
    paymentMethod: PaymentMethod;
    paymentReference: string;
    notes?: string;
  },
): Evidence {
  const mission = getMission(db, params.missionId);
  if (!mission) {
    throw new Error(`Mission ${params.missionId} not found`);
  }

  const source = requiredProofSourceForMethod(params.paymentMethod);
  const evidence: Evidence = {
    id: uuid(),
    missionId: params.missionId,
    taskId: null,
    kind: 'PAYMENT_PROOF',
    paymentProofSource: source,
    paymentReference: params.paymentReference,
    label: 'Payment proof (example)',
    uri: 'evidence://payment-proof/demo',
    notes: params.notes ?? 'Example payment proof — not verified against live systems.',
    createdAt: new Date().toISOString(),
  };
  insertEvidence(db, evidence);
  return evidence;
}
