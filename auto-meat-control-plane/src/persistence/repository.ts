import type Database from "better-sqlite3";
import type {
  Agent,
  Approval,
  AuditEvent,
  ConnectorStatus,
  Evidence,
  Mission,
  Task,
} from "../domain/entities.js";

function parseJsonArray(raw: string): string[] {
  return JSON.parse(raw) as string[];
}

export class ControlPlaneRepository {
  constructor(private readonly db: Database.Database) {}

  isSeeded(): boolean {
    const row = this.db
      .prepare("SELECT value FROM meta WHERE key = 'seeded'")
      .get() as { value: string } | undefined;
    return row?.value === "true";
  }

  markSeeded(): void {
    this.db
      .prepare(
        "INSERT INTO meta(key, value) VALUES('seeded', 'true') ON CONFLICT(key) DO UPDATE SET value = 'true'",
      )
      .run();
  }

  clearAll(): void {
    this.db.exec(`
      DELETE FROM audit_events;
      DELETE FROM evidence;
      DELETE FROM approvals;
      DELETE FROM tasks;
      DELETE FROM missions;
      DELETE FROM agents;
      DELETE FROM connector_status;
      DELETE FROM meta;
    `);
  }

  upsertAgent(agent: Agent): void {
    this.db
      .prepare(
        `INSERT INTO agents(id, name, role, description, status)
         VALUES (@id, @name, @role, @description, @status)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           role = excluded.role,
           description = excluded.description,
           status = excluded.status`,
      )
      .run(agent);
  }

  upsertMission(mission: Mission): void {
    this.db
      .prepare(
        `INSERT INTO missions(id, kind, title, state, lead_ref, assigned_agent_ids, created_by_agent_id, created_at, updated_at)
         VALUES (@id, @kind, @title, @state, @leadRef, @assignedAgentIds, @createdByAgentId, @createdAt, @updatedAt)
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           state = excluded.state,
           lead_ref = excluded.lead_ref,
           assigned_agent_ids = excluded.assigned_agent_ids,
           updated_at = excluded.updated_at`,
      )
      .run({
        ...mission,
        assignedAgentIds: JSON.stringify(mission.assignedAgentIds),
      });
  }

  updateMissionState(
    missionId: string,
    state: string,
    updatedAt: string,
  ): void {
    this.db
      .prepare(
        "UPDATE missions SET state = @state, updated_at = @updatedAt WHERE id = @id",
      )
      .run({ id: missionId, state, updatedAt });
  }

  upsertTask(task: Task): void {
    this.db
      .prepare(
        `INSERT INTO tasks(id, mission_id, title, assignee_agent_id, status, created_at, updated_at)
         VALUES (@id, @missionId, @title, @assigneeAgentId, @status, @createdAt, @updatedAt)
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           status = excluded.status,
           updated_at = excluded.updated_at`,
      )
      .run(task);
  }

  upsertApproval(approval: Approval): void {
    this.db
      .prepare(
        `INSERT INTO approvals(id, mission_id, action_type, status, requested_by_agent_id, approved_by_human_ref, payload_summary, created_at, resolved_at)
         VALUES (@id, @missionId, @actionType, @status, @requestedByAgentId, @approvedByHumanRef, @payloadSummary, @createdAt, @resolvedAt)
         ON CONFLICT(id) DO UPDATE SET
           status = excluded.status,
           approved_by_human_ref = excluded.approved_by_human_ref,
           resolved_at = excluded.resolved_at`,
      )
      .run(approval);
  }

  upsertEvidence(item: Evidence): void {
    this.db
      .prepare(
        `INSERT INTO evidence(id, mission_id, kind, summary, uri, captured_by_agent_id, created_at)
         VALUES (@id, @missionId, @kind, @summary, @uri, @capturedByAgentId, @createdAt)
         ON CONFLICT(id) DO UPDATE SET summary = excluded.summary`,
      )
      .run(item);
  }

  upsertConnectorStatus(status: ConnectorStatus): void {
    this.db
      .prepare(
        `INSERT INTO connector_status(connector, mode, read_only, healthy, last_checked_at, detail)
         VALUES (@connector, @mode, @readOnly, @healthy, @lastCheckedAt, @detail)
         ON CONFLICT(connector) DO UPDATE SET
           mode = excluded.mode,
           read_only = excluded.read_only,
           healthy = excluded.healthy,
           last_checked_at = excluded.last_checked_at,
           detail = excluded.detail`,
      )
      .run({
        ...status,
        readOnly: status.readOnly ? 1 : 0,
        healthy: status.healthy ? 1 : 0,
      });
  }

