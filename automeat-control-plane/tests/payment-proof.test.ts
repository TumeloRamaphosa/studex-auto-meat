import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type Database from 'better-sqlite3';
import { openTestDb } from '@/db/store';
import {
  InvalidPaymentMethodError,
  MissingPaymentProofError,
  PaymentProofMismatchError,
} from '@/domain/payment';
import { runSeed } from '@/seed/seed';
import { attachPaymentProof } from '@/services/evidence-service';
import { transitionCashClawMission } from '@/services/mission-service';
import { setMissionPaymentMethod } from '@/services/payment-service';

const MISSION_ID = 'mission-demo-cashclaw-001';

function forceMissionState(db: Database.Database, state: string): void {
  db.prepare('UPDATE missions SET state = ? WHERE id = ?').run(state, MISSION_ID);
}

describe('PAID transition payment proof', () => {
  let db: Database.Database;
  let dbPath: string;

  beforeEach(async () => {
    dbPath = path.join(os.tmpdir(), `automeat-paid-${Date.now()}.db`);
    db = openTestDb(dbPath);
    await runSeed(db);
    forceMissionState(db, 'ACCEPTED');
  });

  afterEach(() => {
    db.close();
    fs.rmSync(dbPath, { force: true });
    if (fs.existsSync(`${dbPath}-wal`)) fs.rmSync(`${dbPath}-wal`, { force: true });
    if (fs.existsSync(`${dbPath}-shm`)) fs.rmSync(`${dbPath}-shm`, { force: true });
  });

  it('rejects PAID without payment proof evidence and audits rejection', () => {
    const before = db
      .prepare(
        `SELECT COUNT(*) as c FROM audit_events WHERE kind = 'MISSION_TRANSITION_REJECTED' AND message LIKE '%PAID%'`,
      )
      .get() as { c: number };

    expect(() =>
      transitionCashClawMission(db, {
        missionId: MISSION_ID,
        toState: 'PAID',
        actorAgentId: 'agent-sales',
      }),
    ).toThrow(MissingPaymentProofError);

    const after = db
      .prepare(
        `SELECT COUNT(*) as c FROM audit_events WHERE kind = 'MISSION_TRANSITION_REJECTED' AND message LIKE '%PAID%'`,
      )
      .get() as { c: number };
    expect(after.c).toBe(before.c + 1);

    const mission = db.prepare('SELECT state FROM missions WHERE id = ?').get(MISSION_ID) as {
      state: string;
    };
    expect(mission.state).toBe('ACCEPTED');
  });

  it('allows PAID with matching bank confirmation reference (mock)', () => {
    attachPaymentProof(db, {
      missionId: MISSION_ID,
      paymentMethod: 'bank',
      paymentReference: 'EXAMPLE-EFT-REF-DEMO-8842',
    });

    const result = transitionCashClawMission(db, {
      missionId: MISSION_ID,
      toState: 'PAID',
      actorAgentId: 'agent-sales',
    });
    expect(result.to).toBe('PAID');
  });

  it('rejects PAID when proof source does not match mission payment_method', () => {
    attachPaymentProof(db, {
      missionId: MISSION_ID,
      paymentMethod: 'shopify',
      paymentReference: '#DEMO1001',
    });

    expect(() =>
      transitionCashClawMission(db, {
        missionId: MISSION_ID,
        toState: 'PAID',
        actorAgentId: 'agent-sales',
      }),
    ).toThrow(PaymentProofMismatchError);
  });

  it('allows PAID with Shopify order reference when payment_method is shopify', () => {
    setMissionPaymentMethod(db, {
      missionId: MISSION_ID,
      paymentMethod: 'shopify',
      actorAgentId: 'agent-katia',
    });
    attachPaymentProof(db, {
      missionId: MISSION_ID,
      paymentMethod: 'shopify',
      paymentReference: 'gid://shopify/Order/EXAMPLE-1001',
    });

    expect(() =>
      transitionCashClawMission(db, {
        missionId: MISSION_ID,
        toState: 'PAID',
        actorAgentId: 'agent-sales',
      }),
    ).not.toThrow();
  });
});

describe('Phase 1 payment_method', () => {
  let db: Database.Database;
  let dbPath: string;

  beforeEach(async () => {
    dbPath = path.join(os.tmpdir(), `automeat-paymethod-${Date.now()}.db`);
    db = openTestDb(dbPath);
    await runSeed(db);
  });

  afterEach(() => {
    db.close();
    fs.rmSync(dbPath, { force: true });
  });

  it('defaults seeded mission to bank', () => {
    const row = db.prepare('SELECT payment_method FROM missions WHERE id = ?').get(MISSION_ID) as {
      payment_method: string;
    };
    expect(row.payment_method).toBe('bank');
  });

  it('rejects crypto/wallet/stablecoin payment methods', () => {
    for (const bad of ['crypto', 'wallet', 'stablecoin', 'usdc']) {
      expect(() =>
        setMissionPaymentMethod(db, {
          missionId: MISSION_ID,
          paymentMethod: bad,
          actorAgentId: 'agent-katia',
        }),
      ).toThrow(InvalidPaymentMethodError);
    }

    const blocked = db
      .prepare(`SELECT COUNT(*) as c FROM audit_events WHERE kind = 'ACTION_BLOCKED'`)
      .get() as { c: number };
    expect(blocked.c).toBeGreaterThanOrEqual(4);
  });

  it('accepts shopify and bank only', () => {
    expect(
      setMissionPaymentMethod(db, {
        missionId: MISSION_ID,
        paymentMethod: 'shopify',
        actorAgentId: 'agent-katia',
      }),
    ).toBe('shopify');
    expect(
      setMissionPaymentMethod(db, {
        missionId: MISSION_ID,
        paymentMethod: 'bank',
        actorAgentId: 'agent-katia',
      }),
    ).toBe('bank');
  });
});
