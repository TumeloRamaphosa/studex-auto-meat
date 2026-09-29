import type Database from 'better-sqlite3';
import { findConsumableApproval, getMission, insertAudit } from '@/db/store';
import type { ApprovalSubjectByAction } from '@/domain/approval-subject';
import { recordAudit } from '@/services/audit-service';
import type { AgentId, ApprovalActionType, MissionId } from '@/domain/types';
import { ActionBlockedError } from '@/domain/errors';
import { consumeApprovalForAction } from '@/services/approval-service';

export type GatedActionPayload = {
  missionId: MissionId;
  actorAgentId: AgentId;
  actionType: ApprovalActionType;
  summary: string;
  subject: ApprovalSubjectByAction[ApprovalActionType];
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

export function executeGatedAction(
  db: Database.Database,
  payload: GatedActionPayload,
): { ok: true; auditId: string; approvalId: string } {
  const mission = getMission(db, payload.missionId);
  if (!mission) {
    throw new ActionBlockedError(payload.actionType, payload.missionId, 'mission not found');
  }

  const approval = findConsumableApproval(
    db,
    payload.missionId,
    payload.actionType,
    payload.subject,
  );
  if (!approval) {
    recordAudit(db, {
      kind: 'ACTION_BLOCKED',
      missionId: payload.missionId,
      agentId: payload.actorAgentId,
      message: `Blocked ${ACTION_LABELS[payload.actionType]} — no matching unused approval for subject`,
      metadata: {
        actionType: payload.actionType,
        attemptedSubject: payload.subject,
        attemptedSummary: payload.summary,
        ...(payload.metadata ?? {}),
      },
    });
    throw new ActionBlockedError(
      payload.actionType,
      payload.missionId,
      `no matching approved unused ${payload.actionType} for requested subject`,
    );
  }

  consumeApprovalForAction(db, {
    approval,
    actorAgentId: payload.actorAgentId,
    actionType: payload.actionType,
  });

  const audit = recordAudit(db, {
    kind: 'ACTION_EXECUTED',
    missionId: payload.missionId,
    agentId: payload.actorAgentId,
    message: `Executed ${ACTION_LABELS[payload.actionType]} with approval ${approval.id}`,
    metadata: {
      actionType: payload.actionType,
      approvalId: approval.id,
      approvedSubject: approval.subject,
      executedSubject: payload.subject,
      summary: payload.summary,
      ...(payload.metadata ?? {}),
    },
  });

  return { ok: true, auditId: audit.id, approvalId: approval.id };
}

export function hasConsumableApproval(
  db: Database.Database,
  missionId: MissionId,
  actionType: ApprovalActionType,
  subject: ApprovalSubjectByAction[ApprovalActionType],
): boolean {
  return Boolean(findConsumableApproval(db, missionId, actionType, subject));
}

/** @internal */
export { insertAudit };
