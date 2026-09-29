import { randomUUID } from "node:crypto";
import { createMockShopifyConnector } from "../connectors/shopify-mock.js";
import type { Agent, Approval, Mission, Task } from "../domain/entities.js";
import type { ControlPlaneRepository } from "../persistence/repository.js";

const AGENT_IDS = {
  katia: "agent-katia",
  store: "agent-store",
  sales: "agent-sales",
  naledi: "agent-naledi",
  marcus: "agent-marcus",
  cipher: "agent-cipher",
} as const;

export const DEMO_MISSION_ID = "mission-cashclaw-demo-001";

export function buildDemoAgents(): Agent[] {
  return [
    {
      id: AGENT_IDS.katia,
      name: "Katia",
      role: "orchestrator",
      description:
        "Orchestrator/manager — assigns missions, enforces approvals, never executes gated actions alone.",
      status: "active",
    },
    {
      id: AGENT_IDS.store,
      name: "Store Agent",
      role: "store",
      description:
        "Catalog and inventory reader — uses read-only Shopify mock for supply checks.",
      status: "active",
    },
    {
      id: AGENT_IDS.sales,
      name: "Sales Agent",
      role: "sales",
      description:
        "Qualifies leads and drafts quotations — cannot send quotes without approval.",
      status: "active",
    },
    {
      id: AGENT_IDS.naledi,
      name: "Naledi",
      role: "content",
      description:
        "Brand voice and social drafts — publishing blocked until human approval.",
      status: "idle",
    },
    {
      id: AGENT_IDS.marcus,
      name: "Marcus",
      role: "supply",
      description:
        "Supply and fulfilment coordinator — confirms stock and fulfilment plans (draft).",
      status: "idle",
    },
    {
      id: AGENT_IDS.cipher,
      name: "Cipher",
      role: "security",
      description:
        "Security and compliance monitor — reviews audit trail, flags policy violations.",
      status: "active",
    },
  ];
}

export async function seedDemonstration(
  repo: ControlPlaneRepository,
  options: { force?: boolean } = {},
): Promise<void> {
  if (repo.isSeeded() && !options.force) {
    return;
  }
  if (options.force) {
    repo.clearAll();
  }

  const now = new Date().toISOString();
  for (const agent of buildDemoAgents()) {
    repo.upsertAgent(agent);
  }

  const mission: Mission = {
    id: DEMO_MISSION_ID,
    kind: "cashclaw",
    title: "UCT res hall bulk order — exam season protein boxes",
    state: "PRICING_REVIEW",
    leadRef: "LEAD-DEMO-UCT-042",
    assignedAgentIds: [
      AGENT_IDS.store,
      AGENT_IDS.sales,
      AGENT_IDS.naledi,
      AGENT_IDS.marcus,
      AGENT_IDS.cipher,
    ],
    createdByAgentId: AGENT_IDS.katia,
    createdAt: now,
    updatedAt: now,
  };
  repo.upsertMission(mission);

  const tasks: Task[] = [
    {
      id: randomUUID(),
      missionId: DEMO_MISSION_ID,
      title: "Read mock Shopify inventory for Student Pack SKU",
      assigneeAgentId: AGENT_IDS.store,
      status: "done",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      missionId: DEMO_MISSION_ID,
      title: "Qualify lead budget and delivery window",
      assigneeAgentId: AGENT_IDS.sales,
      status: "done",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      missionId: DEMO_MISSION_ID,
      title: "Draft social proof post (not published)",
      assigneeAgentId: AGENT_IDS.naledi,
      status: "in_progress",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      missionId: DEMO_MISSION_ID,
      title: "Confirm cold-chain fulfilment slot",
      assigneeAgentId: AGENT_IDS.marcus,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      missionId: DEMO_MISSION_ID,
      title: "Review audit policy for bulk discount",
      assigneeAgentId: AGENT_IDS.cipher,
      status: "in_progress",
      createdAt: now,
      updatedAt: now,
    },
  ];
  for (const task of tasks) {
    repo.upsertTask(task);
  }

  const pendingApproval: Approval = {
    id: randomUUID(),
    missionId: DEMO_MISSION_ID,
    actionType: "QUOTATION",
    status: "pending",
    requestedByAgentId: AGENT_IDS.sales,
    approvedByHumanRef: null,
    payloadSummary: "Quote R4,280 for 20× Student Pack @ 5% hall discount",
    createdAt: now,
    resolvedAt: null,
  };
  repo.upsertApproval(pendingApproval);

  const approvedPriceChange: Approval = {
    id: "approval-demo-price-approved",
    missionId: DEMO_MISSION_ID,
    actionType: "PRICE_CHANGE",
    status: "approved",
    requestedByAgentId: AGENT_IDS.sales,
    approvedByHumanRef: "human-tumelo-demo",
    payloadSummary: "Temporary line-item discount within guardrails",
    createdAt: now,
    resolvedAt: now,
  };
  repo.upsertApproval(approvedPriceChange);

  repo.upsertEvidence({
    id: randomUUID(),
    missionId: DEMO_MISSION_ID,
    kind: "shopify_snapshot",
    summary: "Mock Shopify: SX-BB-STU qty 42 @ R189",
    uri: "mock://shopify/products/1001",
    capturedByAgentId: AGENT_IDS.store,
    createdAt: now,
  });

  const shopify = createMockShopifyConnector();
  const health = await shopify.healthCheck();
  repo.upsertConnectorStatus({
    connector: "shopify",
    mode: "mock",
    readOnly: true,
    healthy: health.healthy,
    lastCheckedAt: now,
    detail: health.detail,
  });

  repo.insertAudit({
    id: randomUUID(),
    at: now,
    actorAgentId: AGENT_IDS.katia,
    missionId: DEMO_MISSION_ID,
    actionType: "SYSTEM",
    outcome: "recorded",
    message:
      "Katia assigned CashClaw mission to Store Agent, Sales Agent, Naledi, Marcus, and Cipher",
    metadataJson: JSON.stringify({
      assignedAgentIds: mission.assignedAgentIds,
      tasksCreated: tasks.length,
    }),
  });

  repo.markSeeded();
}

export { AGENT_IDS };
