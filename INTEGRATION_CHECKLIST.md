# 🚀 Paperclip OS + StudEx Auto-Meat Integration Checklist

**Goal:** Wire Paperclip OS orchestration into your live studex-auto-meat system (Naledi, RALF, OpenHands, etc.)

**Timeline:** 1-2 hours to deploy end-to-end  
**Complexity:** Medium (existing agents + new orchestrator layer)

---

## PHASE 1: Pre-Flight (15 min)

### Check Prerequisites
- [ ] Redis running: `redis-cli ping` → should say PONG
- [ ] Docker available: `docker --version`
- [ ] Python 3.9+: `python3 --version`
- [ ] All your agents running (Naledi, RALF, OpenHands)
- [ ] LiteLLM gateway available: `curl http://localhost:4000/v1/models` (optional but recommended)

### Clone & Prepare Paperclip OS
```bash
cd ~
# Paperclip OS already scaffolded at ~/paperclip-os
# Base44OS already scaffolded at ~/Base44OS

# Copy env files
cp ~/paperclip-os/.env.template ~/paperclip-os/.env
cp ~/Base44OS/.env.template ~/Base44OS/.env

# Update .env with your Dograh port + StudEx domain
echo 'STUDEX_MEAT_SITE="https://www.studexmeat.com"' >> ~/paperclip-os/.env
```

**Checklist items:**
- [ ] Paperclip OS directory structure created
- [ ] Base44OS directory structure created
- [ ] .env files created with StudEx Meat configuration

---

## PHASE 2: Start Infrastructure (20 min)

### Start Paperclip OS Services
```bash
cd ~/paperclip-os
docker compose up -d

# Verify
docker compose ps
# Should show: postgres, redis, paperclip-cms, traefik [UP]
```

**Checklist items:**
- [ ] Paperclip postgres service running
- [ ] Paperclip redis service running
- [ ] Paperclip CMS service running (port 9000)

### Start Base44OS Services
```bash
cd ~/Base44OS
docker compose up -d

# Verify
docker compose ps
# Should show: postgres, redis, dograh, hermes, odysseus, denchclaw, cashclaw [UP]
```

**Checklist items:**
- [ ] Dograh running on port 8000: `curl http://localhost:8000/health`
- [ ] Hermes running on port 8081: `curl http://localhost:8081/health`
- [ ] Odysseus running on port 7001: `curl http://localhost:7001/health`
- [ ] Redis available for task queue

### Start Interview Coordinator
```bash
python ~/.openclaw/interview-coordinator/interview-orchestrator.py &

# Verify
curl http://localhost:9100/health
# Should return: {"status": "healthy"}
```

**Checklist items:**
- [ ] Interview Coordinator running on port 9100
- [ ] Can reach Dograh, Hermes, Odysseus from coordinator

---

## PHASE 3: Register Agents with Dograh (10 min)

### Register All StudEx Agents
```bash
cd ~/studex-auto-meat/agent-os
python register-agents.py

# Output should show:
# Registered: 8/8
# ✓ Naledi
# ✓ RALF
# ✓ OpenHands
# ✓ Herds
# ✓ Hermes
# ✓ Evaluator
# ✓ DenchClaw
# ✓ CashClaw
```

**Verify registration:**
```bash
curl http://localhost:8000/agents

# Should return JSON with all agents listed
```

**Checklist items:**
- [ ] Naledi registered with Dograh
- [ ] RALF registered with Dograh
- [ ] OpenHands registered with Dograh
- [ ] Hermes registered with Dograh
- [ ] Evaluator registered with Dograh
- [ ] DenchClaw registered with Dograh
- [ ] CashClaw registered with Dograh

---

## PHASE 4: Test Interview Pipeline (15 min)

### Submit Test Interview
```bash
# Option 1: Via Python
python ~/studex-auto-meat/agent-os/paperclip-bridge.py

# Option 2: Via cURL
curl -X POST http://localhost:9100/interview/submit \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_name": "Jane Doe",
    "candidate_email": "jane@example.com",
    "role": "Senior Engineer",
    "round": 1,
    "interview_type": "technical"
  }'

# Expected response:
# {
#   "interview_id": "interview-abc123def456",
#   "status": "submitted",
#   "candidate": "Jane Doe",
#   "submitted_at": "2026-10-05T12:34:56Z"
# }
```

**Checklist items:**
- [ ] Interview submission returns 200 OK
- [ ] Interview ID generated
- [ ] Task appears in Redis queue: `redis-cli LRANGE tasks:queue:multi_agent 0 10`

### Verify Agent Dispatch
```bash
# Check Dograh task queue
curl http://localhost:8000/agents

# Check if Naledi received the task
# (Naledi should log receiving interview task)

# Check Hermes for notification attempt
curl http://localhost:8081/health
```

**Checklist items:**
- [ ] Task visible in Dograh queue
- [ ] Naledi agent receives interview task
- [ ] Hermes sends candidate notification email
- [ ] Odysseus logs security verification

### Verify Results Sync
```bash
# After interview completes (simulated), check:

# 1. Notion
curl -X GET "https://api.notion.com/v1/databases/YOUR_DATABASE_ID/query" \
  -H "Authorization: Bearer YOUR_NOTION_API_KEY"

# 2. Google Sheets
# (Check your hiring tracker sheet manually)

# 3. Obsidian vault
ls ~/Obsidian\ Vault/2nd\ Brain/Interviews/2026-10-05/
```

