import { randomUUID } from "node:crypto";
import {
  assertTransitionCashClaw,
  canTransitionCashClaw,
} from "../domain/mission-state-machine.js";
import type { CashClawMissionState } from "../domain/entities.js";
import type { ControlPlaneRepository } from "../persistence/repository.js";

export class MissionService {
  constructor(private readonly repo: ControlPlaneRepository) {}

  canTransition(
    from: CashClawMissionState,
    to: CashClawMissionState,
  ): boolean {
    return canTransitionCashClaw(from, to);
  }

  transitionMission(
    missionId: string,
    to: CashClawMissionState,
    actorAgentId: string,
  ): void {
    const mission = this.repo.getMission(missionId);
    if (!mission) {
      throw new Error(`Mission not found: ${missionId}`);
    }
    const from = mission.state;
    assertTransitionCashClaw(from, to);
    const now = new Date().toISOString();
    this.repo.updateMissionState(missionId, to, now);
    this.repo.insertAudit({
      id: randomUUID(),
      at: now,
      actorAgentId,
      missionId,
      actionType: "MISSION_TRANSITION",
      outcome: "recorded",
      message: `Mission transitioned ${from} → ${to}`,
      metadataJson: JSON.stringify({ from, to }),
    });
  }
}
