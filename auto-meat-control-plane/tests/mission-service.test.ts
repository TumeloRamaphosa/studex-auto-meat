import { describe, expect, it, beforeEach } from "vitest";
import { createControlPlaneApp } from "../src/app-state.js";
import { seedDemonstration, DEMO_MISSION_ID } from "../src/seed/demo-seed.js";

describe("MissionService transitions (persisted)", () => {
  let app: ReturnType<typeof createControlPlaneApp>;

  beforeEach(async () => {
    app = createControlPlaneApp(":memory:");
    await seedDemonstration(app.repo, { force: true });
  });

  it("records legal transition in SQLite and audit", () => {
    app.missions.transitionMission(
      DEMO_MISSION_ID,
      "AWAITING_APPROVAL",
      "agent-katia",
    );
    const mission = app.repo.getMission(DEMO_MISSION_ID);
    expect(mission?.state).toBe("AWAITING_APPROVAL");
    const audit = app.repo.listAudit(10);
    expect(
      audit.some(
        (e) =>
          e.actionType === "MISSION_TRANSITION" &&
          e.message.includes("PRICING_REVIEW → AWAITING_APPROVAL"),
      ),
    ).toBe(true);
  });

  it("rejects illegal transition without mutating state", () => {
    expect(() =>
      app.missions.transitionMission(DEMO_MISSION_ID, "PAID", "agent-katia"),
    ).toThrow(/Illegal CashClaw transition/);
    expect(app.repo.getMission(DEMO_MISSION_ID)?.state).toBe("PRICING_REVIEW");
  });
});
