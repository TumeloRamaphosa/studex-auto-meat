# STUDEX MEAT VOICE SALES AGENT — Setup Guide

## Overview

A customer-facing voice agent that:
- 🎤 Accepts voice input from website visitors
- 💬 Responds conversationally (powered by local Ollama models)
- 🧠 Learns from Obsidian vault (past buyer interactions, RFQs)
- 📧 Sends email confirmations automatically
- 📊 Logs all interactions for continuous improvement

---

## Prerequisites

1. **Ollama running locally** (qwen2.5 model pulled)
   ```bash
   ollama serve  # Terminal 1
   ollama pull qwen2.5
   ```

2. **Gmail account** (for sending confirmations)
   - Create [App Password](https://support.google.com/accounts/answer/185833)
   - Get your app password (16 chars)

3. **Obsidian vault path**
   - Default: `~/Documents/Obsidian Vault/2nd Brain`
   - Must have folders: `Buyers/`, `RFQs/`, `Products.md`

---

## Installation

### 1. Copy Agent to Main Agent OS

```bash
# Already in place at agent-os/agents/voice-sales-agent/
cd agent-os

# Install dependencies
npm install

# Create .env.local for voice agent
cat > .env.local << 'EOF'
# Voice Sales Agent
OLLAMA_HOST=http://localhost:11434
LLM_MODEL=qwen2.5
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
OBSIDIAN_VAULT_PATH=/Users/yourusername/Documents/Obsidian Vault/2nd Brain
PUBLIC_URL=http://localhost:3000
EOF
```

### 2. Update Main Agent OS Server

In `agent-os/server.js`, add:

```javascript
const voiceSalesAgent = require('./agents/voice-sales-agent');

app.use('/agents/voice-sales', voiceSalesAgent);

// Register voice agent on startup
app.listen(3000, async () => {
  await fetch('http://localhost:3000/agents/voice-sales/agents/register', { 
    method: 'POST' 
  });
  console.log('✅ Voice Sales Agent registered and ready');
});
```

### 3. Set Up Obsidian Vault Structure

Create this folder structure in your Obsidian vault:

```
Obsidian Vault/2nd Brain/
├── Buyers/
│   ├── john@example.com/
│   │   ├── 2026-10-05.md
│   │   └── 2026-10-04.md
│   └── jane@example.com/
│       └── 2026-10-05.md
├── RFQs/
│   ├── RFQ_001_Premium_Wagyu.md
│   ├── RFQ_002_Biltong_Bulk.md
│   └── RFQ_003_Restaurant_Supply.md
├── Products.md
└── Soul.md
```

**Products.md** example:
```markdown
# STUDEX MEAT Products

## Wagyu Beef
- Premium Japanese Wagyu
- Marbling Score: A5
- Price: R350/kg
- Available cuts: Ribeye, Sirloin, Brisket

## Premium Biltong
- Dry cured, slow roasted
- Original, Chili, Garlic varieties
- Pricing: R120 (200g), R280 (500g)

## Group Orders & Financing
- Stitch BNPL available
- Free delivery on orders > R2,000
- Bulk discounts available
```

### 4. Start the Agent

```bash
cd agent-os
npm run dev

# Visit http://localhost:3000/voice-agent
```

---

## How Customers Use It

1. **Visit your website**
   - Embed iframe: `<iframe src="https://your-domain.com/voice-agent"></iframe>`
   - Or standalone: `https://your-domain.com/voice-agent`

2. **Enter email & name**
   - Agent greets them (warm if returning buyer)

3. **Click 🎤 Start Listening**
   - Say: "I want to order Wagyu" or "Tell me about Biltong"
   - Agent responds naturally

4. **Have a conversation**
   - Agent learns from Obsidian history
   - Suggests relevant products/financing
   - Takes order details

5. **Click End & Email**
   - Sends confirmation email automatically
   - Your team gets notified
   - Customer gets tracking info

---

## API Endpoints

### Voice Interactions

**POST** `/agents/voice-sales/voice/session`
```json
{
  "buyer_email": "john@example.com",
  "buyer_name": "John Doe"
}
```
Response:
```json
{
  "session_id": "session_1729346789_abc123",
  "greeting": "Hi John! Great to hear from you again...",
  "is_returning_buyer": true
}
```

**POST** `/agents/voice-sales/voice/transcribe`
```json
{
  "session_id": "...",
  "buyer_email": "john@example.com",
  "transcribed_text": "I need 5kg of Wagyu ribeye"
}
```
Response:
```json
{
  "agent_response": "Great choice! That's 1,750 rand for...",
  "session_id": "...",
  "needs_email_confirmation": true
}
```

**POST** `/agents/voice-sales/voice/end-session`
```json
{
  "session_id": "...",
  "buyer_email": "john@example.com",
  "order_summary": { ... }
}
```

### Agent Management

**POST** `/agents/voice-sales/agents/register`
- Registers agent with central Agent OS
- Response: Agent config + status

---

## Obsidian Learning

The agent learns by:

1. **Reading buyer history** before each conversation
   - "Hi, I see you ordered Wagyu last month..."
   - "You mentioned budget of R2,000..."

2. **Tracking RFQ trends**
   - Most asked questions
   - Seasonal patterns
   - Popular product combinations

3. **Logging all interactions**
   - Timestamped in buyer folders
   - Searchable in Obsidian
   - Improves over time

Example log entry:
```markdown
## Session session_1729346789_abc123
**Time:** 2026-10-05T14:23:45Z

### Buyer:
I need Wagyu for a dinner party next week

### Agent:
Perfect! How many guests are you expecting? That helps me recommend the right cuts and quantity.

---
```

---

## Email Integration

Automatically sends:

1. **Inquiry Confirmation** (immediately after chat)
   ```
   Subject: ✓ Your STUDEX MEAT inquiry received
   
   Thanks for reaching out! We got your message.
   Your inquiry: [what they said]
   Our response: [agent's answer]
   
   Session ID: [for reference]
   ```

2. **Order Confirmation** (when they click "End & Email")
   ```
   Subject: ✓ Your STUDEX MEAT order confirmed
   
   Order Summary: [items, qty, price]
   Next Steps: [payment, delivery, tracking]
   Financing: [Stitch BNPL details if applicable]
   
   Session ID: [for reference]
   ```

---

## Deployment (Railway + Cloudflare)

### Deploy to Railway

```bash
railway link                    # Link to Railway project
railway up                      # Deploy

# Railway sets up:
# - PostgreSQL (for agent registry)
# - Redis (for task queue)
# - Environment variables
```

### Public Access (Cloudflare Tunnel)

```bash
cloudflared tunnel run studex-agent-os

# DNS (cloudflare.com):
# voice-agent.studex.dev  CNAME  <tunnel-id>.cfargotunnel.com
```

### Embed in Website

```html
<!-- In your HTML -->
<div id="voice-agent">
  <iframe 
    src="https://voice-agent.studex.dev" 
    width="600" 
    height="800"
    style="border: none; border-radius: 12px;"
  ></iframe>
</div>
```

---

## Testing

### Local Test

```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Start Agent OS
cd agent-os && npm run dev

# Terminal 3: Open browser
open http://localhost:3000/voice-agent

# Test:
# 1. Enter email: test@example.com
# 2. Click 🎤 Start
# 3. Say: "Hi, I want Wagyu"
# 4. Click "End & Email"
# 5. Check Gmail inbox for confirmation
# 6. Check Obsidian: Buyers/test@example.com/2026-10-05.md
```

### Production Test (Railway)

```bash
# After deploying to Railway
curl https://your-railway-url/agents/voice-sales/voice/session \
  -H "Content-Type: application/json" \
  -d '{"buyer_email": "test@example.com", "buyer_name": "Test User"}'

# Should return session_id and greeting
```

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Ollama connection refused" | Run `ollama serve` first |
| "Gmail auth failed" | Check GMAIL_APP_PASSWORD is 16 chars |
| "Obsidian path not found" | Verify OBSIDIAN_VAULT_PATH in .env |
| "Microphone access denied" | Browser must have microphone permission |
| "No session ID" | Check Agent OS server is running |

---

## Next Steps

1. ✅ Install and test locally
2. ✅ Customize greeting/responses in `index.js`
3. ✅ Add your products to `Products.md` in Obsidian
4. ✅ Populate Obsidian with sample buyer history
5. ✅ Deploy to Railway
6. ✅ Embed in website
7. ✅ Monitor Obsidian logs daily
8. ✅ Refine model prompts based on conversations

---

## Support

- 📖 Docs: This guide
- 🤖 Agent OS: `/agent-os/README.md`
- 💬 Issues: GitHub Issues
- 📧 Questions: Contact your implementation team
