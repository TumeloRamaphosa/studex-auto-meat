import type Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import type { ApprovalSubjectByAction } from '@/domain/approval-subject';
import { findConsumableApproval, getMission, insertAudit, listAgents,
  listApprovalsByStatus,
  listAssignments,
  listConnectorStatus,
  listEvidence,
  listMissions,
  listRecentAudit,
  listTasks,
  rowToApproval,
  updateMissionState,
} from '@/db/store';
import { canTransitionCashClaw } from '@/domain/cashclaw-states';
import {
  ActionBlockedError,
  InvalidTransitionError,
  NotFoundError,
} from '@/domain/errors';
import {
  MissingPaymentProofError,
  PaymentProofMismatchError,
} from '@/domain/payment';
import type {
  AgentId,
  ApprovalActionType,
  CashClawState,
  DashboardSnapshot,
  MissionId,
} from '@/domain/types';
import { executeGatedAction } from '@/services/action-guard';
import { recordAudit } from '@/services/audit-service';
import { assertPaymentProofForPaidTransition } from '@/services/evidence-service';
import { consumeApprovalForAction } from '@/services/approval-service';

const QUOTED_GATE = 'QUOTATION' as const;
const FULFILLMENT_GATE = 'FULFILLMENT' as const;

function blockTransitionMissingApproval(
  db: Database.Database,
  params: {
    missionId: MissionId;
    actorAgentId: AgentId;
    from: CashClawState;
    to: CashClawState;
    actionType: typeof QUOTED_GATE | typeof FULFILLMENT_GATE;
    subject?: ApprovalSubjectByAction[typeof QUOTED_GATE | typeof FULFILLMENT_GATE];
    reason: string;
  },
): never {
  recordAudit(db, {
    kind: 'ACTION_BLOCKED',
    missionId: params.missionId,
    agentId: params.actorAgentId,
    message: params.reason,
    metadata: {
      from: params.from,
      to: params.to,
      requiredApproval: params.actionType,
      attemptedSubject: params.subject ?? null,
    },
  });
  throw new ActionBlockedError(
    params.actionType,
    params.missionId,
    params.reason,
  );
}

