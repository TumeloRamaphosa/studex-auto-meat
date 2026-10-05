import { describe, expect, it } from "vitest";
import { createControlPlaneApp } from "../src/app-state.js";
import { seedDemonstration, DEMO_MISSION_ID } from "../src/seed/demo-seed.js";

describe("Demonstration seed", () => {
  it("Katia assigns mission to Store, Sales, Naledi, Marcus, Cipher", async () => {
    const app = createControlPlaneApp(":memory:");
    await seedDemonstration(app.repo, { force: true });
    const mission = app.repo.getMission(DEMO_MISSION_ID);
    expect(mission?.createdByAgentId).toBe("agent-katia");
    const names = app.repo.listAgents().map((a) => a.name);
    expect(names).toContain("Katia");
    expect(names).toContain("Store Agent");
    expect(names).toContain("Sales Agent");
    expect(names).toContain("Naledi");
    expect(names).toContain("Marcus");
    expect(names).toContain("Cipher");
    expect(mission?.assignedAgentIds).toEqual(
      expect.arrayContaining([
        "agent-store",
        "agent-sales",
        "agent-naledi",
        "agent-marcus",
        "agent-cipher",
      ]),
    );
    const audit = app.repo.listAudit(20);
    expect(
      audit.some((e) =>
        e.message.includes("Katia assigned CashClaw mission"),
      ),
    ).toBe(true);
  });
});
