import type Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import { createMockShopifyConnector } from '@/connectors/shopify-mock';
import { resetDb } from '@/db/store';
import { getDb, getDbPath } from '@/db/store';
import { createMissionAuditStub } from '@/services/mission-service';
import { recordAudit } from '@/services/audit-service';
import type { Agent, ApprovalActionType, CashClawState } from '@/domain/types';

const AGENT_DEFINITIONS: Omit<Agent, 'createdAt'>[] = [
  {
    id: 'agent-katia',
    name: 'Katia',
    roleSlug: 'orchestrator',
    roleTitle: 'Orchestrator / Mission Lead',
    roleDescription:
      'Assigns missions, sets priorities, and approves cross-agent handoffs for StudEx Meat operations (example role).',
    isOrchestrator: true,
  },
  {
    id: 'agent-store',
    name: 'Store Agent',
    roleSlug: 'store',
    roleTitle: 'Shopify Store Agent',
    roleDescription:
      'Read-only catalog and inventory checks against studexmeat.com via the mock Shopify connector (example role).',
    isOrchestrator: false,
  },
  {
    id: 'agent-sales',
    name: 'Sales Agent',
    roleSlug: 'sales',
    roleTitle: 'Quote-to-Cash Sales Agent',
    roleDescription:
      'Runs CashClaw intake, qualification, and customer-facing quotes once approvals exist (example role).',
    isOrchestrator: false,
  },
  {
    id: 'agent-naledi',
    name: 'Naledi',
    roleSlug: 'influencer',
    roleTitle: 'Influencer & Social Proof',
    roleDescription:
      'Prepares publish-ready content and social proof after publishing approvals (example role).',
    isOrchestrator: false,
  },
  {
    id: 'agent-marcus',
    name: 'Marcus',
    roleSlug: 'operations',
    roleTitle: 'Fulfilment & Logistics',
    roleDescription:
      'Plans cold-chain fulfilment and delivery updates once fulfilment approvals are granted (example role).',
    isOrchestrator: false,
  },
  {
    id: 'agent-cipher',
    name: 'Cipher',
    roleSlug: 'analytics',
    roleTitle: 'Analytics & Compliance',
    roleDescription:
      'Validates pricing evidence, margin checks, and audit trails for CashClaw missions (example role).',
    isOrchestrator: false,
  },
];

const MISSION_ID = 'mission-demo-cashclaw-001';
const NOW = new Date().toISOString();

function insertAgent(db: Database.Database, agent: Omit<Agent, 'createdAt'>): void {
  db.prepare(
    `INSERT INTO agents (id, name, role_slug, role_title, role_description, is_orchestrator, created_at)
     VALUES (@id, @name, @roleSlug, @roleTitle, @roleDescription, @isOrchestrator, @createdAt)`,
  ).run({
    id: agent.id,
    name: agent.name,
    roleSlug: agent.roleSlug,
    roleTitle: agent.roleTitle,
    roleDescription: agent.roleDescription,
    isOrchestrator: agent.isOrchestrator ? 1 : 0,
    createdAt: NOW,
  });
}

