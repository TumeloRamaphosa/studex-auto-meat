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
| **Katia** | `orchestrator` | Assigns missions to the team; approves gated actions |
| **Store Agent** | `store` | Reads Shopify via the read-only mock connector |
| **Sales Agent** | `sales` | Runs CashClaw deals from intake through quote |
| **Naledi** | `content` | Drafts content; publishing requires `PUBLISHING` approval |
| **Marcus** | `fulfilment-proposed` | **Proposed, pending owner confirmation** — fulfilment coordination after PAID |
| **Cipher** | `deal-desk-proposed` | **Proposed, pending owner confirmation** — deal-desk audit / pricing evidence |

Katia assigns mission `mission-demo-cashclaw-001` to all five agents with explicit `mission_assignments` roles.

## Payments (Phase 1)

- **No crypto / wallet / stablecoin paths.** Missions carry `payment_method`: only `shopify` or `bank` (seed default: `bank`). Other values are rejected in `setMissionPaymentMethod` with an `ACTION_BLOCKED` audit.
- Transition to **`PAID`** requires attached **`PAYMENT_PROOF`** evidence with a mock free-text reference:
  - `payment_method: bank` → evidence source `bank_confirmation`
  - `payment_method: shopify` → evidence source `shopify_order`
- No live payment verification — references are example strings only.

Use `attachPaymentProof` in `src/services/evidence-service.ts` (or insert via API in later phases).

## CashClaw mission state machine

States (in order of typical flow):

`INTAKE` → `QUALIFYING` → `SUPPLY_CHECK` → `PRICING_REVIEW` → `AWAITING_APPROVAL` → `QUOTED` → `ACCEPTED` → `PAID` → `FULFILLING` → `DELIVERED` → `FOLLOW_UP` → `COMPLETE`

The **allowed transition map** is defined in `src/domain/cashclaw-states.ts` (`CASHCLAW_ALLOWED_TRANSITIONS`). Invalid transitions throw `InvalidTransitionError`, emit `MISSION_TRANSITION_REJECTED` audit events, and never mutate state.

Moving to **`QUOTED`** additionally requires an **`APPROVED`** approval with action type **`QUOTATION`**.

Moving to **`PAID`** requires **`PAYMENT_PROOF`** evidence matching the mission `payment_method` (see Payments above). Missing or mismatched proof emits `MISSION_TRANSITION_REJECTED` and does not change state.

## Approval model

Approvals are persisted records with types:

- `PRICE_CHANGE`
- `QUOTATION`
- `PUBLISHING`
- `CUSTOMER_MESSAGE`
- `FULFILLMENT`
- `REFUND`

Each approval carries a **bound subject** (JSON) — e.g. SKU + price, quote ref + amount, fulfilment ref, message id, refund amount. Actions and state transitions must match that subject exactly.

**Human owner only:** gated approvals are decided by **`human-owner-tumelo` (Tumelo, owner)** — never by agents. The dashboard “Approve as owner” button calls the API without agent credentials. Agent or self-approval attempts are rejected and audited (`APPROVAL_DECISION_REJECTED`).

**Single-use:** when a gated action runs or a gated transition succeeds (`QUOTED`, `FULFILLING`), the matching approval moves to **`CONSUMED`** (`APPROVAL_CONSUMED` audit). It cannot authorize a second action.

**Gated actions** are enforced in `src/services/action-guard.ts`. **`QUOTED`** and **`PAID → FULFILLING`** transitions enforce matching unused approvals in `src/services/mission-service.ts` (fulfilment can no longer skip approval).

Unless a matching **`APPROVED`** (not yet consumed) record exists for the mission, action type, and subject:

1. Throws `ActionBlockedError`
2. Writes an `ACTION_BLOCKED` audit event

`REJECTED` approvals do not satisfy the guard. The dashboard lets the human owner approve or reject pending items; decisions persist via `/api/approvals/[id]`.

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
