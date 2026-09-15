# STUDEX AGENT OS — Complete Platform Plan

**Vision:** Unified content engine for all platforms. Online/offline. All agents coordinated. Local + cloud models. AI influencers creating content end-to-end.

**Status:** Core modules built. Ready for comprehensive plan.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  STUDEX AGENT OS — Master Content Engine                        │
│  Hosted: Railway + Cloudflare Tunnel                             │
│  Database: PostgreSQL + SQLite (agent registry)                  │
│  Cache: Redis (job queue, session state)                         │
└─────────────────────────────────────────────────────────────────┘
        ↓
    ┌───────────────────────────────────────────────────────────┐
    │  PUBLIC INTERFACES                                         │
    ├───────────────────────────────────────────────────────────┤
    │  • Facebook Ad Studio (HTML UI)                            │
    │  • Agent Console (real-time dashboard)                     │
    │  • REST API (http://localhost:3000)                        │
    │  • WebSocket (ws://localhost:3000)                         │
    │  • n8n Workflows (triggers + webhooks)                     │
    │  • Email API (AgentMail integration)                       │
    └───────────────────────────────────────────────────────────┘
        ↓
    ┌───────────────────────────────────────────────────────────┐
    │  CORE AGENTS (Unified Registry)                            │
    ├───────────────────────────────────────────────────────────┤
    │  🎙️  Naledi (CMO) — content strategy, social media        │
    │  💼 OpenClaw (Operations) — workflow orchestration         │
    │  💰 CashClaw (Finance) — invoicing, payments              │
    │  🎙️  Hermes (Sales) — WhatsApp intake, qualification     │
    │  ☁️  Base44 Agents (Cloud) — sales pipeline sync          │
    │  🤖 Custom Agents (via OmniRoute)                          │
    └───────────────────────────────────────────────────────────┘
        ↓
    ┌───────────────────────────────────────────────────────────┐
    │  CONTENT GENERATION ENGINE                                 │
    ├───────────────────────────────────────────────────────────┤
    │  Local Models (always-on):                                 │
    │    • Qwen 2.5 (fast, reliable)                             │
    │    • DeepSeek (reasoning, analysis)                        │
    │    • Hermes (agentic, decision-making)                     │
    │                                                             │
    │  Cloud Models (escalation):                                │
    │    • Claude (quality, nuance)                              │
    │    • Perplexity (research, current info)                   │
    │                                                             │
    │  Routing (OmniRoute):                                       │
    │    • Task → Best model based on complexity/speed/cost      │
    │    • Fallback chain: local → cloud                         │
    │    • Cost optimization via prompt caching                  │
    └───────────────────────────────────────────────────────────┘
        ↓
    ┌───────────────────────────────────────────────────────────┐
    │  CONTENT CREATION PIPELINE                                 │
    ├───────────────────────────────────────────────────────────┤
    │  1. TEXT GENERATION                                        │
    │     • Ad copy (via Qwen/DeepSeek)                          │
    │     • Social captions (Qwen)                               │
    │     • Email newsletters (Claude)                           │
    │     • Landing page copy (Claude)                           │
    │                                                             │
    │  2. IMAGE GENERATION                                       │
    │     • ComfyUI integration (local)                          │
    │     • Product shots, lifestyle images                      │
    │     • Ad banners (16:9, 1:1, 9:16)                         │
    │     • Influencer assets                                    │
    │                                                             │
    │  3. VIDEO GENERATION                                       │
    │     • Higgsfield AI (AI influencer videos)                 │
    │     • LTX Video (2B on Mac, 13B on Windows)               │
    │     • Faceless explainers                                  │
    │     • Product demos, testimonials                          │
    │                                                             │
    │  4. DESIGN SYSTEM INTEGRATION                              │
    │     • Obsidian-gold, Cormorant Garamond                    │
    │     • Bebas Neue headers, Space Mono data                  │
    │     • Brand consistency across all outputs                 │
    │     • Blender 3D asset generation (future)                 │
    └───────────────────────────────────────────────────────────┘
        ↓
    ┌───────────────────────────────────────────────────────────┐
    │  AI INFLUENCER ENGINE                                      │
    ├───────────────────────────────────────────────────────────┤
    │  Personas Created:                                         │
    │    • Naledi (primary, Studex Meat CMO)                     │
    │    • Emily van Dewild (lifestyle, Meat content)            │
    │    • Leila Gold (luxury, Markets content)                  │
    │    • Custom personas (per campaign)                        │
    │                                                             │
    │  Capabilities:                                             │
    │    • Generate scripts (topic → script via LLM)             │
    │    • Synthesize video (script → video via Higgsfield)      │
    │    • Create social proof (testimonials, reviews)           │
    │    • Post automatically (Blotato multi-platform)           │
    │    • Respond to DMs (WhatsApp via Hermes)                  │
    │                                                             │
    │  Output: Instagram Reels, TikTok videos, YouTube Shorts    │
    └───────────────────────────────────────────────────────────┘
        ↓
    ┌───────────────────────────────────────────────────────────┐
    │  MULTI-PLATFORM POSTING                                    │
    ├───────────────────────────────────────────────────────────┤
    │  Blotato (6 platforms):                                    │
    │    • Facebook (Ads Manager + organic)                      │
    │    • Instagram (Feed, Reels, Stories)                      │
    │    • TikTok (organic + ads)                                │
    │    • LinkedIn (B2B, thought leadership)                    │
    │    • X / Twitter                                           │
    │    • YouTube (channel clips)                               │
    │                                                             │
    │  Scheduling:                                               │
    │    • Daily 7:30 SAST (morning briefing)                    │
    │    • Peak times per platform (via last30days)              │
    │    • Batch scheduling (20+ posts weekly)                   │
    │    • A/B variant testing                                   │
    └───────────────────────────────────────────────────────────┘
        ↓
    ┌───────────────────────────────────────────────────────────┐
    │  AGENT COORDINATION LAYER                                  │
    ├───────────────────────────────────────────────────────────┤
    │  Task Queue (Bull/BullMQ):                                 │
    │    • Route tasks to agents based on role                   │
    │    • Priority queue (urgent deals, VIP leads)              │
    │    • Retry logic + exponential backoff                     │
    │    • Concurrency control (3 leads/hr max for Hermes)       │
    │                                                             │
    │  Workflows (n8n):                                          │
    │    • Lead → Qualify (Hermes) → Invoice (CashClaw)         │
    │    • Content request → Generate → Post → Log (Naledi)      │
    │    • Daily briefing (7:30 AM) → Schedule posts             │
    │    • Base44 sync → Update inventory → Post social proof    │
    │                                                             │
    │  Audit Trail (Notion + Obsidian):                          │
    │    • Every action logged: who, what, when, result          │
    │    • Obsidian: Agent/Sessions/{Agent}/{Date}.md            │
    │    • Notion: Campaign dashboards + metrics                 │
    │    • GitHub: Code + data decisions                         │
    └───────────────────────────────────────────────────────────┘
        ↓
    ┌───────────────────────────────────────────────────────────┐
    │  MCP BRIDGE LAYER (Tool Access)                            │
    ├───────────────────────────────────────────────────────────┤
    │  Shopify:                                                  │
    │    • Get products, update inventory, sync prices           │
    │    • Create orders from deals (CashClaw → Shopify)        │
    │    • Track fulfillment                                     │
    │                                                             │
    │  Notion:                                                   │
    │    • Campaign dashboards (impressions, revenue, ROI)       │
    │    • Lead tracker (status, notes, follow-up)              │
    │    • Agent performance metrics                             │
    │    • Decision logs                                         │
    │                                                             │
    │  ClickUp:                                                  │
    │    • Task management (sync from n8n workflows)             │
    │    • Sprint planning for agent work                        │
    │    • Team collaboration                                    │
    │                                                             │
    │  Obsidian:                                                 │
    │    • Knowledge base (always updated)                       │
    │    • Agent session logs                                    │
    │    • Campaign notes + insights                             │
    │    • Connected to ChromaDB RAG                             │
    │                                                             │
    │  GitHub:                                                   │
    │    • Version control (all code, configs, prompts)          │
    │    • Actions (CI/CD triggers)                              │
    │    • Data room (canonical versions)                        │
    │                                                             │
    │  Base44 Webhooks:                                          │
    │    • Receive: sales pipeline, contacts, tasks              │
    │    • Send: deal updates, fulfilled orders                  │
    │    • Sync: hourly, with conflict resolution                │
    │                                                             │
    │  AgentMail (Email API):                                    │
    │    • 6 Studex inboxes (Meat, Markets, AI, etc.)           │
    │    • Agent-to-agent communication                          │
    │    • Newsletter automation                                 │
    │    • Payment receipts, shipping confirmations              │
    └───────────────────────────────────────────────────────────┘
        ↓
    ┌───────────────────────────────────────────────────────────┐
    │  MONITORING & ANALYTICS                                    │
    ├───────────────────────────────────────────────────────────┤
    │  last30days Skill:                                         │
    │    • Campaign performance (impressions, engagement, ROI)   │
    │    • Agent productivity (tasks completed, deals closed)    │
    │    • Platform metrics (Facebook best times, top posts)     │
    │    • Learnings (what worked, what didn't)                  │
    │                                                             │
    │  Real-time Dashboard:                                      │
    │    • Agent status (online/idle/processing)                 │
    │    • Queue depth (pending tasks by type)                   │
    │    • Live metrics (posts per hour, leads qualified)        │
    │    • Error log                                             │
    └───────────────────────────────────────────────────────────┘
```

---

## Phase Breakdown

### **Phase 1: Core Agent OS (IN PROGRESS)**
- [x] Agent Registry (agents.db, track status/capabilities)
- [x] Content Engine (LLM routing, text/image/video)
- [x] Task Queue (Bull, job dispatch)
- [x] MCP Bridge (Shopify, Notion, ClickUp, n8n, Blotato, Base44, Obsidian)
- [ ] WebSocket Workspace (real-time agent console)
- [ ] Facebook Ad Studio Integration (HTML UI → posting)
- [ ] n8n Workflow templates (lead flow, content flow, daily briefing)

**Timeline:** 2-3 hours to completion + deployment

**Blockers:** None — all components ready

---

### **Phase 2: AI Influencer Engine**
- [ ] Influencer persona library (Naledi, Emily, Leila, custom)
- [ ] Script generation pipeline (topic → script, tone, length)
- [ ] Video synthesis (Higgsfield API integration, queueing)
- [ ] Social proof generation (testimonials, reviews from deals)
- [ ] Multi-platform adaptation (Reels, TikTok, Shorts format)

**Timeline:** 3-4 hours

**Dependencies:** Phase 1 complete

---

### **Phase 3: Advanced Features**
- [ ] ComfyUI integration (image generation, style consistent)
- [ ] Blender 3D assets (product visualization)
- [ ] Design system enforcement (Cormorant, Bebas Neue, colors)
- [ ] OmniRoute model selection (smart routing Qwen → DeepSeek → Claude)
- [ ] Headroom context compression (token optimization)
- [ ] LarryBrain skill integration (knowledge management)

**Timeline:** 4-5 hours

**Dependencies:** Phase 2 complete

---

### **Phase 4: Offline Mode + Local Deployment**
- [ ] Embed all local models (Qwen, DeepSeek, Hermes)
- [ ] SQLite fallback (when PostgreSQL unavailable)
- [ ] Offline n8n (trigger workflows without cloud)
- [ ] Hybrid sync (online when available, queue when offline)
- [ ] Mac Mini setup (UTM VM with all agents, Tailscale mesh)

**Timeline:** 2-3 hours

**Dependencies:** Phase 1 + 2 complete

---

## Component Checklist

### Core Modules (Built)
- [x] server.js — main Express app
- [x] agent-registry.js — agent DB + auth
- [x] content-engine.js — LLM + image/video generation
- [x] task-queue.js — Bull job dispatch
- [x] mcp-bridge.js — tool access layer

### To Build (Phase 1)
- [ ] workspace.js — WebSocket real-time console
- [ ] Ad Studio integration (host + live Blotato)
- [ ] n8n template workflows
- [ ] Deployment config (Dockerfile, Railway, Cloudflare)
- [ ] .env template + documentation

### To Build (Phase 2+)
- [ ] influencer-engine.js — persona management
- [ ] script-generator.js (via LLM)
- [ ] higgsfield-client.js (video synthesis)
- [ ] comfyui-client.js (image generation)
- [ ] design-system.js (brand consistency)

---

## API Endpoints (Ready)

```
# Agent Management
POST   /agents/register          Register agent (Hermes, OpenClaw, etc.)
GET    /agents                   List all agents
GET    /agents/:agent_id         Get agent status

# Task Dispatch
POST   /tasks                    Enqueue task
GET    /tasks/:task_id           Get task status

# Content Generation
POST   /content/generate-copy    Ad copy (LLM)
POST   /content/generate-image   Image (ComfyUI)
POST   /content/generate-video   Video (Higgsfield)

# Dashboard
GET    /dashboard                Agent OS console
GET    /studio                   Facebook Ad Studio UI
GET    /health                   Health check

# WebSocket
WS     /                        Real-time agent updates
```

---

## Environment Variables Required

```bash
# Local Models
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5

# Cloud APIs
ANTHROPIC_API_KEY=sk-ant-...
PERPLEXITY_API_KEY=...

# Content Generation
COMFYUI_URL=http://localhost:8188
HIGGSFIELD_API_KEY=...

# Integrations
SHOPIFY_API_URL=https://...
SHOPIFY_API_TOKEN=...
NOTION_API_KEY=...
CLICKUP_API_KEY=...
BLOTATO_API_KEY=blt_...
BASE44_API_KEY=...
AGENTMAIL_API_KEY=...

# Infrastructure
REDIS_HOST=localhost
REDIS_PORT=6379
DATABASE_URL=postgresql://...
OBSIDIAN_VAULT_PATH=~/Documents/Obsidian Vault/2nd Brain
N8N_WEBHOOK_URL=...
CLOUDFLARE_TUNNEL_TOKEN=...

# Server
PORT=3000
NODE_ENV=production
```

---

## Deployment (Ready for Next Step)

1. **Railway Backend** — Node.js app + PostgreSQL
2. **Cloudflare Tunnel** — Public endpoint (cloudflare.studex.dev)
3. **Cloudflare Workers** — Auth + rate limiting (optional)
4. **Redis** — Job queue + session state
5. **GitHub** — Deployment triggers (push → Railway)

---

## Next Immediate Actions

1. ✅ **Finish Phase 1** — build workspace.js, n8n templates, deploy
2. 🚀 **Unblock Agents** — register Hermes, OpenClaw, CashClaw, Naledi in the system
3. 🎯 **Test Flow** — lead intake → qualify → invoice → post social proof
4. 📊 **Wire Metrics** — last30days skill for campaign tracking
5. 🎨 **Phase 2** — AI influencer video generation (24h later)

---

## Success Criteria

- ✅ All agents operational and coordinated
- ✅ Content flows end-to-end (text → image → video → post)
- ✅ Real-time dashboard showing agent status
- ✅ First StudBot campaign launched via Agent OS
- ✅ Lead-to-invoice flow automated (Hermes → CashClaw)
- ✅ Multi-platform posting working (6 platforms)
- ✅ Offline mode tested (local models only)

---

**Built with:** Node.js, Express, Bull, Notion, n8n, Blotato, Ollama, Claude, Perplexity, ComfyUI, Higgsfield  
**Hosted on:** Railway + Cloudflare Tunnel  
**Managed by:** Tumi Ramaphosa (@TumeloRamaphosa)
