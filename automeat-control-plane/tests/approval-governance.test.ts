import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type Database from 'better-sqlite3';
import { getApproval, openTestDb } from '@/db/store';
import { ActionBlockedError, ApprovalPolicyViolationError } from '@/domain/errors';
import { runSeed } from '@/seed/seed';
import { attachPaymentProof } from '@/services/evidence-service';
import { executeGatedAction } from '@/services/action-guard';
import {
  decideApprovalAsAttemptedApprover,
  decideApprovalByHumanOwner,
} from '@/services/approval-service';
import { transitionCashClawMission } from '@/services/mission-service';

const MISSION_ID = 'mission-demo-cashclaw-001';
const DEMO_QUOTE_SUBJECT = { quoteRef: 'DEMO-Q-001', amountZar: 15000 };
const DEMO_FULFIL_SUBJECT = { fulfilmentRef: 'DEMO-SHIP-001' };
const DEMO_PRICE_A = { sku: 'STUDEX-WAGYU-STRIP-1KG-DEMO', newPriceZar: 1804 };
const DEMO_PRICE_B = { sku: 'STUDEX-WAGYU-STRIP-1KG-DEMO', newPriceZar: 1700 };

function moveToPaid(db: Database.Database): void {
  attachPaymentProof(db, {
    missionId: MISSION_ID,
    paymentMethod: 'bank',
    paymentReference: 'EXAMPLE-EFT-DEMO-001',
  });
  db.prepare('UPDATE missions SET state = ? WHERE id = ?').run('ACCEPTED', MISSION_ID);
  transitionCashClawMission(db, {
    missionId: MISSION_ID,
    toState: 'PAID',
    actorAgentId: 'agent-sales',
  });
}

describe('approval governance (criterion 5)', () => {
  let db: Database.Database;
  let dbPath: string;

  beforeEach(async () => {
    dbPath = path.join(os.tmpdir(), `automeat-gov-${Date.now()}.db`);
    db = openTestDb(dbPath);
    await runSeed(db);
  });

  afterEach(() => {
    db.close();
    fs.rmSync(dbPath, { force: true });
  });

  it('refuses PAID → FULFILLING without fulfilment approval, then passes with approval', () => {
    moveToPaid(db);

    expect(() =>
      transitionCashClawMission(db, {
        missionId: MISSION_ID,
        toState: 'FULFILLING',
        actorAgentId: 'agent-marcus',
        approvalSubject: DEMO_FULFIL_SUBJECT,
      }),
    ).toThrow(ActionBlockedError);

    decideApprovalByHumanOwner(db, {
      approvalId: 'approval-fulfilment-demo',
      decision: 'APPROVED',
    });

    expect(() =>
      transitionCashClawMission(db, {
        missionId: MISSION_ID,
        toState: 'FULFILLING',
        actorAgentId: 'agent-marcus',
        approvalSubject: DEMO_FULFIL_SUBJECT,
      }),
    ).not.toThrow();

    const row = db.prepare('SELECT state FROM missions WHERE id = ?').get(MISSION_ID) as {
      state: string;
    };
    expect(row.state).toBe('FULFILLING');
  });

  it('cannot reuse a consumed approval', () => {
    decideApprovalByHumanOwner(db, {
      approvalId: 'approval-quote-demo',
      decision: 'APPROVED',
    });

    executeGatedAction(db, {
      missionId: MISSION_ID,
      actorAgentId: 'agent-sales',
      actionType: 'QUOTATION',
      summary: 'First quote send',
      subject: DEMO_QUOTE_SUBJECT,
    });

    expect(getApproval(db, 'approval-quote-demo')?.status).toBe('CONSUMED');

    expect(() =>
      executeGatedAction(db, {
        missionId: MISSION_ID,
        actorAgentId: 'agent-sales',
        actionType: 'QUOTATION',
        summary: 'Second quote send',
        subject: DEMO_QUOTE_SUBJECT,
      }),
    ).toThrow(ActionBlockedError);
  });

  it('approval for item A does not authorize item B', () => {
    decideApprovalByHumanOwner(db, {
      approvalId: 'approval-price-demo',
      decision: 'APPROVED',
    });

    expect(() =>
      executeGatedAction(db, {
        missionId: MISSION_ID,
        actorAgentId: 'agent-sales',
        actionType: 'PRICE_CHANGE',
        summary: 'Wrong price attempt',
        subject: DEMO_PRICE_B,
      }),
    ).toThrow(ActionBlockedError);

    expect(() =>
      executeGatedAction(db, {
        missionId: MISSION_ID,
        actorAgentId: 'agent-sales',
        actionType: 'PRICE_CHANGE',
        summary: 'Correct price attempt',
        subject: DEMO_PRICE_A,
      }),
    ).not.toThrow();
  });

  it('rejects when an agent attempts to approve', () => {
    expect(() =>
      decideApprovalAsAttemptedApprover(db, {
        approvalId: 'approval-quote-demo',
        decision: 'APPROVED',
        attemptedApproverId: 'agent-katia',
      }),
    ).toThrow(ApprovalPolicyViolationError);

    expect(getApproval(db, 'approval-quote-demo')?.status).toBe('PENDING');
  });

  it('rejects when requester attempts self-approval via agent id', () => {
    expect(() =>
      decideApprovalAsAttemptedApprover(db, {
        approvalId: 'approval-quote-demo',
        decision: 'APPROVED',
        attemptedApproverId: 'agent-sales',
      }),
    ).toThrow(ApprovalPolicyViolationError);
  });
});
