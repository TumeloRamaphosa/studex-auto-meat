# MODELS HOUSE
## Unified Offline/Online Model Gateway for Studex

**Vision:** Single API → routes to optimal model (local/cloud)  
**Status:** Architecture Phase  
**Timeline:** Build by 2026-10-05

---

## 🏠 MODELS HOUSE CONCEPT

```
┌──────────────────────────────────────────────────────────────┐
│                    MODELS HOUSE GATEWAY                      │
│        (Intelligent router: local ↔ cloud, offline-first)     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  QUERY → ROUTER                                      │   │
│  │  (analyze task, check network, choose model)         │   │
│  └──────────────────────────────────────────────────────┘   │
│                        ↓                                      │
│  ┌──────────────────────┬──────────────────────────────┐     │
│  │   LOCAL TIER (Offline)│   CLOUD TIER (Online)       │     │
│  ├──────────────────────┼──────────────────────────────┤     │
│  │                      │                              │     │
│  │ Ollama (Port 11434)  │ HuggingFace Inference API   │     │
│  │ ├─ qwen2.5-coder:7b │ ├─ Llama2-70B               │     │
│  │ ├─ qwen2.5:14b      │ ├─ Mistral-7B               │     │
│  │ ├─ llama3.2:1b      │ ├─ Falcon-40B               │     │
│  │ ├─ ornith-1.5:9b    │ └─ Codellama-34B            │     │
│  │ └─ nemotron-4b      │                              │     │
│  │                      │ OpenRouter (50+ models)     │     │
│  │ (Always available)   │ ├─ Claude 3.5 Sonnet        │     │
│  │ (0ms latency)        │ ├─ Deepseek-V2              │     │
│  │ (Free)               │ ├─ Gemini 2.0               │     │
│  │                      │ └─ Llama 3.1-405B           │     │
│  │                      │                              │     │
│  │                      │ (Fallback when offline)     │     │
│  │                      │ (Premium quality)           │     │
│  │                      │ (Cloud compute)             │     │
│  │                      │                              │     │
│  └──────────────────────┴──────────────────────────────┘     │
│                        ↓                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AGENT RESPONSE (unified interface)                 │   │
│  │  Agent doesn't know/care about local vs. cloud      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 MODEL INVENTORY

### LOCAL MODELS (Ollama)
Running on: MacBook Pro M4 (32GB RAM)

| Model | Size | Speed | Best For | Status |
|-------|------|-------|----------|--------|
| **qwen2.5-coder:7b** | 4.7 GB | ⚡ Ultra-fast | Code generation | ✅ Active |
| **qwen2.5:14b** | 9.0 GB | ⚡ Fast | General tasks | ✅ Active |
| **llama3.2:1b** | 1.3 GB | ⚡⚡ Instant | Quick Q&A | ✅ Active |
| **ornith-1.5:9b** | 6.0 GB | ⚡ Fast | Complex reasoning | ✅ Ready |
| **nemotron-3-nano-4b** | 2.3 GB | ⚡⚡ Instant | NVIDIA tasks | ⏳ Install |

**Total local capacity:** ~23 GB (can load all simultaneously)  
**Latency:** 50-500ms (vs. 500-2000ms cloud)  
**Cost:** Free (already owned)  
**Availability:** 100% offline

---

### CLOUD MODELS (HuggingFace Inference API)

| Model | Provider | Speed | Cost | Best For |
|-------|----------|-------|------|----------|
| **Llama2-70B** | HF | Medium | Free tier | Heavy compute |
| **Mistral-7B** | HF | Fast | Free tier | Balanced |
| **Falcon-40B** | HF | Medium | Free tier | Long context |
| **Codellama-34B** | HF | Medium | Free tier | Code + context |

**HF Setup:**
```bash
# Install HF inference client
pip install huggingface-hub

# Export token
export HF_TOKEN="hf_xxxxxxxxxxxxx"

# Test
huggingface-cli login
```

---

### CLOUD MODELS (OpenRouter)

**50+ models** from: Anthropic, OpenAI, Meta, Google, Mistral, etc.

| Provider | Top Model | Cost | Latency |
|----------|-----------|------|---------|
| **Anthropic** | Claude 3.5 Sonnet | $0.003/k | 500ms |
| **OpenAI** | GPT-4 Turbo | $0.01/k | 800ms |
| **DeepSeek** | DeepSeek-V2 | $0.001/k | 600ms |
| **Google** | Gemini 2.0 | $0.0025/k | 700ms |
| **Meta** | Llama 3.1-405B | $0.0015/k | 750ms |

**OpenRouter Setup:**
```bash
export OPENROUTER_API_KEY="sk-or-xxxxxxxxxxxxx"
```

---

## 🛠️ ROUTER LOGIC

```python
def choose_model(task: str, network_status: str, budget: str):
    """
    Route query to optimal model based on:
    1. Task type (code, explain, reason, research)
    2. Network status (online/offline)
    3. Budget (free, paid, premium)
    """
    
    # If offline → use local only
    if network_status == "offline":
        if "code" in task: return "ollama/qwen2.5-coder:7b"
        if "quick" in task: return "ollama/llama3.2:1b"
        if "reason" in task: return "ollama/ornith-1.5:9b"
        return "ollama/qwen2.5:14b"  # Default
    
    # If online → route by task priority & cost
    if "code" in task and "complex" in task:
        return "openrouter/claude-3.5-sonnet"  # Best code
    
    if "research" in task:
        return "openrouter/llama-3.1-405b"  # Best reasoning
    
    if "heavy" in task:
        return "hf/llama2-70b"  # Free heavy compute
    
    # Default: cheap + reliable
    return "openrouter/deepseek-v2"