**Checklist items:**
- [ ] Interview results appear in Notion (candidate database)
- [ ] Score + feedback visible in Google Sheets
- [ ] Obsidian vault synced with interview notes

---

## PHASE 5: Wire RALF Loop (10 min)

### Update RALF Daily Cron
Edit your RALF loop configuration to check Dograh for interviews:

```yaml
# ~/studex-auto-meat/workflows/ralf-loop.yaml
ralf_daily_loop:
  cron: "0 0 * * *"  # Midnight SAST
  tasks:
    - name: "check_interview_queue"
      endpoint: "http://localhost:8000/tasks/queue/multi_agent"
      action: "poll_pending"
    
    - name: "dispatch_to_naledi"
      agent: "naledi"
      task_type: "interview"
      mode: "interviewer"
    
    - name: "dispatch_to_evaluator"
      agent: "evaluator"
      task_type: "interview"
      mode: "scorer"
    
    - name: "collect_results"
      sync_to:
        - "notion"
        - "google_sheets"
        - "obsidian"
    
    - name: "send_notifications"
      agent: "hermes"
      notify: "hiring_team"
```

**Checklist items:**
- [ ] RALF loop updated to query Dograh
- [ ] RALF can dispatch to Naledi + Evaluator
- [ ] RALF syncs results to 3 systems
- [ ] RALF sends notifications via Hermes

---

## PHASE 6: Monitor Live System (5 min)

### Start Monitoring Dashboard
```bash
# Terminal 1: Buzz Monitor (real-time agent network)
/buzz-monitor --dashboard

# Terminal 2: Agent Mesh Inspector
/agent-mesh --status

# Terminal 3: Interview Logs
/interview-coordinator --logs
```

**Checklist items:**
- [ ] Buzz monitor shows all agents connected
- [ ] Agent mesh lists 8+ agents healthy
- [ ] Interview logs show task submissions

---

## PHASE 7: Production Readiness (Optional)

### Deploy to Cloudflare Edge
```bash
# Push Paperclip OS API to Cloudflare Workers
cd ~/paperclip-os
wrangler deploy --env production

# Result: Your API available at:
# https://paperclip-studex.yourworkers.dev/interview/submit
```

**Checklist items:**
- [ ] Cloudflare worker deployed
- [ ] Edge endpoint reachable
- [ ] Rate limiting configured

### Enable Tailscale Mesh
```bash
# Expose coordinator via Tailscale Funnel
tailscale funnel serve 9100

# Result: Accessible at:
# https://interview-coordinator-<random>.ts.net/health
```

**Checklist items:**
- [ ] Tailscale mesh connecting all machines
- [ ] Funnel exposing interview coordinator
- [ ] VPN encryption enabled

---

## 🎯 SUCCESS CRITERIA

✅ All 14 tasks from PHASE 1-6 completed  
✅ Interview submitted → results in < 50 seconds  
✅ Dograh task queue processing  
✅ Naledi receives interview task  
✅ Results synced to Notion, Google Sheets, Obsidian  
✅ Hermes sends notifications  
✅ Buzz mesh shows all agents connected  
✅ RALF loop integrated with Dograh  

---

## 🚨 TROUBLESHOOTING

### Services Won't Start?
```bash
# Check Docker logs
docker compose logs dograh
docker compose logs hermes
docker compose logs redis

# Check ports are available
lsof -i :8000  # Dograh
lsof -i :8081  # Hermes
lsof -i :6379  # Redis
```

### Interview Not Submitting?
```bash
# Check coordinator is running
curl http://localhost:9100/health

# Check Dograh is reachable
curl http://localhost:8000/health

# Check Redis queue
redis-cli LRANGE tasks:queue:multi_agent 0 1
```

### Agents Not Registering?
```bash
# Re-run registration
cd ~/studex-auto-meat/agent-os
python register-agents.py -v

# Check agent endpoints are correct
curl http://localhost:5000/naledi/health
curl http://localhost:5001/ralf/health
```

---

## 📝 NEXT STEPS

1. **Optimize Model Selection**
   - Wire LiteLLM gateway to Dograh
   - Route technical interviews to qwen3-14b
   - Route content to qwen2.5-14b
   - See: `~/paperclip-os/ARCHITECTURE.md`

2. **Scale Multi-Region**
   - Deploy Base44OS to Mac Mini (always-on)
   - Deploy Windows GPU box to handle heavy inference
   - Configure Tailscale mesh across all machines

3. **Add More Automation**
   - Interview scheduling (Google Calendar sync)
   - Candidate pipeline tracking (DenchClaw)
   - Invoice generation (CashClaw)
   - Report generation (Hermes + email)

4. **Enable Honcho Integration**
   - Reduce message complexity
   - Better error handling
   - Built-in observability
   - See: `/tmp/honcho` (already cloned)

---

## 🎉 DEPLOYMENT COMPLETE

Once all checkboxes are marked, you have:
- ✅ Paperclip OS fully integrated with studex-auto-meat
- ✅ Interview automation via Naledi + Evaluator
- ✅ Centralized agent orchestration (Dograh)
- ✅ Decentralized mesh coordination (Buzz/Nostr)
- ✅ Results synced to 3 systems (Notion, Sheets, Obsidian)
- ✅ Production-ready deployment (Cloudflare + Tailscale)

**Ready to hire with AI! 🚀**
