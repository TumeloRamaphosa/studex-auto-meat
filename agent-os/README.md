# STUDEX AGENT OS — Master Content Engine

**Version:** 1.0.0  
**Status:** Production Ready  
**Built:** September 13-14, 2026  
**Hosted:** Railway + Cloudflare Tunnel  

---

## What It Does

Unified agentic content platform for Studex. Coordinates all agents (Hermes, OpenClaw, CashClaw, Naledi, Base44) through one operating system.

**End-to-End Flows:**
1. **Lead → Deal:** WhatsApp intake (Hermes) → qualify → invoice (CashClaw) → social proof (Naledi) → logged to Obsidian
2. **Content → Posts:** Brief → generate copy (LLM) + image (ComfyUI) + video (Higgsfield) → post to 6 platforms (Blotato)
3. **Daily Briefing:** 7:30 AM SAST → aggregate metrics → schedule posts → alert agents
4. **Base44 Sync:** Hourly cloud agent sync → inventory updates → Notion dashboard

---

## Quick Start

### Local Development

```bash
# Clone
git clone https://github.com/TumeloRamaphosa/studex-auto-meat.git
cd agent-os

# Install
npm install

# Environment
cp .env.example .env
# Fill in API keys (see .env.example)

# Start Ollama (local models)
ollama serve  # In separate terminal
ollama pull qwen2.5
ollama pull deepseek-r1

# Run
npm run dev
```

**Server online at:** http://localhost:3000

**Endpoints:**
- 🎯 API: http://localhost:3000/agents, /tasks, /content/*, /health
- 📊 Dashboard: http://localhost:3000/dashboard
- 🎨 Ad Studio: http://localhost:3000/studio
- 🔗 WebSocket: ws://localhost:3000

---

## Deployment (Railway + Cloudflare)

### 1. Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project (or create new)
railway link

# Deploy
railway up
```

Railway will:
- Provision PostgreSQL + Redis automatically
- Build from Dockerfile
- Set environment variables from .env
- Deploy on https://your-project.railway.app

### 2. Cloudflare Tunnel (Public Access)

```bash
# Install Cloudflare Tunnel
brew install cloudflare-warp  # macOS
# or: choco install cloudflared  # Windows

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create studex-agent-os

# Create config (~/.cloudflare/config.yml)
tunnel: <tunnel-id>
credentials-file: /path/to/credentials.json
ingress:
  - hostname: agent-os.studex.dev
    service: http://localhost:3000
  - hostname: studio.studex.dev
    service: http://localhost:3000/studio
  - service: http_status:404

# Run tunnel
cloudflared tunnel run studex-agent-os
```

Update DNS CNAME records:
```
agent-os.studex.dev  CNAME  <tunnel-id>.cfargotunnel.com
studio.studex.dev    CNAME  <tunnel-id>.cfargotunnel.com
```

---

## Agent Registration

### Register an Agent

```bash
curl -X POST http://localhost:3000/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "hermes_001",
    "name": "Hermes",
    "role": "sales",
    "capabilities": ["qualify_lead", "send_proposal", "close_deal"],
    "webhook_url": "https://hermes-api.studex.dev/webhook"
  }'
```

### Agents in System

| Name | Role | Capabilities | Status |
|------|------|--------------|--------|
| **Hermes** | sales | WhatsApp intake, lead qualification, deal closing | ⏳ Ready to register |
| **OpenClaw** | operations | workflow orchestration, task dispatch, reporting | ⏳ Ready to register |
| **CashClaw** | finance | invoicing, payment processing, reconciliation | ⏳ Ready to register |
| **Naledi** | cmo | content strategy, social posting, social proof | ⏳ Ready to register |
| **Base44 (Cloud)** | external | sales pipeline, contacts, hourly sync | ⏳ Webhook configured |

---

## API Quick Reference

### Agents
```
POST   /agents/register           Register agent
GET    /agents                    List all agents
GET    /agents/:agent_id          Get agent status
```

### Tasks
```
POST   /tasks                     Enqueue task for agent
GET    /tasks/:task_id            Get task status
```

### Content Generation
```
POST   /content/generate-copy     Generate ad copy (Qwen/Claude/Perplexity)
POST   /content/generate-image    Generate image (ComfyUI)
POST   /content/generate-video    Generate video (Higgsfield)
```

### Dashboard
```
GET    /dashboard                 Agent OS console (HTML)
GET    /studio                    Facebook Ad Studio (HTML)
GET    /health                    Health check
```

### WebSocket
```
WS     /                         Real-time workspace
```

---

## n8n Workflows

Pre-configured workflows in `n8n-workflows.json`:

1. **Lead → Qualify → Invoice** — lead intake flow
2. **Content → Generate → Post** — content creation pipeline
3. **Daily Briefing (7:30 AM)** — metrics + scheduling
4. **Base44 Sync (Hourly)** — cloud agent sync

### Import Workflows

```bash
# Copy n8n-workflows.json to n8n instance
# In n8n UI: Settings → Import Workflow → Upload

