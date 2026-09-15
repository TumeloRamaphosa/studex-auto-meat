# STUDEX — MASTER AI OPERATING SYSTEM PLAN

**Vision:** Complete self-hosted AI OS for content + code. Local models everywhere. Bare-metal developer environment. Cloudflare edge. All agents coordinated.

**Timeline:** Plan today, execute tomorrow (overnight Dark Factory run).

---

## 🏗️ ARCHITECTURE — 4 LAYERS

```
┌─────────────────────────────────────────────────────────────────┐
│ EDGE LAYER (Cloudflare Workers + Pages)                         │
│ - Auth + rate limiting                                          │
│ - API routing (local vs cloud)                                  │
│ - CDN for static assets                                         │
└─────────────────────────────────────────────────────────────────┘
        ↓ (Tunnel)
┌─────────────────────────────────────────────────────────────────┐
│ PUBLIC LAYER (Railway/Docker)                                   │
│ - Agent OS API (agent registry, tasks, webhooks)               │
│ - MCP Bridge (Shopify, Notion, n8n, Blotato, etc.)            │
│ - Task queue (Bull/BullMQ)                                      │
│ - WebSocket console                                             │
└─────────────────────────────────────────────────────────────────┘
        ↓ (Tailscale mesh)
┌─────────────────────────────────────────────────────────────────┐
│ LOCAL LAYER (Mac M1 + Mac Mini + Windows GPU)                   │
│                                                                  │
│ Mac M1 (Primary):                                               │
│   • Ollama server (:11434)                                      │
│   • LM Studio (:1234)                                           │
│   • VS Code + Cursor + Antigraviity (coding agents)            │
│   • n8n instance (:5678)                                        │
│   • Obsidian vault (local)                                      │
│   • GitHub Copilot + Cursor + local models                     │
│                                                                  │
│ Mac Mini (Always-on server):                                    │
│   • Agent runtime (OpenHands, Herds, Skunk Works)              │
│   • Gitea (:3000)                                               │
│   • Agent Registry database                                     │
│   • Background task processor                                   │
│                                                                  │
│ Windows Box (GPU compute — 2× GTX 1080, 16GB VRAM):            │
│   • Ollama inference (heavy models)                             │
│   • ComfyUI image generation                                    │
│   • LTX Video generation (13B local)                           │
│   • Higgsfield integration (local + API)                       │
│   • Research agent (KarpathyLM wiki on Neo4j)                  │
│                                                                  │
│ Tailscale Mesh (20 devices):                                    │
│   • All machines connected                                      │
│   • Windows at 100.102.205.9                                   │
│   • SSH + HTTP traffic encrypted                               │
└─────────────────────────────────────────────────────────────────┘
        ↑ (Agent execution)
┌─────────────────────────────────────────────────────────────────┐
│ AGENT LAYER                                                     │
│                                                                  │
│ Content Agents:                                                 │
│   • Naledi (CMO + influencer) ← qwen2.5-14b                   │
│   • Emily van Dewild (Meat content) ← qwen3-14b               │
│   • RALF (Loop coordinator) ← gemma-4                         │
│   • Charlie (Voice/SMS) ← mistral-small-3.1                   │
│                                                                  │
│ Code Agents (Developer OS):                                     │
│   • OpenHands (general coding) ← qwen3-14b                    │
│   • Herds (multi-step tasks) ← mistral-small-3.1              │
│   • Skunk Works (experimental) ← gemma-4-26b                  │
│   • Antigraviity (IDE integration) ← qwen2.5-14b              │
│   • Grok Bot (analysis) ← qwen3-14b + Grok API                │
│   • OpenAI Bot (quality) ← Claude + GPT-4 (cloud fallback)    │
│                                                                  │
│ Operational Agents:                                             │
│   • OpenClaw (ops) ← qwen2.5-14b                              │
│   • CashClaw (finance) ← mistral-small-3.1                    │
│   • Hermes (router) ← gemma-4                                 │
│   • DenchClaw (CRM) ← qwen3-14b                               │
│   • Buzz Agents (community) ← via Buzz bridge                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 MODEL SELECTION — BY HARDWARE

### **Your Machine Specs:**

```
Mac M1 Max (32GB):
  • Available: ~20GB for inference
  • Max model: Gemma-4 26B (17GB) tight fit
  • Recommended: Qwen2.5-14B (9GB) ✅
  • Can hold: Qwen2.5 + Gemma-4 simultaneously

