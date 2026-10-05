import type Database from 'better-sqlite3';
import { getMission, updateMissionPaymentMethod } from '@/db/store';
import { InvalidPaymentMethodError, parsePaymentMethod } from '@/domain/payment';
import type { MissionId, PaymentMethod } from '@/domain/types';
import { NotFoundError } from '@/domain/errors';
import { recordAudit } from '@/services/audit-service';

export function setMissionPaymentMethod(
  db: Database.Database,
  params: {
    missionId: MissionId;
    paymentMethod: unknown;
    actorAgentId: string;
  },
): PaymentMethod {
  const mission = getMission(db, params.missionId);
  if (!mission) {
    throw new NotFoundError(`Mission ${params.missionId} not found`);
  }

  let method: PaymentMethod;
  try {
    method = parsePaymentMethod(params.paymentMethod);
  } catch (e) {
    if (e instanceof InvalidPaymentMethodError) {
      recordAudit(db, {
        kind: 'ACTION_BLOCKED',
        missionId: params.missionId,
        agentId: params.actorAgentId,
        message: `Rejected payment method "${e.attempted}" (Phase 1: shopify or bank only)`,
        metadata: {
          attemptedPaymentMethod: e.attempted,
          allowed: ['shopify', 'bank'],
          excludes: ['crypto', 'wallet', 'stablecoin'],
        },
      });
    }
    throw e;
  }

  const updatedAt = new Date().toISOString();
  updateMissionPaymentMethod(db, params.missionId, method, updatedAt);
  recordAudit(db, {
    kind: 'ACTION_EXECUTED',
    missionId: params.missionId,
    agentId: params.actorAgentId,
    message: `Mission payment_method set to ${method}`,
    metadata: { paymentMethod: method },
  });
  return method;
}
