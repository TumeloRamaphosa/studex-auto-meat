/** Typed domain entities for the Auto Meat Phase 1 control plane. */

export type AgentRole =
  | "orchestrator"
  | "store"
  | "sales"
  | "content"
  | "supply"
  | "security";

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  status: "idle" | "active" | "blocked";
}

export type MissionKind = "cashclaw";

export type CashClawMissionState =
  | "INTAKE"
  | "QUALIFYING"
  | "SUPPLY_CHECK"
  | "PRICING_REVIEW"
  | "AWAITING_APPROVAL"
  | "QUOTED"
  | "ACCEPTED"
  | "PAID"
  | "FULFILLING"
  | "DELIVERED"
  | "FOLLOW_UP"
  | "COMPLETE";

export interface Mission {
  id: string;
  kind: MissionKind;
  title: string;
  state: CashClawMissionState;
  leadRef: string;
  assignedAgentIds: string[];
  createdByAgentId: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = "pending" | "in_progress" | "done" | "cancelled";

export interface Task {
  id: string;
  missionId: string;
  title: string;
  assigneeAgentId: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export type ApprovalActionType =
  | "PRICE_CHANGE"
  | "QUOTATION"
  | "PUBLISHING"
  | "CUSTOMER_MESSAGE"
  | "FULFILMENT"
  | "REFUND";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface Approval {
  id: string;
  missionId: string;
  actionType: ApprovalActionType;
  status: ApprovalStatus;
  requestedByAgentId: string;
  approvedByHumanRef: string | null;
  payloadSummary: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface Evidence {
  id: string;
  missionId: string;
  kind: string;
  summary: string;
  uri: string;
  capturedByAgentId: string;
  createdAt: string;
}

export type ConnectorName = "shopify";

export interface ConnectorStatus {
  connector: ConnectorName;
  mode: "mock" | "live";
  readOnly: boolean;
  healthy: boolean;
  lastCheckedAt: string;
  detail: string;
}

export type AuditOutcome = "allowed" | "blocked";

export interface AuditEvent {
  id: string;
  at: string;
  actorAgentId: string | null;
  missionId: string | null;
  actionType: ApprovalActionType | "MISSION_TRANSITION" | "SYSTEM";
  outcome: AuditOutcome | "recorded";
  message: string;
  metadataJson: string;
}

export const GATED_ACTION_TYPES: readonly ApprovalActionType[] = [
  "PRICE_CHANGE",
  "QUOTATION",
  "PUBLISHING",
  "CUSTOMER_MESSAGE",
  "FULFILMENT",
  "REFUND",
] as const;