  insertAudit(event: AuditEvent): void {
    this.db
      .prepare(
        `INSERT INTO audit_events(id, at, actor_agent_id, mission_id, action_type, outcome, message, metadata_json)
         VALUES (@id, @at, @actorAgentId, @missionId, @actionType, @outcome, @message, @metadataJson)`,
      )
      .run(event);
  }

  listAgents(): Agent[] {
    return this.db.prepare("SELECT * FROM agents ORDER BY name").all() as Agent[];
  }

  getMission(id: string): Mission | null {
    const row = this.db
      .prepare("SELECT * FROM missions WHERE id = @id")
      .get({ id }) as Record<string, unknown> | undefined;
    if (!row) return null;
    return rowToMission(row);
  }

  listMissions(): Mission[] {
    const rows = this.db
      .prepare("SELECT * FROM missions ORDER BY created_at DESC")
      .all() as Record<string, unknown>[];
    return rows.map(rowToMission);
  }

  listTasks(): Task[] {
    const rows = this.db
      .prepare("SELECT * FROM tasks ORDER BY created_at")
      .all() as Record<string, unknown>[];
    return rows.map((r) => ({
      id: r.id as string,
      missionId: r.mission_id as string,
      title: r.title as string,
      assigneeAgentId: r.assignee_agent_id as string,
      status: r.status as Task["status"],
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    }));
  }

  listApprovalsForMission(missionId: string): Approval[] {
    const rows = this.db
      .prepare("SELECT * FROM approvals WHERE mission_id = @missionId")
      .all({ missionId }) as Record<string, unknown>[];
    return rows.map(rowToApproval);
  }

  listAllApprovals(): Approval[] {
    const rows = this.db
      .prepare("SELECT * FROM approvals ORDER BY created_at DESC")
      .all() as Record<string, unknown>[];
    return rows.map(rowToApproval);
  }

  listEvidence(): Evidence[] {
    const rows = this.db
      .prepare("SELECT * FROM evidence ORDER BY created_at DESC")
      .all() as Record<string, unknown>[];
    return rows.map((r) => ({
      id: r.id as string,
      missionId: r.mission_id as string,
      kind: r.kind as string,
      summary: r.summary as string,
      uri: r.uri as string,
      capturedByAgentId: r.captured_by_agent_id as string,
      createdAt: r.created_at as string,
    }));
  }

  getConnectorStatus(): ConnectorStatus | null {
    const row = this.db
      .prepare("SELECT * FROM connector_status WHERE connector = 'shopify'")
      .get() as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      connector: "shopify",
      mode: row.mode as ConnectorStatus["mode"],
      readOnly: Boolean(row.read_only),
      healthy: Boolean(row.healthy),
      lastCheckedAt: row.last_checked_at as string,
      detail: row.detail as string,
    };
  }

  listAudit(limit = 100): AuditEvent[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM audit_events ORDER BY at DESC LIMIT @limit",
      )
      .all({ limit }) as Record<string, unknown>[];
    return rows.map((r) => ({
      id: r.id as string,
      at: r.at as string,
      actorAgentId: (r.actor_agent_id as string) ?? null,
      missionId: (r.mission_id as string) ?? null,
      actionType: r.action_type as AuditEvent["actionType"],
      outcome: r.outcome as AuditEvent["outcome"],
      message: r.message as string,
      metadataJson: r.metadata_json as string,
    }));
  }
}

function rowToMission(row: Record<string, unknown>): Mission {
  return {
    id: row.id as string,
    kind: row.kind as Mission["kind"],
    title: row.title as string,
    state: row.state as Mission["state"],
    leadRef: row.lead_ref as string,
    assignedAgentIds: parseJsonArray(row.assigned_agent_ids as string),
    createdByAgentId: row.created_by_agent_id as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToApproval(row: Record<string, unknown>): Approval {
  return {
    id: row.id as string,
    missionId: row.mission_id as string,
    actionType: row.action_type as Approval["actionType"],
    status: row.status as Approval["status"],
    requestedByAgentId: row.requested_by_agent_id as string,
    approvedByHumanRef: (row.approved_by_human_ref as string) ?? null,
    payloadSummary: row.payload_summary as string,
    createdAt: row.created_at as string,
    resolvedAt: (row.resolved_at as string) ?? null,
  };
}
