# 🗺️ Naledi AI Influencer — Complete Workflow Mind Map
# StudEx Meat | Auto-Meat Project
# Created: 2026-03-11

---

```
                    ┌─────────────────────────┐
                    │   🧠 NALEDI WORKFLOW     │
                    │   AI Influencer System  │
                    │   for StudEx Meat       │
                    └───────────┬─────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
   ┌──────▼──────┐      ┌───────▼──────┐      ┌──────▼──────┐
   │ 1. CREATE   │      │ 2. ANIMATE   │      │ 3. PUBLISH  │
   │  Character  │      │   to Video   │      │ & Automate  │
   └──────┬──────┘      └───────┬──────┘      └──────┬──────┘
          │                     │                     │
   ┌──────▼──────┐      ┌───────▼──────┐      ┌──────▼──────┐
   │Nano Banana  │      │ Kling 3.0    │      │   n8n       │
   │Pro (Gemini) │      │ Veo 3/Flow   │      │  Workflow   │
   │Flux Image   │      │ Seedance 2.0 │      │  Auto-post  │
   │MidJourney   │      │ HailuoAI     │      │  Schedule   │
   └─────────────┘      └─────────────┘       └─────────────┘
```

---

## 🎭 BRANCH 1: Create the Character (Naledi)

### Step 1.1 — Design Base Identity
- Tool: **Nano Banana Pro** (Gemini Image API)
- Prompt: South African woman, 24, UCT medical student, natural hair, confident
- Resolution: 4K
- Output: 20+ consistent reference images

### Step 1.2 — Lock Consistency
- Tool: **Flux** (character seed locking)
- Alt: **Kling Subject Reference** (locks face across all generations)
- Output: Character seed / reference pack

### Step 1.3 — Wardrobe & Scenes
- Lab coat → UCT lab background
- Squash kit → sports court
- Casual → kitchen meal prep (StudEx Meat products)
- Elegant → brand events

---

## 🎬 BRANCH 2: Animate into Video

### Step 2.1 — Image to Video
| Tool | Strength | Status |
|------|----------|--------|
| **Kling 3.0** | Best consistency, lip sync, audio | ✅ API available |
| **Veo 3 / Google Flow** | Most cinematic | ✅ Paid ($249/mo) |
| **Seedance 2.0** | Multi-shot storytelling | ⚠️ API paused |
| **HailuoAI (MiniMax)** | Subject consistency | ✅ API available |

### Step 2.2 — Add Voice
- Tool: **ElevenLabs** or **Google TTS**
- Create Naledi's voice clone (South African accent, warm, intelligent)

### Step 2.3 — Lip Sync
- Tool: **Sync Labs** or **HeyGen**
- Sync generated audio to video

### Step 2.4 — Captions & Branding
- Tool: **CapCut API** or **FFmpeg**
- Add StudEx Meat watermark, www.studexmeat.com CTA

---

## ⚙️ BRANCH 3: n8n Automation Workflow

```
TRIGGER (Manual / Schedule / Webhook)
    │
    ▼
[CONTENT BRIEF]
    • Topic input (meal prep, lab day, squash training)
    • Platform selection (Instagram / TikTok / YouTube Shorts)
    │
    ▼
[AI SCRIPT WRITER] — OpenAI / Anthropic Claude
    • Writes caption + voiceover script
    • Includes: StudEx Meat product mention + studexmeat.com CTA
    │
    ▼
[IMAGE GENERATION] — Choice node:
    ├── Nano Banana Pro (Gemini API)
    ├── Flux
    └── MidJourney (manual fallback)
    │
    ▼
[VIDEO GENERATION] — Choice node:
    ├── Kling 3.0 API
    ├── Veo 3 / Google Flow
    ├── HailuoAI
    └── Seedance 2.0 (when available)
    │
    ▼
[VOICE + LIP SYNC]
    • ElevenLabs TTS → Sync Labs
    │
    ▼
[REVIEW STEP] — Tumelo approves / auto-approve
    │
    ▼
[AUTO-POST]
    ├── Instagram (via Meta API)
    ├── TikTok (via TikTok API)
    ├── YouTube Shorts
    └── Twitter/X
    │
    ▼
[LOG TO GOOGLE DRIVE + GITHUB]
    • Save content, captions, video files
    • Track performance metrics
```

---

## 🏛️ BRANCH 4: GoBot Board of Directors

