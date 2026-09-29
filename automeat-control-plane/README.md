# AutoMeat Phase 1 Control Plane (StudEx Meat)

Self-contained TypeScript control plane for **StudEx Meat** (`studexmeat.com`) — South African Wagyu and meat retail on Shopify. This package uses **example data only** (no production credentials, no real customer or banking data).

The existing repo also contains a legacy JavaScript `agent-os/` stack; Phase 1 lives here as a typed, testable domain layer with a small Next.js dashboard.

## Requirements

- Node.js 20+ (22 recommended)
- npm

## Local setup

```bash
cd automeat-control-plane
npm install
npm run seed    # writes SQLite DB under ./data/automeat.db
npm run dev     # dashboard at http://localhost:3847
```

Optional: set `AUTOMEAT_DB_PATH` to override the SQLite file location.

The dashboard auto-seeds when the database is empty (first visit). For a clean slate:

```bash
rm -f data/automeat.db data/automeat.db-wal data/automeat.db-shm
npm run seed
```

## Scripts (CI-friendly)

| Script | Purpose |
|--------|---------|
| `npm run build` | Production Next.js build |
| `npm run lint` | ESLint (zero warnings) |
| `npm run test` | Vitest unit tests |
| `npm run seed` | Demo data seed |
| `npm run typecheck` | TypeScript `--noEmit` |

## Agent roles (demo seed)

| Agent | Role slug | Responsibility |
|-------|-----------|----------------|
| **Katia** | `orchestrator` | Mission lead — assigns work, approves gated actions |
| **Store Agent** | `store` | Read-only Shopify catalog / inventory checks (mock connector) |
| **Sales Agent** | `sales` | CashClaw intake, qualification, quotes (after approvals) |
| **Naledi** | `influencer` | Social / publish assets (requires `PUBLISHING` approval) |
| **Marcus** | `operations` | Fulfilment planning (requires `FULFILLMENT` approval) |
| **Cipher** | `analytics` | Margin evidence and audit support |

Katia assigns mission `mission-demo-cashclaw-001` to all five agents with explicit `mission_assignments` roles.

## CashClaw mission state machine

States (in order of typical flow):

`INTAKE` → `QUALIFYING` → `SUPPLY_CHECK` → `PRICING_REVIEW` → `AWAITING_APPROVAL` → `QUOTED` → `ACCEPTED` → `PAID` → `FULFILLING` → `DELIVERED` → `FOLLOW_UP` → `COMPLETE`

The **allowed transition map** is defined in `src/domain/cashclaw-states.ts` (`CASHCLAW_ALLOWED_TRANSITIONS`). Invalid transitions throw `InvalidTransitionError`, emit `MISSION_TRANSITION_REJECTED` audit events, and never mutate state.

Moving to **`QUOTED`** additionally requires an **`APPROVED`** approval with action type **`QUOTATION`**.

## Approval model

Approvals are persisted records with types:

- `PRICE_CHANGE`
- `QUOTATION`
- `PUBLISHING`
- `CUSTOMER_MESSAGE`
- `FULFILLMENT`
- `REFUND`

**Gated actions** (price changes, quotations, publishing, customer messages, fulfilments, refunds) are enforced in `src/services/action-guard.ts`. Unless a matching **`APPROVED`** record exists for the mission and action type, the service:

1. Throws `ActionBlockedError`
2. Writes an `ACTION_BLOCKED` audit event

`REJECTED` approvals do not satisfy the guard. The dashboard lets Katia approve or reject pending items; decisions persist via `/api/approvals/[id]`.

## Shopify connector

`src/connectors/shopify-mock.ts` implements a **read-only** interface (`getProducts`, `getProductBySku`, `getOrders`) over in-memory example products/orders. There are **no write methods**, **no network calls**, and **no Shopify credentials**.

## Architecture (short)

- `src/domain/` — typed entities, state machine, errors
- `src/db/` — SQLite persistence (`better-sqlite3`)
- `src/services/` — missions, audits, approval guards
- `src/app/` — Next.js dashboard + API routes
- `tests/` — Vitest coverage for transitions and approvals

## Security note

Do not commit `.env` files with secrets. This package does not require Shopify tokens for local demo use.
