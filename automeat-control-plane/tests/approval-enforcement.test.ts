import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type Database from 'better-sqlite3';
import { openTestDb } from '@/db/store';
import { ActionBlockedError } from '@/domain/errors';
import { runSeed } from '@/seed/seed';
import { executeGatedAction } from '@/services/action-guard';
import { decideApprovalByHumanOwner } from '@/services/approval-service';
import { transitionCashClawMission } from '@/services/mission-service';

const MISSION_ID = 'mission-demo-cashclaw-001';
const DEMO_QUOTE_SUBJECT = { quoteRef: 'DEMO-Q-001', amountZar: 15000 };
const DEMO_PRICE_SUBJECT = { sku: 'STUDEX-WAGYU-STRIP-1KG-DEMO', newPriceZar: 1804 };

describe('approval enforcement', () => {
  let db: Database.Database;
  let dbPath: string;

  beforeEach(async () => {
    dbPath = path.join(os.tmpdir(), `automeat-approval-${Date.now()}.db`);
    db = openTestDb(dbPath);
    await runSeed(db);
  });

  afterEach(() => {
    db.close();
    fs.rmSync(dbPath, { force: true });
    if (fs.existsSync(`${dbPath}-wal`)) fs.rmSync(`${dbPath}-wal`, { force: true });
    if (fs.existsSync(`${dbPath}-shm`)) fs.rmSync(`${dbPath}-shm`, { force: true });
  });

  it('blocks gated actions without a matching approved record', () => {
    expect(() =>
      executeGatedAction(db, {
        missionId: MISSION_ID,
        actorAgentId: 'agent-sales',
        actionType: 'QUOTATION',
        summary: 'Attempt demo quote send',
        subject: DEMO_QUOTE_SUBJECT,
      }),
    ).toThrow(ActionBlockedError);
  });

  it('allows gated actions after human owner approval with matching subject', () => {
    decideApprovalByHumanOwner(db, {
      approvalId: 'approval-quote-demo',
      decision: 'APPROVED',
    });

    const result = executeGatedAction(db, {
      missionId: MISSION_ID,
      actorAgentId: 'agent-sales',
      actionType: 'QUOTATION',
      summary: 'Send demo quote after approval',
      subject: DEMO_QUOTE_SUBJECT,
    });
    expect(result.ok).toBe(true);
  });

  it('still blocks when approval was rejected', () => {
    decideApprovalByHumanOwner(db, {
      approvalId: 'approval-quote-demo',
      decision: 'REJECTED',
    });

    expect(() =>
      executeGatedAction(db, {
        missionId: MISSION_ID,
        actorAgentId: 'agent-sales',
        actionType: 'QUOTATION',
        summary: 'Should remain blocked',
        subject: DEMO_QUOTE_SUBJECT,
      }),
    ).toThrow(ActionBlockedError);

    transitionCashClawMission(db, {
      missionId: MISSION_ID,
      toState: 'AWAITING_APPROVAL',
      actorAgentId: 'agent-katia',
    });

    expect(() =>
      transitionCashClawMission(db, {
        missionId: MISSION_ID,
        toState: 'QUOTED',
        actorAgentId: 'agent-sales',
        approvalSubject: DEMO_QUOTE_SUBJECT,
      }),
    ).toThrow(ActionBlockedError);
  });

  it('covers gated action types without matching approvals', () => {
    const cases = [
      { actionType: 'PRICE_CHANGE' as const, subject: DEMO_PRICE_SUBJECT },
      { actionType: 'PUBLISHING' as const, subject: { contentDraftId: 'draft-naledi-demo-1' } },
      { actionType: 'CUSTOMER_MESSAGE' as const, subject: { messageId: 'msg-demo-1' } },
      { actionType: 'FULFILLMENT' as const, subject: { fulfilmentRef: 'DEMO-SHIP-001' } },
      { actionType: 'REFUND' as const, subject: { orderRef: '#DEMO1001', refundAmountZar: 100 } },
    ];

    for (const c of cases) {
      expect(() =>
        executeGatedAction(db, {
          missionId: MISSION_ID,
          actorAgentId: 'agent-sales',
          actionType: c.actionType,
          summary: `blocked ${c.actionType}`,
          subject: c.subject,
        }),
      ).toThrow(ActionBlockedError);
    }
  });
});