```

---

## 🚀 IMPLEMENTATION

### Phase 1: Local Models (Week 1)
- [ ] Install all 5 Ollama models locally
- [ ] Verify all load simultaneously
- [ ] Test latency benchmarks
- [ ] Create offline test suite

### Phase 2: Cloud APIs (Week 1-2)
- [ ] Setup HuggingFace account + token
- [ ] Setup OpenRouter account + API key
- [ ] Create account abstraction layer
- [ ] Implement fallback logic

### Phase 3: Router Gateway (Week 2-3)
- [ ] Build Models House router (`models-house.py`)
- [ ] Implement offline detection (ping test)
- [ ] Create model selection logic
- [ ] Add cost tracking

### Phase 4: Agent Integration (Week 3-4)
- [ ] Update all 6 base agents to use Models House
- [ ] Test offline → online transitions
- [ ] Create agent routing config
- [ ] Performance benchmarking

### Phase 5: Deployment (Week 4-5)
- [ ] Deploy Models House to local + cloud
- [ ] Wire to Herdr agents
- [ ] Create dashboard/monitoring
- [ ] Team training + docs

---

## 📝 MODELS HOUSE API

**Single endpoint, smart routing:**

```python
# Query — agent doesn't care about implementation
response = models_house.query(
    task="Generate a React component",
    agent="hermes",
    priority="speed"  # or "quality", "cost"
)

# Models House handles:
# 1. Check network status
# 2. Estimate task complexity
# 3. Check budget
# 4. Route to optimal model
# 5. Fall back if needed
# 6. Return response
```

---

## 💰 COST STRUCTURE

### Monthly Costs (Estimated)

| Tier | Model | Count | Price | Monthly |
|------|-------|-------|-------|---------|
| **Local** | Ollama | 5 | Free | $0 |
| **Free Cloud** | HuggingFace | 4 | Free | $0 |
| **Paid Cloud** | OpenRouter | 50+ | $0-0.01/k | $50-200 |
| **Total** | | | | **$50-200** |

**Cost optimization:**
- Use local (0 cost) for 70% of queries
- Use HF free tier for 20% of queries
- Use OpenRouter premium for 10% of queries
- Result: $50-100/month for full capability

---

## 🔌 AGENT CONFIGURATION

Each agent knows its preferences:

```json
{
  "hermes": {
    "orchestrator": true,
    "preferred_models": ["openrouter/claude-3.5-sonnet", "hf/llama2-70b", "ollama/qwen2.5:14b"],
    "offline_fallback": "ollama/qwen2.5:14b",
    "budget": "balanced"
  },
  "naledi": {
    "cmo": true,
    "preferred_models": ["ollama/qwen2.5:14b", "openrouter/deepseek-v2"],
    "offline_fallback": "ollama/qwen2.5:14b",
    "budget": "cost-aware"
  },
  "ralf": {
    "scheduler": true,
    "preferred_models": ["ollama/llama3.2:1b", "ollama/qwen2.5:14b"],
    "offline_fallback": "ollama/llama3.2:1b",
    "budget": "speed-first"
  }
}
```

---

## 🏗️ FILES TO CREATE

```
~/models-house/
├── models-house.py                 # Main router + gateway
├── models-house-config.yaml        # Model registry
├── ollama-local-server.py          # Ollama wrapper
├── huggingface-bridge.py           # HF Inference API
├── openrouter-bridge.py            # OpenRouter wrapper
├── cost-tracker.py                 # Track spending
├── offline-detector.py             # Network detection
├── dashboard.html                  # Models House UI
└── agent-config.json               # Agent preferences
```

---

## 📈 METRICS TO TRACK

**Per query:**
- Model used (local vs. cloud)
- Latency (time to response)
- Cost (if cloud)
- Quality score (user feedback)
- Task type

**Per agent:**
- Average response time
- Cost per month
- Offline vs. online ratio
- Model preferences accuracy

**System-wide:**
- Uptime (offline capability)
- Fallback frequency
- Cost efficiency ratio
- Agent satisfaction

---

## ✅ SUCCESS CRITERIA

**By 2026-10-05:**
- ✅ All 5 Ollama models running locally
- ✅ HF + OpenRouter integrated
- ✅ Router choosing correct model 95%+ of the time
- ✅ System works 100% offline with Ollama
- ✅ Seamless online → offline transitions
- ✅ All 6 agents using Models House
- ✅ Cost tracking active
- ✅ Dashboard showing model usage

---

## 🎯 NEXT STEPS

**Today (Immediate):**
1. List all 5 Ollama models locally
2. Create HF account + token
3. Create OpenRouter account + API key

**This Week:**
4. Install all local models
5. Build router prototype
6. Test offline detection

**Next Week:**
7. Integrate with Herdr agents
8. Performance benchmarking
9. Cost tracking setup

**By Sept 30:**
10. Full deployment + team training

---

## 📞 DESIGN DECISIONS

**Q: Use OpenRouter or just HF?**  
A: Both. HF free tier for standard tasks, OpenRouter for premium (Claude, DeepSeek, etc.)

**Q: Keep all 5 Ollama models loaded?**  
A: Yes. 32GB RAM handles it, saves startup time (lazy-load if RAM constrained)

**Q: Fallback strategy if all APIs down?**  
A: Respond with cached result + queue for retry (graceful degradation)

**Q: How often update model list?**  
A: Weekly (new models release regularly, especially on OpenRouter)

---

**Owner:** Claude Code (Agent)  
**Architect:** Tumi (Founder)  
**Status:** Ready for Build Phase  
**Version:** 1.0 — Architecture Complete
