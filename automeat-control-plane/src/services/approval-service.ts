import type Database from 'better-sqlite3';
import { getApproval, getAgentById, markApprovalConsumed, updateApprovalDecision } from '@/db/store';
import type { ApprovalSubjectByAction } from '@/domain/approval-subject';
import { serializeApprovalSubject } from '@/domain/approval-subject';
import { ApprovalPolicyViolationError, NotFoundError } from '@/domain/errors';
import {
  GATED_ACTION_APPROVER_TYPE,
  HUMAN_OWNER_APPROVER_ID,
  HUMAN_OWNER_DISPLAY_NAME,
} from '@/domain/human-approver';
import type { AgentId, Approval, ApprovalActionType, ApprovalStatus } from '@/domain/types';
import { recordAudit } from '@/services/audit-service';

export { HUMAN_OWNER_APPROVER_ID, HUMAN_OWNER_DISPLAY_NAME };

/**
 * Dashboard / API — human owner (Tumelo) approves or rejects; agents never decide.
 */
export function decideApprovalByHumanOwner(
  db: Database.Database,
  params: {
    approvalId: string;
    decision: Exclude<ApprovalStatus, 'PENDING' | 'CONSUMED'>;
  },
): Approval {
  const existing = getApproval(db, params.approvalId);
  if (!existing) {
    throw new NotFoundError(`Approval ${params.approvalId} not found`);
  }
  if (existing.status !== 'PENDING') {
    throw new Error(`Approval ${params.approvalId} is already ${existing.status}`);
  }

  const decidedAt = new Date().toISOString();
  updateApprovalDecision(
    db,
    params.approvalId,
    params.decision,
    GATED_ACTION_APPROVER_TYPE,
    HUMAN_OWNER_APPROVER_ID,
    decidedAt,
  );
  recordAudit(db, {
    kind: 'APPROVAL_DECIDED',
    missionId: existing.missionId,
    agentId: null,
    message: `${HUMAN_OWNER_DISPLAY_NAME} ${params.decision.toLowerCase()} ${existing.actionType} — approved subject: ${serializeApprovalSubject(existing.subject)}`,
    metadata: {
      approvalId: params.approvalId,
      actionType: existing.actionType,
      decision: params.decision,
      approverType: GATED_ACTION_APPROVER_TYPE,
      approverId: HUMAN_OWNER_APPROVER_ID,
      subject: existing.subject,
      summary: existing.summary,
    },
  });
  const updated = getApproval(db, params.approvalId);
  if (!updated) {
    throw new Error('Approval missing after update');
  }
  return updated;
}

/** Simulates a client/agent attempting to approve — must fail and audit. */
export function decideApprovalAsAttemptedApprover(
  db: Database.Database,
  params: {
    approvalId: string;
    decision: Exclude<ApprovalStatus, 'PENDING' | 'CONSUMED'>;
    attemptedApproverId: string;
  },
): Approval {
  const existing = getApproval(db, params.approvalId);
  if (!existing) {
    throw new NotFoundError(`Approval ${params.approvalId} not found`);
  }

  const agent = getAgentById(db, params.attemptedApproverId as AgentId);
  const violations: string[] = [];
  if (agent) {
    violations.push(
      `Agent "${agent.name}" cannot approve gated actions — human owner (${HUMAN_OWNER_DISPLAY_NAME}) required`,
    );
  }
  if (params.attemptedApproverId === existing.requestedByAgentId) {
    violations.push('Requester cannot approve their own request');
  }
  if (params.attemptedApproverId !== HUMAN_OWNER_APPROVER_ID && !agent) {
    violations.push('Only the human owner may approve gated actions');
  }

  if (violations.length > 0) {
    const message = violations.join('; ');
    recordAudit(db, {
      kind: 'APPROVAL_DECISION_REJECTED',
      missionId: existing.missionId,
      agentId: existing.requestedByAgentId,
      message,
      metadata: {
        approvalId: params.approvalId,
        actionType: existing.actionType,
        attemptedApproverId: params.attemptedApproverId,
        subject: existing.subject,
      },
    });
    throw new ApprovalPolicyViolationError(message);
  }

  return decideApprovalByHumanOwner(db, {
    approvalId: params.approvalId,
    decision: params.decision,
  });
}

export function consumeApprovalForAction(
  db: Database.Database,
  params: {
    approval: Approval;
    actorAgentId: AgentId;
    actionType: ApprovalActionType;
  },
): void {
  if (params.approval.status !== 'APPROVED') {
    throw new Error(`Approval ${params.approval.id} is not consumable (status ${params.approval.status})`);
  }
  const consumedAt = new Date().toISOString();
  markApprovalConsumed(db, params.approval.id, params.actorAgentId, consumedAt);
  recordAudit(db, {
    kind: 'APPROVAL_CONSUMED',
    missionId: params.approval.missionId,
    agentId: params.actorAgentId,
    message: `Consumed approval ${params.approval.id} for ${params.actionType}`,
    metadata: {
      approvalId: params.approval.id,
      actionType: params.actionType,
      approvedSubject: params.approval.subject,
      consumedAt,
    },
  });
}

export type { ApprovalSubjectByAction };
