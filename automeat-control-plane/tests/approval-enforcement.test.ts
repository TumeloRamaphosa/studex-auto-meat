import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type Database from 'better-sqlite3';
import { openTestDb } from '@/db/store';
import { ActionBlockedError } from '@/domain/errors';
import { runSeed } from '@/seed/seed';
import {
  executeGatedAction,
  hasApprovedAction,
} from '@/services/action-guard';
import { decideApproval } from '@/services/audit-service';
import { transitionCashClawMission } from '@/services/mission-service';

const MISSION_ID = 'mission-demo-cashclaw-001';

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

  it('blocks gated actions without an approved record and audits the attempt', () => {
    const blockedBefore = db
      .prepare(`SELECT COUNT(*) as c FROM audit_events WHERE kind = 'ACTION_BLOCKED'`)
      .get() as { c: number };

    expect(() =>
      executeGatedAction(db, {
        missionId: MISSION_ID,
        actorAgentId: 'agent-sales',
        actionType: 'QUOTATION',
        summary: 'Attempt demo quote send',
      }),
    ).toThrow(ActionBlockedError);

    const blockedAfter = db
      .prepare(`SELECT COUNT(*) as c FROM audit_events WHERE kind = 'ACTION_BLOCKED'`)
      .get() as { c: number };
    expect(blockedAfter.c).toBe(blockedBefore.c + 1);
    expect(hasApprovedAction(db, MISSION_ID, 'QUOTATION')).toBe(false);
  });

  it('allows gated actions after approval is granted', () => {
    decideApproval(db, {
      approvalId: 'approval-quote-demo',
      decision: 'APPROVED',
      decidedByAgentId: 'agent-katia',
    });

    expect(hasApprovedAction(db, MISSION_ID, 'QUOTATION')).toBe(true);

    const result = executeGatedAction(db, {
      missionId: MISSION_ID,
      actorAgentId: 'agent-sales',
      actionType: 'QUOTATION',
      summary: 'Send demo quote after approval',
    });
    expect(result.ok).toBe(true);

    const executed = db
      .prepare(
        `SELECT COUNT(*) as c FROM audit_events WHERE kind = 'ACTION_EXECUTED' AND mission_id = ?`,
      )
      .get(MISSION_ID) as { c: number };
    expect(executed.c).toBeGreaterThan(0);
  });

  it('still blocks when approval was rejected', () => {
    decideApproval(db, {
      approvalId: 'approval-quote-demo',
      decision: 'REJECTED',
      decidedByAgentId: 'agent-katia',
    });

    expect(hasApprovedAction(db, MISSION_ID, 'QUOTATION')).toBe(false);

    expect(() =>
      executeGatedAction(db, {
        missionId: MISSION_ID,
        actorAgentId: 'agent-sales',
        actionType: 'QUOTATION',
        summary: 'Should remain blocked',
      }),
    ).toThrow(ActionBlockedError);

    expect(() =>
      transitionCashClawMission(db, {
        missionId: MISSION_ID,
        toState: 'AWAITING_APPROVAL',
        actorAgentId: 'agent-katia',
      }),
    ).not.toThrow();

    expect(() =>
      transitionCashClawMission(db, {
        missionId: MISSION_ID,
        toState: 'QUOTED',
        actorAgentId: 'agent-sales',
      }),
    ).toThrow(ActionBlockedError);
  });

  it('covers all gated action types in the guard layer', () => {
    const types = [
      'PRICE_CHANGE',
      'PUBLISHING',
      'CUSTOMER_MESSAGE',
      'FULFILLMENT',
      'REFUND',
    ] as const;

    for (const actionType of types) {
      expect(() =>
        executeGatedAction(db, {
          missionId: MISSION_ID,
          actorAgentId: 'agent-sales',
          actionType,
          summary: `blocked ${actionType} attempt`,
        }),
      ).toThrow(ActionBlockedError);
    }
  });
});
