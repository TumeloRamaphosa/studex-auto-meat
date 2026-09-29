/** StudEx Meat / AutoMeat Phase 1 — example data only; no production identifiers. */

import type { ApprovalSubject } from './approval-subject';

export type AgentId = string;
export type MissionId = string;
export type TaskId = string;
export type ApprovalId = string;
export type EvidenceId = string;
export type AuditEventId = string;

export interface Agent {
  id: AgentId;
  name: string;
  /** Stable role slug documented in README */
  roleSlug: string;
  roleTitle: string;
  roleDescription: string;
  isOrchestrator: boolean;
  createdAt: string;
}

export type MissionType = 'CASHCLAW';

export type CashClawState =
  | 'INTAKE'
  | 'QUALIFYING'
  | 'SUPPLY_CHECK'
  | 'PRICING_REVIEW'
  | 'AWAITING_APPROVAL'
  | 'QUOTED'
  | 'ACCEPTED'
  | 'PAID'
  | 'FULFILLING'
  | 'DELIVERED'
  | 'FOLLOW_UP'
  | 'COMPLETE';

/** Phase 1 payment rails — `shopify` checkout or `bank` EFT only (no crypto). */
export type PaymentMethod = 'shopify' | 'bank';

export interface Mission {
  id: MissionId;
  type: MissionType;
  title: string;
  description: string;
  state: CashClawState;
  /** Expected settlement path for this CashClaw deal (default `bank`). */
  paymentMethod: PaymentMethod;
  leadAgentId: AgentId;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';

export interface Task {
  id: TaskId;
  missionId: MissionId;
  assigneeAgentId: AgentId;
  title: string;
  summary: string;
  status: TaskStatus;
  createdAt: string;
}

export type ApprovalActionType =
  | 'PRICE_CHANGE'
  | 'QUOTATION'
  | 'PUBLISHING'
  | 'CUSTOMER_MESSAGE'
  | 'FULFILLMENT'
  | 'REFUND';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONSUMED';

export type ApproverType = 'human';

export interface Approval {
  id: ApprovalId;
  missionId: MissionId;
  actionType: ApprovalActionType;
  summary: string;
  /** Bound subject (SKU, amount, message id, etc.) — must match exactly on use. */
  subject: ApprovalSubject;
  status: ApprovalStatus;
  requestedByAgentId: AgentId;
  /** Human owner only for gated actions (never an agent id). */
  decidedByApproverType: ApproverType | null;
  decidedByApproverId: string | null;
  createdAt: string;
  decidedAt: string | null;
  consumedAt: string | null;
  consumedByAgentId: AgentId | null;
}

export type EvidenceKind = 'GENERAL' | 'PAYMENT_PROOF';

/** Reference attached to `PAYMENT_PROOF` evidence (mock free-text; no live verification). */
export type PaymentProofSource = 'shopify_order' | 'bank_confirmation';

export interface Evidence {
  id: EvidenceId;
  missionId: MissionId;
  taskId: TaskId | null;
  kind: EvidenceKind;
  /** Set when kind is PAYMENT_PROOF */
  paymentProofSource: PaymentProofSource | null;
  /** Example Shopify order name or bank confirmation reference */
  paymentReference: string | null;
  label: string;
  uri: string;
  notes: string;
  createdAt: string;
}

export type ConnectorKind = 'SHOPIFY';

export type ConnectorHealth = 'MOCK_CONNECTED' | 'DEGRADED' | 'DISCONNECTED';

export interface ConnectorStatus {
  id: string;
  kind: ConnectorKind;
  displayName: string;
  mode: 'READ_ONLY_MOCK';
  health: ConnectorHealth;
  lastCheckedAt: string;
  detail: string;
}

export type AuditEventKind =
  | 'MISSION_CREATED'
  | 'MISSION_STATE_CHANGED'
  | 'MISSION_TRANSITION_REJECTED'
  | 'APPROVAL_REQUESTED'
  | 'APPROVAL_DECIDED'
  | 'APPROVAL_CONSUMED'
  | 'APPROVAL_DECISION_REJECTED'
  | 'ACTION_BLOCKED'
  | 'ACTION_EXECUTED'
  | 'SEED_COMPLETED';

export interface AuditEvent {
  id: AuditEventId;
  kind: AuditEventKind;
  missionId: MissionId | null;
  agentId: AgentId | null;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface MissionAssignment {
  missionId: MissionId;
  agentId: AgentId;
  roleOnMission: string;
}

export interface DashboardSnapshot {
  agents: Agent[];
  missions: Mission[];
  tasks: Task[];
  assignments: MissionAssignment[];
  evidence: Evidence[];
  pendingApprovals: Approval[];
  recentApprovals: Approval[];
  connectorStatus: ConnectorStatus[];
  recentAudit: AuditEvent[];
}
