import type { Approval, ApprovalActionType } from "./entities.js";

export interface GateAttemptContext {
  missionId: string;
  actionType: ApprovalActionType;
  actorAgentId: string;
  approvals: Approval[];
}

export interface GateResult {
  allowed: boolean;
  reason: string;
  matchingApprovalId: string | null;
}

/**
 * Domain rule: gated side-effects require an approved approval for the same
 * mission and action type. UI cannot bypass this — services call this first.
 */
export function evaluateApprovalGate(ctx: GateAttemptContext): GateResult {
  const match = ctx.approvals.find(
    (a) =>
      a.missionId === ctx.missionId &&
      a.actionType === ctx.actionType &&
      a.status === "approved",
  );
  if (match) {
    return {
      allowed: true,
      reason: `Approved by human ref ${match.approvedByHumanRef ?? "unknown"}`,
      matchingApprovalId: match.id,
    };
  }
  const pending = ctx.approvals.some(
    (a) =>
      a.missionId === ctx.missionId &&
      a.actionType === ctx.actionType &&
      a.status === "pending",
  );
  if (pending) {
    return {
      allowed: false,
      reason: "Approval pending — action blocked until human approves",
      matchingApprovalId: null,
    };
  }
  return {
    allowed: false,
    reason: "No approved approval record for this mission and action type",
    matchingApprovalId: null,
  };
}
