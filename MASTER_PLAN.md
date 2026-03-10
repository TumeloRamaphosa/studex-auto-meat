# 🏛️ GoBot Board of Directors — Master Plan
**Owner:** Tumelo Ramaphosa | **Company:** StudEx Meat
**Created:** 2026-03-11

---

## Phase 1: Foundation (Week 1)
- [ ] Secure all API keys in private vault
- [ ] Create private GitHub repo: `studex-gobot`
- [ ] Set up Google Drive backup structure
- [ ] Create GitHub repo: `studex-auto-meat` (influencer workflow)
- [ ] Define Board Charter (roles, decision rights)
- [ ] Set north star: mission + 90-day outcome

## Phase 2: Build the Board (Week 2)
- [ ] Configure each Chief agent with correct APIs (see API vault)
- [ ] Set up daily 7:30 AM routine automation
- [ ] Set up weekly board meeting template
- [ ] Connect Notion as single source of truth
- [ ] Wire Telegram for board communications

## Phase 3: Naledi Launch (Week 2-3)
- [ ] Generate Naledi character images (Nano Banana Pro)
- [ ] Create first 10 content pieces
- [ ] Build n8n workflow: Brief → Image → Video → Post
- [ ] Set up Instagram + TikTok accounts
- [ ] First post: Naledi introduces herself

## Phase 4: Full Automation (Week 3-4)
- [ ] n8n workflow live and posting daily
- [ ] Shopify order monitoring active
- [ ] Morning briefing delivered at 7:30 AM SA time
- [ ] Board meeting running weekly
- [ ] Chief Critic daily 10 questions at 7:00 AM

---

## Board Structure

| Chief | Role | API/Model |
|-------|------|-----------|
| CRO | Research & Intel | Anthropic Claude |
| CMO | Marketing & Content | Anthropic + Google Gemini |
| CFO | Finance & ROI | Anthropic Claude |
| CSO | Strategy | Ollama (local) |
| CTO | Tech & Code | Codex + Ollama |
| COO | Operations | Codex + Anthropic |
| Chief Critic (Lucius) | Devil's Advocate | Codex + Ollama |
| The General | Coordination | Ollama (local) |

---

## Auto-Meat Influencer Stack

```
Nano Banana Pro (Gemini)  →  Character images
         ↓
Kling 3.0 / Veo 3         →  Talking videos
         ↓
ElevenLabs                →  Voice (Naledi's voice)
         ↓
n8n Workflow              →  Automate everything
         ↓
Instagram / TikTok        →  Post & grow
```

---

## APIs Still Needed
- Anthropic API key
- OpenAI API key  
- Gemini API key
- Kling AI API key
- ElevenLabs API key
- N8n instance URL + API key
- Ollama local machine IP address
