# Paperclip OS Integration Layer

**Bridge:** Connect Paperclip OS (orchestration framework) to studex-auto-meat (live operations)

## Architecture: How They Connect

```
┌─────────────────────────────────────────────────────────────────┐
│          STUDEX AUTO-MEAT (Existing 4-Layer OS)                │
│                                                                  │
│  EDGE: Cloudflare Workers                                       │
│  PUBLIC: Railway API + MCP Bridge                               │
│  LOCAL: Mac M1, Mac Mini, Windows GPU + Ollama                 │
│  AGENTS: Naledi, OpenHands, Herds, RALF, Hermes, etc.         │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                ┌──────────────▼───────────────┐
                │  PAPERCLIP OS INTEGRATION    │
                │  (New orchestration layer)   │
                │                              │
                │  ├─ Dograh ↔ Agent Registry  │
                │  ├─ Hermes ↔ n8n workflows   │
                │  ├─ Odysseus ↔ Security     │
                │  └─ Interview System         │
                └──────────────┬───────────────┘
                               │
        ┌──────────────────────┴──────────────────────┐
        │                                             │
    ┌───▼─────────┐  ┌───────────┐  ┌──────────────┐
    │  Naledi CMO │  │  RALF     │  │  OpenHands   │
    │  (qwen2.5)  │  │ (Gemma-4) │  │  (qwen3)     │
    └─────────────┘  └───────────┘  └──────────────┘
```

## Integration Points

### 1. Dograh → Agent Registry
Connect Dograh task queue to your existing agent registry:

```bash
# Register all your agents with Dograh (one-time)
curl -X POST http://localhost:8000/register_agent \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Naledi",
    "endpoint": "http://localhost:5000/naledi",
    "capabilities": ["content_creation", "influencer", "social_media"],
    "role": "cmo"
  }'

# Repeat for: RALF, OpenHands, Herds, Hermes, DenchClaw, CashClaw, etc.
```

### 2. LiteLLM Router → Dograh Model Selection
Dograh queries LiteLLM for optimal model:

```python
# dograh/model_router.py
def select_model_for_task(task_type: str):
    routes = {
        "interview_technical": "qwen3-14b",      # Windows GPU
        "content_creation": "qwen2.5-14b",        # Mac M1
        "fast_routing": "gemma-4",                # Mac Mini
        "quality_voice": "claude",                # Cloud fallback
        "code_generation": "qwen3-14b"            # Windows GPU
    }
    return routes.get(task_type, "qwen2.5-14b")
```

### 3. Naledi Interview Agent
Extend Naledi's capabilities to conduct interviews:

```yaml
# Naledi personality extension
interview_mode:
  tone: "warm_professional"
  depth: "conversational"
  focus: "candidate_potential"
  
  questions:
    technical:
      - "How would you approach..."
      - "Describe your experience with..."
    cultural:
      - "What drew you to StudEx?"
      - "How do you embody our values?"
    
  scoring:
    model: "qwen3-14b"  # Reasoning
    rubric: "studex-hiring-2026"
```

### 4. RALF Loop ↔ Paperclip OS
RALF coordinates all agents; Paperclip OS hands off interview tasks:

```
RALF Daily Loop (runs at midnight SAST):
  ├─ Check interview queue (Dograh)
  ├─ Dispatch to Naledi (CMO mode)
  ├─ Dispatch to Evaluator (scoring)
  ├─ Collect results
  ├─ Sync to Notion/Google Sheets
  └─ Report to Hermes (notifications)
```

### 5. Buzz Mesh Integration
All agents on Nostr relays for decentralized coordination:

```
Naledi → Buzz (Nostr) → RALF → Hermes → Notion
         ↓
   (EdDSA signed messages)
```

## Implementation: 3 New Files

### File 1: `agent-os/paperclip-bridge.py`
Connects Dograh ↔ Agent Registry

### File 2: `workflows/interview-automation.n8n.json`
n8n workflow for interview orchestration

### File 3: `INTEGRATION_CHECKLIST.md`
Step-by-step wiring guide

## Quick Start

```bash
# 1. Start Paperclip services
cd ~/paperclip-os && docker compose up -d
cd ~/Base44OS && docker compose up -d

# 2. Register agents with Dograh
python ~/studex-auto-meat/agent-os/register-agents.py

# 3. Start interview coordinator
python ~/.openclaw/interview-coordinator/interview-orchestrator.py

# 4. Test end-to-end
/interview-coordinator --candidate="Test" --role="Engineer" --round=1
```

## Benefits

✅ Centralized task orchestration (Dograh)  
✅ Smart model selection (LiteLLM)  
✅ Decentralized coordination (Buzz/Nostr)  
✅ Interview automation (Naledi + Evaluator)  
✅ Results sync to 3 systems (Notion, Google Sheets, Obsidian)  
✅ Audit trail (Odysseus security)  
✅ Agent mesh monitoring (Buzz monitor)

## Next: Production Deployment

See PRODUCTION_DEPLOYMENT.md for:
- Cloudflare edge routing
- Railway public API
- Tailscale mesh scaling
- Multi-region failover