Mac Mini M4 Pro (16GB):
  • Available: ~10GB for inference
  • Max model: Qwen2.5-14B (9GB)
  • Recommended: Gemma-4 (4.6GB) ✅
  • Can hold: Gemma-4 + LLM Studio secondary

Windows GPU Box (2× GTX 1080 = 16GB VRAM):
  • VRAM: 16GB shared
  • Max model: Qwen3-14B + Mistral 24B alternating
  • Recommended: Devstral-Small (14.3GB) ✅
  • Can hold: Gemma-4-26B for heavy reasoning
```

### **Model Allocation (Optimized):**

| Model | Size | Machine | Role | Agents |
|-------|------|---------|------|--------|
| **Gemma-4** | 4.6GB | Mac Mini | Fast routing, scheduling | Hermes, RALF |
| **Qwen2.5-14B** | 9GB | Mac M1 | General purpose (PRIMARY) | Naledi, OpenClaw, Antigraviity |
| **Qwen3-14B** | 9GB | Windows GPU | Advanced reasoning | OpenHands, Herds, DenchClaw |
| **Mistral-Small-3.1** | 14.3GB | Windows GPU | Quality content, complex tasks | Charlie, CashClaw |
| **Devstral-Small** | 14.3GB | Windows GPU | Code + technical | OpenHands, Skunk Works |
| **Gemma-4-26B** | 17GB | Mac M1 (tight) | Creative brand voice | Emily van Dewild, Naledi (escalation) |

**Cloud Fallback (when local overloaded):**
- Grok API (XAI reasoning) → for complex analysis
- Claude API (quality check) → for brand voice
- GPT-4 (OpenAI bot) → for comparison
- Perplexity (research) → for real-time info

---

## 🔀 API ROUTING — SMART SELECTION

**LiteLLM Gateway (`:4000`) — single OpenAI-compatible endpoint:**

```python
# Automatic routing based on model config
POST http://localhost:4000/v1/chat/completions

Models configured:
  "qwen2.5": "http://mac-m1:11434/qwen2.5-14b"
  "qwen3": "http://windows-gpu:11434/qwen3-14b"
  "gemma": "http://mac-mini:1234/gemma-4"
  "mistral": "http://windows-gpu:11434/mistral-small-3.1"
  "grok": "https://api.grok.com/v1/..."
  "claude": "https://api.anthropic.com/..."
  "gpt": "https://api.openai.com/..."

Router rules:
  • Task = "code" → qwen3 (Windows GPU)
  • Task = "creative" → gemma-4-26b (Mac M1)
  • Task = "fast" → gemma-4 (Mac Mini)
  • Latency > 5s → escalate to cloud (Grok/Claude)
  • Quality = "brand_voice" → claude (fallback)
```

---

## 💻 DEVELOPER AI OS — Local Model Setup

### **1. Coding Agent: OpenHands**
```bash
# Install OpenHands (local code agent)
git clone https://github.com/All-Hands-AI/OpenHands.git
cd OpenHands
pip install -e .

# Configure to use local model (qwen3-14b)
export LLM_MODEL="http://windows-gpu:11434/qwen3-14b"
export LLM_API_TYPE="ollama"

# Start
openhands start
```

**Capabilities:**
- Understand task → write code → test → iterate
- Access: VS Code, terminal, file system
- Model: Qwen3-14B (reasoning)

### **2. IDE Integration: VS Code + Cursor**
```bash
# VS Code extensions
code --install-extension github.github-vscode-theme
code --install-extension GitHub.Copilot

