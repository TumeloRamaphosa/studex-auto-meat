import { openDatabase } from "./persistence/database.js";
import { ControlPlaneRepository } from "./persistence/repository.js";
import { MissionService } from "./services/mission-service.js";
import { GatedActionService } from "./services/gated-action-service.js";
import { getDatabasePath } from "./config.js";

export interface ControlPlaneApp {
  repo: ControlPlaneRepository;
  missions: MissionService;
  gatedActions: GatedActionService;
  dbPath: string;
}

export function createControlPlaneApp(dbPath = getDatabasePath()): ControlPlaneApp {
  const db = openDatabase(dbPath);
  const repo = new ControlPlaneRepository(db);
  return {
    repo,
    missions: new MissionService(repo),
    gatedActions: new GatedActionService(repo),
    dbPath,
  };
}
