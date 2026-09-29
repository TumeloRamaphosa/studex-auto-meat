import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import type {
  Agent,
  Approval,
  ApprovalActionType,
  ApprovalStatus,
  AuditEvent,
  AuditEventKind,
  CashClawState,
  ConnectorStatus,
  Evidence,
  Mission,
  MissionAssignment,
  MissionId,
  Task,
} from '@/domain/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = process.env.AUTOMEAT_DB_PATH ?? path.join(DATA_DIR, 'automeat.db');

let dbSingleton: Database.Database | null = null;

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getDbPath(): string {
  return DB_PATH;
}

export function getDb(): Database.Database {
  if (dbSingleton) {
    return dbSingleton;
  }
  ensureDataDir();
  dbSingleton = new Database(DB_PATH);
  dbSingleton.pragma('journal_mode = WAL');
  dbSingleton.pragma('foreign_keys = ON');
  migrate(dbSingleton);
  return dbSingleton;
}

/** Test helper — isolated database file. */
export function openTestDb(filePath: string): Database.Database {
  const db = new Database(filePath);
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

export function closeDb(): void {
  if (dbSingleton) {
    dbSingleton.close();
    dbSingleton = null;
  }
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role_slug TEXT NOT NULL,
      role_title TEXT NOT NULL,
      role_description TEXT NOT NULL,
      is_orchestrator INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      state TEXT NOT NULL,
      lead_agent_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (lead_agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS mission_assignments (
      mission_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      role_on_mission TEXT NOT NULL,
      PRIMARY KEY (mission_id, agent_id),
      FOREIGN KEY (mission_id) REFERENCES missions(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL,
      assignee_agent_id TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (mission_id) REFERENCES missions(id),
      FOREIGN KEY (assignee_agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      summary TEXT NOT NULL,
      status TEXT NOT NULL,
      requested_by_agent_id TEXT NOT NULL,
      decided_by_agent_id TEXT,
      created_at TEXT NOT NULL,
      decided_at TEXT,
      FOREIGN KEY (mission_id) REFERENCES missions(id)
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL,
      task_id TEXT,
      label TEXT NOT NULL,
      uri TEXT NOT NULL,
      notes TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (mission_id) REFERENCES missions(id)
    );

    CREATE TABLE IF NOT EXISTS connector_status (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      display_name TEXT NOT NULL,
      mode TEXT NOT NULL,
      health TEXT NOT NULL,
      last_checked_at TEXT NOT NULL,
      detail TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      mission_id TEXT,
      agent_id TEXT,
      message TEXT NOT NULL,
      metadata_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

export function resetDb(db: Database.Database): void {
  db.exec(`
    DELETE FROM audit_events;
    DELETE FROM evidence;
    DELETE FROM approvals;
    DELETE FROM tasks;
    DELETE FROM mission_assignments;
    DELETE FROM missions;
    DELETE FROM connector_status;
    DELETE FROM agents;
  `);
}

function parseMetadata(json: string): Record<string, unknown> {
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function rowToAgent(row: Record<string, unknown>): Agent {
  return {
    id: String(row.id),
    name: String(row.name),
    roleSlug: String(row.role_slug),
    roleTitle: String(row.role_title),
    roleDescription: String(row.role_description),
    isOrchestrator: Boolean(row.is_orchestrator),
    createdAt: String(row.created_at),
  };
}

export function rowToMission(row: Record<string, unknown>): Mission {
  return {
    id: String(row.id),
    type: 'CASHCLAW',
    title: String(row.title),
    description: String(row.description),
    state: String(row.state) as CashClawState,
    leadAgentId: String(row.lead_agent_id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: String(row.id),
    missionId: String(row.mission_id),
    assigneeAgentId: String(row.assignee_agent_id),
    title: String(row.title),
    summary: String(row.summary),
    status: row.status as Task['status'],
    createdAt: String(row.created_at),
  };
}

export function rowToApproval(row: Record<string, unknown>): Approval {
  return {
    id: String(row.id),
    missionId: String(row.mission_id),
    actionType: String(row.action_type) as ApprovalActionType,
    summary: String(row.summary),
    status: String(row.status) as ApprovalStatus,
    requestedByAgentId: String(row.requested_by_agent_id),
    decidedByAgentId: row.decided_by_agent_id ? String(row.decided_by_agent_id) : null,
    createdAt: String(row.created_at),
    decidedAt: row.decided_at ? String(row.decided_at) : null,
  };
}

export function rowToEvidence(row: Record<string, unknown>): Evidence {
  return {
    id: String(row.id),
    missionId: String(row.mission_id),
    taskId: row.task_id ? String(row.task_id) : null,
    label: String(row.label),
    uri: String(row.uri),
    notes: String(row.notes),
    createdAt: String(row.created_at),
  };
}

export function rowToConnector(row: Record<string, unknown>): ConnectorStatus {
  return {
    id: String(row.id),
    kind: 'SHOPIFY',
    displayName: String(row.display_name),
    mode: 'READ_ONLY_MOCK',
    health: row.health as ConnectorStatus['health'],
    lastCheckedAt: String(row.last_checked_at),
    detail: String(row.detail),
  };
}

export function rowToAudit(row: Record<string, unknown>): AuditEvent {
  return {
    id: String(row.id),
    kind: String(row.kind) as AuditEventKind,
    missionId: row.mission_id ? String(row.mission_id) : null,
    agentId: row.agent_id ? String(row.agent_id) : null,
    message: String(row.message),
    metadata: parseMetadata(String(row.metadata_json)),
    createdAt: String(row.created_at),
  };
}

export function listAgents(db: Database.Database): Agent[] {
  return db
    .prepare('SELECT * FROM agents ORDER BY is_orchestrator DESC, name ASC')
    .all()
    .map((r) => rowToAgent(r as Record<string, unknown>));
}

export function getMission(db: Database.Database, id: MissionId): Mission | undefined {
  const row = db.prepare('SELECT * FROM missions WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? rowToMission(row) : undefined;
}

export function listMissions(db: Database.Database): Mission[] {
  return db
    .prepare('SELECT * FROM missions ORDER BY updated_at DESC')
    .all()
    .map((r) => rowToMission(r as Record<string, unknown>));
}

export function listTasks(db: Database.Database): Task[] {
  return db
    .prepare('SELECT * FROM tasks ORDER BY created_at ASC')
    .all()
    .map((r) => rowToTask(r as Record<string, unknown>));
}

export function listAssignments(db: Database.Database): MissionAssignment[] {
  return db
    .prepare('SELECT mission_id, agent_id, role_on_mission FROM mission_assignments')
    .all()
    .map((r) => {
      const row = r as Record<string, unknown>;
      return {
        missionId: String(row.mission_id),
        agentId: String(row.agent_id),
        roleOnMission: String(row.role_on_mission),
      };
    });
}

export function listApprovalsByStatus(
  db: Database.Database,
  status: ApprovalStatus,
): Approval[] {
  return db
    .prepare('SELECT * FROM approvals WHERE status = ? ORDER BY created_at DESC')
    .all(status)
    .map((r) => rowToApproval(r as Record<string, unknown>));
}

export function getApproval(db: Database.Database, id: string): Approval | undefined {
  const row = db.prepare('SELECT * FROM approvals WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? rowToApproval(row) : undefined;
}

export function findApprovedApproval(
  db: Database.Database,
  missionId: MissionId,
  actionType: ApprovalActionType,
): Approval | undefined {
  const row = db
    .prepare(
      `SELECT * FROM approvals
       WHERE mission_id = ? AND action_type = ? AND status = 'APPROVED'
       ORDER BY decided_at DESC LIMIT 1`,
    )
    .get(missionId, actionType) as Record<string, unknown> | undefined;
  return row ? rowToApproval(row) : undefined;
}

export function listConnectorStatus(db: Database.Database): ConnectorStatus[] {
  return db
    .prepare('SELECT * FROM connector_status ORDER BY display_name ASC')
    .all()
    .map((r) => rowToConnector(r as Record<string, unknown>));
}

export function listRecentAudit(db: Database.Database, limit = 40): AuditEvent[] {
  return db
    .prepare('SELECT * FROM audit_events ORDER BY created_at DESC LIMIT ?')
    .all(limit)
    .map((r) => rowToAudit(r as Record<string, unknown>));
}

export function insertAudit(
  db: Database.Database,
  event: Omit<AuditEvent, 'createdAt'> & { createdAt?: string },
): AuditEvent {
  const createdAt = event.createdAt ?? new Date().toISOString();
  db.prepare(
    `INSERT INTO audit_events (id, kind, mission_id, agent_id, message, metadata_json, created_at)
     VALUES (@id, @kind, @missionId, @agentId, @message, @metadataJson, @createdAt)`,
  ).run({
    id: event.id,
    kind: event.kind,
    missionId: event.missionId,
    agentId: event.agentId,
    message: event.message,
    metadataJson: JSON.stringify(event.metadata ?? {}),
    createdAt,
  });
  return { ...event, createdAt, metadata: event.metadata ?? {} };
}

export function updateMissionState(
  db: Database.Database,
  missionId: MissionId,
  state: CashClawState,
  updatedAt: string,
): void {
  db.prepare('UPDATE missions SET state = ?, updated_at = ? WHERE id = ?').run(
    state,
    updatedAt,
    missionId,
  );
}

export function updateApprovalDecision(
  db: Database.Database,
  approvalId: string,
  status: Exclude<ApprovalStatus, 'PENDING'>,
  decidedByAgentId: string,
  decidedAt: string,
): void {
  db.prepare(
    `UPDATE approvals SET status = ?, decided_by_agent_id = ?, decided_at = ? WHERE id = ?`,
  ).run(status, decidedByAgentId, decidedAt, approvalId);
}
