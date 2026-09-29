# Architecture — Auto Meat Phase 1

## Typed entities

Defined in `src/domain/entities.ts`:

- `Agent`, `Mission`, `Task`, `Approval`, `Evidence`, `ConnectorStatus`, `AuditEvent`
- CashClaw mission states as `CashClawMissionState`
- Gated `ApprovalActionType` enum (six values)

## Persistence

SQLite via `better-sqlite3` (`src/persistence/`). The demonstration seed (`src/seed/demo-seed.ts`) writes Katia’s mission, per-agent tasks, sample approvals, evidence, connector status, and an audit entry.

## Services

- `MissionService` — validates transitions via `mission-state-machine.ts`, updates DB, audits.
- `GatedActionService` — approval gate + audit for all side-effect classes; no Shopify or messaging I/O.

## Connectors

`src/connectors/shopify-mock.ts` implements `ShopifyReadOnlyConnector` (get products/orders, health check only).

## HTTP

`src/server/create-server.ts` — Express API + static dashboard under `src/public/`.
