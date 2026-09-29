import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openTestDb, resetDb } from '@/db/store';
import type Database from 'better-sqlite3';
import { CASHCLAW_ALLOWED_TRANSITIONS } from '@/domain/cashclaw-states';
import { InvalidTransitionError } from '@/domain/errors';
import { runSeed } from '@/seed/seed';
import { transitionCashClawMission } from '@/services/mission-service';

describe('CashClaw mission transitions', () => {
  let db: Database.Database;
  let dbPath: string;

  beforeEach(async () => {
    dbPath = path.join(os.tmpdir(), `automeat-test-${Date.now()}.db`);
    db = openTestDb(dbPath);
    await runSeed(db);
  });

  afterEach(() => {
    db.close();
    fs.rmSync(dbPath, { force: true });
    if (fs.existsSync(`${dbPath}-wal`)) fs.rmSync(`${dbPath}-wal`, { force: true });
    if (fs.existsSync(`${dbPath}-shm`)) fs.rmSync(`${dbPath}-shm`, { force: true });
  });

  it('allows valid transitions along the happy path', () => {
    const missionId = 'mission-demo-cashclaw-001';
    // seed starts at PRICING_REVIEW
    expect(() =>
      transitionCashClawMission(db, {
        missionId,
        toState: 'AWAITING_APPROVAL',
        actorAgentId: 'agent-katia',
      }),
    ).not.toThrow();

    expect(() =>
      transitionCashClawMission(db, {
        missionId,
        toState: 'PRICING_REVIEW',
        actorAgentId: 'agent-katia',
      }),
    ).not.toThrow();
  });

  it('rejects transitions not in the allowed map and writes audit', () => {
    const missionId = 'mission-demo-cashclaw-001';
    const before = db
      .prepare(`SELECT COUNT(*) as c FROM audit_events WHERE kind = 'MISSION_TRANSITION_REJECTED'`)
      .get() as { c: number };

    expect(() =>
      transitionCashClawMission(db, {
        missionId,
        toState: 'PAID',
        actorAgentId: 'agent-katia',
      }),
    ).toThrow(InvalidTransitionError);

    const after = db
      .prepare(`SELECT COUNT(*) as c FROM audit_events WHERE kind = 'MISSION_TRANSITION_REJECTED'`)
      .get() as { c: number };
    expect(after.c).toBe(before.c + 1);
  });

  it('documents every state in the explicit transition map', () => {
    const states = Object.keys(CASHCLAW_ALLOWED_TRANSITIONS);
    expect(states).toHaveLength(12);
    expect(states).toContain('COMPLETE');
  });
});

describe('fresh database reset', () => {
  it('resetDb clears persisted rows', async () => {
    const dbPath = path.join(os.tmpdir(), `automeat-reset-${Date.now()}.db`);
    const db = openTestDb(dbPath);
    await runSeed(db);
    expect(db.prepare('SELECT COUNT(*) as c FROM agents').get()).toEqual({ c: 6 });
    resetDb(db);
    expect(db.prepare('SELECT COUNT(*) as c FROM agents').get()).toEqual({ c: 0 });
    db.close();
    fs.rmSync(dbPath, { force: true });
  });
});
