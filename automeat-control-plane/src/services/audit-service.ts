import { v4 as uuid } from 'uuid';
import type Database from 'better-sqlite3';
import {
  getApproval,
  insertAudit,
  listRecentAudit,
  updateApprovalDecision,
} from '@/db/store';
import type { AgentId, Approval, ApprovalStatus, AuditEvent } from '@/domain/types';
import { NotFoundError } from '@/domain/errors';

export function recordAudit(
  db: Database.Database,
  input: {
    kind: AuditEvent['kind'];
    message: string;
    missionId?: string | null;
    agentId?: string | null;
    metadata?: Record<string, unknown>;
  },
): AuditEvent {
  return insertAudit(db, {
    id: uuid(),
    kind: input.kind,
    missionId: input.missionId ?? null,
    agentId: input.agentId ?? null,
    message: input.message,
    metadata: input.metadata ?? {},
  });
}

export function decideApproval(
  db: Database.Database,
  params: {
    approvalId: string;
    decision: Exclude<ApprovalStatus, 'PENDING'>;
    decidedByAgentId: AgentId;
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
    params.decidedByAgentId,
    decidedAt,
  );
  recordAudit(db, {
    kind: 'APPROVAL_DECIDED',
    missionId: existing.missionId,
    agentId: params.decidedByAgentId,
    message: `Approval ${params.approvalId} ${params.decision.toLowerCase()} for ${existing.actionType}`,
    metadata: {
      approvalId: params.approvalId,
      actionType: existing.actionType,
      decision: params.decision,
    },
  });
  const updated = getApproval(db, params.approvalId);
  if (!updated) {
    throw new Error('Approval missing after update');
  }
  return updated;
}

export function getDashboardAudit(db: Database.Database): AuditEvent[] {
  return listRecentAudit(db, 50);
}