export function transitionCashClawMission(
  db: Database.Database,
  params: {
    missionId: MissionId;
    toState: CashClawState;
    actorAgentId: AgentId;
    reason?: string;
    /** Required when transitioning to QUOTED (quotation subject) or FULFILLING (fulfilment ref). */
    approvalSubject?: ApprovalSubjectByAction[ApprovalActionType];
  },
): { from: CashClawState; to: CashClawState } {
  const mission = getMission(db, params.missionId);
  if (!mission) {
    throw new NotFoundError(`Mission ${params.missionId} not found`);
  }

  const from = mission.state;
  const to = params.toState;

  if (!canTransitionCashClaw(from, to)) {
    recordAudit(db, {
      kind: 'MISSION_TRANSITION_REJECTED',
      missionId: mission.id,
      agentId: params.actorAgentId,
      message: `Rejected transition ${from} → ${to}`,
      metadata: { from, to, reason: params.reason ?? null },
    });
    throw new InvalidTransitionError(from, to);
  }

  if (to === 'QUOTED') {
    const subject = params.approvalSubject;
    if (!subject || !('quoteRef' in subject)) {
      blockTransitionMissingApproval(db, {
        missionId: mission.id,
        actorAgentId: params.actorAgentId,
        from,
        to,
        actionType: QUOTED_GATE,
        reason: 'QUOTED requires quotation approval subject (quoteRef, amountZar)',
      });
    }
    const approval = findConsumableApproval(db, mission.id, QUOTED_GATE, subject);
    if (!approval) {
      blockTransitionMissingApproval(db, {
        missionId: mission.id,
        actorAgentId: params.actorAgentId,
        from,
        to,
        actionType: QUOTED_GATE,
        subject,
        reason: 'Blocked transition to QUOTED — no matching unused quotation approval',
      });
    }
    consumeApprovalForAction(db, {
      approval: approval!,
      actorAgentId: params.actorAgentId,
      actionType: QUOTED_GATE,
    });
  }

  if (to === 'FULFILLING') {
    const subject = params.approvalSubject;
    if (!subject || !('fulfilmentRef' in subject)) {
      blockTransitionMissingApproval(db, {
        missionId: mission.id,
        actorAgentId: params.actorAgentId,
        from,
        to,
        actionType: FULFILLMENT_GATE,
        reason: 'FULFILLING requires fulfilment approval subject (fulfilmentRef)',
      });
    }
    const approval = findConsumableApproval(db, mission.id, FULFILLMENT_GATE, subject);
    if (!approval) {
      blockTransitionMissingApproval(db, {
        missionId: mission.id,
        actorAgentId: params.actorAgentId,
        from,
        to,
        actionType: FULFILLMENT_GATE,
        subject,
        reason: 'Blocked transition to FULFILLING — no matching unused fulfilment approval',
      });
    }
    consumeApprovalForAction(db, {
      approval: approval!,
      actorAgentId: params.actorAgentId,
      actionType: FULFILLMENT_GATE,
    });
  }

  if (to === 'PAID') {
    try {
      const proof = assertPaymentProofForPaidTransition(db, mission.id, mission.paymentMethod);
      recordAudit(db, {
        kind: 'ACTION_EXECUTED',
        missionId: mission.id,
        agentId: params.actorAgentId,
        message: 'Payment proof validated for PAID transition (mock reference only)',
        metadata: {
          evidenceId: proof.id,
          paymentReference: proof.paymentReference,
          paymentProofSource: proof.paymentProofSource,
          paymentMethod: mission.paymentMethod,
        },
      });
    } catch (e) {
      if (e instanceof MissingPaymentProofError || e instanceof PaymentProofMismatchError) {
        recordAudit(db, {
          kind: 'MISSION_TRANSITION_REJECTED',
          missionId: mission.id,
          agentId: params.actorAgentId,
          message: `Rejected transition ${from} → PAID — ${e.message}`,
          metadata: {
            from,
            to,
            reason:
              e instanceof PaymentProofMismatchError ? 'payment_proof_mismatch' : 'missing_payment_proof',
            paymentMethod: mission.paymentMethod,
          },
        });
      }
      throw e;
    }
  }

  const updatedAt = new Date().toISOString();
  updateMissionState(db, mission.id, to, updatedAt);
  recordAudit(db, {
    kind: 'MISSION_STATE_CHANGED',
    missionId: mission.id,
    agentId: params.actorAgentId,
    message: `Mission moved ${from} → ${to}`,
    metadata: { from, to, reason: params.reason ?? null },
  });

  return { from, to };
}

export function applyPriceChange(
  db: Database.Database,
  params: {
    missionId: MissionId;
    actorAgentId: AgentId;
    sku: string;
    newPriceZar: number;
  },
): void {
  executeGatedAction(db, {
    missionId: params.missionId,
    actorAgentId: params.actorAgentId,
    actionType: 'PRICE_CHANGE',
    summary: `Example price change for ${params.sku} to R${params.newPriceZar} (demo)`,
    subject: { sku: params.sku, newPriceZar: params.newPriceZar },
    metadata: { sku: params.sku, newPriceZar: params.newPriceZar },
  });
}

export function loadDashboardSnapshot(db: Database.Database): DashboardSnapshot {
  return {
    agents: listAgents(db),
    missions: listMissions(db),
    tasks: listTasks(db),
    assignments: listAssignments(db),
    evidence: listEvidence(db),
    pendingApprovals: listApprovalsByStatus(db, 'PENDING'),
    recentApprovals: db
      .prepare(
        `SELECT * FROM approvals WHERE status != 'PENDING' ORDER BY decided_at DESC LIMIT 20`,
      )
      .all()
      .map((r) => rowToApproval(r as Record<string, unknown>)),
    connectorStatus: listConnectorStatus(db),
    recentAudit: listRecentAudit(db, 30),
  };
}

export function createMissionAuditStub(
  db: Database.Database,
  missionId: MissionId,
  leadAgentId: AgentId,
  title: string,
): void {
  insertAudit(db, {
    id: uuid(),
    kind: 'MISSION_CREATED',
    missionId,
    agentId: leadAgentId,
    message: `Mission created: ${title}`,
    metadata: { type: 'CASHCLAW' },
  });
}
