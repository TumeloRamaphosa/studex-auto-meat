import type Database from 'better-sqlite3';
import { findApprovedApproval, getMission, insertAudit } from '@/db/store';
import { recordAudit } from '@/services/audit-service';
import type { AgentId, ApprovalActionType, MissionId } from '@/domain/types';
import { ActionBlockedError } from '@/domain/errors';

export type GatedActionPayload = {
  missionId: MissionId;
  actorAgentId: AgentId;
  actionType: ApprovalActionType;
  summary: string;
  metadata?: Record<string, unknown>;
};

const ACTION_LABELS: Record<ApprovalActionType, string> = {
  PRICE_CHANGE: 'price change',
  QUOTATION: 'quotation',
  PUBLISHING: 'publish content',
  CUSTOMER_MESSAGE: 'customer message',
  FULFILLMENT: 'fulfilment',
  REFUND: 'refund',
};

/**
 * Enforces that spend/customer-facing actions require an APPROVED approval on the mission.
 */
export function executeGatedAction(
  db: Database.Database,
  payload: GatedActionPayload,
): { ok: true; auditId: string } {
  const mission = getMission(db, payload.missionId);
  if (!mission) {
    throw new ActionBlockedError(payload.actionType, payload.missionId, 'mission not found');
  }

  const approval = findApprovedApproval(db, payload.missionId, payload.actionType);
  if (!approval) {
    recordAudit(db, {
      kind: 'ACTION_BLOCKED',
      missionId: payload.missionId,
      agentId: payload.actorAgentId,
      message: `Blocked ${ACTION_LABELS[payload.actionType]} — no approved ${payload.actionType} approval`,
      metadata: {
        actionType: payload.actionType,
        attemptedSummary: payload.summary,
        ...(payload.metadata ?? {}),
      },
    });
    throw new ActionBlockedError(
      payload.actionType,
      payload.missionId,
      `missing approved ${payload.actionType} record`,
    );
  }

  const audit = recordAudit(db, {
    kind: 'ACTION_EXECUTED',
    missionId: payload.missionId,
    agentId: payload.actorAgentId,
    message: `Executed ${ACTION_LABELS[payload.actionType]} with approval ${approval.id}`,
    metadata: {
      actionType: payload.actionType,
      approvalId: approval.id,
      summary: payload.summary,
      ...(payload.metadata ?? {}),
    },
  });

  return { ok: true, auditId: audit.id };
}

export function hasApprovedAction(
  db: Database.Database,
  missionId: MissionId,
  actionType: ApprovalActionType,
): boolean {
  return Boolean(findApprovedApproval(db, missionId, actionType));
}

/** @internal tests may import for direct audit insert consistency */
export { insertAudit };