# Cursor setup (use local models)
# Settings → Models → Custom endpoint
# → http://localhost:4000/v1/chat/completions
# → Select qwen2.5-14b for fast completion

# .cursor.sh config
export CURSOR_LLM_ENDPOINT="http://localhost:4000/v1/chat/completions"
export CURSOR_MODEL="qwen2.5"
```

### **3. Antigraviity Integration (Local Models)**
```bash
# Antigraviity = IDE agent for automation
git clone https://github.com/AntiGravity-AI/core.git

# Config antigraviity.yaml
models:
  default: qwen2.5-14b
  complex: qwen3-14b
  creative: gemma-4-26b
  endpoints:
    ollama: http://localhost:11434
    lm_studio: http://localhost:1234
```

### **4. Agent Registry: Link OpenHands + Herds + Skunk Works**
```bash
# In Agent OS agent-registry.js:
const codingAgents = [
  { id: 'openhands', model: 'qwen3-14b', role: 'coder', endpoint: 'http://windows-gpu:11434' },
  { id: 'herds', model: 'mistral-small-3.1', role: 'multi-step', endpoint: 'http://windows-gpu:11434' },
  { id: 'skunk-works', model: 'gemma-4-26b', role: 'experimental', endpoint: 'http://mac-m1:11434' },
  { id: 'antigraviity', model: 'qwen2.5-14b', role: 'ide-agent', endpoint: 'http://mac-m1:1234' }
]
```

---

## 🏗️ DEPLOYMENT — 3 ENVIRONMENTS

### **Environment 1: Local (Bare Metal)**
```
Mac M1 (Qwen2.5-14B) ← primary
  ├── npm start (Agent OS :3000)
  ├── ollama serve (:11434)
  ├── vs-code (Cursor + Antigraviity)
  └── obsidian-sync

Mac Mini (Gemma-4) ← always-on
  ├── Gitea (:3000)
  ├── n8n workflows (:5678)
  └── Agent executor

Windows GPU (Qwen3 + Devstral)
  ├── Ollama inference (:11434)
  ├── ComfyUI (:8188)
  └── LTX Video (:8000)