```
TUMELO (Owner)
    │
    ├── CRO (Research) — Anthropic Claude
    │       └── Market research, competitor intel, customer discovery
    │
    ├── CMO (Marketing) — Anthropic + Gemini
    │       └── Content strategy, Naledi campaigns, StudEx brand voice
    │       └── Sub-pod: Naledi Content Engine (this workflow!)
    │
    ├── CFO (Finance) — Anthropic Claude  
    │       └── ROI tracking, ad spend, influencer campaign budgets
    │
    ├── CSO (Strategy) — Ollama (local)
    │       └── Growth plan, platform selection, partnerships
    │
    ├── CTO (Tech) — Codex + Ollama
    │       └── n8n workflows, API integrations, Shopify tech
    │
    ├── COO (Operations) — Codex + Anthropic
    │       └── Daily routines, delivery tracking, Shopify orders
    │
    ├── Chief Critic / Lucius (Devil's Advocate) — Codex + Ollama
    │       └── 10 daily questions at 7:00 AM SA time
    │       └── Tests strategy for failure modes
    │
    └── The General (Coordinator) — Ollama (local)
            └── Morning briefings, meeting agendas, task routing
```

---

## 📅 BRANCH 5: Daily Routine Automation

### 7:00 AM SA Time — Chief Critic (Lucius)
- Generates 10 daily strategy questions
- Saved to GitHub + Google Drive

### 7:30 AM SA Time — Morning Brief
- Top 10 AI YouTube videos
- Top 10 AI articles + Hacker News
- Top 3 updates / risks / decisions needed
- Delivered via Discord / Telegram

### 8:00 AM — Breakfast AI News Summary
- 20 min audio/video digest of AI + global economics

### 8:30 AM — Board Meeting
- Each Chief reports
- Plans approved
- Tasks assigned

### 9:00 AM — Production Manager
- New products ready to sell
- Shopify order check
- Delivery team update

---

## 🔑 BRANCH 6: API Stack

### Image Generation
- **Gemini API** (Nano Banana Pro) — `GEMINI_API_KEY`
- **Kling AI** — `KLING_API_KEY`

### Video Generation  
- **Kling 3.0 API** — `KLING_API_KEY`
- **HailuoAI (MiniMax)** — `MINIMAX_API_KEY`
- **Google Flow/Veo** — Google AI Ultra account

### AI/LLM
- **Anthropic Claude** — `ANTHROPIC_API_KEY` ⬅️ NEED
- **OpenAI / Codex** — `OPENAI_API_KEY` ⬅️ NEED
- **Groq** — `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` ✅
- **Ollama** — Local machine `OLLAMA_HOST` ⬅️ NEED IP

### Storage & Productivity
- **GitHub** — `ghp_xJT2Sxd...` ✅
- **Google Drive** — OAuth needed
- **Notion** — `ntn_1689...` ✅
- **Airtable** — `patCgp7...` ✅
- **AFFiNE** — `ut_rWVJw...` ✅
- **Supabase** — `sb_publishable_0k3...` ✅
- **Pinecone** — ✅

### Commerce & Comms
- **Shopify** — ✅
- **Twilio** — ✅
- **AgentMail** — ✅

### Automation
- **n8n** — Instance needed ⬅️ NEED URL

---

## 🎯 Content Calendar Template (Naledi)

| Day | Theme | Format | StudEx Integration |
|-----|-------|--------|--------------------|
| Mon | Lab Day | Reel | "Fuel for focus" meal prep |
| Tue | Squash Training | Story | "Recovery protein" |
| Wed | Study Session | Post | "What I eat in 16hr study day" |
| Thu | Science Explains | Reel | "Why protein matters for your brain" |
| Fri | Week Wins | Story | StudEx haul + review |
| Sat | Lifestyle | Post | Social meal featuring StudEx |
| Sun | Planning | Story | Week prep with StudEx products |

---

## 🎬 Video Reference
Based on: https://www.youtube.com/watch?v=G01kghX152g
Workflow methodology adapted from this tutorial.

---

## 📁 File Structure (GitHub: studex-auto-meat)
```
studex-auto-meat/
├── naledi/
│   ├── character-sheet.md
│   ├── image-prompts.md
│   ├── video-prompts.md
│   └── voice-script-templates/
├── workflows/
│   ├── n8n-auto-post.json
│   ├── n8n-image-gen.json
│   └── n8n-board-morning.json
├── board/
│   ├── gobot-charter.md
│   ├── daily-questions-template.md
│   └── board-meeting-template.md
├── apis/
│   └── .env.example (no real keys)
└── README.md
```
