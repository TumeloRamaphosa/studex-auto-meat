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
  EvidenceKind,
  Mission,
  MissionAssignment,
  MissionId,
  PaymentMethod,
  PaymentProofSource,
  Task,
  AgentId,
} from '@/domain/types';
import type { ApprovalSubjectByAction } from '@/domain/approval-subject';
import {
  parseApprovalSubjectJson,
  subjectsMatchForAction,
} from '@/domain/approval-subject';
import { parsePaymentMethod } from '@/domain/payment';

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

function columnNames(db: Database.Database, table: string): Set<string> {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return new Set(rows.map((r) => r.name));
}

function addColumnIfMissing(
  db: Database.Database,
  table: string,
  column: string,
  definition: string,
): void {
  if (!columnNames(db, table).has(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
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

  addColumnIfMissing(db, 'missions', 'payment_method', "TEXT NOT NULL DEFAULT 'bank'");
  addColumnIfMissing(db, 'evidence', 'kind', "TEXT NOT NULL DEFAULT 'GENERAL'");
  addColumnIfMissing(db, 'evidence', 'payment_proof_source', 'TEXT');
  addColumnIfMissing(db, 'evidence', 'payment_reference', 'TEXT');
  addColumnIfMissing(db, 'approvals', 'subject_json', "TEXT NOT NULL DEFAULT '{}'");
  addColumnIfMissing(db, 'approvals', 'approver_type', 'TEXT');
  addColumnIfMissing(db, 'approvals', 'approver_id', 'TEXT');
  addColumnIfMissing(db, 'approvals', 'consumed_at', 'TEXT');
  addColumnIfMissing(db, 'approvals', 'consumed_by_agent_id', 'TEXT');
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
  const rawMethod = row.payment_method ?? 'bank';
  return {
    id: String(row.id),
    type: 'CASHCLAW',
    title: String(row.title),
    description: String(row.description),
    state: String(row.state) as CashClawState,
    paymentMethod: parsePaymentMethod(rawMethod),
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
  const rawSubject = row.subject_json ? String(row.subject_json) : '{}';
  let subject: Approval['subject'];
  try {
    subject = parseApprovalSubjectJson(rawSubject);
  } catch {
    subject = { actionType: 'QUOTATION', quoteRef: 'unknown', amountZar: 0 };
  }
  const approverId = row.approver_id
    ? String(row.approver_id)
    : row.decided_by_agent_id
      ? String(row.decided_by_agent_id)
      : null;
  const approverType = row.approver_type
    ? (String(row.approver_type) as Approval['decidedByApproverType'])
    : approverId?.startsWith('human-')
      ? 'human'
      : null;

  return {
    id: String(row.id),
    missionId: String(row.mission_id),
    actionType: String(row.action_type) as ApprovalActionType,
    summary: String(row.summary),
    subject,
    status: String(row.status) as ApprovalStatus,
    requestedByAgentId: String(row.requested_by_agent_id),
    decidedByApproverType: approverType,
    decidedByApproverId: approverId,
    createdAt: String(row.created_at),
    decidedAt: row.decided_at ? String(row.decided_at) : null,
    consumedAt: row.consumed_at ? String(row.consumed_at) : null,
    consumedByAgentId: row.consumed_by_agent_id ? String(row.consumed_by_agent_id) : null,
  };
}

export function rowToEvidence(row: Record<string, unknown>): Evidence {
  return {
    id: String(row.id),
    missionId: String(row.mission_id),
    taskId: row.task_id ? String(row.task_id) : null,
    kind: (row.kind ? String(row.kind) : 'GENERAL') as EvidenceKind,
    paymentProofSource: row.payment_proof_source
      ? (String(row.payment_proof_source) as PaymentProofSource)
      : null,
    paymentReference: row.payment_reference ? String(row.payment_reference) : null,
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

export function getAgentById(db: Database.Database, id: AgentId): Agent | undefined {
  const row = db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? rowToAgent(row) : undefined;
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
  subject: ApprovalSubjectByAction[ApprovalActionType],
): Approval | undefined {
  return findConsumableApproval(db, missionId, actionType, subject);
}

export function findConsumableApproval(
  db: Database.Database,
  missionId: MissionId,
  actionType: ApprovalActionType,
  subjectPayload: ApprovalSubjectByAction[typeof actionType],
): Approval | undefined {
  const rows = db
    .prepare(
      `SELECT * FROM approvals
       WHERE mission_id = ? AND action_type = ? AND status = 'APPROVED'
       ORDER BY decided_at DESC`,
    )
    .all(missionId, actionType) as Record<string, unknown>[];

  for (const row of rows) {
    const approval = rowToApproval(row);
    const json = row.subject_json ? String(row.subject_json) : '{}';
    if (
      subjectsMatchForAction(
        actionType,
        json,
        subjectPayload as ApprovalSubjectByAction[ApprovalActionType],
      )
    ) {
      return approval;
    }
  }
  return undefined;
}

export function markApprovalConsumed(
  db: Database.Database,
  approvalId: string,
  consumedByAgentId: AgentId,
  consumedAt: string,
): void {
  db.prepare(
    `UPDATE approvals
     SET status = 'CONSUMED', consumed_at = ?, consumed_by_agent_id = ?
     WHERE id = ? AND status = 'APPROVED'`,
  ).run(consumedAt, consumedByAgentId, approvalId);
}

export function listEvidence(db: Database.Database, missionId?: MissionId): Evidence[] {
  if (missionId) {
    return db
      .prepare('SELECT * FROM evidence WHERE mission_id = ? ORDER BY created_at ASC')
      .all(missionId)
      .map((r) => rowToEvidence(r as Record<string, unknown>));
  }
  return db
    .prepare('SELECT * FROM evidence ORDER BY created_at ASC')
    .all()
    .map((r) => rowToEvidence(r as Record<string, unknown>));
}

export function insertEvidence(db: Database.Database, evidence: Evidence): void {
  db.prepare(
    `INSERT INTO evidence (
      id, mission_id, task_id, kind, payment_proof_source, payment_reference,
      label, uri, notes, created_at
    ) VALUES (
      @id, @missionId, @taskId, @kind, @paymentProofSource, @paymentReference,
      @label, @uri, @notes, @createdAt
    )`,
  ).run({
    id: evidence.id,
    missionId: evidence.missionId,
    taskId: evidence.taskId,
    kind: evidence.kind,
    paymentProofSource: evidence.paymentProofSource,
    paymentReference: evidence.paymentReference,
    label: evidence.label,
    uri: evidence.uri,
    notes: evidence.notes,
    createdAt: evidence.createdAt,
  });
}

export function updateMissionPaymentMethod(
  db: Database.Database,
  missionId: MissionId,
  paymentMethod: PaymentMethod,
  updatedAt: string,
): void {
  db.prepare('UPDATE missions SET payment_method = ?, updated_at = ? WHERE id = ?').run(
    paymentMethod,
    updatedAt,
    missionId,
  );
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
  status: Exclude<ApprovalStatus, 'PENDING' | 'CONSUMED'>,
  approverType: 'human',
  approverId: string,
  decidedAt: string,
): void {
  db.prepare(
    `UPDATE approvals
     SET status = ?, approver_type = ?, approver_id = ?, decided_by_agent_id = NULL, decided_at = ?
     WHERE id = ?`,
  ).run(status, approverType, approverId, decidedAt, approvalId);
}
