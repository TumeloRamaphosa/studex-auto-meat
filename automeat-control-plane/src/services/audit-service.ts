import { v4 as uuid } from 'uuid';
import type Database from 'better-sqlite3';
import { insertAudit, listRecentAudit } from '@/db/store';
import type { AuditEvent } from '@/domain/types';

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

export function getDashboardAudit(db: Database.Database): AuditEvent[] {
  return listRecentAudit(db, 50);
}