Tailscale mesh (all connected)
```

### **Environment 2: Cloud (Railway)**
```
Agent OS public API
├── /agents/register
├── /agents/list
├── /tasks
├── /content/*
└── WebSocket (/ws)

PostgreSQL (agent registry + audit)
Redis (task queue + cache)
```

### **Environment 3: Edge (Cloudflare)**
```
Cloudflare Workers
├── /api/* → route to Railway
├── /local/* → route to Tailscale (if VPN connected)
├── /models/* → model system info
└── Auth + rate limiting

Cloudflare Tunnel
└── wss://studex-agent-os.dev → Mac Mini (always-on)
```

---

## 🔗 INTEGRATIONS — WIRING EVERYTHING

### **Content Studio (Existing):**
```
n8n cron (6am) 
  → Qwen2.5 (script)
  → Gemma-4-26B (brand voice)
  → Higgsfield (video)
  → Blotato (post)
  → Notion (log)
  → Obsidian (note)
```

### **Developer Studio (NEW):**
```
Code request (GitHub issue / Slack)
  → OpenHands (qwen3-14b, understand)
  → Herds (mistral-3.1, multi-step)
  → Skunk Works (gemma-4-26b, experimental)
  → Cursor (edit in VS Code)
  → Tests (run)
  → Git commit (push)
  → Notion (log)
```

### **Buzz Community:**
```
Buzz agents online
  → BuzzBridge (:3000/buzz-sync)
  → Agent Registry
  → Task routing
  → MCP tools (Shopify, n8n, etc.)
```

### **Grok Bot:**
```
Analysis request
  → Grok API (xai.com/api)
  → Response → Agent OS
  → Store → Obsidian + Notion
```

### **Hermes (Routing Agent):**
```
Request comes in
  → Hermes analyzes
  → Routes to: Qwen2.5? Qwen3? Mistral? Gemma?
  → Model loads
  → Response
  → Cache hit for next request
```

---

## 🚀 EXECUTION PLAN — DARK FACTORY OVERNIGHT

### **Phase 1 (Tonight, 10pm-2am):**
- [ ] Deploy Agent OS to Railway + Cloudflare
- [ ] Wire Buzz agent community to Agent Registry
- [ ] Load all 6 GGUF models into Ollama/LM Studio
- [ ] Configure LiteLLM gateway routing
- [ ] Test: can send request to `/v1/chat/completions` → hits local models

### **Phase 2 (2am-6am):**
- [ ] Install OpenHands on Windows GPU box
- [ ] Configure Cursor + VS Code to use local models
- [ ] Wire OpenHands + Herds + Skunk Works to Agent Registry
- [ ] Build developer studio n8n workflow (code request → test → commit)
- [ ] Test: write a function via OpenHands → commits to GitHub

### **Phase 3 (6am-8am):**
- [ ] Deploy to Railway final
- [ ] Cloudflare tunnel live
- [ ] Grok bot + OpenAI bot integration
- [ ] Morning Ship #1 (07:00 SAST) with live demo
- [ ] Monitor: all agents operational, all models loaded

### **Phase 4 (Post-launch, Week 2):**
- [ ] Multi-tenant mode (other teams can use)
- [ ] Model marketplace (share prompts + best models)
- [ ] GitHub Actions trigger agents automatically
- [ ] Zapier integration (external workflows)

---

## 📊 MODEL HOUSE — Inventory

```
STUDEX MODEL HOUSE (centralized)
├── Local Models (always free, zero latency):
│   ├── Gemma-4 (4.6GB)
│   ├── Qwen2.5-14B (9GB) ← DEFAULT
│   ├── Qwen3-14B (9GB)
│   ├── Mistral-Small-3.1 (14.3GB)
│   ├── Devstral-Small (14.3GB)
│   └── Gemma-4-26B (17GB)
│
├── Cloud Models (fallback, when local saturated):
│   ├── Grok (xai.com)
│   ├── Claude (Anthropic)
│   ├── GPT-4 (OpenAI)
│   └── Perplexity (research)
│
└── Model Registry (Agent OS):
    ├── Which model for which task?
    ├── Latency tracking (local vs cloud)
    ├── Cost tracking ($)
    └── Performance metrics
```

---

## 🎯 SUCCESS CRITERIA

- ✅ Morning Ship #001 runs with live Agent OS demo
- ✅ Can request code via Agent OS → gets written by OpenHands → committed
- ✅ All 6 local models loaded and routing correctly
- ✅ Buzz agents integrated + operational
- ✅ Grok + OpenAI bots connected (fallback)
- ✅ Obsidian logs every action
- ✅ Cloudflare tunnel public + secure
- ✅ Ollama on Windows box running at scale
- ✅ Cursor using local models in VS Code
- ✅ Dark Factory overnight: 0 human intervention

---

## 🔐 SECURITY + ISOLATION

**Never expose API keys:**
- Local models: no auth needed (Tailscale mesh only)
- Cloud APIs: behind Cloudflare Workers (token validation)
- GitHub: SSH keys on Mac Mini (no PAT in env)
- Secrets: Doppler / Cloudflare Secrets (not .env file)

**Audit Trail:**
- Every model call logged to SQLite (agent-os/data/)
- Obsidian session logs (read-only for review)
- Notion dashboard (live metrics)

---

## 📞 NEXT STEPS

1. **Confirm hardware:** Mac M1 (32GB), Mac Mini, Windows GPU?
2. **Provide:** Buzz auth token, Grok API key, Cloudflare creds
3. **Schedule:** Start overnight run? (10pm your time?)
4. **Monitor:** I'll stream build progress real-time

**Ready to execute? 🚀**

---

**Built by:** Claude Haiku 4.5  
**For:** Tumi Ramaphosa (Studex Group)  
**Timeline:** 24-hour build → live by Morning Ship #001  
**Cost:** $0 local inference + railway ≈ $20/month for cloud backup