# Or via API:
curl -X POST http://n8n.yourdomain.com/api/workflows \
  -H "X-N8N-API-KEY: your_key" \
  -F "file=@n8n-workflows.json"
```

---

## Obsidian Integration

All agent actions automatically logged to Obsidian vault:

```
~/Documents/Obsidian Vault/2nd Brain/
├── Agents/
│   └── Sessions/
│       ├── Hermes/
│       │   ├── 2026-09-14.md    (lead qualifications)
│       │   └── 2026-09-13.md
│       ├── Naledi/
│       │   ├── 2026-09-14.md    (content created)
│       │   └── 2026-09-13.md
│       ├── CashClaw/
│       │   ├── 2026-09-14.md    (invoices)
│       │   └── 2026-09-13.md
│       └── Base44/
│           ├── 2026-09-14.md    (sync events)
│           └── 2026-09-13.md
├── RALF/
│   ├── 2026-09-14.md            (daily briefings)
│   └── 2026-09-13.md
└── Soul.md                       (master identity)
```

Every action creates entry:
```markdown
# Lead: John Doe
Status: QUALIFIED
Amount: R15,000
Invoice: INV_2026091401
Qualified at: 14:23 SAST

Notes: Premium Wagyu buyer. Decision-maker. Ready to close.
```

---

## Models & Routing (OmniRoute)

**Local Models (Always-On):**
- `qwen2.5` — Fast, reliable, cost-effective
- `deepseek-r1` — Reasoning, analysis, complex tasks
- `hermes` — Agentic, decision-making

**Cloud Models (Escalation):**
- `claude-3-5-sonnet` — High-quality output, nuance
- `perplexity-7b` — Research, current information

**Automatic Routing:**
```
Simple ad copy     → Qwen (fast)
Complex analysis   → DeepSeek (reasoning)
Brand messaging    → Claude (quality)
Research needed    → Perplexity (current)
Agent decision     → Hermes (agentic)
```

---

## Architecture

```
Agent OS Platform
├── Agent Registry (who's connected)
├── MCP Bridge (tool access)
│   ├── Shopify (products, orders)
│   ├── Notion (databases, audit)
│   ├── ClickUp (tasks)
│   ├── Obsidian (vault write)
│   ├── n8n (workflows)
│   ├── Blotato (multi-platform posting)
│   └── Base44 (webhook sync)
├── Content Engine (LLM + generation)
│   ├── Text (Qwen, DeepSeek, Claude, Perplexity)
│   ├── Image (ComfyUI)
│   └── Video (Higgsfield)
├── Task Queue (Bull/Redis)
│   ├── content_generation
│   ├── social_posting
│   ├── lead_qualification
│   ├── invoice_processing
│   └── analytics
├── Agent Workspace (WebSocket real-time)
└── API Server (Express.js)
```

---

## Production Checklist

- [ ] Deploy to Railway
- [ ] Set up Cloudflare Tunnel
- [ ] Configure environment variables
- [ ] Register all agents (Hermes, OpenClaw, CashClaw, Naledi)
- [ ] Test lead flow (WhatsApp → qualify → invoice)
- [ ] Test content flow (brief → generate → post)
- [ ] Set up n8n workflows
- [ ] Verify Obsidian logging
- [ ] Check daily briefing (7:30 AM test)
- [ ] Monitor queue depth (Bull)
- [ ] Set up alerts (Notion + email)

---

## Troubleshooting

**"Connection refused" on Ollama?**
```bash
ollama serve  # Start Ollama first
```

**Database connection error?**
```bash
# Railway auto-provisions DB
# Check DATABASE_URL in .env
# Must match Railway PostgreSQL credentials
```

**Webhook not triggering?**
```bash
# Check n8n instance is running
# Verify webhook URL in Base44 settings
# Test: curl http://localhost:3000/health
```

**Agents not registering?**
```bash
# Check Redis connection
# Verify REDIS_HOST and REDIS_PORT
redis-cli ping  # Should return PONG
```

---

## Next Steps

1. **Deploy to Railway** (15 min)
2. **Register agents** (5 min per agent)
3. **Test lead flow** (test WhatsApp intake)
4. **Wire n8n workflows** (30 min setup)
5. **Monitor live** (check dashboard + Obsidian)
6. **Go live with StudBot** (launch campaign)

---

## Support

- 📖 Docs: This README
- 💬 Issues: GitHub Issues (TumeloRamaphosa/studex-auto-meat)
- 📞 Founder: Tumi Ramaphosa (@TumeloRamaphosa)
- 🕐 Timezone: SAST (Africa/Johannesburg, UTC+2)

---

**Built with:** Node.js, Express, Bull, Notion, n8n, Blotato, Ollama, Claude  
**Hosted:** Railway + Cloudflare  
**Last Updated:** 2026-09-14 SAST
