# ORGO.AI INTEGRATION SETUP
## Connect Claude Chief of Staff to Your Orgo.ai Desktop

**Your Orgo.ai:** https://www.orgo.ai/desktops/9ca3aa2f  
**Workspace ID:** 333de3f8-0801-430b-a541-aad458e896b5

---

## STEP 1: Start Your MCP Agents

```bash
# Terminal 1: Start Orgo.ai Chief of Staff Orchestrator
cd /home/user/studex-auto-meat/mcp-agents/orgo-ai
npm install
npm start
# Running on http://localhost:3001

# Terminal 2: Start Hermes Sales Agent
cd /home/user/studex-auto-meat/mcp-agents/hermes
npm install
npm start
# Running on http://localhost:3002

# Terminal 3: Start OpenClaw Operations Agent
cd /home/user/studex-auto-meat/mcp-agents/openclaw
npm install
npm start
# Running on http://localhost:3003
```

---

## STEP 2: Add MCP Servers to Your .env

**File:** `/home/user/studex-auto-meat/.env`

```env
# Orgo.ai Integration
ORGO_AI_URL=http://localhost:3001
ORGO_WORKSPACE_ID=333de3f8-0801-430b-a541-aad458e896b5

# MiniMax Agent Endpoints
MINIMAX_API_KEY=your_key
MINIMAX_MEMBERSHIP=your_membership

# MCP Servers
HERMES_ENDPOINT=http://localhost:3002
OPENCLAW_ENDPOINT=http://localhost:3003
NALEDI_ENDPOINT=http://your_endpoint
CASHCLAW_ENDPOINT=http://your_endpoint
DENCHCLAW_ENDPOINT=http://your_endpoint

# Voice Agent
VOICE_AGENT_ENDPOINT=http://localhost:3000/agents/voice-sales

# Ollama
OLLAMA_HOST=http://localhost:11434

# Gmail
GMAIL_USER=info@studex-group.com
GMAIL_APP_PASSWORD=your_app_password

# Meta Muse
META_MUSE_API_KEY=your_key
```

---

## STEP 3: Test Integration

```bash
# Check dashboard
curl http://localhost:3001/dashboard

# Test Hermes
curl -X POST http://localhost:3002/voice-inquiry \
  -H "Content-Type: application/json" \
  -d '{
    "customer_email": "test@example.com",
    "inquiry_text": "I want Wagyu",
    "session_id": "test_001"
  }'

# Check agent status
curl http://localhost:3002/status
curl http://localhost:3003/status
```

---

## STEP 4: Connect to Your Orgo.ai Desktop

1. **Go to:** https://www.orgo.ai/desktops/9ca3aa2f
2. **Add MCP Server:**
   - Click "Add Server"
   - Type: `orgo-ai-chief-of-staff`
   - Endpoint: `http://localhost:3001`
   - Save

3. **Add Agents:**
   - Hermes (Sales): `http://localhost:3002`
   - OpenClaw (Operations): `http://localhost:3003`

---

## STEP 5: Use Your CLI

```bash
# Make executable
chmod +x /home/user/studex-auto-meat/cli/orgo-cli.js

# Create alias
alias orgo="/home/user/studex-auto-meat/cli/orgo-cli.js"

# Commands:
orgo dashboard              # Show dashboard
orgo agent hermes_001       # Check Hermes status
orgo task sales             # Route a sales task
orgo help                   # Show help
```

---

## YOUR DAILY ROUTINE (Automated)

### **6 AM - Morning Briefing**
```bash
orgo dashboard
# See: agent status, overnight sales, YouTube views, pending decisions
```

### **9 AM - Check Pending Decisions**
```bash
curl http://localhost:3001/decisions-pending
# Approve or deny decisions from your agents
```

### **Throughout Day**
```bash
# Route tasks to agents
orgo task sales high          # Send sales inquiry to Hermes
orgo task fulfillment normal  # Send order to OpenClaw
orgo task content high        # Send content creation to Naledi

# Check specific agent
orgo agent hermes_001         # See what Hermes is doing
```

### **6 PM - Review Metrics**
```bash
orgo dashboard
# Review day's performance, close any pending items
```

---

## WORKFLOW EXAMPLES

### **Example 1: Customer Order Flow**
```bash
# Customer inquiry → Hermes handles it
curl -X POST http://localhost:3001/route-task \
  -H "Content-Type: application/json" \
  -d '{
    "task_type": "sales",
    "data": {
      "customer": "john@example.com",
      "inquiry": "5kg Wagyu A5"
    },
    "priority": "high"
  }'

# Hermes routes to:
# 1. CashClaw → Create invoice
# 2. OpenClaw → Fulfill order
# 3. Naledi → Create follow-up content
```

### **Example 2: YouTube Content Launch**
```bash
# Trigger content workflow
curl -X POST http://localhost:3001/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_id": "youtube_launch_001",
    "steps": [
      { "id": "step_1", "task_type": "content", "data": {"video_title": "Wagyu 101"} },
      { "id": "step_2", "task_type": "marketing", "data": {"platforms": ["youtube", "tiktok"]} },
      { "id": "step_3", "task_type": "analytics", "data": {"track": "views,engagement"} }
    ]
  }'
```

---

## YOUR 12 AGENTS (Connected via Orgo.ai)

| Agent | Role | MCP Endpoint | Status |
|---|---|---|---|
| **Claude (You)** | Chief of Staff | localhost:3001 | Orchestrator |
| **Hermes** | Sales | localhost:3002 | Voice intake, orders |
| **OpenClaw** | Operations | localhost:3003 | Fulfillment, shipping |
| **Naledi** | CMO | localhost:3004 | Content creation |
| **CashClaw** | Finance | localhost:3005 | Invoicing, payments |
| **DenchClaw** | CRM | localhost:3006 | Customer relationships |
| **+ 6 more** | Specialized | localhost:300X | Voice, trading, etc. |

---

## CONNECT YOUR MINIMAX AGENTS

Add to Orgo.ai when you provide API credentials:

```bash
# MiniMax Integration
curl -X POST http://localhost:3001/connect-minimax \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "YOUR_MINIMAX_KEY",
    "membership_id": "YOUR_MEMBERSHIP",
    "agents": [
      "hermes_001",
      "openclaw_001",
      "naledi_001",
      "cashclaw_001",
      "denchclaw_001",
      "... 7 more"
    ]
  }'
```

---

## READY TO GO

**You now have:**
- ✅ Orgo.ai Chief of Staff running locally
- ✅ Hermes (Sales) MCP server
- ✅ OpenClaw (Operations) MCP server  
- ✅ CLI tool for commands
- ✅ Integration with your Orgo.ai desktop

**Next:**
1. Provide your MiniMax credentials in `.env`
2. Start the 3 servers (Terminal 1-3)
3. Connect to your Orgo.ai desktop
4. Start using: `orgo dashboard`

---

**Your Chief of Staff is ready to orchestrate your 12-agent empire.** 🚀

