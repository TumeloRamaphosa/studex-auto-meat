# Auto Meat Control Plane (Phase 1)

Self-contained TypeScript control plane for **StudEx Meat** ([studexmeat.com](https://studexmeat.com)). Phase 1 is **drafts-only**: nothing posts, spends, messages customers, or writes to Shopify without a matching **human-approved** approval record.

Built alongside the repo’s existing **agent-os** and **Naledi** content work; this app is the CashClaw / mission orchestration slice with persisted state and an operator dashboard.

## Local setup

Requirements: **Node.js 20+**

```bash
cd auto-meat-control-plane
cp .env.example .env   # optional; defaults are fine for demo
npm install
npm run seed           # SQLite demo data (Katia mission assignment)
npm run dev            # seed + dashboard on http://localhost:3847/
```

Commands used in CI / verification:

| Command        | Purpose                          |
|----------------|----------------------------------|
| `npm run build` | Compile TypeScript + copy static UI |
| `npm run lint`  | ESLint on `src/` and `tests/`    |
| `npm run test`  | Vitest unit tests                |

Database file default: `data/control-plane.sqlite` (gitignored). Tests use `:memory:`.

## Agent roles (proposed)

These descriptions are **proposed** for Phase 1 demo wiring; adjust with product owners before production.

| Agent | Role | Proposed responsibility |
|-------|------|-------------------------|
| **Katia** | Orchestrator / manager | Creates missions, assigns tasks, advances state only along allowed transitions, requests human approvals. |
| **Store Agent** | Store / catalog | Read-only Shopify mock: inventory and product facts for supply checks. |
| **Sales Agent** | Sales | Lead qualification, draft quotations and price change requests (gated). |
| **Naledi** | Content | Social and brand drafts; **publishing** is gated. |
| **Marcus** | Supply / fulfilment | Fulfilment planning; **fulfilment** actions are gated. |
| **Cipher** | Security / compliance | Monitors audit log and policy; escalates blocked actions. |

## Approval model

Six action types are **gated** in the domain layer (`GatedActionService`):

1. `PRICE_CHANGE`
2. `QUOTATION`
3. `PUBLISHING`
4. `CUSTOMER_MESSAGE`
5. `FULFILMENT`
6. `REFUND`

For each attempt, `evaluateApprovalGate` requires an `Approval` row with the same `missionId` and `actionType` and `status === "approved"`. Otherwise the action does not run. **Every** attempt (allowed or blocked) appends an `AuditEvent`.

CashClaw missions use an explicit state machine (`INTAKE` → … → `COMPLETE`) with legal rollback edges; illegal transitions throw and do not update SQLite.

## Shopify connector

Phase 1 uses `createMockShopifyConnector()` only: **read-only**, in-memory fake catalog/orders, **no network**, no Admin API writes. The `store/` package in the repo root is a separate optional live reader; this control plane does not call it.

## Dashboard

`npm run serve` exposes:

- `GET /api/dashboard` — agents, missions, tasks, approvals, evidence, connector status, audit (from SQLite)
- Static UI at `/` loads that API (not hard-coded cards)

## Documentation

See also [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for entity and flow overview.