function seedMission(db: Database.Database): void {
  const title = 'Example corporate Wagyu box — CashClaw demo';
  const description =
    'Demonstration mission: fictional Cape Town office wants an example A5 Wagyu tasting box (example data only).';
  const state: CashClawState = 'PRICING_REVIEW';

  db.prepare(
    `INSERT INTO missions (id, type, title, description, state, lead_agent_id, created_at, updated_at)
     VALUES (@id, 'CASHCLAW', @title, @description, @state, @leadAgentId, @createdAt, @updatedAt)`,
  ).run({
    id: MISSION_ID,
    title,
    description,
    state,
    leadAgentId: 'agent-katia',
    createdAt: NOW,
    updatedAt: NOW,
  });

  createMissionAuditStub(db, MISSION_ID, 'agent-katia', title);

  const assignments: { agentId: string; roleOnMission: string }[] = [
    { agentId: 'agent-store', roleOnMission: 'Supply & SKU verification (mock Shopify read)' },
    { agentId: 'agent-sales', roleOnMission: 'Customer qualification & quote drafting' },
    { agentId: 'agent-naledi', roleOnMission: 'Optional social proof asset (pending publish approval)' },
    { agentId: 'agent-marcus', roleOnMission: 'Fulfilment planning once paid' },
    { agentId: 'agent-cipher', roleOnMission: 'Margin & audit evidence review' },
  ];

  const insertAssignment = db.prepare(
    `INSERT INTO mission_assignments (mission_id, agent_id, role_on_mission) VALUES (?, ?, ?)`,
  );
  for (const a of assignments) {
    insertAssignment.run(MISSION_ID, a.agentId, a.roleOnMission);
  }

  const tasks = [
    {
      id: 'task-store-supply',
      assignee: 'agent-store',
      title: 'Verify demo SKU stock',
      summary: 'Confirm example striploin SKU has sufficient mock inventory.',
      status: 'DONE',
    },
    {
      id: 'task-sales-qualify',
      assignee: 'agent-sales',
      title: 'Qualify example lead',
      summary: 'Example B2B tasting request — budget band R15k (demo).',
      status: 'DONE',
    },
    {
      id: 'task-cipher-margin',
      assignee: 'agent-cipher',
      title: 'Margin check pack',
      summary: 'Attach demo margin worksheet for pricing review.',
      status: 'IN_PROGRESS',
    },
    {
      id: 'task-naledi-content',
      assignee: 'agent-naledi',
      title: 'Draft publish caption',
      summary: 'Hold until PUBLISHING approval — example Instagram caption.',
      status: 'BLOCKED',
    },
    {
      id: 'task-marcus-route',
      assignee: 'agent-marcus',
      title: 'Cold-chain route sketch',
      summary: 'Waiting for PAID state before fulfilment approval.',
      status: 'PENDING',
    },
  ];

  const insertTask = db.prepare(
    `INSERT INTO tasks (id, mission_id, assignee_agent_id, title, summary, status, created_at)
     VALUES (@id, @missionId, @assignee, @title, @summary, @status, @createdAt)`,
  );
  for (const t of tasks) {
    insertTask.run({
      id: t.id,
      missionId: MISSION_ID,
      assignee: t.assignee,
      title: t.title,
      summary: t.summary,
      status: t.status,
      createdAt: NOW,
    });
  }

  const approvals: {
    id: string;
    actionType: ApprovalActionType;
    summary: string;
    status: 'PENDING' | 'APPROVED';
    requestedBy: string;
  }[] = [
    {
      id: 'approval-price-demo',
      actionType: 'PRICE_CHANGE',
      summary: 'Example 5% striploin promo for demo corporate box (fake pricing).',
      status: 'PENDING',
      requestedBy: 'agent-sales',
    },
    {
      id: 'approval-quote-demo',
      actionType: 'QUOTATION',
      summary: 'Send example quotation PDF to fictional buyer (demo).',
      status: 'PENDING',
      requestedBy: 'agent-sales',
    },
    {
      id: 'approval-publish-demo',
      actionType: 'PUBLISHING',
      summary: 'Publish example social post about demo tasting box.',
      status: 'PENDING',
      requestedBy: 'agent-naledi',
    },
  ];

  const insertApproval = db.prepare(
    `INSERT INTO approvals (id, mission_id, action_type, summary, status, requested_by_agent_id, decided_by_agent_id, created_at, decided_at)
     VALUES (@id, @missionId, @actionType, @summary, @status, @requestedBy, NULL, @createdAt, NULL)`,
  );
  for (const a of approvals) {
    insertApproval.run({
      id: a.id,
      missionId: MISSION_ID,
      actionType: a.actionType,
      summary: a.summary,
      status: a.status,
      requestedBy: a.requestedBy,
      createdAt: NOW,
    });
    recordAudit(db, {
      kind: 'APPROVAL_REQUESTED',
      missionId: MISSION_ID,
      agentId: a.requestedBy,
      message: `Approval requested: ${a.actionType}`,
      metadata: { approvalId: a.id, actionType: a.actionType },
    });
  }

  db.prepare(
    `INSERT INTO evidence (id, mission_id, task_id, label, uri, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    uuid(),
    MISSION_ID,
    'task-cipher-margin',
    'Example margin worksheet',
    'file://example/local/demo-margin.csv',
    'Synthetic numbers for demonstration only.',
    NOW,
  );
}

async function seedConnector(db: Database.Database): Promise<void> {
  const shopify = createMockShopifyConnector();
  const products = await shopify.getProducts();
  const detail = `Mock read-only Shopify: ${products.length} example products loaded (no network).`;
  db.prepare(
    `INSERT INTO connector_status (id, kind, display_name, mode, health, last_checked_at, detail)
     VALUES (@id, 'SHOPIFY', @displayName, 'READ_ONLY_MOCK', 'MOCK_CONNECTED', @lastCheckedAt, @detail)`,
  ).run({
    id: 'connector-shopify-mock',
    displayName: 'studexmeat.com (mock read-only)',
    lastCheckedAt: new Date().toISOString(),
    detail,
  });
}

export async function runSeed(db: Database.Database = getDb()): Promise<void> {
  resetDb(db);
  for (const agent of AGENT_DEFINITIONS) {
    insertAgent(db, agent);
  }
  await seedConnector(db);
  seedMission(db);
  recordAudit(db, {
    kind: 'SEED_COMPLETED',
    missionId: MISSION_ID,
    agentId: 'agent-katia',
    message: 'AutoMeat Phase 1 demo seed completed (example data only).',
    metadata: { dbPath: getDbPath(), missionId: MISSION_ID },
  });
}

async function main(): Promise<void> {
  const db = getDb();
  await runSeed(db);
  console.log(`Seeded AutoMeat control plane at ${getDbPath()}`);
  console.log(`Demo mission: ${MISSION_ID} (state PRICING_REVIEW)`);
}

const isSeedCli = process.argv[1]?.replace(/\\/g, '/').endsWith('/src/seed/seed.ts');
if (isSeedCli) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
