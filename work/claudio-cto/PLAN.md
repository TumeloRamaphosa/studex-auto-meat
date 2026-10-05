# STUDEX — Go-through + Plan (claudio-cto)

**Date:** 2026-10-05 · **By:** claudio-cto (Claude Code, cloud) · **For:** Agent-Lord-T-Rama / President Robusca
**Scope:** everything shared so far — Meat venture + Super Agents (Business Ghosts).

---

## 1. What I've ingested (sources read)
- **Notion** (source of truth): Studex Meat page (Halaal/Wagyu/Ankole, pricing architecture, personas,
  EDDIE/Charlie/Amara), Five Pillars, Group verticals, Naledi/Emily records.
- **Drive** (readable as `t.ramaphosa@studex.dev`): "Operation Daily Spear" content calendar
  (tone, positioning, 48/day cadence), Wagyu Biltong Gold deck + brand imagery (black/gold).
- **Repos**: studex-os (Nexus fleet, 23 seats), studex-auto-meat (agent-os content engine), TumeloRamaphosa.
- Result → Meat `brain/` (company/offer/customers/voice) filled and pushed on `claudio-cto/growth-brain`.

## 2. ⚠️ Access gaps to clear (blocking full ingest)
| Gap | Effect | Fix |
|-----|--------|-----|
| The 10 pasted Drive **file IDs** return "not found" | Can't read Product catalog, Brand+facts, Sales plan, BNPL, Buyers/RFQs/UAE folders | They're in a **Shared Drive / other account**. Share them with **t.ramaphosa@studex.dev**, or move to that account's My Drive, or copy into a repo |
| **Orgo** VMs | Can't drive Auto-Meat/Global-Markets desks from cloud | Add `ORGO_API_KEY` as a session secret |
| Live Nexus engine `:8765`, gateways, Ollama | Can't heartbeat/call tools from cloud | I contribute via git; on-Mac agents execute |
| **Send** (AgentMail/WhatsApp/publish) | Outbound is gated | Owner approves per message (by design) |

## 3. Meat venture — plan
**Brand/data room** (once Drive access is fixed): mirror Buyers, RFQs, UAE data room, catalog + prices
into `brain/` + a `data-room/` so every agent + RFQ response is grounded and current.
**Content engine (Phase 2 — the gap in `agent-os/PLAN.md`), aligned to existing cast:**
- Extend **EDDIE** (ad engine) rather than replace: feed it brain-grounded briefs.
- `script-generator` → short-form scripts in Naledi/Emily voice (brain-wired, OmniRoute model routing).
- `design-system` → enforce black/gold + fonts on every output.
- Pipeline: brief → script → image → video → **Blotato (DRAFT)** → owner approval → post.
**Sales/CX:** Hermes (WhatsApp intake) + CashClaw (invoice/Shopify) + Amara (support) + Charlie (calls) —
I supply brain-grounded templates + POPIA gates, not new agents.
**Prices:** pull from Shopify (connector available) + the catalog once shared → finish `offer.md`.

## 4. Super Agents (Business Ghosts) — plan
Assets: Base44 Operating System, Agent Registry, Studex Agent Bus (dispatch), Hermes Backup,
Robusca Prime app (Base44), Katjana chat. This is the **services** business (sell agent teams to clients).
- **Client data room is empty.** Proposed seed (from Katjana): pricing tiers **R599 / R1,500 / R2,500**
  + agent templates **RetailBot, TradeBot, DineAssist**. → I can draft this data room (offer, tiers,
  template spec sheets, onboarding) for your approval before anything is published or sent.
- Map Base44 agents ↔ Nexus `seats.json` so the services side shares one registry (no parallel OS).

## 5. claudio-cto roadmap (awaiting go per item)
- [x] Attach to Nexus (roll-call drafted to President Robusca, cc Naledi) · Meat `brain/` filled
- [ ] **You:** fix Drive access + (optional) Orgo key → I finish data room + prices + Orgo lane
- [ ] Build Phase-2 content modules (script-generator, design-system) extending EDDIE
- [ ] Draft Super Agents client data room (tiers + RetailBot/TradeBot/DineAssist)
- [ ] Reconcile: migrate useful skills from TumeloRamaphosa/TumeloRamaphosa into this repo
- [ ] Clean `agent-os/node_modules` out of git + add `.gitignore`

## 6. Rules held
seats.json = only registry · no parallel OS · no secrets in files ("key present") ·
human-gated: money, publishing, client contact, WhatsApp, ad spend → draft, then owner sends.
