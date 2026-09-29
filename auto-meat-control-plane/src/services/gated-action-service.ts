import { randomUUID } from "node:crypto";
import type { ApprovalActionType } from "../domain/entities.js";
import { evaluateApprovalGate } from "../domain/approval-gate.js";
import type { ControlPlaneRepository } from "../persistence/repository.js";

export interface GatedActionPayload {
  summary: string;
  details?: Record<string, unknown>;
}

export type GatedActionExecutor = () => void | Promise<void>;

export class GatedActionService {
  constructor(private readonly repo: ControlPlaneRepository) {}

  async attempt(
    missionId: string,
    actionType: ApprovalActionType,
    actorAgentId: string,
    payload: GatedActionPayload,
    execute: GatedActionExecutor,
  ): Promise<{ executed: boolean; reason: string }> {
    const approvals = this.repo.listApprovalsForMission(missionId);
    const gate = evaluateApprovalGate({
      missionId,
      actionType,
      actorAgentId,
      approvals,
    });
    const now = new Date().toISOString();
    this.repo.insertAudit({
      id: randomUUID(),
      at: now,
      actorAgentId,
      missionId,
      actionType,
      outcome: gate.allowed ? "allowed" : "blocked",
      message: gate.allowed
        ? `${actionType} allowed: ${payload.summary}`
        : `${actionType} blocked: ${gate.reason}`,
      metadataJson: JSON.stringify({
        payload,
        matchingApprovalId: gate.matchingApprovalId,
        gateReason: gate.reason,
      }),
    });
    if (!gate.allowed) {
      return { executed: false, reason: gate.reason };
    }
    await execute();
    return { executed: true, reason: gate.reason };
  }

  changePrice(
    missionId: string,
    actorAgentId: string,
    payload: GatedActionPayload,
  ) {
    return this.attempt(missionId, "PRICE_CHANGE", actorAgentId, payload, () => {
      /* draft-only: no Shopify write */
    });
  }

  sendQuotation(
    missionId: string,
    actorAgentId: string,
    payload: GatedActionPayload,
  ) {
    return this.attempt(missionId, "QUOTATION", actorAgentId, payload, () => {
      /* draft-only */
    });
  }

  publishContent(
    missionId: string,
    actorAgentId: string,
    payload: GatedActionPayload,
  ) {
    return this.attempt(missionId, "PUBLISHING", actorAgentId, payload, () => {
      /* draft-only */
    });
  }

  messageCustomer(
    missionId: string,
    actorAgentId: string,
    payload: GatedActionPayload,
  ) {
    return this.attempt(
      missionId,
      "CUSTOMER_MESSAGE",
      actorAgentId,
      payload,
      () => {
        /* draft-only */
      },
    );
  }

  fulfilOrder(
    missionId: string,
    actorAgentId: string,
    payload: GatedActionPayload,
  ) {
    return this.attempt(missionId, "FULFILMENT", actorAgentId, payload, () => {
      /* draft-only */
    });
  }

  issueRefund(
    missionId: string,
    actorAgentId: string,
    payload: GatedActionPayload,
  ) {
    return this.attempt(missionId, "REFUND", actorAgentId, payload, () => {
      /* draft-only */
    });
  }
}
