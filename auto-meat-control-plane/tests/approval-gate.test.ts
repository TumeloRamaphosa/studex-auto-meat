import { describe, expect, it, beforeEach } from "vitest";
import { GATED_ACTION_TYPES } from "../src/domain/entities.js";
import { createControlPlaneApp } from "../src/app-state.js";
import {
  seedDemonstration,
  DEMO_MISSION_ID,
} from "../src/seed/demo-seed.js";
import type { GatedActionService } from "../src/services/gated-action-service.js";

const ACTOR = "agent-sales";

async function runBlocked(
  gated: GatedActionService,
  type: (typeof GATED_ACTION_TYPES)[number],
) {
  const map: Record<
    (typeof GATED_ACTION_TYPES)[number],
    () => ReturnType<GatedActionService["changePrice"]>
  > = {
    PRICE_CHANGE: () =>
      gated.changePrice(DEMO_MISSION_ID, ACTOR, { summary: "test price" }),
    QUOTATION: () =>
      gated.sendQuotation(DEMO_MISSION_ID, ACTOR, { summary: "test quote" }),
    PUBLISHING: () =>
      gated.publishContent(DEMO_MISSION_ID, ACTOR, { summary: "test post" }),
    CUSTOMER_MESSAGE: () =>
      gated.messageCustomer(DEMO_MISSION_ID, ACTOR, { summary: "test msg" }),
    FULFILMENT: () =>
      gated.fulfilOrder(DEMO_MISSION_ID, ACTOR, { summary: "test ship" }),
    REFUND: () =>
      gated.issueRefund(DEMO_MISSION_ID, ACTOR, { summary: "test refund" }),
  };
  return map[type]();
}

describe("Approval enforcement (all gated action types)", () => {
  let app: ReturnType<typeof createControlPlaneApp>;

  beforeEach(async () => {
    app = createControlPlaneApp(":memory:");
    await seedDemonstration(app.repo, { force: true });
  });

  for (const actionType of GATED_ACTION_TYPES) {
    it(`blocks ${actionType} without matching approved record and writes audit`, async () => {
      if (actionType === "PRICE_CHANGE") {
        // Demo seed includes an approved PRICE_CHANGE — remove for block test
        app.repo.clearAll();
        await seedDemonstration(app.repo, { force: true });
        app.repo.upsertApproval({
          id: "approval-demo-price-approved",
          missionId: DEMO_MISSION_ID,
          actionType: "PRICE_CHANGE",
          status: "rejected",
          requestedByAgentId: ACTOR,
          approvedByHumanRef: null,
          payloadSummary: "rejected for test",
          createdAt: new Date().toISOString(),
          resolvedAt: new Date().toISOString(),
        });
      }

      const result = await runBlocked(app.gatedActions, actionType);
      expect(result.executed).toBe(false);
      const match = app.repo
        .listAudit(200)
        .find((e) => e.actionType === actionType && e.outcome === "blocked");
      expect(match).toBeDefined();
      expect(match?.message).toMatch(/blocked/i);
    });

    it(`allows ${actionType} when approved approval exists and writes audit`, async () => {
      const now = new Date().toISOString();
      app.repo.upsertApproval({
        id: `approval-test-${actionType}`,
        missionId: DEMO_MISSION_ID,
        actionType,
        status: "approved",
        requestedByAgentId: ACTOR,
        approvedByHumanRef: "human-demo",
        payloadSummary: `approved ${actionType}`,
        createdAt: now,
        resolvedAt: now,
      });

      const result = await runBlocked(app.gatedActions, actionType);
      expect(result.executed).toBe(true);
      const audit = app.repo.listAudit(5);
      expect(
        audit.some(
          (e) => e.actionType === actionType && e.outcome === "allowed",
        ),
      ).toBe(true);
    });
  }
});
